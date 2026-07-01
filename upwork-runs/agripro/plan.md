# AgriPro — Plan

## 1. Demo Concept (chosen)

**D1 — AgriPro Operations Console**

This concept wins because AgriPro's stated differentiators ("AI-powered solutions that solve real business problems") map directly to OCR + anomaly detection on lab certificates — the hardest thing to fake and the hardest for a competitor to claim. A live in-browser OCR extract, doc classification, and statistical anomaly flag on a real grain grading certificate makes a concrete, memorable argument for the developer's technical depth. Wrapping that AI hero in a believable role-aware ops spine (campaign board, approval pipeline, role dashboards) answers every major R# in the brief in one cohesive view rather than five disconnected screens.

## 2. Prototype vs Full

**FULL build — Feature richness 10/10.**

No fallback rule from CLAUDE.md trips: the demo has a clear hero + 2 supporting pillars, stays inside the ~12-file cap with a justified Vite sub-build, and the AI features run honestly client-side. No mw-backend needed. Tesseract.js (npm, WASM) handles OCR in-browser; rule-based anomaly detection and keyword-heuristic document classification are pure JS — no cloud API, no Flask blueprint, no Surface runner. Seeded sample lab certificate images ship with the demo so the hero flow never dead-ends.

## 3. Hero Feature + Supporting Pillars

**Hero — AI Inspection Layer**
Drop a lab certificate image (grain moisture/aflatoxin/foreign-matter cert) into the upload zone. Tesseract.js extracts text; a keyword classifier identifies document type (e.g. "Grade Certificate", "Moisture Report", "Aflatoxin Screen"); extracted numeric values auto-populate the inspection record fields; a rule-based anomaly detector compares values against crop-specific reference bands and flags any out-of-band reading with severity level (warn/reject). This is the one thing the demo must nail — it is the reason the client mentioned OCR, classification, and anomaly detection as separate requirements.

**Pillar 1 — Procurement Campaign Board + Multi-stage Approval Pipeline**
A Kanban-style campaign board showing active procurement campaigns by state/crop. Clicking a campaign reveals its inspection records in an approval pipeline (Draft → Field Inspection → Lab Review → Quality Approval → Procurement Approval → Warehouse Allocation). Each stage has an action button (Approve / Flag / Reject) that moves the record forward. Status chips update immediately. This directly demos R2, R3, R5, and implies R1 (role gates).

**Pillar 2 — Role-aware Dashboards + PDF/Excel Export**
Four role views (Procurement, Quality/Lab, Warehouse, Management) each showing a distinct KPI surface: Procurement sees campaign pipeline counts and budget utilization; Quality sees pending lab reviews and anomaly flags; Warehouse sees allocation fill rates; Management sees cross-role summary + trend charts. Export button on each dashboard view generates a PDF report (jsPDF) or Excel file (SheetJS) from the visible data.

## 4. Out of Scope (Explicit)

- No real user authentication or password hashing. Role switching is a picker UI (demonstrates the concept without implementing auth infrastructure that cannot run in a static demo).
- No real warehouse bin physical simulation or map. Warehouse view = a tabular allocation grid on seeded data, showing allocation status per bin/lot.
- No real-time notifications or WebSocket push. Notification tray = seeded alerts with mark-read interaction; no polling, no server.
- No real audit-log persistence. Audit log = a seeded, scrollable event table (action / actor / timestamp / record ID) appended on user actions in the session only.
- No real document storage or file upload persistence beyond the OCR hero interaction. Document library = a seeded list of mock files with status badges.
- No global search backend. Search + filter = client-side filter on the in-memory mock dataset.
- No admin portal beyond the Management role dashboard. The proposal will describe the admin portal as a deliverable in the full build narrative.
- No real PDF/Excel round-trip from server. Export = client-side generation from the visible data in the DOM/state.

## 5. Design Direction (Bespoke — Agri-Industrial SaaS)

This is an internal operations tool for commodity-trading professionals. The design must read as trustworthy, data-dense, and field-ready — nothing like a marketing site.

