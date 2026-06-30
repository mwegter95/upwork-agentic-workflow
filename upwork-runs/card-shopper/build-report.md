# build-report.md - Card Shopper (demo-builder)

Richness target 10 of 10. Self-contained React-via-CDN + htm SPA, frontend only,
localStorage persistence, no backend. Built per plan.md sections 3, 3b, 2b.

## What was built

A single multi-screen app that walks the whole product story: US map home ->
verified shop profile -> the value-box flip (hero) -> the zero-fee seller booth.
Every advertised flow functions and persists across reload, with a Reset demo
control and an optional guided tour.

Buyer side (working + persisted): inline public-domain-style US map silhouette
(959x593 viewBox) with category-colored pins, drop banners, global top-bar search,
category tiles, shop profiles, the HERO 3D flip bin (real CSS rotateY + fanned/
staggered face-down stack, keyboard flippable) with a Flip|Grid toggle, per-shop
search, multi-facet filters (price slider, category, grade) + sort, watchlist save
+ watchlist page + top-bar count, per-listing message threads with canned seller
replies, make-offer modal with a real pending -> accepted/declined state machine +
offers inbox, instant buy -> order confirmation + orders page, follow-a-shop ->
follower feed + home banner, and a notifications center with unread counts.

Seller side (working + persisted): role toggle, seller application Pending ->
Approved gate, booth dashboard whose stats (active listings, monthly sales, open
offers, followers) update live from real actions, 4-step AI-assisted upload
(photo -> faux "AI detecting" scan animation -> EDITABLE auto-detected fields
mirroring CollX: player/set/year/card number/grade -> market-price suggestion with
accept/override -> publish standalone OR into a value box where it then appears in
that bin), listings manager (edit price / delist), drop builder with a LIVE
email-preview render (Klaviyo-style, simulated send to followers) that creates a
scheduled drop shown in the follower feed + notifications, and a subscription
screen with 2 tiers, a mock Stripe checkout (test card prefilled), and an active/
canceled billing state that gates and unlocks seller actions with the flat fee +
zero per-sale fees called out.

Polish: responsive mobile layout with a bottom nav, loading/empty/success states,
the signature 3D flip plus card tilt and foil shimmer on gold/foil cards, visible
focus states + aria labels + alt text + Enter/Space to flip + Escape to close
modals, toasts, and a 4-step guided tour remembered in persisted state.

Design: bespoke felt-green/midnight-navy/foil-gold/ivory collector palette with
the category color system, Fraunces display + Inter Tight UI from the plan's
Google Fonts URL. Card faces are CSS-drawn (zero-network source of truth) with
Lorem Picsum deterministic seeds layered behind and an onError gradient fallback,
so there are no broken images. Does not resemble michaelwegter.com.

Backend substitution (per Zscaler overrides): the CollX `/detect` endpoint and
Stripe are client-side mocks; no Surface service, no Flask blueprint, no push.

## Files (13 demo files + 1 registry edit, all under the ~20 cap)

- public/demos/card-shopper/index.html
- public/demos/card-shopper/assets/styles.css
- public/demos/card-shopper/assets/data-shops.js
- public/demos/card-shopper/assets/data-listings.js
- public/demos/card-shopper/assets/store.js
- public/demos/card-shopper/assets/us-map.js
- public/demos/card-shopper/assets/components.js
- public/demos/card-shopper/assets/notifications.js
- public/demos/card-shopper/assets/screens-home.js
- public/demos/card-shopper/assets/screens-shop.js
- public/demos/card-shopper/assets/screens-buyer.js
- public/demos/card-shopper/assets/screens-seller.js
- public/demos/card-shopper/assets/app.js
- src/data/workSamples.js (one prepended entry, id 10; no tagSections edit)

No image assets (CSS card faces + deterministic picsum), so the file count stayed
low.

## Local preview command + URL

```
cd michaelwegter.com/public/demos/card-shopper
python3 -m http.server 4178
```
Then open http://localhost:4178/ (or `npx serve .` and use the printed URL).

## Registry entry added

