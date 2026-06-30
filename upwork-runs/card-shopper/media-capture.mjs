import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.BASE_URL || "http://localhost:4178/";
const RUN = "/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/upwork-runs/card-shopper";
const SITE = "/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/michaelwegter.com";
const MEDIA = path.join(RUN, "proposal/media");
const CARD_PNG = path.join(SITE, "public/work-samples/card-shopper.png");

fs.mkdirSync(MEDIA, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 2,
  recordVideo: { dir: MEDIA, size: { width: 1280, height: 720 } },
});
const page = await ctx.newPage();

async function dismissTour() {
  if (await page.locator(".tour-scrim").count()) {
    const skip = page.getByRole("button", { name: /skip tour/i });
    if (await skip.count()) await skip.first().click().catch(() => {});
    await sleep(400);
  }
}
async function shot(name) {
  await page.screenshot({ path: path.join(MEDIA, name) });
  console.log("shot", name);
}

await page.goto(BASE, { waitUntil: "networkidle" });
await sleep(900);

// 1) Map home (hero candidate)
await dismissTour();
await sleep(400);
await shot("01-map-home.png");

// 2) Open a shop -> flip bin (hero)
await page.locator("button.pin").first().click().catch(() => {});
await sleep(700);
await shot("02-shop-flip-bin.png");

// 3) Mid-flip + revealed face
const flipcard = page.locator(".bin-stage .flipcard").last();
if (await flipcard.count()) {
  await flipcard.click().catch(() => {});
  await sleep(300);
  await shot("03-flip-midflip.png"); // caught mid-rotation
  await sleep(700);
  await shot("04-card-revealed.png");
}

// 4) Grid + filters view
const seg = page.locator(".seg button");
if (await seg.count()) { await seg.nth(1).click().catch(() => {}); await sleep(500); }
await shot("05-grid-filters.png");

// 5) Make-offer modal
const offerBtn = page.getByRole("button", { name: /^offer$/i }).first();
if (await offerBtn.count()) {
  await offerBtn.click().catch(() => {});
  await sleep(500);
  await shot("06-make-offer.png");
  await page.getByRole("button", { name: /send offer/i }).first().click().catch(() => {});
  await sleep(900);
}

// 6) Seller booth: apply -> dashboard
const sellerToggle = page.getByRole("button", { name: /^seller$/i }).first();
if (await sellerToggle.count()) { await sellerToggle.click().catch(() => {}); await sleep(500); }
const submitApp = page.getByRole("button", { name: /submit application|submit|apply/i }).first();
if (await submitApp.count()) { await submitApp.click().catch(() => {}); await sleep(3600); }
await shot("07-seller-dashboard.png");

// 7) Subscription + mock Stripe
async function clickTab(label) {
  const t = page.locator(".tabs button", { hasText: new RegExp("^" + label + "$", "i") }).first();
  if (await t.count()) { await t.click().catch(() => {}); await sleep(500); return true; }
  return false;
}
await clickTab("Subscription");
await shot("08-subscription.png");
const subBtn = page.getByRole("button", { name: /^subscribe$/i }).first();
if (await subBtn.count()) {
  await subBtn.click().catch(() => {});
  await sleep(500);
  await shot("09-stripe-checkout.png");
  await page.getByRole("button", { name: /pay .* and activate/i }).first().click().catch(() => {});
  await sleep(600);
}

// 8) AI upload flow
await clickTab("AI upload");
const dropzone = page.locator(".dropzone").first();
if (await dropzone.count()) {
  await shot("10-ai-upload-photo.png");
  await dropzone.click().catch(() => {});
  await sleep(800);
  await shot("11-ai-detecting.png");
  await sleep(1800);
  await shot("12-ai-review-price.png");
}

// 9) Drop builder live email preview
await clickTab("Drops");
await sleep(500);
await shot("13-drop-builder-email.png");

await page.close(); // finalize video
const videoPath = await page.video()?.path().catch(() => null);
await ctx.close();
await browser.close();

// rename the recorded video to a friendly name
if (videoPath && fs.existsSync(videoPath)) {
  const dest = path.join(MEDIA, "card-shopper-hero-flow.webm");
  fs.renameSync(videoPath, dest);
  console.log("video", dest);
}

// 10) 16:9 card still for the work-samples gallery card (use the hero flip bin)
const ctx2 = await browser.isConnected() ? null : null;
// fresh context for a clean, deterministic card still
const b2 = await chromium.launch();
const c2 = await b2.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
const p2 = await c2.newPage();
await p2.goto(BASE, { waitUntil: "networkidle" });
await sleep(900);
if (await p2.locator(".tour-scrim").count()) {
  const sk = p2.getByRole("button", { name: /skip tour/i });
  if (await sk.count()) await sk.first().click().catch(() => {});
  await sleep(400);
}
await p2.locator("button.pin").first().click().catch(() => {});
await sleep(700);
const fc = p2.locator(".bin-stage .flipcard").last();
if (await fc.count()) { await fc.click().catch(() => {}); await sleep(900); }
fs.mkdirSync(path.dirname(CARD_PNG), { recursive: true });
await p2.screenshot({ path: CARD_PNG }); // 1280x720 = 16:9
console.log("card-still", CARD_PNG);
await b2.close();

console.log("MEDIA DONE");
