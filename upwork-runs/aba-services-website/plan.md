# Plan: aba-services-website

## 1. Demo concept (chosen): D1, ABA Clinic Website Showcase

A fictional, fully realized single-page ABA clinic site. This wins because the
client's literal ask is "design and develop a website for ABA services." The
proposal lands hardest if the buyer can open one link and immediately see the
exact deliverable they imagined, rendered with healthcare-appropriate warmth and
trust. D2 and D3 are subordinate components inside D1, so picking D1 absorbs
their value without splitting focus. A 10-second scan should yield: "yes, this
person can build my clinic site."

## 2. Prototype vs full

Call: **lean full.** None of the CLAUDE.md fallback rules trip. There is no
backend dependency (R1 to R6 are all presentational), the build fits inside the
caps, and the concept is not throwaway/visual-only (an interactive site reads
much more credible than mockups for a clinic).

**mw-backend needed: no.** A marketing site with a client-validated contact form
is the canonical frontend-only demo. Adding a real intake endpoint would
introduce HIPAA-adjacent considerations the client did not ask for and would
slow the run. The contact form validates inline and shows a thank-you state; the
proposal narrative covers how a production rollout would wire email/CRM later.

## 3. Hero feature

**A credible, conversion-shaped ABA clinic homepage**, anchored by:

