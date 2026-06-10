// Work-sample registry for client-proposal demos.
//
// This mirrors src/data/apps.js but is a SEPARATE list so client demos stay
// distinct from Michael's personal tools. The Upwork Proposal Engine appends one
// entry here per run.
//
// Demos built by the workflow are same-origin static apps under public/demos/<slug>/,
// so `href` is a BASE_URL-relative path, not an external GitHub Pages URL.
//
// Schema (extends the apps.js schema):
//   id            unique number, sequential
//   slug          kebab-case -> /work-samples/<slug> and /demos/<slug>/
//   title         display name
//   description   one or two plain sentences
//   category      "Utility" | "Creative" | "Productivity" | "Data" | ...
//   status        "live"
//   href          import.meta.env.BASE_URL + "demos/<slug>/"
//   color         "#rrggbb" from the site palette
//   icon          single emoji
//   frameStyle    "baroque" | "walnut"
//   client        client name or null
//   postingSummary one-line summary of the Upwork posting
//   builtFor      the role/job title from the posting
//   date          ISO date the demo was built

export const workSamples = [
  // ── Template (copy, fill in, remove this comment) ────────────────────────
  // {
  //   id: 1,
  //   slug: "dog-grooming-booking",
  //   title: "Mobile Grooming Booking Widget",
  //   description:
  //     "Embeddable booking widget that prices services and blocks slots by appointment length.",
  //   category: "Utility",
  //   status: "live",
  //   href: import.meta.env.BASE_URL + "demos/dog-grooming-booking/",
  //   color: "#12b4c8",
  //   icon: "🐕",
  //   frameStyle: "walnut",
  //   client: "Mobile dog-grooming business",
  //   postingSummary: "Simple booking + availability widget for a Squarespace site.",
  //   builtFor: "Booking widget (fixed-price, 2 to 3 weeks)",
  //   date: "2026-06-10",
  // },
];
