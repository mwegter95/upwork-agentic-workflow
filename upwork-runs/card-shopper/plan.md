# plan.md - Card Shopper

Run slug: `card-shopper`. Feature richness target: 10 of 10 (a genuinely
full-featured, production-quality prototype with several fully working features,
deep polish, and persistence across reload).

## 1. Demo concept (chosen)

**Chosen: D1 (the value-box flip) as the spine, fused with D2 (map browse) and D3
(seller booth) into ONE cohesive single-page app the client clicks through.**

The brief's `recommended_demo` is D1 and the success signals are unambiguous: the
value-box flip is the signature, hard-to-fake interaction, and a Bubble screenshot
can never convey it. But D1 alone under-sells us at feature richness 8. The
strongest play for this non-technical founder is a single demo that walks the whole
product story: land on the **map home** (the screen the client described first),
tap a pin to open a **shop profile**, dig through the **value box flip**, then flip
roles into the **seller booth** to see the dashboard, the 4-step AI upload, the drop
builder with live preview, and the zero-fee subscription panel. One app, three
acts, every signature interaction working.

Why this wins this client: the founder values trust/curation and the in-person
card-show feel, and must recruit 10 to 20 founding sellers next. A demo that makes
buyers FEEL the bin-dig delight AND shows sellers the zero-fee booth speaks to both
audiences in one artifact. It proves we understand the product deeply enough to
build the parts that are hardest to imagine, while the proposal positions Bubble.io
as the real delivery platform. We are not faking the build; we are de-risking the
vision by making its riskiest interactions real and clickable.

## 2. Prototype vs full: FULL (LEAN), PRODUCTION-GRADE PROTOTYPE

**Call: full (lean), production-grade prototype.** At richness 10 this is not a
highlight reel; it is a genuinely full-featured app where every advertised flow
actually works end to end, state persists across reload, and the polish reads as
shippable. Mock data and client-side simulation stand in for the real Bubble /
Stripe / CollX backend, but the experience itself is complete. No rule from
CLAUDE.md's prototype fallback tripped:
- Hero feature (the flip) is pure front-end animation, no backend needed.
- Build fits the (raised) file and time caps (see section 7).
- The concept is interactive, not throwaway-visual; every control does something
  real and its effect survives a refresh.

**Backend: none. Frontend-only with realistic mock data.** Per the Zscaler
environment overrides, no Surface-hosted service, no Node/Express, no Docker, no
`/run/exec`. The optional CollX `/detect` Flask blueprint from D3 is DOWNGRADED to
a client-side mock: the upload flow shows a faux "AI detecting..." state, then
returns pre-seeded player/set/year/grade + a market-price suggestion from a local
fixture. This reads identically to the client and needs zero infra. Stripe is
mocked client-side (a subscription panel with a fake checkout confirmation, no real
charge). All verification is LOCAL (localhost build/preview), never the live URL.

## 2b. Persistence (state survives reload)

At richness 10 the app feels real because **state persists**. A single
`store.js` persistence module wraps `localStorage` under a namespaced key
(`cardshopper:v1`) and hydrates the app on load. Persisted slices: **watchlist,
follows, offers (with their pending/accepted/declined status), message threads,
seller-uploaded listings, scheduled drops, subscription status (plan + billing
state), active role, seller-application status, and notification read state.**
Writes go through a tiny dispatch/save helper so every action that mutates state
is durable. A visible **"Reset demo"** control (in a settings/overflow menu)
clears the namespace and re-seeds the original fixtures, so the client can always
return to a clean, fully-populated starting point. Seed data loads only when no
saved state exists.

## 3. Hero + supporting features (all fully working, not visual-only)

**Hero (maps to R6): the value-box flip.** Face-down cards fanned in a bin that
flip one at a time with a real CSS 3D flip + fan animation, recreating digging
through a bin at a show. Click/tap the top card to flip and reveal; the fan
advances; each revealed card exposes watchlist / offer / buy / message actions
that all persist. This is the one interaction the demo MUST nail.

