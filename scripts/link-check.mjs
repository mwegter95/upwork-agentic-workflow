#!/usr/bin/env node
/**
 * link-check.mjs - verify one or more URLs return a healthy status.
 * Usage: node scripts/link-check.mjs <url> [url2 ...]
 * Exit 0 only if every URL returns 200-399. Prints a line per URL.
 */
const urls = process.argv.slice(2);
if (!urls.length) {
  console.error("usage: node scripts/link-check.mjs <url> [url2 ...]");
  process.exit(2);
}

let bad = 0;
for (const u of urls) {
  try {
    const res = await fetch(u, { redirect: "follow" });
    const ok = res.status >= 200 && res.status < 400;
    console.log(`${ok ? "OK " : "BAD"} ${res.status} ${u}`);
    if (!ok) bad++;
  } catch (e) {
    console.log(`ERR --- ${u} (${e.message})`);
    bad++;
  }
}
process.exit(bad ? 1 : 0);
