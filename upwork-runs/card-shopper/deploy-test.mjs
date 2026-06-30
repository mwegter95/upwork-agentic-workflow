import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:4178/";
const results = [];
const consoleErrors = [];
const pageErrors = [];

function ok(name, cond, detail = "") {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  :: " + detail : ""}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => pageErrors.push(String(e)));

await page.goto(BASE, { waitUntil: "networkidle" });
await sleep(800);

// 1) First paint, no console errors
ok("first-paint root rendered", (await page.locator("#root *").count()) > 0);
ok("no console errors on first paint", consoleErrors.length === 0, consoleErrors.slice(0, 4).join(" | "));
ok("no page errors on first paint", pageErrors.length === 0, pageErrors.slice(0, 4).join(" | "));

// Dismiss the guided tour if present
async function dismissTour() {
  const scrim = page.locator(".tour-scrim");
  if (await scrim.count()) {
    const skip = page.getByRole("button", { name: /skip tour/i });
    if (await skip.count()) {
      await skip.first().click().catch(() => {});
    } else {
      const gold = page.locator(".tour-card .btn.gold");
      for (let i = 0; i < 6 && (await page.locator(".tour-scrim").count()); i++) {
        await gold.first().click().catch(() => {});
        await sleep(250);
      }
    }
    await sleep(300);
  }
}
await dismissTour();
ok("tour dismissed", (await page.locator(".tour-scrim").count()) === 0);

// 2) Map home -> open a shop via a pin
const pin = page.locator("button.pin").first();
ok("map pins present", (await page.locator("button.pin").count()) > 0);
await pin.click();
await sleep(600);
ok("shop profile opened (bin-stage present)", (await page.locator(".bin-stage").count()) > 0);

// 3) HERO value-box flip
async function getFaceVisible() {
  return await page.locator(".reveal-actions").count();
}
const flipcard = page.locator(".bin-stage .flipcard").last();
ok("flip bin has cards", (await page.locator(".bin-stage .flipcard").count()) > 0);
if (await flipcard.count()) {
  await flipcard.click().catch(() => {});
  await sleep(900);
}
ok("hero flip reveals card face", (await getFaceVisible()) > 0);

// 4) Make-offer accept/decline at the 85% threshold.
// The seller accepts when amount >= listing.price * 0.85 (see app.js makeOffer).
async function returnToShop() {
  // go home (map) via the brand, then open a shop pin
  const brand = page.locator(".brand").first();
  if (await brand.count()) { await brand.click().catch(() => {}); await sleep(400); }
  const pinAgain = page.locator("button.pin").first();
  if (await pinAgain.count()) { await pinAgain.click().catch(() => {}); await sleep(600); }
  const seg = page.locator(".seg button");
  if (await seg.count()) { await seg.nth(1).click().catch(() => {}); await sleep(400); } // Grid
}

async function openOfferModal() {
  const offerBtn = page.getByRole("button", { name: /^offer$/i }).first();
  if (!(await offerBtn.count())) return false;
  await offerBtn.click().catch(() => {});
  await sleep(400);
  return (await page.locator(".modal").count()) > 0;
}

// ensure grid view for stable Offer buttons
{
  const seg = page.locator(".seg button");
  if (await seg.count()) { await seg.nth(1).click().catch(() => {}); await sleep(400); }
}

// 4a) ACCEPT path: the modal pre-fills the offer at 85% of asking -> accepted.
const acceptOpened = await openOfferModal();
ok("offer modal opens", acceptOpened);
if (acceptOpened) {
  const amtInput = page.locator(".modal input[aria-label='Offer amount']").first();
  const prefill = Number(await amtInput.inputValue().catch(() => "0"));
  // pre-fill is round(price*0.85); bump 1 above to be safely >= threshold
  await amtInput.fill(String(prefill + 1)).catch(() => {});
  await page.getByRole("button", { name: /send offer/i }).first().click().catch(() => {});
  await sleep(5800);
  const accepted = (await page.locator(".pill.status-accepted").count()) > 0;
  ok("offer >=85% accepted", accepted, `offered ${prefill + 1}`);
}

// 4b) DECLINE path: a deliberately low offer (< 85%) -> declined.
await returnToShop();
const declineOpened = await openOfferModal();
ok("second offer modal opens (decline path)", declineOpened);
if (declineOpened) {
  const amtInput = page.locator(".modal input[aria-label='Offer amount']").first();
  await amtInput.fill("1").catch(() => {});
  await page.getByRole("button", { name: /send offer/i }).first().click().catch(() => {});
  await sleep(5800);
  const declined = (await page.locator(".pill.status-declined").count()) > 0;
  ok("offer <85% declined", declined, "offered 1");
}

// 5) AI upload accept/override (seller side) - full flow.
async function gotoSeller() {
  const rt = page.locator(".roletoggle button");
  if (await rt.count()) {
    const seller = page.getByRole("button", { name: /^seller$/i }).first();
    await seller.click().catch(() => {});
    await sleep(500);
  }
}
await gotoSeller();
// submit application if shown
const submitApp = page.getByRole("button", { name: /submit application|submit|apply/i }).first();
if (await submitApp.count()) {
  await submitApp.click().catch(() => {});
  await sleep(3600); // auto-approve ~3s
}
ok("seller booth reachable (tabs present)", (await page.locator(".tabs button").count()) > 0);

// Activate subscription so upload is unlocked
async function clickTab(label) {
  const t = page.locator(".tabs button", { hasText: new RegExp("^" + label + "$", "i") }).first();
  if (await t.count()) { await t.click().catch(() => {}); await sleep(400); return true; }
  return false;
}
const subActive0 = await page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem("cardshopper:v1")).subscription.status; } catch { return null; }
});
if (subActive0 !== "active") {
  await clickTab("Subscription");
  const subBtn = page.getByRole("button", { name: /^subscribe$/i }).first();
  if (await subBtn.count()) {
    await subBtn.click().catch(() => {});
    await sleep(400);
    const pay = page.getByRole("button", { name: /pay .* and activate/i }).first();
    await pay.click().catch(() => {});
    await sleep(600);
  }
}
const subStatus = await page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem("cardshopper:v1")).subscription.status; } catch { return null; }
});
ok("subscription activated (mock Stripe)", subStatus === "active", `status=${subStatus}`);

