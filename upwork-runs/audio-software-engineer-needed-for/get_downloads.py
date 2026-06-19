"""Go to order page and get download URLs for 3 songs."""
import asyncio
from playwright.async_api import async_playwright

ORDER_URL = "https://www.tommywalkerministries.org/commerce/orders/ee90fe9e-baa8-448d-af76-cf5020150a9c"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context()
        page = await ctx.new_page()

        # Track all navigations/downloads
        captured_urls = []
        async def on_request(req):
            url = req.url
            if any(k in url.lower() for k in ['download', 'dropbox', 'drive.google', '.zip', '.mp3', '.wav', 'cdn', 'asset', 'file', 'static']):
                captured_urls.append(url)
        page.on("request", on_request)

        await page.goto(ORDER_URL, wait_until="networkidle", timeout=30000)
        text = await page.evaluate("() => document.body.innerText")
        print("Order page:", text[:1000])

        # Get all links including download item links
        links = await page.evaluate("""() =>
            Array.from(document.querySelectorAll('a')).map(a => ({
                text: a.innerText.trim().slice(0,100), href: a.href
            })).filter(l => l.href)
        """)
        print("\n=== ALL LINKS ===")
        for l in links:
            print(f"  {l['text']!r:60s} -> {l['href']}")

        # Find DOWNLOAD ITEM links
        download_links = [l for l in links if 'DOWNLOAD' in l['text'].upper() or 'download' in l['href'].lower()]
        print(f"\n=== DOWNLOAD LINKS: {len(download_links)} ===")
        for dl in download_links:
            print(f"  {dl['text']!r} -> {dl['href']}")

        # Click each download item and capture redirect
        download_item_links = page.get_by_text("DOWNLOAD ITEM")
        count = await download_item_links.count()
        print(f"\nDOWNLOAD ITEM elements: {count}")

        for i in range(count):
            el = download_item_links.nth(i)
            tag = await el.evaluate("e => e.tagName")
            href = await el.evaluate("e => e.href || e.getAttribute('href') || ''")
            parent_href = await el.evaluate("e => e.closest('a') ? e.closest('a').href : ''")
            print(f"  [{i}] tag={tag}, href={href!r}, parent_href={parent_href!r}")

        # Get parent anchor elements of DOWNLOAD ITEM text
        download_anchors = await page.evaluate("""() => {
            const results = [];
            document.querySelectorAll('a').forEach(a => {
                if (a.innerText.trim().includes('DOWNLOAD')) {
                    results.push({text: a.innerText.trim(), href: a.href, onclick: a.getAttribute('onclick')});
                }
            });
            return results;
        }""")
        print("\nDownload anchors:", download_anchors)

        # Also check buttons with download
        download_btns = await page.evaluate("""() => {
            const results = [];
            document.querySelectorAll('button').forEach(b => {
                if (b.innerText.trim().includes('DOWNLOAD')) {
                    results.push({text: b.innerText.trim(), onclick: b.getAttribute('onclick'), 'data': Object.fromEntries([...b.attributes].map(a => [a.name, a.value]))});
                }
            });
            return results;
        }""")
        print("Download buttons:", download_btns)

        # Try clicking DOWNLOAD ITEM via JS and capture the URL
        print("\nCapturing download URLs by clicking each DOWNLOAD ITEM...")
        for i in range(3):
            page2 = await ctx.new_page()
            captured = []
            async def capture(req, captured=captured):
                captured.append(req.url)
            page2.on("request", capture)

            # Go to the order page fresh
            await page2.goto(ORDER_URL, wait_until="networkidle", timeout=30000)

            items = page2.get_by_text("DOWNLOAD ITEM")
            cnt = await items.count()
            if cnt > i:
                item = items.nth(i)
                # Check what element it is
                tag = await item.evaluate("e => e.tagName")
                print(f"  Item {i}: {tag}")
                if tag == "A":
                    href = await item.get_attribute("href")
                    print(f"  href: {href}")
                else:
                    # Click and see where it goes
                    async with page2.expect_navigation(timeout=10000) as nav:
                        await item.click()
                    resp = await nav.value
                    print(f"  Navigation to: {resp.url}")

                # Print requests
                print(f"  Requests (first 5): {captured[:5]}")

            await page2.close()

        await browser.close()

asyncio.run(main())
