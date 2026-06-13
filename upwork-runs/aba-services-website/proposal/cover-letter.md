# ABA Services Website, Design and Development

Hi,

Families looking for ABA services need to feel, in about ten seconds, that your clinic is real, warm, and worth a phone call. A clear hero, plain language about services, a few trust signals, and an easy way to ask for an intake is most of the job. I built a working mock of that for you so we can look at the same thing.

I built a demo for your posting: https://michaelwegter.com/work-samples/aba-services-website. It runs as a fictional clinic called Bright Path ABA. Click the services cards to expand them, try the intake form validation, open the FAQ. Raw demo fallback: https://michaelwegter.com/demos/aba-services-website/.

A few notes on the real build. The demo covers a single-page structure: hero with a clear CTA, an explorer for In-Home, Center-Based, Parent Training, and School Consultation, a Meet the Team strip with BCBA credentials, an FAQ, and an intake form with inline validation. For production I would expand to a 5 to 7 page site (Home, About, Services, Team, Insurance, Contact), keep it fast and mobile-first, and hit WCAG AA contrast. On HIPAA, the marketing form should collect only name, email, phone, and a service interest dropdown, with a visible note asking parents not to include diagnosis details. Real intake routes through a HIPAA-eligible channel like your EHR portal or a provider with a Business Associate Agreement.

On frameworks, I work daily in React, Vite, vanilla JS, and Flask on the backend. This demo itself is plain HTML, CSS, and JS, shipped same-origin from my portfolio. On similar work, the Bright Path mock was built for this posting; more samples and live apps are at michaelwegter.com.

Three things I would ask on a kickoff call: how many pages, do you need a CMS to edit content later, and do you have brand assets or should I propose a visual direction. Happy to walk through the demo together.

Thanks,
Michael Wegter
