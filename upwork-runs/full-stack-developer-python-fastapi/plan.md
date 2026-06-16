# Plan — Full-Stack Developer (Python/FastAPI + React) Compliance SaaS

Slug: `full-stack-developer-python-fastapi`

---

## 1. Demo concept (chosen)

**Compliance Reconciliation Console** — a synthesis of the brief's `D1`, `D3`,
and the core proof-of-`D2` thinking, delivered as one self-contained
same-origin static demo.

The brief lists three candidate demos (D1 streaming parser, D2 tenant isolation,
D3 rules engine + anomaly dashboard). Building all three separately would blow
the caps and dilute the message. The winning move is to merge the two that map
to the client's **payment-gate hero capability** (D1's streaming parse + D3's
rules engine and dashboard) into one console, and to handle D2's tenant
isolation in the proposal prose where it belongs (it is an architecture story,
not a clickable artifact). This wins because the client has already decided the
architecture and is hunting for a build partner who provably understands the two
riskiest pieces: memory-stable parsing of 500+ MB fiscal XML, and a 170+ rule
reconciliation engine with drill-down. The console makes both tangible and
reproducible, which is exactly what the Milestone 2 payment gate (R17: live
500 MB iterparse PoC with memory profile) demands. It pre-answers the gate before
the client has spent a euro.

---

## 2. Prototype vs full

**Outcome: LEAN FULL** — self-contained static app, fully clickable with real
logic over sample fixtures and generated data. No CLAUDE.md fallback rule trips.

- Rule 1 (backend integration) does NOT trip: everything runs in-browser on
  shipped sample XML fixtures and a generated dataset. No secrets, no DB, no
  server compute.
- Rule 2 (caps) does NOT trip: 1 hero + 2 supporting, file list below stays
  under 12.
- Rule 3 (throwaway/visual) does NOT trip: real parse loop, real rule
  evaluation, real pagination/export logic.

**mw-backend: NOT needed.** Frontend-only with sample fixtures + generated data,
which is the cheaper and safer default per CLAUDE.md.

**The one honest stub:** the demo does not literally stream a 500 MB file in a
browser tab (that is a backend concern and not browser-safe). Instead it ships
realistic but small fiscal-XML fixtures and demonstrates the *algorithmic
approach* — chunked / `iterparse`-style iterative processing with bounded
memory — via a live readout that contrasts a constant-memory streaming line
against a naive full-DOM-load line as record count climbs. This shows the
production approach Michael would take with `lxml.iterparse`, `elem.clear()`,
and ancestor pruning, made visible. The cover letter states this honestly and
ties it to the real Milestone 2 deliverable.

---

## 3. Hero feature + supporting features

**HERO — Streaming-parse + reconciliation rules engine with drill-down.**
Maps to client #1 requirement (R2 + R4, and pre-answers the R17 payment gate and
Q1). User drops/selects a sample fiscal XML fixture; the console runs a
simulated streaming parse with a live memory-stability readout (constant-memory
vs naive-load), then evaluates a visible subset of 8-12 representative
reconciliation rules (standing in for the 170+) with configurable thresholds and
pass/warn/fail status. Each failed rule drills down to the exact offending source
transactions.

**SUPPORTING 1 — Analytical dashboard.** Summary tiles, a trend/anomaly chart,
a transactions table that paginates a generated 100k-row dataset to mimic
server-side pagination, and an Export button (CSV download). Maps to R5.

**SUPPORTING 2 — File-format detector.** Inspects the chosen file and identifies
document type, fiscal period, and schema version, then routes to the matching
parser profile (shown in the UI before parse begins). Maps to R1.

(Cap respected: exactly 1 hero + 2 supporting.)

---

## 4. Out of scope (explicit — NOT built in the demo)

These are deliberately excluded from the demo and are addressed in the
**proposal prose (cover letter / deck)**, not built:

- Real 500 MB file processing (demo simulates the algorithm; honestly stated).
- Real Celery + Redis async infra, heavy/light queues, status polling (R3, R11).
- Real Stripe billing: trial, plans, proration, webhooks, cancellation (R7, R14).
- Real Supabase / Auth0 auth adapter (R13).
- Real multi-tenant DB isolation enforced at API level (R6) — explained as an
  architecture answer in the cover letter (Q2), not demoed.
- PDF parsing with embedded-XML extraction (part of R2) — described, not built.
- AWS S3 / Azure Blob storage and AWS/Azure hosting (R12, R15).
- Real PostgreSQL / FastAPI services (R8, R9, R10) — the demo mimics
  server-side pagination behavior client-side rather than standing up the stack.

This split keeps the demo proving the parsing + rules + dashboard core while the
proposal-writer covers infra, billing, auth, and isolation in words.

---

## 5. Tech approach

Self-contained static demo, no build step. Single `index.html` plus local
`assets/` using **React + htm via CDN** (no bundler), styled with the
michaelwegter.com design tokens copied into a local stylesheet so the demo reads
as on-brand dark gallery aesthetic.

