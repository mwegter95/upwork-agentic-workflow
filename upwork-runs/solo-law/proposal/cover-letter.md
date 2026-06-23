# Cover Letter — Solo Law Premium Website

You want a law firm website that looks like it belongs in Zurich or London, not a local directory listing. I went ahead and built a working version of exactly that: **https://michaelwegter.com/demos/solo-law/**

Click through it. The public site loads with cinematic black-and-white editorial imagery, Cormorant Garamond display type, and a warm gold accent system. Switch the language selector in the nav from English to Spanish to French and every label, practice area, and article headline flips instantly. Then click "EDITOR LOGIN," use `editor@solo-law.demo` / `Demo2026!`, and you are inside the CMS: a clean dashboard with your practice areas, publications, and translation strings all editable without touching code.

The AI Assist panel inside each CMS record runs four stages in sequence: draft, reflect (the model critiques its own output), evaluate against a rubric (professional tone, jurisdiction accuracy, conciseness score), and then either finalize or loop again until it clears the bar. That is the agentic loop you described, running live in the browser via WebGPU. On devices without a capable GPU it gracefully falls back to a mock that shows you the loop stages without waiting for a full model download.

Here is how the real site would be built:

- **Frontend:** Angular 18 + TypeScript + Tailwind CSS, standalone components, ngx-translate with Signal-based reactivity for i18n. Three locales (EN/ES/FR) stored in your database, so adding a fourth is a content task, not a code deployment.
- **Backend:** Python with clean OOP, Flask blueprints, JWT-protected CMS routes, SQLite with WAL mode for safe concurrent edits. Every content type (practice areas, publications, brand assets) has its own service class with a clear contract.
- **CMS:** An in-app editor your team can use without you. Create a new article, pick the practice area, write in English, hit "AI Draft" to generate the Spanish and French versions, review them, publish. The public site reflects the change immediately.
- **AI content assist:** Browser-side WebGPU inference (Phi-3.5-mini via WebLLM), so there is no per-call API cost and no third-party data exposure. The four-step loop (generate, reflect, rubric-evaluate, finalize or retry) means outputs are self-checked before they reach your editor.
- **Design system:** Monochrome editorial photography, one restrained accent color, refined serif + sans-serif type scale, cinematic motion on scroll. Every visual decision is documented so handing it off to a future designer is clean.

On the experience side: I spent two and a half years as the sole developer on an internal platform serving 600 users a month at U.S. Bank, where becoming the subject-matter expert fast was a survival requirement. Right now I am on an Angular + .NET platform at Optum in a strict Agile shop, which keeps the Angular and TypeScript skills sharp and current. I use AI-assisted development in production daily, which is part of why the agentic content loop in the demo is real code rather than a mockup.

Happy to walk through any part of the demo on a call or send the source for the AI loop specifically. No pressure either way.

Michael
