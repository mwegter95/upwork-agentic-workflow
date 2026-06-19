"""Complete purchase AND immediately click downloads in same session."""
import asyncio
import os
from playwright.async_api import async_playwright

SONGS_TO_ADD = [
    ("He Will Hold Me Fast", "https://www.tommywalkerministries.org/multitracks/hewillholdmefast"),
    ("Greater Than Great", "https://www.tommywalkerministries.org/multitracks/greaterthangreat2021"),
    ("Highest Praises", "https://www.tommywalkerministries.org/multitracks/highestpraises"),
]

EMAIL = "zweetztuph@gmail.com"
FIRST_NAME = "michael"
LAST_NAME = "wegter"
DOWNLOAD_DIR = "/tmp/twm_downloads"

async def fill_if_visible(locator, value):
    if await locator.count() > 0 and await locator.first.is_visible():
        await locator.first.fill(value)

async def main():
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(accept_downloads=True)
        page = await ctx.new_page()

        # Track download redirect URLs
        download_urls = {}

        # Add each song
        for song_name, url in SONGS_TO_ADD:
            print(f"Adding: {song_name}")
            await page.goto(url, wait_until="networkidle", timeout=30000)
            btn = page.get_by_role("button", name="ADD TO CART")
            if await btn.count() > 0:
                await btn.first.click()
                await page.wait_for_timeout(1500)

        # Checkout
        await page.goto("https://www.tommywalkerministries.org/commerce/goto-checkout", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1000)

        # Email step
        await page.locator('input[name="email"]').fill(EMAIL)
        subscribe = page.locator('input[name="subscribeCheckbox"]')
        if await subscribe.count() > 0 and await subscribe.is_checked():
            await subscribe.uncheck()
        await page.get_by_role("button", name="CONTINUE").click()
        await page.wait_for_timeout(2000)

        # Address step
        await fill_if_visible(page.locator('input[placeholder="First Name"]'), FIRST_NAME)
        await fill_if_visible(page.locator('input[placeholder="Last Name"]'), LAST_NAME)
        await fill_if_visible(page.locator('input[placeholder="Address 1"]'), "123 Main St")
        await fill_if_visible(page.locator('input[placeholder="ZIP Code"]'), "91001")
        await fill_if_visible(page.locator('input[placeholder="City"]'), "Altadena")
        await fill_if_visible(page.locator('input[placeholder="Phone Number"]'), "6265551234")
        state_sel = page.locator('select[name="address-level1 region"]')
        if await state_sel.count() > 0:
            await state_sel.select_option("CA")
        await page.get_by_role("button", name="CONTINUE").last.click()
        await page.wait_for_timeout(2000)

        # Purchase
        purchase_btn = page.get_by_role("button", name="PURCHASE")
        if await purchase_btn.count() == 0:
            purchase_btn = page.get_by_role("button", name="Purchase")
        await purchase_btn.first.click()

        # Wait for order confirmation
        try:
            await page.wait_for_url("**/commerce/orders/**", timeout=20000)
        except:
            await page.wait_for_timeout(8000)

        print("Order URL:", page.url)
        text = await page.evaluate("() => document.body.innerText")
        print("Order page:", text[:500])

        # Check for DOWNLOAD ITEM buttons (not auth required)
        dl_buttons = page.get_by_role("button", name="DOWNLOAD ITEM")
        dl_count = await dl_buttons.count()
        print(f"DOWNLOAD ITEM buttons: {dl_count}")

        # Also check for any enabled download buttons
        all_dl = await page.evaluate("""() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.filter(b => b.innerText.includes('DOWNLOAD')).map(b => ({
                text: b.innerText.trim(),
                id: b.id,
                disabled: b.disabled,
            }));
        }""")
        print("All download buttons:", all_dl)

        # Try clicking each download button individually and capturing the URL
        for i, btn_info in enumerate(all_dl):
            if not btn_info['disabled']:
                print(f"\nClicking: {btn_info['text']} (id={btn_info['id']})")
                # Open new tab to capture redirect
                new_page = await ctx.new_page()
                captured_nav = []
                new_page.on("request", lambda req: captured_nav.append(req.url) if req.url.startswith('http') else None)

                # Click by ID if available
                if btn_info['id']:
                    btn = page.locator(f"#{btn_info['id']}")
                else:
                    btn = page.get_by_role("button", name=btn_info['text']).nth(i)

                # Listen for download on main page
                try:
                    async with page.expect_download(timeout=10000) as dl_info:
                        await btn.click()
                    download = await dl_info.value
                    print(f"  Download URL: {download.url}")
                    print(f"  Filename: {download.suggested_filename}")
                    save_path = os.path.join(DOWNLOAD_DIR, download.suggested_filename)
                    await download.save_as(save_path)
                    print(f"  Saved to: {save_path}")
                    download_urls[btn_info['text']] = download.url
                except Exception as e:
                    print(f"  Download exception: {e}")

                await new_page.close()
            else:
                print(f"\nSkipping disabled: {btn_info['text']}")

        print("\n=== SUMMARY ===")
        for k, v in download_urls.items():
            print(f"  {k}: {v}")

        await browser.close()

asyncio.run(main())