**Palette:**
- `--clr-bg`: `#F5F2EC` — warm parchment (evokes wheat/grain, neutral base for data density)
- `--clr-surface`: `#FFFFFF` — card/panel surfaces
- `--clr-nav`: `#0F2A1A` — very dark forest green (sidebar/nav)
- `--clr-primary`: `#1B4332` — agronomy deep green (headings, active states)
- `--clr-accent`: `#B5651D` — earth amber / grain ochre (accents, highlights)
- `--clr-action`: `#1D4ED8` — strong blue (buttons, links, interactive)
- `--clr-pass`: `#15803D` — status pass/approved
- `--clr-flag`: `#B45309` — status flagged/warning
- `--clr-reject`: `#B91C1C` — status rejected
- `--clr-text`: `#1C1917` — near-black primary text
- `--clr-text-muted`: `#57534E` — warm gray secondary text
- `--clr-border`: `#D6D3C8` — warm light gray borders

**Typography:**
- Primary UI: **IBM Plex Sans** (Google Fonts) — professional, legible at dense data sizes, industrial feel distinct from portfolio's Inter
- Tabular data / grading values: **IBM Plex Mono** (same family) — ensures numeric columns align, appropriate for measurement data
- Weights: 400 (body), 500 (labels), 600 (headings/KPIs)

**Mood / Layout:** Dense sidebar-nav + content-area layout (not single-page scroll). Left nav lists module icons + labels (Inspections, Procurement, Dashboards, Documents, Warehouse, Audit Log). Main content area uses full-width data tables with sticky headers, status pipeline bars across the top of workflow cards, and a collapsible details panel on the right for record deep-dive. Mobile breakpoint flips to bottom tab nav + single-column stacked cards for field team use.

**NOT to use:** michaelwegter.com's dark gallery-wall theme, mustard/cyan, Space Grotesk.

## 6. Tech Approach

**Vite sub-build** (justified: Tesseract.js WASM workers require a proper bundler; React 18 for complex multi-tab, multi-role state; jsPDF/SheetJS as npm deps). Build output drops into `../michaelwegter.com/public/demos/agripro/` as a self-contained static folder.

- **Framework:** React 18 (via Vite)
- **OCR:** `tesseract.js` (npm) — in-browser WASM, no API key
- **PDF export:** `jspdf` (npm) — pure browser
- **Excel export:** `xlsx` (npm, SheetJS community) — pure browser
- **Charts:** `recharts` (npm) — lightweight, React-native
- **Styling:** plain CSS with custom properties (the design tokens above), no Tailwind
- **Data:** all seeded in `src/data/mockData.js`; session-state only, no persistence
- **Sample certs:** 2-3 realistic grain lab certificate images bundled as `public/samples/*.jpg`

No external API, no backend, no auth infrastructure. Runs entirely in the browser.

## 7. File Budget (~12 files)

```
demos/agripro/          <- Vite build output (single deploy folder)
src/
  main.jsx              (1) Vite entry, mount App
  App.jsx               (2) Layout shell: sidebar nav, role state, tab routing
  components/
    RoleLogin.jsx        (3) Role picker (Procurement / Quality / Warehouse / Management)
    InspectionLab.jsx    (4) HERO: upload zone, OCR runner, classifier, anomaly flags, record form
    ProcurementBoard.jsx (5) Campaign kanban + approval pipeline + stage actions
    Dashboard.jsx        (6) Role-aware KPI dashboards + PDF/Excel export
    Shared.jsx           (7) StatusChip, PipelineBar, DataTable, NotificationTray (all in one)
  data/
    mockData.js          (8) All seeded campaigns, inspections, warehouse, audit log, notifications
  services/
    inspection.js        (9) Tesseract.js wrapper + keyword classifier + rule-based anomaly detector
  styles/
    tokens.css           (10) Design tokens (palette, typography, spacing)
package.json             (11) deps: react, tesseract.js, jspdf, xlsx, recharts, vite
vite.config.js           (12) build config (output to ../../michaelwegter.com/public/demos/agripro)
```

Total: 12 source files + build config. Stays at cap.

## 8. Requirement -> Feature Traceability Matrix

