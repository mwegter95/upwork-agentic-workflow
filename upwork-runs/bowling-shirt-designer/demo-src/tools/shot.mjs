#!/usr/bin/env node
// shot.mjs — screenshot the preview page from several angles.
// Usage: node tools/shot.mjs [outPrefix] [--design test|gradient] [--views front,back,left,three]
// Serves demo-src/ statically, loads tools/preview/index.html via playwright, saves PNGs.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire('/sessions/laughing-gifted-heisenberg/mnt/upwork-agentic-workflow/package.json');
const { chromium } = require('playwright');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const prefix = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '/tmp/shirt';
const design = process.argv.includes('--design') ? process.argv[process.argv.indexOf('--design') + 1] : 'gradient';
const viewsArg = process.argv.includes('--views') ? process.argv[process.argv.indexOf('--views') + 1] : 'front,three,left,back';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.bin': 'application/octet-stream', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let fp = path.join(ROOT, urlPath === '/' ? 'tools/preview/index.html' : urlPath);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] ?? 'application/octet-stream' });
    res.end(data);
  });
});

const VIEWS = {
  front: { azim: 0, elev: 6 },
  three: { azim: 32, elev: 8 },
  left: { azim: 90, elev: 5 },
  right: { azim: -90, elev: 5 },
  back: { azim: 180, elev: 6 },
  backthree: { azim: 145, elev: 8 },
};

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
for (const v of viewsArg.split(',')) {
  const cfg = VIEWS[v];
  if (!cfg) continue;
  // fresh browser per view + retry: swiftshader GL crashes randomly under this sandbox
  let ok = false;
  for (let attempt = 0; attempt < 2 && !ok; attempt++) {
    const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
    try {
      const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
      page.on('pageerror', (e) => console.log('[pageerror]', e.message));
      await page.goto(`http://127.0.0.1:${port}/tools/preview/index.html?azim=${cfg.azim}&elev=${cfg.elev}&design=${design}`);
      await page.waitForFunction(() => document.title === 'READY', { timeout: 20000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${prefix}-${v}.png` });
      console.log(`saved ${prefix}-${v}.png`);
      ok = true;
    } catch (e) {
      console.log(`view ${v} attempt ${attempt + 1} failed:`, String(e).slice(0, 120));
    }
    await browser.close().catch(() => {});
  }
}
server.close();
