"""Complete checkout - fill address form properly and get download links."""
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
        return True
    return False

async def select_if_visible(locator, value):
    if await locator.count() > 0 and await locator.first.is_visible():
        await locator.first.select_option(value)
        return True
    return False

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context()
        page = await ctx.new_page()

        # Add each song to cart
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

        # Step 1: Email
        await page.locator('input[name="email"]').fill(EMAIL)
        subscribe = page.locator('input[name="subscribeCheckbox"]')
        if await subscribe.count() > 0 and await subscribe.is_checked():
            await subscribe.uncheck()
        await page.get_by_role("button", name="CONTINUE").click()
        await page.wait_for_timeout(2000)
        print("Passed email step")

        # Step 2: Billing Address
        await fill_if_visible(page.locator('input[placeholder="First Name"]'), FIRST_NAME)
        await fill_if_visible(page.locator('input[placeholder="Last Name"]'), LAST_NAME)
        await fill_if_visible(page.locator('input[placeholder="Address 1"]'), "123 Main St")
        await fill_if_visible(page.locator('input[placeholder="ZIP Code"]'), "91001")
        await fill_if_visible(page.locator('input[placeholder="City"]'), "Altadena")
        await fill_if_visible(page.locator('input[placeholder="Phone Number"]'), "6265551234")

        # Select state
        state_sel = page.locator('select[name="address-level1 region"]')
        await select_if_visible(state_sel, "CA")

        print("Filled address form")

        # Click CONTINUE (billing step)
        continue_btns = page.get_by_role("button", name="CONTINUE")
        count = await continue_btns.count()
        print(f"CONTINUE buttons: {count}")
        if count > 0:
            await continue_btns.last.click()
            await page.wait_for_timeout(2000)

        print("Current URL:", page.url)
        text = await page.evaluate("() => document.body.innerText")
        print("Page text after billing:", text[:2000])

        # Look for Place Order / Purchase / Review & Purchase
        all_buttons = await page.evaluate("""() =>
            Array.from(document.querySelectorAll('button')).map(b => ({text: b.innerText.trim(), type: b.type, disabled: b.disabled}))
        """)
        print("Buttons:", all_buttons)

        # Try clicking any "Place" or "Purchase" or "Complete" button
        for btn_name in ["PLACE ORDER", "Place Order", "Purchase", "COMPLETE", "Review & Purchase"]:
            btn = page.get_by_role("button", name=btn_name)
            if await btn.count() > 0 and not await btn.first.is_disabled():
                print(f"Clicking: {btn_name}")
                await btn.first.click()
                await page.wait_for_load_state("networkidle", timeout=30000)
                break

        print("Final URL:", page.url)
        final_text = await page.evaluate("() => document.body.innerText")
        print("Final page:", final_text[:5000])

        # Get all links
        links = await page.evaluate("""() =>
            Array.from(document.querySelectorAll('a')).map(a => ({
                text: a.innerText.trim().slice(0,100), href: a.href
            })).filter(l => l.href && l.href !== window.location.href)
        """)
        print("\n=== LINKS ON FINAL PAGE ===")
        for l in links:
            print(f"  {l['text']!r:60s} -> {l['href']}")

        await page.screenshot(path="/tmp/final_page.png")
        await browser.close()

asyncio.run(main())
