"""Browse Tommy Walker Ministries multitrack menu after login."""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context()
        page = await ctx.new_page()

        print("=== Navigating to multitrack menu ===")
        await page.goto("https://www.tommywalkerministries.org/multitracksmenu", wait_until="networkidle", timeout=30000)
        print("URL after navigate:", page.url)

        # Check if there's a login form
        content = await page.content()

        # Look for login form
        login_fields = await page.query_selector_all('input[type="email"], input[type="text"], input[name*="email"], input[name*="name"], input[name*="user"]')
        print(f"Found {len(login_fields)} input fields")

        # Print page title
        title = await page.title()
        print("Page title:", title)

        # Look for forms
        forms = await page.query_selector_all('form')
        print(f"Found {len(forms)} forms")

        # Print all input names/types
        inputs = await page.query_selector_all('input')
        for inp in inputs:
            name = await inp.get_attribute('name')
            typ = await inp.get_attribute('type')
            placeholder = await inp.get_attribute('placeholder')
            print(f"  Input: name={name}, type={typ}, placeholder={placeholder}")

        # Print visible text (truncated)
        text = await page.evaluate("() => document.body.innerText")
        print("Page text (first 2000 chars):", text[:2000])

        await browser.close()

asyncio.run(main())
