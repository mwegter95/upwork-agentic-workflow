# Research: aba-services-website

---

## 1. ABA Domain Primer

- ABA (Applied Behavior Analysis) is an evidence-based behavioral intervention used primarily with autistic children. Sessions are delivered by a Registered Behavior Technician (RBT) supervised by a Board Certified Behavior Analyst (BCBA).
- Primary buyer audience: parents or guardians of autistic children aged 2 to 18. Secondary audiences: referring pediatricians/neurologists and payers (insurance case managers).
- Settings matter and must be named on the site: in-home, center-based, school-based, and telehealth are the four standard delivery modes. Families search by setting first.
- Trust signals that move parents past the "is this real?" gate:
  - Named BCBA credentials prominently in bios and in the hero trust strip ("BCBA-supervised sessions")
  - Insurance accepted row (Medicaid, TRICARE, major commercial plans) is often the first scroll-to on a real site
  - Age ranges served stated plainly (e.g., "ages 2 to 18") so parents self-qualify fast
  - Wait time transparency: "Current wait: approximately 3 to 6 weeks" is more trusted than silence
  - In-home vs. center distinction made explicit because parents weigh both
  - Parent Training listed as a named service: it signals the clinic sees parents as partners, not just payers
  - Testimonials handled tactfully: first-name only, no diagnosis detail, no child photos without explicit consent framing; "Amanda, parent of a 6-year-old" is the safe pattern
  - Accreditation or BACB membership mention if the clinic has it
