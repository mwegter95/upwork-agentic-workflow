# Cover Letter: AgriPro Operations Platform

Managing a multi-state agricultural procurement operation on spreadsheets and email is not just inefficient, it creates real risk: missed approval steps, untracked lab anomalies, and inspection records living in inboxes with no audit trail. I built a working demo of the platform you described:

**https://michaelwegter.com/demos/agripro/**

You can log in as Procurement, Quality, Warehouse, or Management and the experience changes meaningfully for each role. The hero feature runs live in your browser: drop a lab certificate image into the OCR scanner and Tesseract.js extracts moisture, test weight, aflatoxin, and foreign-matter readings, classifies the document type, and flags anything outside crop-specific reference bands in real time. No mocked screenshot, no API key, just the logic running client-side the way it would in production. That covers your OCR, document classification, and anomaly detection requirements working together.

For the full build I would deliver in three milestones:

**Milestone 1 (8 weeks): Core Operational Spine:** Authenticated RBAC, procurement campaign management, field inspection records, the multi-stage approval pipeline (Draft through Warehouse Allocation), search and advanced filtering, audit logs, mobile-responsive layout for field teams, and the admin portal.

**Milestone 2 (4 weeks): AI and Quality Layer:** Production OCR tied to real lab certificate ingestion, intelligent document classification, anomaly detection with configurable crop-specific thresholds, warehouse allocation and tracking, document management, notifications and reminders, and role-scoped dashboards with PDF and Excel export.

**Milestone 3 (4 weeks): Hardening and Delivery:** Unit tests for anomaly detection and classification logic, end-to-end tests for the approval workflows, technical documentation, containerized deployment with CI/CD, and 30 days of post-launch stabilization support.

On my background: I spent about 2.5 years at U.S. Bank building and then owning TDAAS, an internal operations platform serving 600 users per month and around 60,000 lines of React, Python, SQL, and Java. I became the sole developer and SME within a few months; when something broke I fixed it, often within 10 minutes. I also led that platform's migration to Azure Cloud as its main technical representative, one of the first apps the bank moved. Right now I am building a full-stack Angular and .NET platform at Optum (150+ story points delivered), and I am the team's go-to for AI-assisted development. Internal tools with dense operational data and AI woven into real workflows, not bolted on cosmetically, are the kind of projects I find most rewarding and where I do my best work.

Happy to walk through the demo together and talk through your timeline whenever it is convenient.

Michael
github.com/mwegter95
