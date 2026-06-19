"""Complete full purchase flow and capture download links."""
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

        # Go to checkout
        await page.goto("https://www.tommywalkerministries.org/commerce/goto-checkout", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1000)
        print("Checkout URL:", page.url)

        # Enter email and uncheck subscribe
        await page.locator('input[name="email"]').fill(EMAIL)
        subscribe = page.locator('input[name="subscribeCheckbox"]')
        if await subscribe.count() > 0 and await subscribe.is_checked():
            await subscribe.uncheck()

        # Click CONTINUE (email step)
        await page.get_by_role("button", name="CONTINUE").click()
        await page.wait_for_timeout(2000)
        print("Past email step")

        # Fill billing address
        fname = page.locator('input[placeholder="First Name"]')
        if await fname.count() > 0:
            await fname.fill(FIRST_NAME)

        lname = page.locator('input[placeholder="Last Name"]')
        if await lname.count() > 0:
            await lname.fill(LAST_NAME)

        addr1 = page.locator('input[placeholder="Address 1"]')
        if await addr1.count() > 0 and await addr1.is_visible():
            await addr1.fill("123 Main St")

        zip_f = page.locator('input[placeholder="ZIP Code"]')
        if await zip_f.count() > 0 and await zip_f.is_visible():
            await zip_f.fill("91001")

        city_f = page.locator('input[placeholder="City"]')
        if await city_f.count() > 0 and await city_f.is_visible():
            await city_f.fill("Altadena")

        # Click Purchase
        purchase_btn = page.get_by_role("button", name="Purchase")
        print("Purchase button count:", await purchase_btn.count())
        if await purchase_btn.count() > 0:
            await purchase_btn.click()
            await page.wait_for_load_state("networkidle", timeout=30000)

        print("Post-purchase URL:", page.url)
        text = await page.evaluate("() => document.body.innerText")
        print("Post-purchase page:", text[:5000])

        # Look for download links
        links = await page.evaluate("""() =>
            Array.from(document.querySelectorAll('a')).map(a => ({
                text: a.innerText.trim().slice(0,100),
                href: a.href
            })).filter(l => l.href)
        """)
        print("\n=== ALL LINKS ===")
        for l in links:
            print(f"  {l['text']!r:60s} -> {l['href']}")

        await page.screenshot(path="/tmp/purchase_complete.png")
        print("\nScreenshot: /tmp/purchase_complete.png")

        await browser.close()

asyncio.run(main())
