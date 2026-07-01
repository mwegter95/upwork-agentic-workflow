import { chromium } from 'playwright';

const PHOTO_IDS = {
  ext1: '1613977257363-707ba9348227',
  ext2: '1600596542815-ffad4c1539a9',
  ext3: '1580587771525-78b9dba3b914',
  ext4: '1564013799919-ab600027ffc6',
  ext5: '1600585154340-be6161a56a0c',
  sub1: '1570129477492-45c003edd2be',
  sub2: '1449844908441-8829872d2607',
  sub3: '1527030280862-64139fba04ca',
  sub4: '1486325212027-8081e485255e',
  condo1: '1512917774080-9991f1c4c750',
  condo2: '1628744448840-55bdb2497bd4',
  condo3: '1545324418-cc1a3fa10c00',
  condo4: '1554995207-c18c203602cb',
  int1: '1600210492493-0946911123ea',
  int2: '1616137466211-f939a420be84',
  int3: '1493809842364-78817add7ffb',
  int4: '1560184897-ae75f418493e',
  int5: '1600047509807-ba8f99d2cdde',
  sky1: '1622866306950-81d17097d458',
  sky2: '1582268611958-ebfd161ef9cf',
  sky3: '1590725121839-892b458a74fe',
  est1: '1600566753190-17f0baa2a6c3',
  est2: '1502005229762-cf1b2da7c5d6',
  est3: '1576941089067-2de3c901e126',
  est4: '1521401830884-6c03c1c87ebb',
};

const browser = await chromium.launch({ headless: true });
const results = {};

for (const [key, id] of Object.entries(PHOTO_IDS)) {
  const page = await browser.newPage();
  try {
    // Use the JSON+LD or nextjs data embedded in the page
    await page.goto(`https://unsplash.com/photos/${id}`, { timeout: 25000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const title = await page.title().catch(() => '');
    const metaDesc = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');
    const ogDesc = await page.$eval('meta[property="og:description"]', el => el.content).catch(() => '');
    const ogTitle = await page.$eval('meta[property="og:title"]', el => el.content).catch(() => '');
    // Try to get alt from the main image
    const mainAlt = await page.$eval('figure img, [data-testid="photo-grid-masonry-img"], img[itemprop]', el => el.alt).catch(() => '');
    // Try ld+json
    const ldJson = await page.$eval('script[type="application/ld+json"]', el => el.textContent).catch(() => '');

    results[key] = {
      title: title.slice(0,150),
      metaDesc: metaDesc.slice(0,200),
      ogDesc: ogDesc.slice(0,200),
      ogTitle: ogTitle.slice(0,150),
      mainAlt: mainAlt.slice(0,200),
      ldJson: ldJson.slice(0,300),
    };
  } catch(e) {
    results[key] = { error: e.message.slice(0,100) };
  }
  await page.close();
  const r = results[key];
  console.log(`${key}|title=${r.title}|metaDesc=${r.metaDesc}|ogTitle=${r.ogTitle}|mainAlt=${r.mainAlt}`);
}

await browser.close();