**Full catalog fixture (powers real search/filter/sort).** A richer dataset:
multiple shops spread across all three categories (sports / Pokemon / MTG) with
dozens of listings carrying real metadata (player/team, set, year, grade, price,
category, foil flag, value-box membership). This volume is what makes the
buyer-side controls genuinely functional rather than decorative.

**Supporting feature 1 (maps to R1 to R13, R22): the buyer experience.**
- Map home with color-coded category pins (sports / Pokemon / MTG), live
  drop-announcement banners, a search bar, and category tiles.
- **Global search** across all shops AND **per-shop search** by player/team/set.
- **Multi-facet filters** (price range slider, category, grade, player/team/set)
  and **sort** (price low/high, newest, grade) that all actually recompute the
  result set.
- Tapping a pin opens a shop profile with the Flip (hero) and Grid views, a
  follow button, and per-card actions.
- **Watchlist PAGE** (not just a counter): a dedicated screen listing saved cards
  with remove/buy/offer actions.
- **Offers inbox** with a real pending -> accepted/declined state machine and
  canned seller responses driving status changes.
- **Messages thread view**: per-listing buyer/seller threads with canned seller
  replies that append to the conversation.
- **Instant buy -> order confirmation** screen (order id, summary, status).
- **Follow a shop** -> that shop's drops appear in a **follower feed** screen AND
  surface as a **home banner**.

**Supporting feature 2 (maps to R14 to R20): the seller booth.**
- **Dashboard stats that update live** from real actions (active listings count,
  monthly sales total, open offers, follower count all derive from state).