| ID  | Requirement | Demo Treatment |
|-----|-------------|----------------|
| R1  | Secure auth + RBAC | Role picker (Procurement / Quality / Warehouse / Management / Admin) gates dashboard views and approval actions — **demo feature** |
| R2  | Procurement campaign management | Campaign Kanban board in ProcurementBoard.jsx with status, crop, state, volume — **demo feature (Pillar 1)** |
| R3  | Field inspection workflows | Inspection records in approval pipeline; each record shows field team, GPS location, timestamps, stage — **demo feature (Pillar 1)** |
| R4  | Laboratory testing and quality grading | Grading values table (moisture, test weight, aflatoxin, foreign matter, dockage) auto-populated by OCR — **demo feature (Hero)** |
| R5  | Multi-stage approval workflows | 6-stage pipeline bar (Draft → Field → Lab → QA → Procurement → Warehouse) with Approve/Flag/Reject actions — **demo feature (Pillar 1)** |
| R6  | Warehouse allocation and tracking | Warehouse allocation grid on seeded data (lot ID, bin, commodity, volume, status) — **convincing mock (Shared.jsx DataTable)** |
| R7  | File and document management | Document library tab with seeded file list (cert type, upload date, linked inspection, status badge) — **convincing mock** |
| R8  | Search and advanced filtering | Client-side filter bar on inspection table (crop type, state, status, date range, anomaly flag) — **convincing mock (in-memory filter)** |
| R9  | Operational dashboards for different user roles | 4 role-specific dashboard views with KPI cards + Recharts charts — **demo feature (Pillar 2)** |
| R10 | Reporting with PDF and Excel export | jsPDF and SheetJS export buttons on dashboard view — **demo feature (Pillar 2)** |
| R11 | Notifications and reminders | Notification tray (bell icon) with seeded alerts; mark-read interaction — **convincing mock** |
| R12 | Audit logs | Audit log tab: seeded event table (actor, action, record, timestamp); session actions appended — **convincing mock** |
| R13 | Mobile-responsive for field teams | Bottom tab nav + stacked card layout at <768px; inspection entry form tested on mobile viewport — **demo feature** |
| R14 | OCR for lab certificates | Tesseract.js WASM extracts text from dropped/selected lab cert image — **demo feature (Hero)** |
| R15 | Intelligent document classification | Keyword/heuristic classifier on OCR text → document type label (Grade Cert / Moisture Report / Aflatoxin Screen / etc.) — **demo feature (Hero)** |
| R16 | Anomaly detection on inspection values | Rule-based detector compares extracted values against crop-specific reference bands; flags with severity (warn/reject) and explanation — **demo feature (Hero)** |
| D1  | Production-ready web application | Addressed in proposal narrative: phased delivery (MVP spine → AI layer → hardening), testing plan, scalable architecture description |
| D2  | Clean, maintainable source code | Addressed in proposal: component decomposition, typed interfaces, ESLint/Prettier, documented services |
| D3  | Admin portal | Addressed in proposal: Management role in demo shows concept; full admin portal is Milestone 3 deliverable |
| D4  | Technical documentation | Addressed in proposal: API docs, data model diagrams, runbook — standard deliverable per milestone |
| D5  | Testing before delivery | Addressed in proposal: unit tests (Vitest) for anomaly/classifier logic; E2E (Playwright) for approval flows |
| D6  | Deployment support | Addressed in proposal: containerized deploy (Docker + Nginx), CI/CD pipeline, env config management |
| D7  | Post-launch support | Addressed in proposal: 30-day stabilization period, SLA for critical bugs, knowledge transfer session |

**All 23 explicit requirements mapped.** 12 of 16 feature requirements (R1-R5, R9-R10, R13-R16) are demo features; R6-R8, R11-R12 are convincing mocks. All 7 deliverables addressed in proposal narrative.

---

**PLAN STATUS: READY**

Researcher.out was a placeholder (no actual research data returned), but the orchestrator.out provided sufficient competitive reference (AgriDigital, Cropin, Bushel conventions) and the brief + domain knowledge cover the remaining context. No unknowns block the build.

## handoff

- **Produced:** `plan.md` — full plan with concept, design system (hex palette + IBM Plex fonts), tech stack (Vite + React + Tesseract.js + jsPDF + SheetJS + Recharts), 12-file budget, traceability matrix for all 23 requirements
- **Decisions:** D1 full build (10/10); no mw-backend; hero = AI inspection layer (OCR/classify/anomaly); Pillar 1 = procurement board + approval pipeline; Pillar 2 = role dashboards + PDF/Excel export; R6/R7/R8/R11/R12 = convincing mocks on seeded data
- **Next needs:** demo-builder to install deps (tesseract.js, jspdf, xlsx, recharts), bundle 2-3 sample grain cert JPEGs in `public/samples/`, implement hero flow in InspectionLab.jsx before building pillars
- **Risks:** Tesseract.js WASM load time in browser (mitigate: lazy-load only on tab open + show progress bar); SheetJS community license (check for proposal/demo use — MIT for non-commercial); mobile layout needs explicit test pass since field UX is a stated requirement
