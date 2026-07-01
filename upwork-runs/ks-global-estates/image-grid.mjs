import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';

const OUT = '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/upwork-runs/ks-global-estates/image-views/';
await mkdir(OUT, { recursive: true });

const IMAGES = {
  ext1: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
  ext2: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
  ext3: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
  ext4: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
  ext5: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  sub1: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80',
  sub2: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80',
  sub3: 'https://images.unsplash.com/photo-1527030280862-64139fba04ca?auto=format&fit=crop&w=800&q=80',
  sub4: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80',
  condo1: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  condo2: 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?auto=format&fit=crop&w=800&q=80',
  condo3: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  condo4: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80',
  int1: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=800&q=80',
  int2: 'https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&w=800&q=80',
  int3: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80',
  int4: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=800&q=80',
  int5: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80',
  sky1: 'https://images.unsplash.com/photo-1622866306950-81d17097d458?auto=format&fit=crop&w=800&q=80',
  sky2: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80',
  sky3: 'https://images.unsplash.com/photo-1590725121839-892b458a74fe?auto=format&fit=crop&w=800&q=80',
  est1: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
  est2: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=800&q=80',
  est3: 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=800&q=80',
  est4: 'https://images.unsplash.com/photo-1521401830884-6c03c1c87ebb?auto=format&fit=crop&w=800&q=80',
};

const browser = await chromium.launch();

// Do 5 at a time in grid screenshots for efficiency
const keys = Object.keys(IMAGES);
const urls = Object.values(IMAGES);

// Make a grid of 5 images per page
for (let i = 0; i < keys.length; i += 5) {
  const batch = keys.slice(i, i+5);
  const batchUrls = batch.map(k => IMAGES[k]);
  const html = `<html><body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(5,1fr);gap:4px">
    ${batch.map((k, j) => `<div style="position:relative"><img src="${batchUrls[j]}" style="width:100%;height:180px;object-fit:cover;display:block"><div style="position:absolute;bottom:0;left:0;background:rgba(0,0,0,.7);color:#fff;font:12px monospace;padding:2px 4px">${k}</div></div>`).join('')}
  </body></html>`;
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 220 });
  await page.setContent(html);
  await page.waitForTimeout(5000);
  const fname = `grid_${String(i).padStart(2,'0')}.png`;
  await page.screenshot({ path: path.join(OUT, fname) });
  await page.close();
  console.log(`Grid ${fname}: ${batch.join(', ')}`);
}

await browser.close();
console.log('Done.');
