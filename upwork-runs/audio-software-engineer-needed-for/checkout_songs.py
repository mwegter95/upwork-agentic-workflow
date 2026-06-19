"""Add 3 multitracks to cart and checkout to get download links."""
import asyncio
import json
from playwright.async_api import async_playwright

# Pick 3: ballad, mid-tempo, uptempo
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
        browser = await p.chromium.launch(headless=False, slow_mo=500)  # visible so we can see what's happening
        ctx = await browser.new_context()
        page = await ctx.new_page()

        # Add each song to cart
        for song_name, url in SONGS_TO_ADD:
            print(f"\n=== Adding: {song_name} ===")
            await page.goto(url, wait_until="networkidle", timeout=30000)

            # Click ADD TO CART
            btn = page.get_by_role("button", name="ADD TO CART")
            if await btn.count() > 0:
                await btn.first.click()
                await page.wait_for_timeout(2000)
                print(f"  Added to cart")
            else:
                print(f"  ERROR: No ADD TO CART button found")

        # Go to cart
        print("\n=== Going to cart ===")
        await page.goto("https://www.tommywalkerministries.org/cart", wait_until="networkidle", timeout=30000)
        cart_text = await page.evaluate("() => document.body.innerText")
        print("Cart page (first 1000):", cart_text[:1000])

        # Look for checkout button
        checkout_links = await page.evaluate("""() =>
            Array.from(document.querySelectorAll('a, button')).filter(el =>
                el.innerText && el.innerText.toLowerCase().includes('checkout')
            ).map(el => ({text: el.innerText.trim(), href: el.href || '', tag: el.tagName}))
        """)
        print("Checkout elements:", checkout_links)

        # Click checkout
        checkout = page.get_by_role("link", name="Checkout")
        if await checkout.count() == 0:
            checkout = page.get_by_role("button", name="Checkout")
        if await checkout.count() > 0:
            await checkout.first.click()
            await page.wait_for_load_state("networkidle", timeout=30000)
            print("Checkout URL:", page.url)

        # Print checkout page
        checkout_text = await page.evaluate("() => document.body.innerText")
        print("Checkout page (first 2000):", checkout_text[:2000])

        # Print all inputs
        inputs = await page.evaluate("""() =>
            Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
                name: el.name, type: el.type, id: el.id,
                placeholder: el.placeholder, value: el.value
            }))
        """)
        print("Checkout inputs:", json.dumps(inputs, indent=2))

        await page.wait_for_timeout(5000)  # pause to see state
        await browser.close()

asyncio.run(main())
