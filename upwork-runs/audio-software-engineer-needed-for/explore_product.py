"""Explore individual multitrack product pages."""
import asyncio
from playwright.async_api import async_playwright

URLS = [
    "https://www.tommywalkerministries.org/multitracks/hewillholdmefast",
    "https://www.tommywalkerministries.org/multitracks/butasforme",
    "https://www.tommywalkerministries.org/multitracks/greaterthangreat2021",
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context()
        page = await ctx.new_page()

        for url in URLS:
            await page.goto(url, wait_until="networkidle", timeout=30000)
            title = await page.title()
            text = await page.evaluate("() => document.body.innerText")
            links = await page.evaluate("""() =>
                Array.from(document.querySelectorAll('a')).map(a => ({text: a.innerText.trim().slice(0,80), href: a.href}))
                .filter(l => l.href && !l.href.includes('javascript'))
            """)
            print(f"\n=== {url} ===")
            print("Title:", title)
            print("Text:", text[:1500])
            print("Download-like links:")
            for l in links:
                if any(k in l['href'].lower() for k in ['download', 'dropbox', 'drive.google', 'zip', 'mp3', 'wav', 'stems']):
                    print(f"  {l['text']!r} -> {l['href']}")

        await browser.close()

asyncio.run(main())