- **4-step AI-assisted upload** with a believable detecting animation, then
  **EDITABLE auto-detected fields** (player/set/year/grade), a **market-price
  suggestion the seller can accept or override**, and **publish as a standalone
  listing OR into a value box** (where it then appears in that bin's flip).
- **Listings manager**: edit and delist existing listings.
- **Drop builder** with a LIVE preview that, on publish, **creates a scheduled
  drop** shown to followers (feed + banner) and counted in notifications.
- **Subscription screen** with 1 to 2 plan tiers, a **mock Stripe checkout**, and
  a resulting **billing / active** state that gates and unlocks seller actions.

**Notifications center (maps to R19, offers, messages):** a center listing drop,
offer, and message events with **unread counts** and a mark-read interaction.

**Seller application + manual verification (R14):** an application form with a
**Pending -> Approved** state machine that **gates listing** until approved
(curation gate made tangible).

These acts together also cover R7, R21 (grid view, role distinction). The role
toggle drives the buyer vs seller surface.

## 3b. Polish for a 10

- **Responsive mobile layout**: the card-show feel on a phone (sticky bottom-ish
  nav, single-column bin, touch-friendly tap targets), tested at narrow widths.
- **Loading / empty / success states** on every async-feeling action (detecting,
  checkout, search-with-no-results, empty watchlist, drop published).
- **Subtle motion**: card tilt and foil shimmer on hover, the signature 3D flip,
  gentle screen transitions. Tasteful, never noisy.
- **Keyboard support + basic a11y**: visible focus states, alt text on card
  imagery, aria labels on controls, Enter/Space to flip, escape to close modals.
- **Optional guided "Take the tour" overlay** highlighting the hero interactions
  (flip the bin, open a shop, switch to the seller booth), dismissible and
  remembered in persisted state.

## 4. Out of scope (explicit scope fences)

Deliberately NOT building. The builder must not gold-plate past these:
- **Real CollX AI detection.** The upload step uses a client-side mock fixture and a
  simulated detecting state. No CollX API call.
- **Real Stripe charge.** The subscription panel simulates checkout and shows a
  success state. No Stripe keys, no real recurring billing.
- **Real auth / accounts backend.** Buyer/seller roles are a front-end toggle.
  No login, no DB, no server-side sessions.
- **Real email / push delivery (R19).** Drop "send" shows an in-app notification
  AND a rendered **email-preview** of what followers would receive; no Klaviyo, no
  actual email or push goes out. Simulated but visible, not merely narrated.
- **Native app wrap (R23, Median.co).** Demoed as responsive web only; the App
  Store/Play wrap is a proposal-narrative talking point, not built.
- **The actual Bubble.io build.** This demo is a high-fidelity prototype of the
  experience; the proposal positions Bubble.io as the delivery platform.

## 5. Design direction (bespoke, card-show energy)

Premium, trustworthy, collector-grade, tactile. Must NOT reuse michaelwegter.com's
dark gallery-wall / mustard-cyan / Space Grotesk look.

**Palette (hex):**
- Felt green (primary surface, the card-show table felt): `#0E3B2E`
- Midnight navy (deep panels, headers): `#10131C`
- Foil gold (metallic accent, premium cues, CTAs): `#D4AF37`
- Warm ivory (card stock, content surfaces): `#F5F0E6`
- Ink (primary text on ivory): `#1A1B18`
- Category color system (the map pins + filter chips):
  - Sports: `#1E66FF` (cobalt)
  - Pokemon: `#FFCB05` (Pokemon yellow) with `#E63946` accent
  - Magic: The Gathering: `#7B3FA0` (arcane purple)
  - Multi/other: `#2DB67D` (emerald)
- Success/buy: `#2DB67D`; danger/decline: `#E63946`.

**Typography (Google Fonts):**
- Display / headings: **Fraunces** (confident, high-contrast serif; collector-grade,
  auction-catalog gravitas).
- UI / body: **Inter Tight** (clean, modern sans; dense data reads cleanly).
- Numerics / prices / stats: **Inter Tight** tabular figures (or `Space Mono` as a
  monospace accent for price tags / card metadata if a tactile "label" feel helps).

**Mood / tone:** the hush and shine of a high-end card show. Dark felt and navy
ground the experience; foil gold signals premium and trust; ivory card surfaces feel
like real cardstock. Subtle depth (soft shadows, slight card tilt on hover), foil
shimmer on the gold accents, and a satisfying 3D flip give it the tactile, hold-it
-in-your-hands quality the client wants.

**Layout style:** spacious, card-forward. A sticky top bar (logo, search, role
toggle, watchlist). The map home is hero-height with floating drop banners and a
category tile rail beneath. Shop profile uses a two-pane feel: the flip bin
front-and-center with a view toggle (Flip | Grid) and a filter rail. The seller
booth is a clean dashboard grid (stat cards up top, tabbed below: Listings /
Upload / Drops / Subscription). Generous whitespace on ivory, rich contrast on felt.

## 6. Tech approach

Self-contained static single-page app in
`../michaelwegter.com/public/demos/card-shopper/`. **React via CDN + htm** (no build
step, no bundler) to manage the multi-screen state and animation cleanly, with all
styling in a single bespoke CSS file using the palette above. Mock data lives in a
local `data.js` fixture (shops, listings, value boxes, offers, drops, market
prices). The 3D flip is CSS `transform: rotateY` + `perspective` with staggered
transition timing for the fan. Map is an inline SVG US map with absolutely
positioned color-coded pins (no Mapbox/Google key needed, keeps it offline and
self-contained). Card imagery uses free stock / generated placeholder art with
category-appropriate framing. Verify everything on localhost; deploy is blind push.

Reuse the structural mechanics of an existing demo under
`../michaelwegter.com/public/demos/` as scaffolding ONLY (file shape, CDN wiring),
but apply this bespoke design; inherit none of its styling.

## 7. File budget (cap ~16 to 20)

Richness 10 justifies a larger surface. Still self-contained (React via CDN + htm,
one CSS system), no bundler, no backend. In
`../michaelwegter.com/public/demos/card-shopper/`:
1. `index.html` - CDN wiring (React, htm), font links, root mount.
2. `assets/app.js` - app shell, screen router, role toggle, tour overlay,
   notifications wiring.
3. `assets/store.js` - persistence module (localStorage hydrate/save, dispatch
   helper, seed loader, Reset demo).
4. `assets/data-shops.js` - shops + map pins + drops fixture.
5. `assets/data-listings.js` - the richer listings catalog (dozens, all 3
   categories) + value-box groupings + market prices.
6. `assets/screens-home.js` - map home, banners, global search, category tiles,
   follower feed.
7. `assets/screens-shop.js` - shop profile, flip bin (hero), grid, search,
   multi-facet filters, sort.
8. `assets/screens-buyer.js` - watchlist page, offers inbox, messages thread,
   order confirmation.
9. `assets/screens-seller.js` - booth dashboard, 4-step upload, listings manager,
   drop builder, subscription/checkout, seller application.
10. `assets/notifications.js` - notifications center + unread counts.
11. `assets/components.js` - shared card, flip-card, pin, banner, modal, chip,
    filter controls, empty/loading/success states.
12. `assets/styles.css` - bespoke design system (palette, fonts, flip animation,
    responsive breakpoints, focus states, shimmer/tilt motion).
13. `assets/us-map.svg` (or inline) - the map base.
14 to ~18. Card/art placeholder images in `assets/img/` (category-appropriate
    framing; counted as a few slots).

Plus two registry edits in michaelwegter.com (site chrome, not demo styling):
`src/data/workSamples.js` (new entry) and the card screenshot at
`public/work-samples/card-shopper.png`. Stay at or under ~20 touched files.

## 8. Requirement -> feature traceability matrix

| R# | Requirement | Coverage |
|----|-------------|----------|
| R1 | US map, color-coded shop pins | Demo: map home (Supporting 1) |
| R2 | Drop announcement banners on home | Demo: live banners on map home (from real drops) |
| R3 | Home search | Demo: GLOBAL search across all shops from the top bar |
| R4 | Category tiles | Demo: category tile rail under map (filters the catalog) |
| R5 | Tap pin -> shop profile | Demo: pin click opens shop profile |
| R6 | Value-box flip, fan animation | Demo: HERO flip bin (keyboard-flippable) |
| R7 | Standard grid view | Demo: Flip\|Grid toggle on shop profile |
| R8 | Search by player/team/set | Demo: per-shop inventory search |
| R9 | Filter by price + category | Demo: multi-facet filters (price range, category, grade, player/set) + sort |
| R10 | Watchlist save | Demo: watchlist action + dedicated watchlist PAGE (persisted) |
| R11 | Message seller (per-listing thread) | Demo: messages thread view w/ canned seller replies (persisted) |
| R12 | Make an offer (pending/accepted/declined) | Demo: offers inbox w/ real state machine (persisted) |
| R13 | Buy instantly | Demo: instant buy -> order confirmation screen |
| R14 | Manual seller verification gate | Demo: seller application Pending -> Approved, gates listing |
| R15 | Booth dashboard (listings/sales/offers/followers) | Demo: stat cards that update LIVE from actions |
| R16 | 4-step AI upload (photo/detect/price/publish) | Demo: detecting animation, EDITABLE detected fields, accept/override market price, publish standalone or into a value box |
| R17 | Drop builder (title/date/teaser) | Demo: drop builder form |
| R18 | Drop builder live preview | Demo: live preview pane; publish creates a scheduled drop |
| R19 | Drops pushed to followers (in-app + email) | Demo: in-app notification (unread count) + rendered EMAIL-PREVIEW + follower feed. Deck: Klaviyo delivery wiring scoped out |
| R20 | Flat monthly Stripe subscription, zero sale fees | Demo: 1 to 2 tiers + mock checkout + active/billing state gating seller actions. Deck: real Stripe recurring billing |
| R21 | Buyer/seller role distinction | Demo: role toggle drives buyer vs seller views |
| R22 | Follow a shop (feeds drops) | Demo: follow -> follower feed + home banner + follower count |
| R23 | Web + mobile responsive, Median.co wrap later | Demo: responsive mobile layout. Deck: native wrap roadmap (not built) |

Every R1 to R23 is mapped, and at richness 10 nearly all are DEMONSTRATED as
fully working in the demo (R1 to R18, R20-checkout, R21, R22 all function and
persist; R19 is simulated-but-visible via in-app notification + email-preview +
follower feed). Only three items carry deck/cover narrative scope-outs because
they require real third-party infra: **real Stripe recurring billing (R20)**,
**real CollX detection (R16's live API)**, and **the native Median.co wrap
(R23)**. Everything else the client can click.

## 9. Phased-delivery framing (mirror the client's stated phasing)

The client explicitly wants core first within the 6 to 10 week / 2.5k to 4.5k
envelope, with the flip animation and AI upload as fast-follows. The proposal should
mirror this exactly:

- **Phase 1 - Core (ships first, fits budget):** accounts + buyer/seller roles
  (R21), seller application + manual verification gate (R14), the US map home with
  pins / banners / search / tiles (R1 to R5), shop profiles with grid view +
  inventory search/filters (R7 to R9), watchlist / message / offer / buy
  (R10 to R13), follow (R22), and Stripe recurring flat-fee subscription with zero
  sale fees (R20). This is the usable core that proves the model.
- **Phase 2 - Signature + seller power (fast-follow):** the value-box flip
  experience (R6, the hero), the 4-step AI-assisted upload with CollX
  auto-detect + market price (R16), the booth dashboard stats (R15), the drop
  builder with live preview + follower fan-out via in-app + Klaviyo email
  (R17 to R19).
- **Phase 3 - Native wrap (later):** Median.co App Store / Google Play wrap (R23).

Note the strategic inversion for the DEMO: we build the Phase 2 signature (the flip,
the AI upload) NOW in the prototype because those are the hardest-to-imagine, highest
-risk interactions to de-risk for the founder, even though delivery sequences them
after the core. The proposal makes this explicit so the phasing reads as deliberate,
not contradictory.

## handoff
- produced: `plan.md` - full build plan for the `card-shopper` demo, now bumped to
  **feature richness 10 of 10** (full, lean, production-grade prototype).
- decisions: D1 flip is hero, fused with D2 map + D3 seller booth into one SPA;
  frontend-only React-via-CDN, mock CollX + mock Stripe, no backend; bespoke
  felt-green/navy/foil-gold collector palette with Fraunces + Inter Tight.
- richness-10 additions: **localStorage persistence** (watchlist, follows, offers,
  messages, uploaded listings, drops, subscription, role, app status) + a "Reset
  demo" control; **deeper fully-working flows** (richer catalog powering global +
  per-shop search, multi-facet filters and sort; watchlist page; offers inbox
  state machine; messages threads; instant-buy order confirmation; follower feed +
  home banner; live seller dashboard stats; editable AI upload with accept/override
  market price and publish-into-a-value-box; listings manager; drop builder ->
  scheduled drop; subscription tiers + mock checkout + billing gate;
  **notifications center with unread counts**; seller application Pending ->
  Approved gating); **polish** (responsive mobile, loading/empty/success states,
  flip/tilt/shimmer motion, keyboard + a11y, optional guided tour).
- file budget raised to ~16 to 20 (split data fixtures, buyer/seller screen
  modules, `store.js` persistence, `notifications.js`, image assets); still
  self-contained, no bundler, no backend.
- traceability: R1 to R18, R20-checkout, R21, R22 demonstrated and persisted; R19
  is simulated-but-visible (in-app + email-preview + feed). Only real Stripe
  billing (R20), real CollX (R16 live API), and the native Median wrap (R23) remain
  deck-narrative scope-outs.
- next needs: demo-builder builds the SPA in
  `michaelwegter.com/public/demos/card-shopper/`, nails the 3D flip first, wires
  `store.js` persistence early so every flow is durable, verifies on localhost;
  deck/cover mirror the 3-phase delivery framing.
- risks: breadth (many working flows) must not dilute hero-flip polish; keep map as
  inline SVG (no map API key); guard the file cap; ensure persisted state migrates
  cleanly and "Reset demo" always restores seed; keep the three remaining scope-outs
  clearly framed as narrative, not implied as built.
