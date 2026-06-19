"""Complete checkout with proper wait for order confirmation."""
import asyncio
from playwright.async_api import async_playwright

SONGS_TO_ADD = [
    ("He Will Hold Me Fast", "https://www.tommywalkerministries.org/multitracks/hewillholdmefast"),
    ("Greater Than Great", "https://www.tommywalkerministries.org/multitracks/greaterthangreat2021"),
    ("Highest Praises", "https://www.tommywalkerministries.org/multitracks/highestpraises"),
]

EMAIL = "zweetztuph@gmail.com"
FIRST_NAME = "michael"
LAST_NAME = "wegter"

async def fill_if_visible(locator, value):
    if await locator.count() > 0 and await locator.first.is_visible():
        await locator.first.fill(value)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context()
        page = await ctx.new_page()

        # Capture all network requests for download URLs
        download_urls = []
        def on_response(response):
            url = response.url
            if any(k in url.lower() for k in ['download', 'dropbox', 'drive.google', '.zip', '.mp3', '.wav']):
                download_urls.append(url)
                print(f"NETWORK: {url}")

        page.on("response", on_response)

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

        # Review & Purchase - click PURCHASE
        purchase_btn = page.get_by_role("button", name="PURCHASE")
        if await purchase_btn.count() == 0:
            purchase_btn = page.get_by_role("button", name="Purchase")
        if await purchase_btn.count() > 0:
            print("Clicking PURCHASE...")
            await purchase_btn.first.click()
            # Wait for navigation or timeout
            try:
                await page.wait_for_url("**/order-confirmation**", timeout=15000)
                print("Navigated to order confirmation!")
            except:
                # May navigate to different URL
                await page.wait_for_timeout(8000)

        print("URL after purchase:", page.url)
        text = await page.evaluate("() => document.body.innerText")
        print("Final page text:", text[:6000])

        # Get all links
        links = await page.evaluate("""() =>
            Array.from(document.querySelectorAll('a')).map(a => ({
                text: a.innerText.trim().slice(0,100), href: a.href
            })).filter(l => l.href)
        """)
        print("\n=== LINKS ===")
        for l in links:
            print(f"  {l['text']!r:60s} -> {l['href']}")

        await page.screenshot(path="/tmp/order_complete.png")
        print("\nDownload URLs captured:", download_urls)
        await browser.close()

asyncio.run(main())
