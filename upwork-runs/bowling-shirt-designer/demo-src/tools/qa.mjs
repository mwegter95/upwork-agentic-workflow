#!/usr/bin/env node
// qa.mjs — drive the BUILT demo (out/) under its real basePath with Playwright.
// Checks console errors, changes colors, uploads a test design, screenshots.
// Usage: node tools/qa.mjs <outDir> <shotPrefix>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';

const require = createRequire('/sessions/laughing-gifted-heisenberg/mnt/upwork-agentic-workflow/package.json');
const { chromium } = require('playwright');

const OUTDIR = process.argv[2];
const PREFIX = process.argv[3] ?? '/tmp/qa';
const BASE = '/demos/bowling-shirt-designer';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.bin': 'application/octet-stream', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.startsWith(BASE)) p = p.slice(BASE.length);
  if (p === '' || p === '/') p = '/index.html';
  let fp = path.join(OUTDIR, p);
  if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] ?? 'application/octet-stream' });
    res.end(data);
  });
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

// tiny test logo PNG (red square with white diagonal) via raw pixels -> PNG encoder
function makeTestPng() {
  const W = 128, H = 128;
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 3 + 1)] = 0;
    for (let x = 0; x < W; x++) {
      const o = y * (W * 3 + 1) + 1 + x * 3;
      const diag = Math.abs(x - y) < 8;
      raw[o] = diag ? 255 : 200; raw[o + 1] = diag ? 255 : 30; raw[o + 2] = diag ? 255 : 40;
    }
  }
  const idat = zlib.deflateSync(raw);
  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crcTable = [];
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
    let crc = 0xffffffff;
    for (const b of td) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
    const cb = Buffer.alloc(4); cb.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([len, td, cb]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0)),
  ]);
}
const testPng = '/tmp/qa-logo.png';
fs.writeFileSync(testPng, makeTestPng());

const errors = [];
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message.slice(0, 200)));

await page.goto(`http://127.0.0.1:${port}${BASE}/`, { waitUntil: 'networkidle' });
await page.waitForSelector('#shirt-canvas canvas', { timeout: 20000 });
await page.waitForTimeout(3500); // let the shirt load + first frames render
await page.locator('#studio').scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
await page.screenshot({ path: `${PREFIX}-app-default.png`, clip: { x: 0, y: 100, width: 1280, height: 800 } });

// change body color: click the 3rd swatch
const swatches = page.locator('.swatch');
const count = await swatches.count();
if (count > 2) { await swatches.nth(2).click(); await page.waitForTimeout(900); }
await page.screenshot({ path: `${PREFIX}-app-recolor.png`, clip: { x: 0, y: 100, width: 1280, height: 800 } });

// upload the test design
const fileInput = page.locator('input[type="file"]').first();
await fileInput.setInputFiles(testPng);
await page.waitForTimeout(2500);
await page.screenshot({ path: `${PREFIX}-app-upload.png`, clip: { x: 0, y: 100, width: 1280, height: 800 } });

console.log('console errors:', errors.length ? errors : 'NONE');
await browser.close();
server.close();
