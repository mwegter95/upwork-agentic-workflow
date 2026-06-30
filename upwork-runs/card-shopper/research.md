# research.md - Card Shopper (build-prep, richness 10)

Self-contained static React-via-CDN + htm SPA. No backend, no Surface runner, no
build step. Everything below is verified-local-only friendly. Mock CollX, mock
Stripe, inline SVG map, license-clear card art.

---

## 1. SCAFFOLD POINTER (copy file shape + CDN wiring; inherit NO styling)

**Clone from:** `../michaelwegter.com/public/demos/full-stack-developer-python-fastapi/`
This is the canonical lean, no-bundler React-via-CDN + htm demo. Copy its FILE
SHAPE and CDN wiring only.

- `index.html` head wires UMD React + htm (Safari-safe, no importmap):
  ```html
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/htm@3/dist/htm.js" crossorigin></script>
  ```
  Then it loads plain (non-module) scripts in order at the end of `<body>`:
  `<script src="./assets/parser.js"></script> ... ./assets/app.js`. Each module is
  an IIFE that hangs its exports on `window` (e.g. `window.ReconData = ...`) so
  later files can read them. No `import`/`export`, no `type=module`. This is the
  pattern to copy for `card-shopper`'s many split files (`store.js`,
  `data-shops.js`, `data-listings.js`, `screens-*.js`, `components.js`, `app.js`).

- `assets/app.js` shows the exact UMD bind at the top of the root file:
  ```js
  (function () {
    "use strict";
    const { useState, useEffect, useRef, useMemo } = React;   // UMD globals
    const html = htm.bind(React.createElement);                // htm template tag
    // ...components using html`<div ...>` ...
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(html`<${App} />`);
  })();
  ```
  Use `ReactDOM.createRoot` (UMD global), NOT the esm.sh `createRoot` import. (The
  `healthstack-patient-portal` demo uses the esm.sh module style instead; do NOT
  mix the two - stick to the UMD + htm style above for the whole app.)

**NOTE on shared hooks across split files:** with the IIFE/`window` pattern, define
`const html = htm.bind(React.createElement);` once and expose it (e.g.
`window.html = html`) OR re-bind per file (cheap). Re-binding per file is simplest
and avoids load-order surprises. Each screen module should expose its components on
a namespace (e.g. `window.Screens = window.Screens || {}; Screens.Home = ...`).

### Registry shape (the ONE michaelwegter.com edit; site chrome, not demo styling)

Schema confirmed from CLAUDE.md and `../michaelwegter.com/src/data/workSamples.js`.
Prepend a new entry to `workSampleRegistry` (the array, highest `id` so far is 9
for `mn-state-park-tracker`; use `id: 10`). Exact fields a valid entry needs:

```js
{
  id: 10,
  slug: "card-shopper",
  title: "Card Shopper - curated trading card marketplace",
  description: "One or two plain sentences. The map browse, the value-box flip, the seller booth.",
  category: "E-commerce",            // or "Creative"; any string, shown as label
  status: "live",
  href: import.meta.env.BASE_URL + "demos/card-shopper/",
  color: "#0E3B2E",                  // felt green from the plan palette
  icon: "🃏",                         // single emoji
  frameStyle: "baroque",             // "baroque" | "walnut"
  tags: [ /* see below */ ],
  screenshot: import.meta.env.BASE_URL + "work-samples/card-shopper.png",
  client: "Upwork, Card Shopper (trading card marketplace founder)",
  postingSummary: "Curated card-show-style marketplace: US map of verified shops, value-box flip browse, 4-step AI upload, zero-fee Stripe subscription.",
  builtFor: "Card Shopper - curated trading card marketplace (Upwork)",
  date: "2026-06-30",
  proposalDeckUrl: null,
  proposalPageUrl: null,
}
```

