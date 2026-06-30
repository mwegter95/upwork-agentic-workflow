# image-analysis2.md - Card Shopper (image-analyzer + image-fixer, improve pass)

Viewed every captured screenshot and every image the demo renders on localhost.

## Flagged (and fixed)

1. [BLOCKER] Trading-card art was random Lorem Picsum stock photos. The card faces
   pulled `https://picsum.photos/seed/<id>/360/504`, so "Umbreon VMAX Alt Art"
   showed a photo of book pages, "Rayquaza" a clock, "Charizard ex" the Matterhorn,
   "Venusaur" a forest. Every card read as a mislabeled placeholder, the single
   worst visual in the demo, and on a card marketplace it undercut the whole pitch.
   FIX: removed the picsum `<img>` entirely and replaced it with a fully CSS-drawn
   card face (category-tinted holo sunburst, category emblem, a large Fraunces
   monogram of the player initial, the player name and set). Now every card looks
   like a deliberate, on-brand collectible with zero network dependency and zero
   mismatch. Files: assets/components.js (TradingCard), assets/styles.css (.cardart*).

2. [BLOCKER] Form controls were invisible inside light panels and modals. `.select`,
   `.input`, `.range-vals`, and secondary `.btn`/`.chip` used ivory text meant for
   the dark app chrome, so inside the ivory `.panel`/`.modal` surfaces the offer
   amount, seller-application fields, AI-upload review fields, drop-builder fields,
   subscription card number, grade/sort selects, and price range labels rendered as
   near-white text on near-white backgrounds. FIX: added panel-scoped overrides
   (`.panel .select/.input/.range-vals/.btn/.chip`) forcing dark-on-light with a
   white field background and a readable disabled state. File: assets/styles.css.

3. [robustness] Demo depended on unpkg.com for React/react-dom/htm; unpkg is blocked
   here (403) and any unpkg outage would white-screen the demo for real users. FIX:
   vendored the three UMD libs into assets/vendor/ and pointed index.html at them
   (covered in deploy-test2.out). Not an image issue but it was why nothing rendered
   at first.

## Checked, no fix needed

- Map home pins, drop banners, category tiles render correctly.
- Flip bin (hero): face-down CardBack and the revealed CSS card face both correct.
- Stripe checkout modal, seller dashboard stats, notifications, follower feed: clean.
- Drop email preview renders (the "upload cards to feature them" line is intended
  empty-state copy, not a broken image).

## Re-capture

All 13 hero-flow screenshots, the hero-flow recording, and the 16:9 card still
(`michaelwegter.com/public/work-samples/card-shopper.png`) were re-captured after
the fixes against localhost. No AI image generation used.

## handoff
- produced: image-analysis2.md; fixed the card art (CSS-drawn) and the light-panel
  contrast bug; re-captured all media + the card still.
- decisions: card faces are now 100% CSS (no picsum, no `<img>`); the `seed` field
  is unused but harmless and left in place.
- verified: re-viewed offer modal, grid+filters, AI-upload review, drop builder,
  card still, all legible and on-brand; deploy-test still 22/22 pass.
- next needs: registry screenshot null -> path; proposal embeds the new stills.
- risks: none open locally.