- Clone the mechanics of the existing `/apps` registry pattern: add a
  `workSamples.js` entry and reuse `AppFrame.jsx` unchanged for the
  `/work-samples/<slug>` iframe route (per CLAUDE.md).
- Demo ships to `../michaelwegter.com/public/demos/full-stack-developer-python-fastapi/`,
  served at `/demos/full-stack-developer-python-fastapi/`,
  `href: import.meta.env.BASE_URL + "demos/full-stack-developer-python-fastapi/"`.
- No Vite sub-build: complexity does not warrant a bundler; CDN React/htm is
  sufficient and zero-friction.

---

## 6. File budget (cap ~12)

Demo (in `public/demos/full-stack-developer-python-fastapi/`):

1. `index.html` — app shell, CDN imports, mount point.
2. `assets/app.js` — React/htm root: layout, view routing, state.
3. `assets/parser.js` — simulated streaming parse + memory-stability model + format detector.
4. `assets/rules.js` — reconciliation rule definitions, thresholds, evaluator, drill-down mapping.
5. `assets/dashboard.js` — tiles, anomaly chart, 100k-row paginated table, CSV export.
6. `assets/data.js` — 100k-row dataset generator + helpers.
7. `assets/styles.css` — design tokens + layout.
8. `assets/samples/saft-sample.xml` — sample fiscal/SAF-T-style fixture (clean).
9. `assets/samples/invoice-ledger-anomalies.xml` — fixture seeded with rule violations.

Site wiring (in `../michaelwegter.com/`):

10. `src/data/workSamples.js` — registry entry (new or appended).
11. `src/pages/WorkSamples.jsx` and/or `src/App.jsx` route — only if route not
    already present (reuse `AppFrame.jsx`, do not modify it).
12. `src/components/Navbar.jsx` — add "Work Samples" link if absent.

(Within the 12-file cap; items 10-12 are shared-scaffold touches.)

---

## 7. Requirement -> feature traceability matrix

| Req | Text (short) | Where addressed |
|-----|--------------|-----------------|
| R1  | File-format detector (type/period/version, route to parser) | **Demo** — Supporting feature 2 |
| R2  | Streaming XML via iterparse, memory-stable 500+ MB; PDF embedded-XML | **Demo (XML streaming + memory readout, simulated) + prose** (PDF extraction and real 500 MB in prose) |
| R3  | Async Celery + Redis, heavy/light queues, status polling | **Prose** (out of demo scope) |
| R4  | 170+ rule reconciliation engine, thresholds, drill-down | **Demo** — Hero feature (8-12 representative rules) + prose for full 170+ |
| R5  | Analytical dashboard, charts, anomaly, server-side pagination 100k+, Excel/PDF export | **Demo** — Supporting feature 1 (CSV export shown; Excel/PDF noted in prose) |
| R6  | Multi-tenant isolation enforced + tested at API level | **Prose** (Q2 answer; out of demo scope) |
| R7  | Stripe subscription billing (trial, proration, webhooks, cancel) | **Prose** |
| R8  | Backend Python + FastAPI | **Prose** (stack confirmation + relevant experience) |
| R9  | Frontend React + TypeScript | **Both** — demo is React; prose confirms TS in real build |
| R10 | PostgreSQL | **Prose** |
| R11 | Queue Celery + Redis | **Prose** |
| R12 | Storage AWS S3 / Azure Blob | **Prose** |
| R13 | Auth adapter Supabase / Auth0 | **Prose** |
| R14 | Payments Stripe | **Prose** |
| R15 | Hosting AWS / Azure | **Prose** |
| R16 | Automated tests: golden-file suites, 70% coverage, zero critical static findings | **Prose** (golden-file fixtures parallel the demo's seeded sample files) |
| R17 | Milestone 2 gate: live 500+ MB iterparse PoC + memory profile | **Both** — demo's streaming memory readout previews the gate deliverable; prose commits to the real profile |
| R18 | Weekly Monday written status updates | **Prose** (process commitment) |
| R19 | Milestone-close demo call per pre-agreed script | **Prose** (process commitment) |
| R20 | Fixed-price, milestone-based, approx EUR 4,000 / 6 milestones | **Prose** (commercial terms acknowledgment) |
| **Q1** | Largest structured file processed + memory approach | **COVER LETTER — REQUIRED.** Demo's streaming-memory visualization directly supports and illustrates this answer. |
| **Q2** | Enforce tenant isolation in FastAPI + PostgreSQL, at which layers | **COVER LETTER — REQUIRED.** Answer with concrete layers: API middleware tenant binding, mandatory `tenant_id` query filters, PostgreSQL row-level security, optional schema scoping, plus test enforcement. |

Nothing in the brief is left unmapped. Q1 and Q2 are flagged as
**must-be-answered in the cover letter** (application-required questions).
