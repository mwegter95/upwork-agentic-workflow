"""Get metadata from all multitrack product pages."""
import asyncio
from playwright.async_api import async_playwright

PRODUCT_URLS = [
    ("What A Generous God", "https://www.tommywalkerministries.org/multitracks/1awo364knaaosbf72yqo486kxi6btk"),
    ("But As For Me", "https://www.tommywalkerministries.org/multitracks/butasforme"),
    ("The Harvest Is Ready", "https://www.tommywalkerministries.org/multitracks/theharvestisready"),
    ("He Will Hold Me Fast", "https://www.tommywalkerministries.org/multitracks/hewillholdmefast"),
    ("Now Unto The King", "https://www.tommywalkerministries.org/multitracks/nowuntotheking"),
    ("No One Is Holy Like Our God", "https://www.tommywalkerministries.org/multitracks/nooneisholylikeourgod"),
    ("Highest Praises", "https://www.tommywalkerministries.org/multitracks/highestpraises"),
    ("We Worship You", "https://www.tommywalkerministries.org/multitracks/weworshipyou"),
    ("Your Love Is Life", "https://www.tommywalkerministries.org/multitracks/yourloveislife"),
    ("The Fragrance", "https://www.tommywalkerministries.org/multitracks/thefragrance"),
    ("This Is How Much", "https://www.tommywalkerministries.org/multitracks/thisishowmuch"),
    ("Greater Than Great", "https://www.tommywalkerministries.org/multitracks/greaterthangreat2021"),
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context()
        page = await ctx.new_page()

        for name, url in PRODUCT_URLS:
            await page.goto(url, wait_until="networkidle", timeout=30000)
            text = await page.evaluate("() => document.body.innerText")
            # Extract key lines
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            # Filter for metadata
            meta = []
            for l in lines:
                if any(k in l for k in ['Key:', 'Tempo:', 'Time Signature:', 'Duration:', 'BPM', 'bpm']):
                    meta.append(l)
            print(f"{name}: {' | '.join(meta) if meta else 'NO METADATA'}")

        await browser.close()

asyncio.run(main())