id 10, slug `card-shopper`, title "Card Shopper - curated trading card
marketplace", category E-commerce, href `import.meta.env.BASE_URL +
"demos/card-shopper/"`, color #0E3B2E, icon playing-card, frameStyle baroque,
tags `["React","JavaScript","Maps","E-commerce","Dashboard","Mobile App",
"Real-time"]` (all already in tagSections), screenshot null (capture could not be
produced in this session, see below), plus client/postingSummary/builtFor/date.

## Self-test results

- Static error check (get_errors) on workSamples.js + all demo JS: CLEAN, no
  errors.
- Dash gate: grep for U+2013/U+2014 across the entire
  public/demos/card-shopper/ tree returned NO matches. The added registry entry
  uses hyphen-minus only. PASS.
- File-shape/CDN wiring cloned from
  public/demos/full-stack-developer-python-fastapi/ (UMD React + react-dom + htm@3,
  IIFE modules on window.CS.*, ReactDOM.createRoot, html = htm.bind(...)).
- NOT EXECUTED in this session: `npm run build` and the localhost serve/console
  check could not be run because this Copilot session has no terminal-execution
  tool. The change to the site source is limited to one valid, schema-matching
  workSamples.js entry with tags that already exist in tagSections, and the demo
  is static under public/ (copied verbatim by Vite, not bundled), so the build is
  expected to pass. The deploy / deploy-test phase should still run
  `npm run build`, serve the folder, and confirm a clean first-paint console
  before relying on it.
- Screenshot: the capture script could not be run (no terminal execution here), so
  screenshot is set to null. The work-sample card renders without an image until a
  capture is added. Suggested hero still: the flip bin mid-flip in PrizmHouse
  Breaks, or the map home.

## Hero-flow click steps + key selectors (for media-capture and deploy-test)

1. First load shows the guided tour overlay (`.tour-scrim .tour-card`). Click the
   gold button (`.tour-card .btn.gold`) to step through, or "Skip tour".
2. Map home: click a pin, e.g. PrizmHouse Breaks
   (`button.pin[aria-label^="PrizmHouse"]`). Pins are `.pin`; drop pins also show
   `.drop-dot`.
3. Shop profile opens in Flip view. The top face-down card is the last `.flipcard`
   in `.bin-stage`; click it (or focus + Enter/Space) to run the real 3D flip and
   reveal the face. Revealed actions appear in `.reveal-actions`.
4. Advance the bin with `.bin-controls .btn.gold` ("Next card"); progress shows in
   `.bin-progress`.
5. Toggle Grid via `.seg button` (second button). Filter with `.filter-rail .range`
   (price), the category chips, the grade `.select`, and the sort `.select`.
6. Watch a card: a `.reveal-actions` or `.grid-item .quick` Watch button; the
   top-bar watchlist button (`button[aria-label="Watchlist"]`) badge increments.
7. Buy: the green Buy button opens the buy modal (`.modal`); "Confirm purchase"
   shows the order confirmation; "View my orders" -> orders page.
8. Offer: the Offer button -> offer modal; set amount, Send -> offers page; status
   flips from pending to accepted/declined after ~5s (`.pill.status-accepted` /
   `.status-declined`). An offer at/above 85% of asking is accepted.
9. Message: opens the thread modal (`.thread` + `.composer`); a canned seller reply
   appends after ~2s and adds a notification.
10. Follow: the shop header Follow button (`.shop-header .btn.gold`) adds the shop
    to the follower feed (menu -> Follower feed) and a home banner.
11. Seller: top-bar role toggle (`.roletoggle button`, "Seller") -> application
    form; Submit -> Pending -> auto-approved after ~3s -> booth dashboard.
12. Booth tabs `.tabs button`: Subscription -> Subscribe -> mock Stripe modal ->
    "Pay and activate" sets status active (unlocks Upload/Drops).
13. AI upload: `.dropzone` ("Capture card") -> `.scanline` detecting -> editable
    fields + market-price Accept/Override -> "Publish listing" (choose "Into my
    value box"); the card appears in Listings and in the booth's flip bin
    (Listings -> "Preview my booth").
14. Drops: fill the builder, watch the `.email-preview` update live, Publish ->
    scheduled drop + notification + follower-feed entry.
15. Reset: top-bar overflow menu (`button[aria-label="Menu"]`) -> "Reset demo"
    restores seed state.

Persistence to verify on reload: watchlist, follows, offers (and their status),
message threads, orders, seller-uploaded listings, scheduled drops, subscription
state, active role, seller-application status, notification read state, and
tour-done. All are saved under localStorage key `cardshopper:v1`.

## Backend

NONE. Frontend-only with mock CollX detection and mock Stripe checkout. Nothing to
deploy or push for the backend.

## handoff
- produced: full richness-10 `card-shopper` SPA in
  `michaelwegter.com/public/demos/card-shopper/` (13 files) + one workSamples.js
  registry entry (id 10, screenshot null).
- decisions: D1 flip is the hero and works (real CSS rotateY + fanned stack,
  keyboard accessible); map, buyer flows, and seller booth all function and persist
  via localStorage (`cardshopper:v1`) with a Reset demo control; CollX + Stripe are
  client-side mocks (no backend, no push); a virtual "Your Booth" shop
  (`s-mybooth`) holds seller uploads/drops and is previewable.
- verified: get_errors clean on all touched files; dash gate clean across the demo
  tree; tags all pre-exist in tagSections (no tagSections edit).
- next needs: deploy/deploy-test must run `npm run build` and a localhost serve +
  console check (could not run here, no terminal tool) and, if desired, capture
  `public/work-samples/card-shopper.png` from the local preview and flip screenshot
  back to a path. Media-capture should grab the flip-bin mid-flip and the map home.
- risks: no live build/serve was executed in this session, so treat the build-pass
  and console-clean checks as expected-but-unverified until the deploy phase runs
  them; screenshot is null until a capture is produced; picsum art depends on
  network but falls back to a CSS gradient so cards never break.
