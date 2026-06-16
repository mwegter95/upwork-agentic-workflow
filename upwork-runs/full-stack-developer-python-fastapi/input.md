# Upwork Posting (raw input)

**Title:** Full-Stack Developer (Python/FastAPI + React) Compliance SaaS, Large-File Parsing & Rules Engine
Posted yesterday — Worldwide

## Summary

We are building a B2B SaaS platform that automates compliance workflows in the fiscal and accounting domain. The product ingests standardized XML and PDF files (including XML files of 500+ MB), applies a documented business rules engine with 170+ reconciliation rules, and delivers analytical dashboards, anomaly detection and exports.

This is not a "figure it out as you go" project. You will receive a consolidated technical specification, field-level parsing reference workbooks (exact XPath mappings, format variants and edge cases already documented from real files), and an interactive HTML design prototype that is the binding visual reference. Domain registered, company incorporated, architecture decided. We are looking for one reliable mid-to-senior developer to build the product from scratch alongside the Product Owner.

## What you will build

- Unified file-format detector: identifies document type, period and version from uploaded XML and PDF files and routes to the correct parser (two distinct XML formats per document type, fully documented).
- Streaming XML parsers: lxml/iterparse based, memory-stable on files up to 500+ MB; PDF parsing with embedded XML extraction.
- Asynchronous processing: Celery + Redis with separate heavy/light queues, status polling, full job lifecycle.
- Business rules engine: 170+ documented reconciliation rules across multiple document types, with configurable thresholds and drill-down to source transactions.
- Analytical dashboard: tables, charts, trend and anomaly analysis, server-side pagination on 100,000+ row datasets, Excel and PDF export.
- Multi-tenant architecture: full data isolation per client account, enforced and tested at API level.
- Subscription billing: Stripe (trial, plans, proration, webhooks, cancellation).

## Tech stack (decided)

- Backend: Python (FastAPI)
- Frontend: React + TypeScript
- Database: PostgreSQL
- Queue: Celery + Redis
- Storage: AWS S3 or Azure Blob
- Auth: Supabase or Auth0 (behind an adapter module — hard requirement)
- Payments: Stripe
- Hosting: AWS or Azure

Well-argued alternatives can be discussed at kickoff; the stack will not change mid-project.

## How we work (please read before applying)

- 6 milestones with written Definition of Done and acceptance criteria, agreed upfront.
- Each milestone delivery includes automated tests written by you: golden-file test suites against pre-validated fixtures, minimum 70% coverage on business logic, static analysis report with zero critical findings.
- Milestone 2 includes a payment gate: a live proof of concept parsing a 500+ MB XML file via iterparse, with a memory profile, before the rest of the milestone proceeds.
- Weekly written status update (Mondays); a demo call at the end of each milestone, following a script agreed 3 days in advance.
- Fixed-price, milestone-based contract with a total budget of approx. EUR 4,000 across the 6 milestones.
- Additional modules are planned after this one launches.
- EU timezone preferred.
- All code lives in a private GitHub repository owned by us.

## What we are looking for

- Proven experience shipping SaaS web applications end to end.
- Demonstrable experience processing large structured files (tell us the largest XML or CSV you have parsed in production and how).
- Familiarity with multi-tenant isolation and async job architectures.
- Clean code, honest communication, reliable delivery. Domain knowledge is not required - the documentation covers it.

## First step

We might request a short task probation paid via upwork before the full build begins: parse a real XML file and return structured data via a REST endpoint, so we both validate fit on a low-risk task before committing to the remaining scope.

## To apply, answer these two questions (required)

1. What is the largest XML or structured file you have processed in production, and what was your approach to memory management?
2. How would you enforce tenant isolation in a FastAPI + PostgreSQL application, and at which layers?