**Tags (4 to 10, must match `tagSections` casing exactly).** All of these already
exist in `tagSections`, so NO `tagSections` edit is required:
`["React", "JavaScript", "Maps", "E-commerce", "Dashboard", "Mobile App", "Real-time"]`
(`Maps`, `E-commerce`, `Dashboard`, `Mobile App`, `Real-time`, `Full-Stack` all
live in the `data`/`type` sections; `React`/`JavaScript` in `frontend`). If you add
any NEW tag, you MUST also add it to the right section in `tagSections` in the same
edit - but the list above avoids that.

`tagSections` lives at line ~481 of `workSamples.js`; the registry array is at the
top. Two surgical edits in that one file (new entry + nothing else) plus the PNG.

---

## 2. EXACT LIBRARIES (pinned CDN URLs) + the inline SVG map approach

Keep it lean. Only these three are needed:

```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
<script src="https://unpkg.com/htm@3/dist/htm.js" crossorigin></script>
```

- **Dates:** do NOT add a date library. Native `Intl.DateTimeFormat` and
  `new Date(...).toLocaleString()` cover drop dates, billing renewal dates, and
  message timestamps. A 6-line relative-time helper ("2h ago") in `components.js`
  is enough. Adding date-fns/dayjs would violate "keep it lean."
- **No Mapbox, no Google Maps, no map key.** The map is inline SVG (next).

### Inline US states SVG (public-domain) + absolute pin placement

**Approach (recommended, fully offline, zero copyright risk):** embed a
public-domain blank US map SVG and overlay pins as absolutely-positioned elements.

- **Source:** the widely-used public-domain "Blank US Map" (Albers-style) SVG, the
  same base shipped by simplemaps/us-atlas and Wikimedia Commons "Blank US Map
  (states only).svg". It uses **`viewBox="0 0 959 593"`** with one `<path>` per
  state. The builder can paste this path set into `assets/us-map.svg` (or inline it
  in `screens-home.js`). It is public domain (no attribution required). Style every
  state path with `fill: var(--felt-green-tint)` + `stroke: rgba(245,240,230,.18)`
  so it reads as a dark felt table, NOT a literal political map.
- **Pin placement:** wrap the SVG in a `position: relative` container sized to the
  SVG's aspect ratio (959:593 ~= 1.617). Render each shop pin as a
  `position: absolute` element with `left`/`top` as **percentages** so pins scale
  with the map responsively. Percentages map directly onto the 959x593 viewBox
  (`left% = x/959*100`, `top% = y/593*100`). Use `transform: translate(-50%, -100%)`
  so the pin's TIP sits on the coordinate.
- **Approximate pin coordinates on the 959x593 viewBox** (good enough for a demo;
  spread shops across categories/regions):

  | City | left % | top % | suggested shop/category |
  |------|--------|-------|--------------------------|
  | Seattle, WA | 10 | 9 | Route 1 Pokemon (Pokemon) |
  | San Francisco, CA | 4 | 49 | The Foil Room (multi) |
  | Los Angeles, CA | 9 | 62 | PrizmHouse Breaks (sports) |
  | Phoenix, AZ | 19 | 67 | Desert Mana Games (MTG) |
  | Denver, CO | 34 | 47 | Mile High Holos (Pokemon) |
  | Dallas, TX | 49 | 73 | First Pitch Collectibles (sports) |
  | Austin, TX | 47 | 78 | Tap Out Games (MTG) |
  | Minneapolis, MN | 56 | 26 | North Star Cards (multi) |
  | Chicago, IL | 63 | 38 | Holo Vault (Pokemon) |
  | Atlanta, GA | 74 | 66 | Peachtree Prospects (sports) |
  | Orlando, FL | 80 | 86 | Pallet Town Trading (Pokemon) |
  | Cooperstown / NYC, NY | 87 | 33 | Dugout Cards Co. (sports) |
  | Boston, MA | 91 | 28 | Topdeck Emporium (MTG) |

  Pin fill = the plan's category color (sports `#1E66FF`, Pokemon `#FFCB05`, MTG
  `#7B3FA0`, multi `#2DB67D`). Add a subtle drop-shadow + a pulse ring on the
  active/hovered pin; live drop pins get a small gold dot badge.

