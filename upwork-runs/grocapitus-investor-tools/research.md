# Research: grocapitus-investor-tools

---

## 1. Client Context

- **Company:** Grocapitus Investments, Fremont CA. CEO: Neal Bawa ("mad scientist of multifamily"). [grocapitus.com](https://grocapitus.com/)
- **Focus:** Data-driven multifamily, build-to-rent, and fourplex syndication. 4,400+ units, ~$660M portfolio value, 1,000+ investors, $200M+ equity invested. [techcompanynews.com](https://www.techcompanynews.com/grocapitus-pioneering-real-estate-investment-with-data-driven-strategies/)
- **Education arm:** Multifamily University (multifamilyu.com) hosts online classes and live events for tens of thousands annually on market analysis, property management, and syndication. [multifamilyu.com/about/](https://multifamilyu.com/about/)
- **Tone implication:** Audience is aspiring and active investors, not finance professionals. Keep language plain, outcome-oriented ("does this deal cash flow?"), and lightly educational. Numbers and labels matter more than jargon. The tool should feel like a trusted educator, not a bank.
- **This posting:** wants a vibe-coder / AI-direction specialist to build lightweight educational investor tools fast. The demo IS the pitch -- it proves the concept-to-working-tool capability the job requires.

---

## 2. Domain Formulas (financially accurate, copy-pasteable)

### 2.1 Gross Scheduled Income (GSI)

```
GSI_monthly = monthly_rent * num_units   // for single-family: num_units = 1
GSI_annual  = GSI_monthly * 12
```

Default placeholder input: $2,200/month rent, 1 unit.

### 2.2 Effective Gross Income (EGI)

```
vacancy_loss = GSI_annual * vacancy_rate          // default vacancy_rate = 0.08 (8%)
EGI          = GSI_annual - vacancy_loss
```

8% vacancy is a conservative but realistic national default for single-family/small multifamily.

### 2.3 Operating Expenses

Standard line items (all annual, all % of GSI unless noted):

| Expense                | Default % of GSI | Notes |
|------------------------|------------------|-------|
| Property taxes         | user input or ~1.25% of purchase price / yr | Use annual dollar input |
| Insurance              | ~0.5% of purchase price / yr | Use annual dollar input |
| Property management    | 8-10% of EGI     | Default 9% |
| Repairs & maintenance  | 5% of GSI        | Excludes capex |
| CapEx reserve          | 5% of GSI        | Major systems replacement |
| Vacancy (see above)    | 8% of GSI        | Treated as income reduction, not expense |
| HOA / other            | $0 default       | User input |

Total operating expense ratio (excl. vacancy, excl. debt): typically 35-45% of GSI for SFR. If user leaves defaults, the 50% rule provides a sanity check.

### 2.4 Net Operating Income (NOI)

```
NOI = EGI - total_operating_expenses
    = (GSI_annual * (1 - vacancy_rate)) - (taxes + insurance + mgmt_fee + repairs + capex + hoa)
```

NOI does NOT include mortgage P&I or income taxes. This is the industry-standard definition.

### 2.5 Cap Rate

```
cap_rate = NOI / purchase_price * 100       // expressed as a percentage
```

Source: [awning.com cap rate calculator](https://awning.com/post/cap-rate-calculator), [wallstreetprep.com](https://www.wallstreetprep.com/knowledge/cap-rate-vs-cash-on-cash-return/)

### 2.6 Mortgage P&I Payment (Monthly)

Standard fixed-rate amortization formula:

```
r = annual_interest_rate / 12            // monthly rate (decimal)
n = loan_term_years * 12                 // number of payments
P = purchase_price * (1 - down_pct)     // loan principal

monthly_PI = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
```

If r == 0 (edge case): monthly_PI = P / n

Default inputs: purchase_price = $350,000, down_pct = 0.20 (20%), interest_rate = 7.0%, term = 30 years.
Worked example: P = $280,000, r = 0.005833, n = 360 -> monthly_PI ≈ $1,863/month.

Source: [penfed.org mortgage formula](https://www.penfed.org/mortgage/article/how-to-calculate-principal-and-interest)

### 2.7 Annual Debt Service

```
annual_debt_service = monthly_PI * 12
```

### 2.8 Annual Cash Flow

```
annual_cash_flow = NOI - annual_debt_service
monthly_cash_flow = annual_cash_flow / 12
```

### 2.9 Cash-on-Cash Return (CoC)

```
total_cash_invested = down_payment + closing_costs     // closing costs default: 2% of purchase price
CoC = annual_cash_flow / total_cash_invested * 100     // expressed as a percentage
```

Source: [wallstreetprep.com CoC](https://www.wallstreetprep.com/knowledge/cash-on-cash-return/), [plantemoran.com](https://www.plantemoran.com/explore-our-thinking/insight/2023/plante-moran-reia/cash-on-cash-return-in-real-estate-investing)

### 2.10 Gross Rent Multiplier (GRM)

```
GRM = purchase_price / GSI_annual
```

Lower is better. A market-average GRM for comparison context: typically 8-15 for SFR/small multifamily depending on market.

### 2.11 The 1% Rule (rule of thumb, educational only)

```
monthly_rent >= purchase_price * 0.01     // passes the 1% rule
```

Show as pass/fail. The rule ignores expenses entirely; label it clearly as a quick screen, not a decision.
Source: [commercialrealestate.loans 1% rule](https://www.commercialrealestate.loans/commercial-real-estate-glossary/1-and-2-percent-rules/)

### 2.12 The 50% Rule (rule of thumb, educational only)

```
estimated_NOI_50pct = GSI_annual * 0.50
estimated_cash_flow_50pct = estimated_NOI_50pct - annual_debt_service
```

Show as a sanity-check comparison alongside the detailed NOI. If detailed NOI diverges >25% from 50% estimate, surface a soft warning.

---

## 3. Default Placeholder Inputs (realistic single-family rental)

The builder can paste these directly as HTML `value=""` attributes:

```
Purchase Price:     $350,000
Down Payment:       20%  ($70,000)
Interest Rate:      7.0%
Loan Term:          30 years
Monthly Rent:       $2,200
Annual Taxes:       $4,375   (1.25% of purchase price)
Annual Insurance:   $1,750   (0.5% of purchase price)
Vacancy Rate:       8%
Property Mgmt:      9%
Repairs:            5%
CapEx:              5%
HOA/Other:          $0
Closing Costs:      2%  ($7,000)
```

Computed results with these defaults:
- GSI annual: $26,400
- EGI: $24,288
- Operating expenses: ~$10,936 (taxes + insurance + mgmt $2,186 + repairs $1,320 + capex $1,320 + HOA $0)
- NOI: ~$13,352
- Cap rate: ~3.8%  (note: this is a thin deal, which is realistic for 2024-2025 and makes the verdict layer interesting)
- Monthly P&I: ~$1,863
- Annual debt service: ~$22,352
- Annual cash flow: ~-$9,000  (negative -- thin deal on purpose for demo drama)
- Monthly cash flow: ~-$750
- CoC: negative (shows the verdict layer triggering "Deal Alert" state)
- 1% rule: $2,200 / $350,000 = 0.63% -- FAILS
- GRM: $350,000 / $26,400 = 13.3

Builder: start with this to show a thin/negative deal (realistic in today's market) so all three verdict states are demonstrable. User can adjust rent to $2,900+ to flip it positive.

---

## 4. Deal-Verdict Thresholds (color-coded, educational heuristics)

These are defensible industry heuristics. The UI must include a disclaimer: "Educational heuristics only, not investment advice."

### Cap Rate

| Range       | Label          | Color token         |
|-------------|----------------|---------------------|
| >= 7%       | Strong         | --parrot-green      |
| 5-7%        | Acceptable     | --mustard           |
| 4-5%        | Thin           | --sky-blue (muted)  |
| < 4%        | Weak           | --parrot-red        |

Note: 2025 national multifamily average is ~5.3-5.6%. Source: [butterflymx.com multifamily cap rates](https://butterflymx.com/blog/multifamily-cap-rates/), [apartmentloanstore.com](https://apartmentloanstore.com/loan-product/cap-rates)

### Cash-on-Cash Return

| Range       | Label          | Color token         |
|-------------|----------------|---------------------|
| >= 8%       | Strong         | --parrot-green      |
| 5-8%        | Acceptable     | --mustard           |
| 1-5%        | Thin           | --sky-blue (muted)  |
| < 1% or neg | Weak / Avoid   | --parrot-red        |

Source: [loopnet.com CoC](https://www.loopnet.com/cre-explained/tools/cash-on-cash-return-in-real-estate-investments/)

### Monthly Cash Flow (per door)

| Range          | Label          | Color token     |
|----------------|----------------|-----------------|
| >= $300/door   | Strong         | --parrot-green  |
| $100-300/door  | Acceptable     | --mustard       |
| $0-100/door    | Thin           | --cyan-vivid    |
| Negative       | Negative       | --parrot-red    |

### 1% Rule

| Result   | Label     | Color token    |
|----------|-----------|----------------|
| Passes   | Passes 1% | --parrot-green |
| Fails    | Fails 1%  | --parrot-red   |

### Overall Verdict Logic (composite)

Derive one top-level verdict from the three main metrics:
- "Strong Deal": cap rate >= 6% AND CoC >= 6% AND monthly cash flow >= $200/door
- "Acceptable Deal": cap rate >= 4.5% AND CoC >= 3% AND monthly cash flow >= $0
- "Thin Deal": cash flow positive but CoC < 3% or cap rate < 4.5%
- "Negative Cash Flow": monthly cash flow < 0

Color-code verdict chip: green / mustard / cyan / red respectively.

---

## 5. Scaffold: Existing App to Clone

**Demo destination:** `../michaelwegter.com/public/demos/grocapitus-investor-tools/`
Files: `index.html` + `assets/app.js` + `assets/styles.css`

**Registry file to edit:** `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/src/data/workSamples.js`
- Current entries: 1 (aba-services-website, id:1)
- New entry: id:2, slug: "grocapitus-investor-tools"
- href: `import.meta.env.BASE_URL + "demos/grocapitus-investor-tools/"`

**Route mechanics (already wired, no changes needed):**
- `/work-samples/:slug` route exists in `src/App.jsx` line 30
- `AppFrame` at `src/components/AppFrame.jsx` looks up slug across `[...apps, ...workSamples]` -- the slug lookup works automatically once the workSamples.js entry is added
- `WorkSamples.jsx` page already renders cards from the workSamples array
- Navbar already has a "Work Samples" link (line 125 of Navbar.jsx)

**No new libraries needed.** Vanilla JS + inline SVG/CSS handles all math, the bar visual, the verdict chip, and the sensitivity slider. Confirm: no React, no charting library, no build step.

**Gotcha:** AppFrame does a slug-based lookup: `a.slug === appId`. The slug in workSamples.js must exactly match the folder name in `public/demos/` and the run slug (`grocapitus-investor-tools`). Triple-check these match.

---

## 6. Portfolio App Media for the Proposal

### Has existing screenshots (no Playwright capture needed)

Located at `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/public/screenshots/`:

- **Stage (gallery-wall-planner):**
  - `gallery_wall_planner_wall_warp_perspective.png` -- hero still
  - `gallery_wall_planner_drag_and_drop_main_demo.mp4` -- drag-drop flow
  - `gallery_wall_planner_switch_layouts_compare.mp4` -- layout switching
  - `gallery_wall_planner_piece_library_demo.mp4` -- piece library
- **Spotify Super User Tools (SSUT):**
  - `ssut_main_screenshot_playlist_extractor_to_text.png` -- main view
  - `ssut_playlist_builder_from_list.png` -- playlist builder
  - `ssut_cleanify_song_clean_playlist.png` -- cleanify feature

### Needs Playwright capture

- **Growyard:** live at `https://mwegter95.github.io/growyard/`
- **Life Dashboard:** live at `https://mwegter95.github.io/life-dashboard/`

Capture target: 1-2 hero screenshots each, 1280x800 viewport, full first-paint state (no interaction required). Sized for deck/one-pager card slots.

---

## 7. Open Risks for the Builder

1. **Default inputs produce a negative cash flow deal.** This is intentional and realistic (2025 market), but the builder must make the verdict chip and the "Thin" / "Negative" states visually clear and non-alarming so the tool feels educational, not broken.

2. **Math precision:** Use JavaScript's `Math.pow(base, exp)` not `**` for broadest compatibility. Guard against division-by-zero on purchase_price = 0 and interest_rate = 0 (the r==0 branch in the P&I formula).

3. **Sensitivity slider scope:** The plan specifies ONE slider (rent OR interest rate sweeping a key metric). Pick monthly rent vs. monthly cash flow as the most immediately legible pairing for a first-time investor. Keep the slider tight; do not add a second axis.

4. **No contact info anywhere** in the demo (per brief.json red flags). Remove any "built by" footer credits that include personal info.

5. **Disclaimer required:** The verdict layer must include visible text: "Educational tool only. Not investment advice." This protects both Michael and the client.

6. **The 1% rule fails on the default inputs** (0.63%). This is fine and good for education -- label it clearly as a quick-screen heuristic and explain why it fails without being alarming.