- The emotional tone parents seek: "these people understand my child's life, not just the clinical chart." Warm, plain, parent-first language earns that faster than a credentials wall.
- Source: [LEARN Behavioral services overview](https://learnbehavioral.com/services), [Forta Health FAQ](https://www.fortahealth.com/faq), [Autism Speaks ABA overview](https://www.autismspeaks.org/applied-behavior-analysis)

---

## 2. Tone and Accessibility Notes

- Person-first language is the current professional standard: "children with autism" rather than "autistic children" (though some self-advocates prefer identity-first; clinic sites typically default to person-first to avoid alienating any parent cohort).
- Avoid deficit framing in hero copy. "We help families build skills and confidence" beats "we treat challenging behaviors."
- No jargon in primary navigation or hero. "ABA therapy" is understood; "discrete trial training" and "VB-MAPP" belong in service detail cards only.
- WCAG AA contrast is a hard requirement for healthcare sites. The light-mode palette planned for this demo (dark ink on warm off-white) comfortably passes if mustard is used for CTAs with dark text on top, not as text itself on white.
- Font size baseline: 16px body minimum. CTA buttons 16px to 18px. Form labels never below 14px.
- Touch targets 44x44px minimum for mobile (parent on a phone during a pediatrician waiting-room visit is the key scenario).
- No auto-playing media. No animations that cannot be paused. Reduced-motion preference should be respected with `@media (prefers-reduced-motion: reduce)`.

---

## 3. Competitor / Reference Cues

Five real ABA sites surveyed; no assets copied. Notes are observational for design direction only.

1. **Action Behavior Centers** (https://www.actionbehavior.com/) - Strong hero: photo of a child in session (warm, not clinical), "Get Started" primary CTA above the fold, insurance logos immediately below the fold in a trust strip. Their services grid is the clearest layout pattern to reference for the services explorer.

2. **LEARN Behavioral** (https://learnbehavioral.com/) - Services page is structured as a scannable list with named settings (home, center, school, telehealth) each with a short descriptive paragraph and a "Learn More" secondary CTA. Their intake flow is separated into a dedicated portal (intakeportal.learnbehavioral.com) with a clear "Start Enrollment" CTA on the main site, which is the right HIPAA-boundary pattern: marketing site collects name/email/phone only, real intake lives on a secure portal.

3. **Forta Health** (https://www.fortahealth.com/) - Virtual-first positioning with a hero stat ("60 to 90 days from referral to first session" vs. industry wait times of 6 to 12 months). Insurance accepted prominently above the fold. FAQ page is dense and genuinely helpful. The "parent training" and "parent-supported" language is used as a differentiator.

4. **Autism Spectrum Therapies (AST)** (https://autismtherapies.com/) - Credible, multi-region clinic site. The team page lists BCBA names and photos with credentials and caseload focus. This is the trust-depth pattern the demo's team strip should mimic.

5. **Cortica Care ABA** (https://www.corticacare.com/treatments/aba) - Integrated multi-discipline framing (ABA + speech + OT in one clinic). Good example of "what to expect" narrative in service descriptions: a paragraph that walks parents through a typical session day. Worth borrowing this narrative pattern for the services-card expanded state.

---

## 4. HIPAA Compliance Call-out

**What Michael will recommend to the buyer (this is practical guidance, not legal advice):**

A marketing-only website that collects only name, email, phone number, and a general inquiry selection is not itself subject to HIPAA's Security Rule, because that data alone does not constitute Protected Health Information (PHI). The live trip wire is the "message" or "notes" free-text field: as soon as a parent types "my son has autism and needs in-home therapy," that submission contains PHI, and the form, the email it generates, and any CRM it populates all fall into HIPAA scope. The practical recommendation for production is: (1) restrict the free-text field to a "service interest" dropdown so no clinical context can be entered on the marketing site; (2) add a visible disclaimer above the submit button ("Please do not include your child's diagnosis or medical history here. Our team will collect that information securely after your first contact."); (3) route the form submission through a HIPAA-eligible email provider or intake portal (e.g., the clinic's EHR patient portal, or a form provider that offers a Business Associate Agreement). The demo will implement this exact pattern: a dropdown for service interest, no medical-history field, and a privacy reassurance line above the submit button. The proposal narrative will call this out explicitly as a production consideration.

Sources: [Nopio HIPAA compliant website forms](https://www.nopio.com/blog/hipaa-compliant-website-forms/), [Digital Authority Partners ABA website HIPAA guide](https://www.digitalauthority.me/resources/whitepapers/hipaa-compliant-aba-websites/), [HIPAA compliant hosting contact forms](https://hipaacomplianthosting.com/are-client-contact-form-submissions-for-therapist-websites-regulated-by-hipaa/)

---

## 5. Clone Target and Demo Scaffold

**No existing demo files exist** in `../michaelwegter.com/public/demos/` (glob returned nothing). There is no prior demo to clone file-for-file.

**The correct scaffold approach** (confirmed by CLAUDE.md and confirmed by the empty demos directory):
- Start from a clean shell: `index.html` + `assets/styles.css` + `assets/app.js`.
- Output path: `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/public/demos/aba-services-website/`
- This will be served at `https://michaelwegter.com/demos/aba-services-website/` and iframed by AppFrame.

**AppFrame status:** `src/components/AppFrame.jsx` exists and is confirmed operational. It handles loading state, cross-origin token bridging, and content-height messaging. It will iframe the demo unchanged.

**WorkSamples registry:** `src/data/workSamples.js` exists with an empty array and a commented template entry. The builder must append one real entry following the schema. `src/pages/WorkSamples.jsx` also exists and reads from this file, so no new page scaffolding is needed.

**Relevant existing file paths:**
- `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/src/data/workSamples.js` (append entry here)
- `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/src/data/apps.js` (reference for schema shape)
- `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/src/components/AppFrame.jsx` (reuse unchanged)
- `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/src/pages/WorkSamples.jsx` (already wired, no changes needed)
- `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/src/index.css` (token source, lines 16 to 55)

---

## 6. Libraries

**No third-party libraries needed.** The demo is vanilla JS + CSS.

- Accordion (FAQ), services-card expand/collapse: native `<details>`/`<summary>` for zero-JS fallback, or a 10-line vanilla toggle with `aria-expanded`. Either works.
- Form validation: native HTML5 constraint validation + a small JS layer for custom error messages and the success-panel swap. No library needed.
- Icons: inline SVG sprites in `assets/icons.svg`. No icon library required. A single sprite file with `<use>` references is cleanest and keeps the file count down.
- Fonts: Google Fonts CDN import for Space Grotesk and Inter in the `<head>`. JetBrains Mono optional (mono eyebrows are rare in a clinic site). Loading all three from CDN is fine for a demo; a `<link rel="preconnect">` call is sufficient optimization.
- No React, no build step, no npm. Confirmed.

---

## 7. Design Tokens to Import Verbatim

The demo `styles.css` must declare these tokens in its own `:root` so it reads as part of Michael's system. Then immediately below, a light-mode surface override block replaces the dark surfaces with warm clinic whites.

```css
/* --- Inherited from michaelwegter.com design system --- */
:root {
  /* Parrot palette (accent use only in the demo) */
  --mustard:      #e8b820;
  --cyan-vivid:   #12b4c8;
  --hot-pink:     #f0186e;
  --parrot-red:   #e83828;
  --parrot-green: #6ed46a;
  --sky-blue:     #3a8fcc;

  /* Typography (same as portfolio site) */
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body:    'Inter', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;

  /* Layout rhythm */
  --content-width: 1200px;
  --section-pad:   80px;

  /* --- Light-mode surface override for clinic context --- */
  --bg-root:        #fbf8f3;   /* warm off-white page */
  --bg-surface:     #f4f0e8;   /* section band fill */
  --bg-card:        #ffffff;   /* card / form surface */
  --bg-card-hover:  #fdf9f4;   /* card hover lift */

  --border-subtle:  #ece6da;
  --border-default: #d8d0c4;
  --border-active:  #c8bfb0;

  --text-primary:   #1a1822;   /* deep ink */
  --text-secondary: #5a5868;   /* warm slate */
  --text-muted:     #9a96a8;

  --accent:         var(--mustard);
  --accent-pale:    rgba(232, 184, 32, 0.12);
}
```

Key usage rules for the demo builder:
- `--mustard` for primary CTA background ("Request an Intake", form submit button). Use `--text-primary` (#1a1822) as the text color on top of mustard for sufficient contrast.
- `--cyan-vivid` for link underlines, focus rings, service-card hover accent line.
- `--parrot-green` for success state only (form confirmation panel checkmark).
- Never block-fill a large section with a bright palette color. Surfaces stay warm white/off-white.
- No dark backgrounds anywhere in the demo. The dark gallery-wall surfaces are the portfolio site's personality, not a clinic's.

---

## 8. Open Questions for Proposal Writer

Frame these as "what I would ask in the kickoff call," not as gaps in Michael's proposal:

1. **Page count and site map:** Is this a single-page scrolling site or multi-page? Common for a first ABA site is 5 to 7 pages (Home, About/Our Approach, Services, Team, Insurance, Contact/Intake). The demo shows a single-page structure; production scope should be confirmed.
2. **CMS requirement:** Does the client want to edit content themselves post-launch? If yes, a headless CMS (Contentful, Sanity) or WordPress adds to scope and cost. The $500 budget implies static or near-static; worth surfacing this explicitly.
3. **Brand assets:** Does the clinic have a logo, color palette, or photography? The demo uses placeholder SVGs. Production would need either client-supplied assets or a small brand sprint added to scope.
4. **Hosting preference:** Vercel, Netlify, or their own host? Static hosting is essentially free and the right call for a brochure site. If they want WordPress, the hosting story changes.
5. **Insurance credentialing list:** Which payers does the clinic accept? This affects the insurance row content and is a common trust-builder on ABA sites.
6. **HIPAA-aware intake:** Does the clinic have an existing EHR or patient portal for real intake? The production contact form needs to connect to something HIPAA-eligible. Naming it early avoids scope creep later.
7. **"Ongoing project" clarification:** The posting is flagged ongoing. Is this phase-1 MVP with retainer for content updates, or is there additional feature work planned (booking, portal, blog)? This affects how Michael scopes the $500 engagement and sets expectations.

---

## Sources

- [Autism Speaks ABA overview](https://www.autismspeaks.org/applied-behavior-analysis)
- [Action Behavior Centers](https://www.actionbehavior.com/)
- [LEARN Behavioral services](https://learnbehavioral.com/services)
- [Forta Health FAQ](https://www.fortahealth.com/faq)
- [Autism Spectrum Therapies](https://autismtherapies.com/)
- [Cortica Care ABA](https://www.corticacare.com/treatments/aba)
- [Nopio: HIPAA compliant website forms](https://www.nopio.com/blog/hipaa-compliant-website-forms/)
- [Digital Authority Partners: HIPAA-compliant ABA websites](https://www.digitalauthority.me/resources/whitepapers/hipaa-compliant-aba-websites/)
- [HIPAA compliant hosting: contact form guidance](https://hipaacomplianthosting.com/are-client-contact-form-submissions-for-therapist-websites-regulated-by-hipaa/)
