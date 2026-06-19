"""Full checkout flow for Tommy Walker Ministries multitracks."""
import asyncio
import json
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
            else:
                print(f"  WARNING: no ADD TO CART for {song_name}")

        # Go to checkout URL directly
        print("\nGoing to checkout...")
        await page.goto("https://www.tommywalkerministries.org/commerce/goto-checkout", wait_until="networkidle", timeout=30000)
        print("Checkout URL:", page.url)

        await page.wait_for_timeout(1000)

        # Print inputs
        inputs = await page.evaluate("""() =>
            Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
                name: el.name, type: el.type, id: el.id,
                placeholder: el.placeholder, label: ''
            }))
        """)
        print("Checkout inputs:", json.dumps(inputs, indent=2))

        text = await page.evaluate("() => document.body.innerText")
        print("Checkout page text:", text[:3000])

        # Take screenshot
        await page.screenshot(path="/tmp/checkout_page.png")
        print("Screenshot saved to /tmp/checkout_page.png")

        await browser.close()

asyncio.run(main())
