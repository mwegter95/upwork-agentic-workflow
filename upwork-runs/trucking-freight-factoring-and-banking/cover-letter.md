# Cover Letter — JS Senior Expert for Claude Code Refactor

You're migrating a production freight-factoring and banking platform to a TypeScript monorepo, and you need an engineer who can own NestJS money-critical domains, write real Postgres integration tests, and genuinely drive Claude Code in a real codebase. I went ahead and built a working demo of the core system:

**FreightFactor Operations Console:** https://michaelwegter.com/demos/trucking-freight-factoring-and-banking/

The demo covers the key domains you described. The backend is NestJS + Drizzle + Postgres: full invoice factoring lifecycle (carrier submission, underwriter approval, advance disbursal), double-entry FIDC ledger with debit/credit pairs posted on every factoring event, and JWT auth with four RBAC roles (admin, underwriter, carrier, driver). The frontend is Next.js 15 App Router. Integer-cents math throughout, no floats on any money path. Zod validation on every schema, discriminated unions for currency types, strict TypeScript. You can click through the full flow with the seeded demo credentials.


In terms of how I would approach your refactor: I would start by mapping legacy PHP/Laravel routes to a domain-driven NestJS module structure (factoring, banking, payments, identity), building each domain with real-DB integration tests running against Postgres before declaring it done. No mocks on money paths. I have done this kind of careful migration before at U.S. Bank, where I became the sole developer and SME on a 60k-LOC internal platform within months and led its Azure migration as the project's main engineer.

My background is full-stack TypeScript and JavaScript (5+ years production), with strong PostgreSQL (Drizzle, Prisma, raw SQL), NestJS, and Next.js. At my current contract at Optum I am the team's go-to for AI-assisted development, and I run a personal agentic workflow studio built on Claude Code that I use daily. I am comfortable with monorepos, Turborepo/pnpm, and CI/CD. I write tests that actually catch bugs.

---

**To your three questions:**

**1. A non-trivial feature I shipped with an AI coding agent:**

The Cornerstone Construction portfolio site. I used Claude Code with my Agentic Workflow Studio (the with-ceo layout, where parallel build agents run under a CEO supervisor for quality gates) to take the project from design to a functional deployed frontend. The agent handled component architecture, routing, and all initial styling autonomously.

What I had to correct: (1) Navbar links were invisible over the video background, a CSS specificity issue the agent missed. (2) Project images were duplicated per category instead of being unique per project, a data-mapping bug in the seed logic. (3) A navigation quirk where clicking a project from the homepage opened the projects listing page but did not auto-open the modal for that specific project. I diagnosed each issue, rewired the navigation state to pass the project context as a query param, and verified with React DevTools plus a full manual walkthrough of the flow. The pattern is exactly what you described: AI builds fast and broad, the engineer verifies, corrects the edge cases, and owns the final quality. See the attached screenshot of the workflow studio running the with-ceo layout.

**2. A TS/Node codebase I am proud of:**

This demo. Deep TypeScript throughout: discriminated unions for currency types, strict mode, Zod schemas on every API boundary. NestJS patterns: Guards for RBAC, decorators for role enforcement, full dependency injection. Drizzle relations with Postgres. Double-entry ledger logic that posts correct debit/credit pairs on every factoring event, with all amounts stored as integer minor units. Next.js 15 App Router on the frontend with server components where they matter. It is production-grade built in a proposal timeframe, which is exactly what this kind of AI-assisted development enables when the engineer knows how to direct and verify it.

**3. One thing teams get wrong about AI-assisted development:**

They assume AI gets too much wrong to be a real partner, so they either avoid it entirely or hand it over completely with no oversight. With well-designed workflows, disciplined prompting, and an engineer who reviews output skeptically and catches where the agent is subtly wrong, AI-assisted development is genuinely powerful and produces production-ready work. The engineer becomes a force multiplier: AI handles breadth and velocity, the human handles correctness, architecture, and the edge cases agents miss. The demo is evidence that this works.

---

I am available to start immediately and can make meaningful overlap with Brazil business hours work. Looking forward to talking.

Michael Wegter
https://michaelwegter.com
