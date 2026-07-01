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

const browser = await chromium.launch();

const results = {};
for (const [key, id] of Object.entries(PHOTO_IDS)) {
  const page = await browser.newPage();
  try {
    await page.goto(`https://unsplash.com/photos/${id}`, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Try to get page title and meta description
    const title = await page.title();
    const metaDesc = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');
    const altText = await page.$eval('img[itemprop="image"]', el => el.alt).catch(() => '');
    const h1 = await page.$eval('h1', el => el.textContent).catch(() => '');
    
    results[key] = { title, metaDesc: metaDesc.slice(0, 200), altText: altText.slice(0, 200), h1: h1.slice(0, 100) };
  } catch(e) {
    results[key] = { error: e.message.slice(0, 80) };
  }
  await page.close();
  console.log(`${key}: ${JSON.stringify(results[key])}`);
}

await browser.close();
