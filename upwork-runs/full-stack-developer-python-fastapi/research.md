# Research — Full-Stack Developer (Python/FastAPI) Compliance SaaS

Slug: `full-stack-developer-python-fastapi`
Date: 2026-06-14

---

## 1. Scaffold Pointer (Repo Clone Target)

### workSamples.js — EXISTS, append only

`/Users/michaelwegter/Desktop/Projects/michaelwegter.com/src/data/workSamples.js`

The file exists and currently has 4 entries (ids 1-4). The next entry must use `id: 5`. Full schema confirmed:

```js
{
  id: 5,
  slug: "full-stack-developer-python-fastapi",
  title: "Compliance Reconciliation Console",
  description: "...",
  category: "Data",
  status: "live",
  href: import.meta.env.BASE_URL + "demos/full-stack-developer-python-fastapi/",
  color: "#12b4c8",      // cyan-vivid — fits a data/compliance theme
  icon: "📋",
  frameStyle: "baroque",
  client: "Upwork / Fiscal Compliance SaaS",
  postingSummary: "Build a B2B compliance SaaS that ingests 500+ MB XML files, applies 170+ reconciliation rules, and delivers multi-tenant analytical dashboards.",
  builtFor: "Full-Stack Developer (Python/FastAPI + React) - Compliance SaaS (Upwork)",
  date: "2026-06-14",
  proposalDeckUrl: null,
  proposalPageUrl: null,
}
```

### Route + AppFrame wiring — ALREADY COMPLETE, nothing to change

- `/work-samples` route: `App.jsx` line 29 already wires `<Route path="/work-samples" element={<WorkSamples />} />`.
- `/work-samples/:slug` route: `App.jsx` line 31 already wires `<Route path="/work-samples/:slug" element={<AppFramePage />} />`.
- `AppFrame.jsx` already imports and merges `workSamples` (`[...apps, ...workSamples].find(...)`).
- `Navbar.jsx` already has a "Work Samples" link (line 123-129).
- `WorkSamples.jsx` exists and reads from the registry.

**The builder touches ONLY `workSamples.js` (append entry) and the demo files under `public/demos/full-stack-developer-python-fastapi/`. Zero other site files need editing.**

### Simplest existing demo to clone as scaffold

`/Users/michaelwegter/Desktop/Projects/michaelwegter.com/public/demos/grocapitus-investor-tools/`

Structure: `index.html` + `assets/styles.css` + `assets/app.js`. Plain vanilla JS, no bundler, no CDN framework. That demo uses the full design-token CSS pattern (Google Fonts preconnect for Inter/JetBrains Mono/Space Grotesk, local styles.css, no external framework), inline SVG chart (bar segments via CSS widths). This is the right pattern to clone for the CSS/HTML skeleton.

For the React/htm CDN approach (needed for component state in the reconciliation console), cross-reference `aba-services-website` -- it also uses vanilla but its structure shows how assets split. The plan calls for React + htm via CDN; the builder should import from `https://esm.sh/preact@10` + `https://esm.sh/htm@3` or `https://unpkg.com/react@18/umd/react.development.js` + `https://unpkg.com/react-dom@18/umd/react-dom.development.js` plus `https://unpkg.com/htm@3/preact/standalone.umd.js`. The grocapitus demo's CSS is the closest stylesheet scaffold to copy.

### mw-backend — NOT needed

Confirmed: frontend-only demo with sample fixtures. mw-backend is irrelevant for this run.

---

## 2. Domain Accuracy — SAF-T XML Structure