---

## 3. DOMAIN ACCURACY (believable mock data)

### CollX (the AI card-scan reference the 4-step upload must mirror)

CollX ("collects") is a real mobile app that scans a sports/TCG card photo and
returns a recognized record. From collx.app, the scan returns and displays:
**player/character name, set name, card number (e.g. #4/102), year, sport/category,
and an estimated market value** (the average of recent marketplace transactions),
plus a grading path. There is no public developer/REST endpoint reachable here (the
`/developers` page 404s), which confirms the plan's decision to MOCK it. So the
mock `/detect` should return, after a faux "AI detecting..." delay:
`{ player, set, year, cardNumber, category, grade (suggested), estValue }`, all
EDITABLE by the seller, with `estValue` shown as the "market price suggestion" the
seller can accept or override. This mirrors CollX faithfully.

### Stripe recurring-subscription concepts (for the mock subscription screen)

Model the mock on real Stripe nouns so the deck/cover read credibly:
- **Product -> Price** with `recurring: { interval: "month" }` (NOT a one-time
  charge). Two tiers, e.g. **"Booth" $29/mo** and **"Booth Pro" $49/mo**, both with
  **zero per-sale fees** (the headline differentiator).
- **Checkout Session** (`mode: "subscription"`) -> on "success", set local state to
  `subscription: { plan, status: "active", renewsOn: <date +1 month> }`.
- **Customer Billing Portal**: a "Manage billing" button opens a mock portal panel
  (change plan / cancel / view next invoice). Cancelling -> `status: "canceled"`
  which re-gates seller listing actions. All client-side, no Stripe keys.

### Klaviyo (for the drop email-preview narrative)

A drop publish simulates a Klaviyo **flow/campaign** to the shop's **follower
segment**. The rendered email-preview should look like a Klaviyo template with
merge tags resolved: shop name, drop title, date/time, teaser, a "Browse the drop"
CTA, and a few featured cards. The deck frames real Klaviyo wiring as scope-out;
the demo shows the rendered email + an in-app notification + the follower feed.

### Example shops (fictional, trademark-safe, real-sounding)

Use the 13 from the pin table above. Give each a `specialty` line, a verified
badge, a follower count, and 1 to 2 value boxes. Spread categories: ~5 sports, ~4
Pokemon, ~3 MTG, ~2 multi.

### Card fixture reference table (turn into `data-listings.js`)

Believable, generic enough to avoid using any real copyrighted scan (art is
CSS/placeholder, see section 4). Grades use the real PSA/BGS scales.

**Sports**
| Player | Set | Year | Grade | ~Price |
|--------|-----|------|-------|--------|
| Patrick Mahomes (RC) | Panini Prizm | 2017 | PSA 10 | $2,400 |
| Victor Wembanyama (RC) | Panini Prizm | 2023-24 | PSA 10 | $900 |
| Mike Trout (RC) | Topps Update | 2011 | BGS 9.5 | $1,850 |
| Shohei Ohtani (RC) | Topps Chrome | 2018 | PSA 10 | $720 |
| Luka Doncic (RC) | Panini Prizm | 2018-19 | PSA 9 | $640 |
| Ja'Marr Chase (RC) | Panini Prizm | 2021 | PSA 9 | $120 |
| Caitlin Clark (RC) | Panini Prizm WNBA | 2024 | PSA 10 | $460 |
| Connor Bedard (RC) | Upper Deck Young Guns | 2023-24 | PSA 10 | $300 |

**Pokemon**
| Card | Set | Year | Grade | ~Price |
|------|-----|------|-------|--------|
| Charizard Holo #4/102 | Base Set | 1999 | PSA 9 | $2,000 |
| Blastoise Holo #2/102 | Base Set | 1999 | PSA 8 | $400 |
| Mewtwo Holo #10/102 | Base Set | 1999 | PSA 9 | $300 |
| Pikachu #58/102 | Base Set | 1999 | PSA 8 | $60 |
| Umbreon VMAX (Alt Art) | Evolving Skies | 2021 | PSA 10 | $550 |
| Rayquaza VMAX (Alt Art) | Evolving Skies | 2021 | PSA 10 | $120 |
| Lugia Holo #9/111 | Neo Genesis | 2000 | PSA 8 | $700 |
| Charizard ex #125 | Obsidian Flames | 2023 | PSA 10 | $70 |

**Magic: The Gathering**
| Card | Set | Year | Grade | ~Price |
|------|-----|------|-------|--------|
| Tarmogoyf | Future Sight | 2007 | BGS 9.5 | $120 |
| Liliana of the Veil | Innistrad | 2011 | PSA 10 | $150 |
| Jace, the Mind Sculptor | Worldwake | 2010 | PSA 9 | $130 |
| Ragavan, Nimble Pilferer | Modern Horizons 2 | 2021 | PSA 10 | $90 |
| Snapcaster Mage | Innistrad | 2011 | BGS 9 | $60 |
| Force of Will | Alliances | 1996 | BGS 8.5 | $200 |
| The One Ring | LOTR: Tales of ME | 2023 | PSA 10 | $110 |
| Liliana, the Last Hope | Eldritch Moon | 2016 | PSA 9 | $70 |

Add `foil` flags (Pokemon holos, MTG foils), a `valueBoxId` on roughly half the
cards so the flip bins are populated, and a `category` field driving pin/chip color.
Aim for ~30 to 40 listings total so search/filter/sort are genuinely exercised.

---

## 4. CARD IMAGERY (license-clear, never broken images)

Do NOT use real copyrighted card scans. Two layered approaches; use BOTH:

**Primary - CSS-drawn card faces (best, zero network, fully on-brand).** Render each
card as a styled `<div>`: ivory cardstock background, a gold/category-colored frame
border, the player/character name + set + year typeset on it (Fraunces title, Inter
Tight metadata), a grade chip (e.g. "PSA 10") top-right, and a foil-shimmer overlay
(`linear-gradient` + animated `background-position`) for foil cards. The face-DOWN
state of the flip is a CSS/SVG card back: a repeating diamond/foil pattern in navy +
gold (`repeating-linear-gradient` or a small inline SVG pattern), identical for all
cards so the bin reads as face-down. This is the most reliable for the hero flip and
carries the demo with no external requests.

**Secondary - generic free placeholder art (texture/variety behind the frame).**
Use deterministic, license-free image services so cards are never broken and always
load the same image per card:

- Lorem Picsum (free, no key, deterministic by seed):
  - `https://picsum.photos/seed/cs-sports-01/360/504`
  - `https://picsum.photos/seed/cs-pokemon-01/360/504`
  - `https://picsum.photos/seed/cs-mtg-01/360/504`
  - vary the seed per listing id, e.g. `https://picsum.photos/seed/cs-<id>/360/504`
    (360x504 ~= 2.5x3.5 card ratio). Place it as the frame's inner art with a
    category-tinted overlay so it reads as "card art," not a photo.
- Optional Unsplash/Pexels direct hero images for shop banners (not card faces):
  - `https://images.pexels.com/photos/1echo...` style direct URLs, or simpler, keep
    shop banners as CSS gradients in the category color. Prefer CSS to avoid any
    broken-image risk.

**Rule:** every card MUST render even with zero network (CSS face is the source of
truth); the picsum art is an enhancement layered behind the frame with an
`onerror`-safe fallback to a flat gradient. No real card scans anywhere.

---

## 5. DESIGN CUES

### Google Fonts embed (confirmed URLs)

Single combined request (put in `index.html` head, after the `preconnect` links):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Inter+Tight:wght@400;500;600;700&display=swap" />
```

- **Fraunces** is a variable serif with an optical-size axis (`opsz 9..144`); the
  range above gives display weights 400 to 700. Use it large and high-contrast for
  headings, prices-as-hero, and the logo (auction-catalog gravitas).
- **Inter Tight** for UI/body and dense metadata; enable tabular figures for prices
  and dashboard stats via `font-feature-settings: "tnum" 1;`.
- Optional tactile accent for price tags / card-metadata labels: add
  `&family=Space+Mono:wght@400;700` to the same URL only if you actually use it;
  otherwise skip to stay lean.

### Visual-language reference notes (premium collector / card-show / auction catalog)

- **Card-show table felt:** the dark felt-green + midnight-navy ground evokes the
  tables at a real show; cards "sit" on felt with soft contact shadows. Keep large
  dark negative space so ivory cards and gold accents pop.
- **Auction-catalog gravitas:** big Fraunces headers, generous margins, a thin gold
  hairline rule under section titles, prices set large and tabular like lot
  estimates. Metadata (set, year, grade) reads like a catalog lot description.
- **Foil / premium cues:** reserve foil-gold (`#D4AF37`) for CTAs, the verified
  badge, grade chips, and the foil-shimmer on holo/foil cards. A subtle animated
  gold shimmer on the primary CTA and on foil cards sells the "premium" feel without
  noise. Verified-seller badges and "zero per-sale fees" messaging should feel like
  a trust seal, not a generic checkmark.
- **Tactile depth:** slight card tilt on hover (`transform: rotateX/rotateY` a few
  degrees), the signature 3D flip (`perspective` + `rotateY(180deg)` with staggered
  fan timing), soft layered shadows. Motion is restrained and physical, never
  bouncy or playful.
- **Category as a color system:** cobalt/sports, yellow/Pokemon, purple/MTG,
  emerald/multi appear consistently on pins, filter chips, and card frame accents so
  the three worlds stay legible at a glance.

---

## handoff
- produced: `research.md` - build-prep for the richness-10 `card-shopper`
  self-contained React-via-CDN + htm SPA.
- scaffold: clone file shape + CDN wiring from
  `public/demos/full-stack-developer-python-fastapi/` (UMD React + htm@3, IIFE
  scripts on `window`, `ReactDOM.createRoot`, `html = htm.bind(React.createElement)`);
  inherit NO styling. Registry = ONE entry (`id: 10`) prepended to
  `workSampleRegistry` in `src/data/workSamples.js`; all 7 suggested tags already
  exist in `tagSections` so no `tagSections` edit needed.
- libraries: ONLY react@18 UMD + react-dom@18 UMD + htm@3 (pinned URLs given). No
  date lib (use `Intl`), no map lib. Map = public-domain blank US SVG
  `viewBox="0 0 959 593"` with absolutely-positioned percentage pins (coords table
  provided), category-colored.
- domain: CollX returns player/set/year/cardNumber/grade/estValue -> mock `/detect`
  shape given; Stripe recurring concepts (Product/Price/Checkout Session/Billing
  Portal, two tiers, zero per-sale fees) and Klaviyo flow/merge-tag email-preview
  narrative noted. Believable 24-card fixture table across sports/Pokemon/MTG with
  real PSA/BGS grades + plausible prices, plus 13 fictional trademark-safe shops
  mapped to pins.
- imagery: CSS-drawn card faces as the source of truth (zero-network, on-brand foil
  shimmer + navy/gold card back), Lorem Picsum deterministic seeds
  (`picsum.photos/seed/cs-<id>/360/504`) as layered art with gradient fallback. No
  real card scans.
- design: combined Google Fonts URL for Fraunces + Inter Tight confirmed; card-show
  felt / auction-catalog / foil-premium visual notes given. Palette + category
  colors come from `plan.md` section 5.
- next needs: demo-builder scaffolds the SPA in
  `michaelwegter.com/public/demos/card-shopper/`, builds the CSS card face + 3D flip
  FIRST, wires `store.js` localStorage persistence early, then layers screens;
  verifies on localhost only (live URL unreachable here).
- risks: keep the inline US SVG path data compact (it can be large - minify/round
  coords); ensure picsum failures fall back to CSS gradient so no broken images;
  hold the file budget at <=20; do not let breadth dilute hero-flip polish.
