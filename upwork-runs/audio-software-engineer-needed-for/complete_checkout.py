"""Complete checkout and get download links for 3 Tommy Walker multitracks."""
import asyncio
import json
import re
from playwright.async_api import async_playwright

SONGS_TO_ADD = [
    ("He Will Hold Me Fast", "https://www.tommywalkerministries.org/multitracks/hewillholdmefast"),
    ("Greater Than Great", "https://www.tommywalkerministries.org/multitracks/greaterthangreat2021"),
    ("Highest Praises", "https://www.tommywalkerministries.org/multitracks/highestpraises"),
]

EMAIL = "zweetztuph@gmail.com"
FIRST_NAME = "michael"
LAST_NAME = "wegter"

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

        # Go to checkout
        print("\nProceeding to checkout...")
        await page.goto("https://www.tommywalkerministries.org/commerce/goto-checkout", wait_until="networkidle", timeout=30000)
        print("Checkout URL:", page.url)
        await page.wait_for_timeout(1000)

        # Step 1: Email
        email_field = page.locator('input[name="email"]')
        await email_field.fill(EMAIL)

        # Uncheck subscribe if checked
        subscribe = page.locator('input[name="subscribeCheckbox"]')
        if await subscribe.count() > 0:
            is_checked = await subscribe.is_checked()
            if is_checked:
                await subscribe.uncheck()
                print("Unchecked subscribe checkbox")

        # Click CONTINUE
        continue_btn = page.get_by_role("button", name="CONTINUE")
        if await continue_btn.count() == 0:
            continue_btn = page.get_by_text("CONTINUE")
        await continue_btn.first.click()
        await page.wait_for_timeout(2000)
        print("Email submitted, URL:", page.url)

        # Step 2: Name and address
        fname_field = page.locator('input[placeholder="First Name"]')
        lname_field = page.locator('input[placeholder="Last Name"]')
        if await fname_field.count() > 0:
            await fname_field.fill(FIRST_NAME)
        if await lname_field.count() > 0:
            await lname_field.fill(LAST_NAME)

        # Fill required address fields if needed
        addr1 = page.locator('input[placeholder="Address 1"]')
        if await addr1.count() > 0 and await addr1.is_visible():
            await addr1.fill("123 Main St")

        zip_field = page.locator('input[placeholder="ZIP Code"]')
        if await zip_field.count() > 0 and await zip_field.is_visible():
            await zip_field.fill("91001")

        city_field = page.locator('input[placeholder="City"]')
        if await city_field.count() > 0 and await city_field.is_visible():
            await city_field.fill("Altadena")

        # Print state of page
        text = await page.evaluate("() => document.body.innerText")
        print("After email step, page text:", text[:1000])

        # Look for continue/next step button
        buttons = await page.evaluate("""() =>
            Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim())
        """)
        print("Buttons:", buttons)

        # Try clicking Continue again if visible
        continue_btns = page.get_by_role("button", name="CONTINUE")
        if await continue_btns.count() > 0:
            await continue_btns.first.click()
            await page.wait_for_timeout(2000)

        # Look for Place Order / Complete Order button
        place_order = page.get_by_role("button", name="PLACE ORDER")
        if await place_order.count() == 0:
            place_order = page.get_by_text("PLACE ORDER")
        if await place_order.count() == 0:
            # Try any submit-like button
            all_buttons = await page.evaluate("""() =>
                Array.from(document.querySelectorAll('button')).map(b => ({text: b.innerText.trim(), type: b.type}))
            """)
            print("All buttons at checkout:", all_buttons)

        text2 = await page.evaluate("() => document.body.innerText")
        print("Checkout page (2nd step):", text2[:2000])
        await page.screenshot(path="/tmp/checkout_step2.png")

        await browser.close()

asyncio.run(main())