- A warm hero (clinic tagline, "Request an Intake" primary CTA, supporting
  imagery placeholder, trust strip: "BCBA-led", "In-network with major
  insurers", "Serving ages 2 to 18").
- An adjacent **services explorer** card grid (In-Home, Center-Based, Parent
  Training, School Consultation) where each card expands inline to reveal age
  range, what to expect, and a "Request this service" link that scrolls to the
  intake form.

This is the screenshot that sells the proposal: a polished above-the-fold that
visibly understands ABA clinic positioning.

## 4. Supporting features (max 2)

1. **Intake/contact form with inline validation and confirmation state.**
   Fields: parent name, email, phone, child's age, service interest (select),
   message. Real-time validation, accessible error messages, privacy reassurance
   line, friendly success panel. Console-logs the payload.
2. **Team and FAQ strip.** A compact "Meet the team" row (3 mock BCBA bios with
   credentials) and a 4 to 5 item FAQ accordion below it. Both build trust
   cheaply and round the site out to a believable structure.

## 5. Out of scope (explicit, do not build)

- No real backend, no email sending, no CMS, no auth, no database.
- No HIPAA-regulated data flow. The intake form is a client-side demo only and
  shows a privacy note explaining production would route through a HIPAA-aware
  pipeline.
- No multi-page routing. Single scrollable page with anchor nav is sufficient
  and faster to scan.
- No blog, no resource library, no insurance verification widget.
- No build tooling. Single `index.html` + local assets, no Vite, no bundler.
- No analytics, no cookie banner, no i18n.
- No stock photography licensing. Use CSS gradients, SVG illustrations, or
  clearly placeholder image blocks with alt text.
- No dark mode toggle. The demo ships in a single light theme (see section 8).

## 6. Tech approach

Self-contained static demo. One `index.html`, one CSS file, one JS file,
optional SVG assets. Vanilla JS for the accordion, services-card expansion, and
form validation (no framework needed; React via CDN would be overkill here).

Scaffold to clone: copy the file layout of an existing self-contained demo in
`../michaelwegter.com/public/demos/` if one exists; otherwise start from a clean
`index.html` shell that imports `assets/styles.css` and `assets/app.js`.

Output path: `../michaelwegter.com/public/demos/aba-services-website/`.
Registry update: append entry to `../michaelwegter.com/src/data/workSamples.js`
following the schema in CLAUDE.md.

No Vite sub-build. No npm install. No backend blueprint.

## 7. File budget (cap ~12)

Inside `michaelwegter.com/public/demos/aba-services-website/`:

1. `index.html`
2. `assets/styles.css`
3. `assets/app.js`
4. `assets/logo.svg` (mock clinic mark)
5. `assets/hero-illustration.svg` (warm, abstract, family-friendly)
6. `assets/team-1.svg`, `assets/team-2.svg`, `assets/team-3.svg` (avatar
   placeholders, can be combined into one sprite to save a slot)
7. `assets/icons.svg` (sprite for service-card icons and FAQ chevron)

Inside `michaelwegter.com/`:

8. `src/data/workSamples.js` (add the entry)
9. Possibly `src/pages/WorkSamples.jsx` only if the route/registry plumbing is
   not already wired; otherwise skip.

That is 8 to 9 files. Headroom intentionally left under the ~12 cap.

## 8. Voice and palette anchors (for demo-builder)

The demo must read as a **credible ABA clinic**, not as a portfolio piece. That
means warmth and trust dominate; the michaelwegter.com tokens are used as
accents, not as the full skin.

- **Theme:** light mode. Clinic sites are overwhelmingly light; a dark
  gallery-wall aesthetic would undercut the "trustworthy healthcare" read.
  Define a light override at the top of `styles.css` rather than importing the
  site's dark surfaces wholesale.
- **Surfaces (light override):**
  - page background: warm off-white (e.g., `#fbf8f3`)
  - card surface: pure white (`#ffffff`)
  - subtle border: warm gray (e.g., `#ece6da`)
  - text primary: deep ink (`#1a1822`), text secondary: warm slate (`#5a5868`)
- **Accents (from site tokens):**
  - `--mustard #e8b820` for primary CTAs ("Request an Intake", form submit)
  - `--cyan-vivid #12b4c8` for links, focus rings, service-card hover accent
  - `--parrot-green #6ed46a` used sparingly for success states
  - Bright palette colors stay accent-light; never block-fill large areas.
- **Type:** keep the site fonts so it still belongs to Michael's system.
  Space Grotesk for headings (warm tracking), Inter for body, JetBrains Mono
  reserved for tiny eyebrows like "OUR SERVICES" and "WHAT TO EXPECT".
- **Voice:** plain, parent-facing, no jargon stack. "We help families" beats
  "evidence-based interventions" in the hero. Reserve clinical terms for the
  service cards where they earn their place.
- **Hard rule:** no em dashes, no en dashes anywhere. Commas, periods, or
  rewrite. This applies to the demo copy too, not just the cover letter.

## 9. Requirement -> feature traceability matrix

| Req | Text (short) | Demo feature / screen | Proposal surface |
|-----|--------------|-----------------------|------------------|
| R1  | Design and develop a professional ABA website | Entire single-page demo at `/demos/aba-services-website/` | Cover letter opener; deck slide 1 (hero shot); one-pager hero |
| R2  | Visually appealing design that communicates services and values | Hero + services explorer + warm light palette | Deck slide 2 (design system + tokens); one-pager "Design" section |
| R3  | User-friendly | Anchor nav, single-page scroll, accessible form, FAQ accordion, mobile responsive layout | Deck slide 3 (UX choices); cover letter "what families need" paragraph |
| R4  | Effectively communicate services | Services explorer cards with age range, what to expect, CTA | Deck slide 2; one-pager "Services architecture" callout |
| R5  | Integrate design and development seamlessly from concept to launch | Demo itself is the proof (design and build are one artifact); deploy story = push to main, GH Pages auto-publishes | Cover letter closing; deck slide 4 (process: concept, design, build, ship); one-pager "Process" strip |
| R6  | Graphic design elements (nice to have) | Custom SVG logo, hero illustration, service-card icons | Deck slide 2 visual; one-pager visual treatment. Also: addressed in proposal narrative as "I handle the visual system end to end" |

Implicit needs are absorbed as follows: trust visuals (hero + team bios + FAQ),
clear services page (services explorer), intake form (supporting feature 1),
mobile responsiveness (CSS), team bios (supporting feature 2), about/values
(short "Our approach" band between hero and services), professional imagery
(SVG illustrations + placeholder blocks), fast loads and accessibility (single
static page, semantic HTML, labeled form fields, focus styles), SEO basics
(addressed in proposal narrative, not demoed), HIPAA-adjacent awareness
(privacy line under the intake form + addressed in proposal narrative).

Nothing in the brief is left unmapped.