// AI upload flow
await clickTab("AI upload");
const dropzone = page.locator(".dropzone").first();
ok("upload dropzone present", (await dropzone.count()) > 0);
if (await dropzone.count()) {
  await dropzone.click().catch(() => {});
  await sleep(2400); // scan ~1.8s -> step 3
  ok("AI detect reaches editable review (market-suggest)", (await page.locator(".market-suggest").count()) > 0);
  // Override: price input becomes editable
  const overrideBtn = page.getByRole("button", { name: /^override$/i }).first();
  let overrideWorks = false;
  if (await overrideBtn.count()) {
    await overrideBtn.click().catch(() => {});
    await sleep(250);
    const priceInput = page.locator(".panel input.num[type='number']").last();
    overrideWorks = await priceInput.isEnabled().catch(() => false);
    if (overrideWorks) await priceInput.fill("777").catch(() => {});
  }
  ok("override unlocks the price field", overrideWorks);
  // Accept: re-accept the suggested market price
  const acceptBtn = page.getByRole("button", { name: /^accept$/i }).first();
  let acceptWorks = false;
  if (await acceptBtn.count()) {
    await acceptBtn.click().catch(() => {});
    await sleep(250);
    const priceInput = page.locator(".panel input.num[type='number']").last();
    acceptWorks = !(await priceInput.isEnabled().catch(() => true)); // disabled when accepted
  }
  ok("accept re-locks to suggested market price", acceptWorks);
  // Publish
  const publish = page.getByRole("button", { name: /publish listing/i }).first();
  if (await publish.count()) { await publish.click().catch(() => {}); await sleep(600); }
  ok("listing published (success state)", (await page.getByText(/listing published/i).count()) > 0);
}

// 6) localStorage persistence across reload
const before = await page.evaluate(() => localStorage.getItem("cardshopper:v1"));
ok("localStorage state written", !!before && before.length > 2);
await page.reload({ waitUntil: "networkidle" });
await sleep(700);
const after = await page.evaluate(() => localStorage.getItem("cardshopper:v1"));
ok("localStorage persists across reload", !!after && after.length > 2);

// no new console errors accumulated across the run (ignore favicon/font noise)
const realErrors = consoleErrors.filter((e) => !/favicon|font|net::ERR_/.test(e));
ok("no console errors across full run", realErrors.length === 0, realErrors.slice(0, 5).join(" | "));

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log("\n----------------------------------------");
console.log(`TOTAL ${results.length}  PASS ${results.length - failed.length}  FAIL ${failed.length}`);
if (consoleErrors.length) console.log("CONSOLE ERRORS:\n" + consoleErrors.join("\n"));
if (pageErrors.length) console.log("PAGE ERRORS:\n" + pageErrors.join("\n"));
console.log(`VERDICT: ${failed.length === 0 ? "pass" : "fail"}`);
process.exit(failed.length === 0 ? 0 : 1);