Sources: [Wikipedia SAF-T](https://en.wikipedia.org/wiki/SAF-T), [EDICOM SAF-T overview](https://edicomgroup.com/learning-center/what-is-saft), [Norway SAF-T GitHub schema](https://github.com/Skatteetaten/saf-t/blob/master/Norwegian_SAF-T_Financial_Schema_v_1.10.xsd), [SAF-T XML Viewer](https://kibervarnost.si/saft-viewer/), [Portugal SAF-T API example](https://github.com/AndreFCruz/saft-api/blob/master/saf-t.xml)

### SAF-T canonical top-level structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:PT_1.04_01"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

  <Header>
    <AuditFileVersion>1.04_01</AuditFileVersion>
    <CompanyID>PT123456789</CompanyID>
    <TaxRegistrationNumber>123456789</TaxRegistrationNumber>
    <TaxAccountingBasis>F</TaxAccountingBasis>   <!-- F=Faturação, C=Contabilidade -->
    <CompanyName>Empresa Exemplo, Lda</CompanyName>
    <BusinessName>Empresa Exemplo</BusinessName>
    <FiscalYear>2023</FiscalYear>
    <StartDate>2023-01-01</StartDate>
    <EndDate>2023-12-31</EndDate>
    <CurrencyCode>EUR</CurrencyCode>
    <DateCreated>2024-01-15</DateCreated>
    <TaxEntity>Global</TaxEntity>
    <ProductCompanyTaxID>000000000</ProductCompanyTaxID>
    <SoftwareCertificateNumber>0000</SoftwareCertificateNumber>
    <ProductID>Accounting Software/1.0</ProductID>
    <ProductVersion>1.0</ProductVersion>
  </Header>

  <MasterFiles>
    <GeneralLedgerAccounts>
      <Account>
        <AccountID>11</AccountID>
        <AccountDescription>Caixa</AccountDescription>
        <OpeningDebitBalance>5000.00</OpeningDebitBalance>
        <OpeningCreditBalance>0.00</OpeningCreditBalance>
        <ClosingDebitBalance>3200.00</ClosingDebitBalance>
        <ClosingCreditBalance>0.00</ClosingCreditBalance>
        <GroupingCode>1</GroupingCode>
        <GroupingCategory>GA</GroupingCategory>
      </Account>
    </GeneralLedgerAccounts>
    <Customers>
      <Customer>
        <CustomerID>C001</CustomerID>
        <AccountID>21100001</AccountID>
        <CustomerTaxID>987654321</CustomerTaxID>
        <CompanyName>Cliente Exemplo, SA</CompanyName>
        <BillingAddress>
          <AddressDetail>Rua Exemplo, 1</AddressDetail>
          <City>Lisboa</City>
          <PostalCode>1000-001</PostalCode>
          <Country>PT</Country>
        </BillingAddress>
        <SelfBillingIndicator>0</SelfBillingIndicator>
      </Customer>
    </Customers>
    <Suppliers>
      <Supplier>
        <SupplierID>S001</SupplierID>
        <AccountID>22100001</AccountID>
        <SupplierTaxID>111222333</SupplierTaxID>
        <CompanyName>Fornecedor Exemplo, Lda</CompanyName>
        <SelfBillingIndicator>0</SelfBillingIndicator>
      </Supplier>
    </Suppliers>
    <TaxTable>
      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>PT</TaxCountryRegion>
        <TaxCode>NOR</TaxCode>
        <Description>Taxa Normal</Description>
        <TaxPercentage>23.00</TaxPercentage>
      </TaxTableEntry>
    </TaxTable>
  </MasterFiles>

  <GeneralLedgerEntries>
    <NumberOfEntries>1250</NumberOfEntries>
    <TotalDebit>485320.75</TotalDebit>
    <TotalCredit>485320.75</TotalCredit>
    <Journal>
      <JournalID>VD</JournalID>
      <Description>Vendas</Description>
      <Transaction>
        <TransactionID>2023-01-0001</TransactionID>
        <Period>1</Period>
        <TransactionDate>2023-01-15</TransactionDate>
        <SourceID>User01</SourceID>
        <Description>Factura FT 2023/1</Description>
        <DocArchivalNumber>FT 2023/1</DocArchivalNumber>
        <TransactionType>N</TransactionType>
        <GLPostingDate>2023-01-15</GLPostingDate>
        <CustomerID>C001</CustomerID>
        <Line>
          <RecordID>1</RecordID>
          <AccountID>21100001</AccountID>
          <Description>Faturação cliente</Description>
          <DebitAmount>1230.00</DebitAmount>
        </Line>
        <Line>
          <RecordID>2</RecordID>
          <AccountID>71100000</AccountID>
          <Description>Rendimento prestação serviços</Description>
          <CreditAmount>1000.00</CreditAmount>
        </Line>
        <Line>
          <RecordID>3</RecordID>
          <AccountID>24320000</AccountID>
          <Description>IVA liquidado 23%</Description>
          <CreditAmount>230.00</CreditAmount>
        </Line>
      </Transaction>
    </Journal>
  </GeneralLedgerEntries>

  <SourceDocuments>
    <SalesInvoices>
      <NumberOfEntries>340</NumberOfEntries>
      <TotalDebit>0.00</TotalDebit>
      <TotalCredit>412800.00</TotalCredit>
      <Invoice>
        <InvoiceNo>FT 2023/1</InvoiceNo>
        <ATCUD>0</ATCUD>
        <DocumentStatus>
          <InvoiceStatus>N</InvoiceStatus>
          <InvoiceStatusDate>2023-01-15T09:30:00</InvoiceStatusDate>
          <SourceID>User01</SourceID>
          <SourceBilling>P</SourceBilling>
        </DocumentStatus>
        <Hash>ABCD1234</Hash>
        <HashControl>1</HashControl>
        <Period>1</Period>
        <InvoiceDate>2023-01-15</InvoiceDate>
        <InvoiceType>FT</InvoiceType>
        <SpecialRegimes>
          <SelfBillingIndicator>0</SelfBillingIndicator>
          <CashVATSchemeIndicator>0</CashVATSchemeIndicator>
          <ThirdPartiesBillingIndicator>0</ThirdPartiesBillingIndicator>
        </SpecialRegimes>
        <SourceID>User01</SourceID>
        <SystemEntryDate>2023-01-15T09:30:00</SystemEntryDate>
        <CustomerID>C001</CustomerID>
        <Line>
          <LineNumber>1</LineNumber>
          <ProductCode>SVC001</ProductCode>
          <ProductDescription>Consultoria</ProductDescription>
          <Quantity>10.00</Quantity>
          <UnitOfMeasure>HR</UnitOfMeasure>
          <UnitPrice>100.00</UnitPrice>
          <TaxPointDate>2023-01-15</TaxPointDate>
          <Description>Serviços de consultoria Janeiro 2023</Description>
          <DebitAmount>0.00</DebitAmount>
          <CreditAmount>1000.00</CreditAmount>
          <Tax>
            <TaxType>IVA</TaxType>
            <TaxCountryRegion>PT</TaxCountryRegion>
            <TaxCode>NOR</TaxCode>
            <TaxPercentage>23.00</TaxPercentage>
          </Tax>
          <TaxExemptionReason></TaxExemptionReason>
        </Line>
        <DocumentTotals>
          <TaxPayable>230.00</TaxPayable>
          <NetTotal>1000.00</NetTotal>
          <GrossTotal>1230.00</GrossTotal>
        </DocumentTotals>
      </Invoice>
    </SalesInvoices>
  </SourceDocuments>

</AuditFile>
```

### Schema version / document-type detection

The `xmlns` attribute on `<AuditFile>` is the primary version signal:

| xmlns value | Country | Type |
|---|---|---|
| `urn:OECD:StandardAuditFile-Tax:PT_1.04_01` | Portugal | Financial (full) |
| `urn:OECD:StandardAuditFile-Tax:PT_1.03_01` | Portugal | Financial (older) |
| `urn:StandardAuditFile-Taxation-Financial:NO` | Norway | Financial |
| `urn:StandardAuditFile-Taxation-Payroll:NO` | Norway | Payroll |

Secondary signals in `<Header>`:
- `<AuditFileVersion>` contains the version string.
- `<TaxAccountingBasis>` values: `F` = invoicing only, `C` = full accounting -- determines which sections are present.
- `<FiscalYear>` + `<StartDate>` + `<EndDate>` provide the period.
- `<TaxRegistrationNumber>` length and format identifies country when xmlns is generic.

**The demo's format-detector module should extract xmlns, AuditFileVersion, FiscalYear, StartDate/EndDate, and TaxAccountingBasis from the first ~2KB of the file using a streaming read of only the opening tags.**

### Why iterparse is the right tool for these files

A real SAF-T PT full-accounting file for a mid-size company covering 12 months easily reaches 200-600 MB. The `<Transaction>` elements repeat thousands of times inside `<GeneralLedgerEntries>`; `<Invoice>` elements repeat inside `<SalesInvoices>`. Each repeating element has a predictable closing tag, making the event-driven iterparse pattern safe and efficient: on `end` event for `Transaction` or `Invoice`, process the element, then call `elem.clear()` followed by ancestor pruning (`while elem.getprevious() is not None: del elem.getparent()[0]`). Memory stays bounded at roughly the size of a single element subtree regardless of file length.

---

## 3. The 10 Reconciliation Rules for the Demo

These are grounded in real SAF-T validation practice. Each maps to a named element in the fixture above.

| # | Rule Name | What It Checks | Pass/Warn/Fail Logic | Threshold |
|---|---|---|---|---|
| R01 | **Debit/Credit Balance** | `GeneralLedgerEntries.TotalDebit` == `GeneralLedgerEntries.TotalCredit` | FAIL if any difference; WARN if rounding delta < 0.01 | delta = 0 (strict) |
| R02 | **Control Total vs Sum of Lines** | Sum of all `<Transaction><Line><DebitAmount>` and `<CreditAmount>` across the journal matches `TotalDebit` / `TotalCredit` header totals | FAIL if |header - computed| > 0.01 | 0.01 EUR tolerance |
| R03 | **VAT Totals Reconciliation** | Sum of `<Tax><TaxPayable>` across all invoices matches sum of `<Line><CreditAmount>` on VAT accounts (AccountID prefix `2432`) | WARN if delta > 1.00, FAIL if > 10.00 | 10.00 EUR |
| R04 | **Invoice Sequence Gaps** | `<InvoiceNo>` values within each series (FT, NC, ND) must be numerically sequential with no gaps | WARN for gap of 1, FAIL for gap > 1 | gap > 1 = FAIL |
| R05 | **Duplicate Invoice Numbers** | `<InvoiceNo>` must be unique within each `<InvoiceType>` series | FAIL if any duplicate found | 0 duplicates allowed |
| R06 | **Period Boundary Check** | `<InvoiceDate>` and `<GLPostingDate>` on every document must fall within `Header.StartDate` to `Header.EndDate` | FAIL for any out-of-period date | strict range |
| R07 | **DocumentTotals Cross-Check** | `<GrossTotal>` == `<NetTotal>` + `<TaxPayable>` for every invoice | FAIL if |GrossTotal - (NetTotal + TaxPayable)| > 0.01 | 0.01 EUR |
| R08 | **Cancelled Invoice Linkage** | Every credit note (`InvoiceType=NC`) must reference a valid originating invoice `InvoiceNo` in its `<References>` block | WARN if reference missing | any missing = WARN |
| R09 | **Customer ID Integrity** | Every `<CustomerID>` in invoices must exist in `MasterFiles.Customers` | FAIL if any orphan CustomerID found | 0 orphans allowed |
| R10 | **Ledger Account Completeness** | Every `<AccountID>` in `<Line>` elements must exist in `MasterFiles.GeneralLedgerAccounts` | WARN if 1-5 missing, FAIL if > 5 missing | 5 missing = escalate to FAIL |

**The demo fixture `invoice-ledger-anomalies.xml` should deliberately seed violations of R04 (gap in invoice sequence between FT 2023/4 and FT 2023/6), R07 (one invoice where GrossTotal is off by 0.50), R09 (one invoice with CustomerID "C999" not in MasterFiles), and R03 (VAT total off by 12.00 EUR). This gives the demo 4 real rule failures and 6 passes in the anomalies fixture, and 10 passes in the clean fixture.**

---

## 4. Technical Notes for the Demo

### React/htm CDN approach (no bundler)

```html
<!-- In index.html <head> -->
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18",
    "react-dom/client": "https://esm.sh/react-dom@18/client",
    "htm/react": "https://esm.sh/htm@3/react"
  }
}
</script>
<!-- Then in assets/app.js -->
<!-- import { html } from 'htm/react'; import { useState, useEffect, useRef } from 'react'; -->
```

Alternatively (more browser-compatible, avoids importmap support gaps in older Safari):

```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
<script src="https://unpkg.com/htm@3/dist/htm.js" crossorigin></script>
<!-- In JS: const html = htm.bind(React.createElement); -->
```

The UMD approach is safer for the widest browser compatibility without a bundler. Use `React.createElement` bound version.

### Memory-stability visualization (in-browser simulation)

The demo cannot literally iterparse a 500 MB file in a browser tab. The honest approach (per plan.md) is to:

1. Load the small XML fixture via `fetch()` or `FileReader`.
2. Parse it using a manual chunked-DOM approach: read the XML string, extract elements one by one via regex or `DOMParser`, tracking cumulative "elements processed" vs a simulated timestamp.
3. Plot two lines on an SVG chart: (A) "Streaming / bounded" -- stays flat near a baseline (e.g., 12 MB), increments by ~0.1 MB per 1000 records then drops back as elements are "cleared"; (B) "Naive DOM load" -- climbs linearly at ~2 MB per 1000 records with no clearing.
4. The data for both lines is computed synthetically based on record count, not real memory measurement. `performance.memory` (Chrome only, non-standard) can be used as a bonus overlay if available (`window.performance.memory?.usedJSHeapSize`).

Suggested synthetic memory model:
- Streaming line: `memMB = 8 + (recordsInFlight * 0.002)` where `recordsInFlight` stays bounded at ~50 (processing window).
- Naive line: `memMB = recordsProcessed * 0.04` (40 KB per element in DOM, accumulates unbounded).
- Animate by processing the fixture records with `requestAnimationFrame` or a `setInterval` loop, advancing 10-20 records per tick.

### Charting approach

Inline SVG is sufficient. No external chart library needed. The memory chart is a two-line SVG `<polyline>` over a fixed viewport (e.g., 600x180), with dynamic `points` attribute updated each tick. The dashboard bar/donut charts are CSS-width-based (like the grocapitus demo). This keeps the demo self-contained with zero CDN dependencies beyond React.

### 100k-row pagination simulation

Generate the dataset client-side in `assets/data.js` using a seeded pseudo-random function (lcg/mulberry32) so it is deterministic. A 100k entry array of `{id, date, accountId, description, debit, credit, period}` objects is ~15-20 MB in memory, which is fine for a demo. Server-side pagination is simulated by slicing the array: `rows.slice((page-1)*pageSize, page*pageSize)`. Show "Simulating server-side pagination" label in the UI.

### CSV export

`URL.createObjectURL(new Blob([csvString], {type:'text/csv'}))` + programmatic `<a>` click. No library needed.

---

## 5. Proposal Factual Hooks (for Q1 and Q2)

### Q1: Largest file processed + memory management approach

**Accurate technical answer to build the cover letter around:**

- lxml's `iterparse()` is an event-driven SAX-like parser that yields `(event, element)` tuples as the XML stream is read, never building the full tree in memory.
- The standard production pattern: iterate on `('end', 'Transaction')` or `('end', 'Invoice')` events. After processing each element: (1) call `elem.clear()` to release its text content and attributes, (2) prune preceding siblings with `while elem.getprevious() is not None: del elem.getparent()[0]`. This keeps memory bounded at approximately the size of a single element subtree regardless of total file size.
- On a 500 MB SAF-T file with ~50,000 `<Transaction>` elements, each ~10 KB, peak RSS stays around 80-120 MB using this pattern vs 600-800 MB with full-tree `etree.parse()`.
- The `tag` parameter in `iterparse(file, events=('end',), tag='Transaction')` pre-filters to only the target elements, so lxml internally skips irrelevant subtrees, but ancestor pruning is still required because lxml retains the root path.
- For the Milestone 2 payment gate: the deliverable is a FastAPI endpoint that accepts a multipart upload, streams the file to a temp location (or S3 presigned URL), runs iterparse in a Celery task, and returns a memory profile (measured with `tracemalloc` or `psutil.Process().memory_info().rss`) in the job result.

Source: [lxml best practices for large documents](https://webscraping.ai/faq/lxml/what-are-the-best-practices-for-managing-memory-usage-when-using-lxml), [iterparse 1GB example](https://www.codestudy.net/blog/using-lxml-and-iterparse-to-parse-a-big-1gb-xml-file/)

### Q2: Tenant isolation in FastAPI + PostgreSQL, at which layers

**Accurate 4-layer answer for the cover letter:**

**Layer 1 — JWT claim extraction (request entry point).**
JWT issued by Supabase/Auth0 includes a `tenant_id` claim. A FastAPI dependency (`get_current_tenant`) decodes the token and returns a `TenantContext` object. Every route that touches data declares this dependency. Routes without it cannot access data tables.

**Layer 2 — Mandatory query filter injection (application layer).**
All database operations go through a `TenantScopedSession` wrapper (SQLAlchemy). Every `SELECT`, `UPDATE`, `DELETE` automatically appends `.filter(Model.tenant_id == ctx.tenant_id)`. ORM base classes or a custom query class enforce this so no individual route can accidentally omit the filter. This is the primary isolation layer and is testable with unit tests on every query builder.

**Layer 3 — PostgreSQL Row-Level Security (database layer, defense in depth).**
Each table has an RLS policy: `CREATE POLICY tenant_isolation ON invoices USING (tenant_id = current_setting('app.current_tenant')::uuid)`. The FastAPI db connection sets `SET LOCAL app.current_tenant = '<uuid>'` at the start of each transaction. Even if the application layer filter is accidentally bypassed, the database refuses to return other tenants' rows. This protects against bugs and direct DB access.

**Layer 4 — API-level test enforcement.**
Integration tests use two seeded tenant accounts. Every endpoint test asserts that a request authenticated as tenant A cannot retrieve, modify, or delete records belonging to tenant B -- tested with both valid and manipulated JWTs. Static analysis (ruff + bandit) enforces no raw SQL strings that could bypass ORM filters.

**PgBouncer caveat:** If using PgBouncer in transaction-pooling mode, `SET LOCAL` (transaction-scoped) must be used instead of `SET SESSION` (session-scoped) to prevent tenant context leaking across connection reuse.

Source: [FastAPI multi-tenant patterns](https://medium.com/@koushiksathish3/multi-tenant-architecture-with-fastapi-design-patterns-and-pitfalls-aa3f9e75bf8c), [PostgreSQL RLS for SaaS](https://mvpfactory.io/blog/row-level-security-in-postgresql-multi-tenant-data-isolation-for-your-saas), [FastAPI RLS without pain](https://medium.com/@hjparmar1944/fastapi-multi-tenant-saas-row-level-security-without-pain-9ef960085bf4)

### Celery heavy/light queue split (for R3 answer)

**Two-queue configuration:**

```python
# celery config
task_routes = {
    'tasks.parse_xml_file': {'queue': 'heavy'},        # 500 MB parse, memory-intensive
    'tasks.extract_pdf_xml': {'queue': 'heavy'},        # PDF + embedded XML extraction
    'tasks.run_reconciliation': {'queue': 'heavy'},     # 170+ rules over full dataset
    'tasks.generate_report': {'queue': 'light'},        # export/PDF generation
    'tasks.send_notification': {'queue': 'light'},      # email/webhook callbacks
    'tasks.check_job_status': {'queue': 'light'},       # status polling heartbeats
}
# Launch two worker pools:
# celery -A app worker -Q heavy --concurrency=2 -n heavy@%h   (memory-hungry, few workers)
# celery -A app worker -Q light --concurrency=8 -n light@%h   (fast, many workers)
```

Heavy workers: low concurrency (1-2 per instance), prefetch multiplier = 1 (`worker_prefetch_multiplier=1`) so no task is pre-fetched and memory-starved. Light workers: higher concurrency (6-8), default prefetch. This ensures a flood of status-poll requests from the frontend never blocks a long-running parse job from getting a worker slot.

Source: [Celery workers guide](https://docs.celeryq.dev/en/stable/userguide/workers.html), [Celery optimizing](https://docs.celeryq.dev/en/latest/userguide/optimizing.html)

---

## 6. Open Risks for the Builder

1. **importmap browser support**: Safari 16.4+ supports importmaps; anything older does not. The UMD React approach is safer for the demo. Use the UMD script tags (react + react-dom + htm) not the importmap approach.

2. **DOMParser with large XML**: `new DOMParser().parseFromString(xmlString, 'text/xml')` on a 200 KB fixture will be instant. Do not let the fixture exceed ~50 KB or the "parse" will complete before the animation can show meaningful streaming behavior. Keep fixtures under 20 KB; simulate the 500 MB scale through the synthetic memory model and animated record counter.

3. **`performance.memory` is Chrome-only and non-standard**: Use it as an optional overlay only (`if (window.performance?.memory)`). The primary memory display should be the synthetic model, not a real measurement, so it works in Firefox and Safari.

4. **The `workSamples.js` file uses ES module `import.meta.env.BASE_URL`**: Verify the demo's `href` exactly matches the path. On local dev with Vite, `BASE_URL` is `/`. On GH Pages it is `/`. This should work as-is, but confirm no double-slash issue.

5. **100k-row array generation at startup**: Building a 100k-row array synchronously on page load will cause a visible stall (~100-200ms). Generate lazily on first visit to the dashboard tab, or use a `setTimeout(..., 0)` deferral after first paint.

6. **SAF-T fixture realism**: The sample XML above is based on SAF-T PT 1.04_01 (Portugal). If the client is building for a different national variant (Norway, Romania, Poland), the schema differs. However, SAF-T PT is the most documented and widely used variant and is a safe credible choice for the demo fixture. The demo's format-detector should mention at least two variants (PT and NO) to show awareness of multi-format handling.

---

## 7. File Paths the Builder Needs

- Registry to append: `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/src/data/workSamples.js`
- Demo destination: `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/public/demos/full-stack-developer-python-fastapi/`
- Scaffold to copy CSS from: `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/public/demos/grocapitus-investor-tools/assets/styles.css`
- AppFrame (read-only reference, do not modify): `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/src/components/AppFrame.jsx`
- App.jsx (read-only, routes already wired): `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/src/App.jsx`
- Navbar.jsx (read-only, Work Samples link already present): `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/src/components/Navbar.jsx`
