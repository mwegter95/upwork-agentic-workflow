# Cover Letter — Orschell Excavating / E-Commerce Backend

---

You need a backend developer who can take an existing e-commerce site from "in development" to production-ready, covering auth, catalog, inventory, orders, payments, and the REST API that ties it all together. I built you a working version of that system so you can see exactly what you would be getting.

**Live demo:** https://michaelwegter.com/demos/orschell-excavating-e-commerce-full/

It runs Node.js + TypeScript + Express on the backend with a PostgreSQL-compatible relational schema (22 REST endpoints), and Vite + React on the frontend. Every feature on your list is functional: JWT-based authentication with customer and admin roles, a full product catalog (26 SKUs across 5 categories), real-time inventory tracking with low-stock warnings, a complete order pipeline from cart to confirmation, and a CMS admin panel covering product CRUD, inventory edits, and order status management. The payment step is mocked and clearly labeled as such (a Stripe integration would be a one-day addition on the real build; I kept it out of the demo to stay in scope). To try the admin panel, log in with admin@orschellsupply.com / Admin1234!.

For the actual project I would work directly from your existing codebase rather than starting fresh. My first step would be an audit of what is already built, identifying which pieces are production-ready and where the gaps are, then building out the missing layers cleanly without rearchitecting what is working. The schema I designed here is ready to migrate to a hosted Postgres instance (Supabase, RDS, or your choice) with a simple driver swap. I can also add Stripe or another payment gateway as a real integration once the order pipeline is stable.

My background is a good match for what you need. I spent two and a half years at U.S. Bank building and eventually owning a full-stack internal platform (React + Python + SQL, 60k+ lines of code), and I am currently on a large enterprise project at Optum built on PostgreSQL and .NET. I have shipped Node.js and TypeScript backends across several personal projects, and I use TypeScript daily, so the learning curve here is zero. I also use AI tooling heavily in delivery, which keeps my iteration speed high without cutting corners on code quality.

If the demo looks close to what you are picturing, I would love to schedule a short call to walk through your existing codebase and nail down a delivery plan. Happy to answer any questions here first.

Michael Wegter
michaelwegter.com | github.com/mwegter95
