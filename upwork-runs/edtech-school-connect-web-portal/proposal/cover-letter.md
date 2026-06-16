You are building a school-parent communication platform, and the two hardest parts to get right are making it feel trustworthy enough for parents and fast enough for teachers. I have already built a simplified, demo version of it.

Here is the live demo: **https://michaelwegter.com/demos/edtech-school-connect-web-portal/**

You can log in as a parent (parent@demo.edu / ParentDemo1) or a teacher (teacher@demo.edu / TeachDemo1) and experience both sides of the platform right now. The parent dashboard shows student Alex Johnson's live grades, a recent activity feed, and a real-time message thread with the teacher. The teacher side lets you update a grade and watch it reflect on the parent's dashboard within seconds, post announcements to the activity feed, and reply to parent messages. All three core features are working with a real backend, not mock data.

**On the PHP question.** Your posting lists PHP as the mandatory stack, which I want to address directly. The demo runs on a JavaScript frontend plus a Python/Flask API because it has to work on a static host for fast prototyping. But the architecture maps cleanly to PHP/Laravel: the Flask blueprint becomes a Laravel Controller with routes, the SQLite tables become MySQL with Eloquent ORM, the JWT auth becomes Laravel Sanctum, and the real-time polling upgrades to Laravel Echo with Pusher for WebSockets. The demo is a production-spec prototype, not a throwaway. A mid-level Laravel developer could migrate it in one to two weeks. I am comfortable working directly in PHP/Laravel for the actual build, and I can bring the same architecture you see in the demo into the PHP stack from day one.

**What the full build would look like.** Starting from this prototype, the MVP scope for the 1 to 3 month engagement is clear: harden the messaging layer to handle multiple parent-teacher pairs, expand the gradebook to a full class roster, add real email notification hooks, and layer in a proper admin role for school staff. The data model is already designed for this, and the frontend components are built as reusable modules so expansion does not mean rewrites. I work under 30 hours a week, which keeps scope focused and delivery consistent, and I build with student-data privacy in mind from the start (no third-party analytics, JWTs scoped by role, no PII leakage in API responses).

**Why I am the right person for this.** I spent two and a half years as the sole developer and SME on a React and Python platform at U.S. Bank, serving 600 users a month. If something was broken, I could usually fix it within ten minutes, because I owned the whole stack. I am currently on a large Angular and .NET contract at Optum. I build full-stack, I move fast, and I own what I ship.

The demo is already live and clicking. If the direction looks right, I would love to hear which features matter most to you first.

Michael
