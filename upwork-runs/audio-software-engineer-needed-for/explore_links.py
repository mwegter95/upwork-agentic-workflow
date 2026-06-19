"""Explore all links on the Tommy Walker page to find download URLs."""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context()
        page = await ctx.new_page()

        await page.goto("https://www.tommywalkerministries.org/multitracksmenu", wait_until="networkidle", timeout=30000)

        # Get all links
        links = await page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a')).map(a => ({
                text: a.innerText.trim().slice(0, 80),
                href: a.href,
            })).filter(l => l.href && l.href !== 'javascript:void(0)');
        }""")

        for l in links:
            print(f"{l['text']!r:50s} -> {l['href']}")

        # Also look for any buttons or forms with cart/download actions
        buttons = await page.evaluate("""() => {
            return Array.from(document.querySelectorAll('button, [data-item-id], [data-product-id]')).map(b => ({
                text: b.innerText.trim().slice(0, 80),
                dataAttrs: Object.fromEntries([...b.attributes].filter(a => a.name.startsWith('data-')).map(a => [a.name, a.value])),
                tagName: b.tagName,
            }));
        }""")

        print("\n=== BUTTONS/CART ELEMENTS ===")
        for b in buttons:
            print(f"{b['tagName']}: {b['text']!r:50s} data={b['dataAttrs']}")

        await browser.close()

asyncio.run(main())
