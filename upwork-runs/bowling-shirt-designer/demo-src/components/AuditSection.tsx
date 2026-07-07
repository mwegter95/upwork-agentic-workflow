const ROWS = [
  {
    problem: 'Dead clicks + "undefined is not an object" on color / design swaps',
    cause: 'Unguarded nested state reads; the customizer touches store fields before async hydration finishes.',
    fix: 'Zustand selectors with safe defaults, no unguarded optional chaining. Every read resolves to a value or a fallback, never undefined.',
  },
  {
    problem: 'Homepage bounce: instant exits right after load',
    cause: 'Heavy synchronous JS (the 3D / canvas lib) sits in the critical path and blocks first paint.',
    fix: 'next/dynamic with ssr:false code-splits Three.js out of the initial bundle. The homepage is interactive and painted before the canvas ever mounts.',
  },
  {
    problem: 'Unresponsive color swaps / laggy UI',
    cause: 'Multiple setState calls per interaction trigger cascading re-renders and layout thrash.',
    fix: 'One atomic Zustand action per interaction; the 3D material updates a single prop per frame instead of re-rendering the tree.',
  },
  {
    problem: 'Share / save silently fails when an API is down',
    cause: 'Fetch rejects, the handler throws, the click looks "dead".',
    fix: 'Every network call is wrapped: on failure the design is encoded into the share URL client-side, so the feature degrades instead of dying.',
  },
];

const ROADMAP = [
  'Audit every selector call for undefined; wrap with ?? fallback or an early return.',
  'Move Three.js / canvas to a dynamic import with ssr:false. Measure LCP before and after.',
  'Replace setState chains with a single store action that patches multiple fields atomically.',
  'Wrap the Canvas in an ErrorBoundary and log failures to Clarity custom events.',
  'Re-run the Clarity Dead-Click heatmap against the patched build and confirm the hot zones clear.',
];

export default function AuditSection() {
  return (
    <section id="audit" className="max-w-6xl mx-auto px-5 py-20">
      <div className="halftone h-6 w-full mb-10 rounded" />
      <p className="font-display text-gold text-xl">The engineering behind it</p>
      <h2 className="font-display text-4xl md:text-5xl mb-3">
        This customizer is the fix, not the bug
      </h2>
      <p className="text-cream/70 max-w-3xl mb-10">
        The posting described a customizer bleeding conversions to dead clicks, console errors,
        and a bouncing homepage. This demo is built the way that store should have been. Below is
        the exact before / after mapping and the remediation roadmap your current team can execute.
      </p>

      <div className="overflow-x-auto card">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-gold border-b border-cream/15">
              <th className="p-4 font-ui font-semibold">Clarity finding</th>
              <th className="p-4 font-ui font-semibold">Root cause</th>
              <th className="p-4 font-ui font-semibold">This build&apos;s fix</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={i} className="border-b border-cream/10 align-top">
                <td className="p-4 text-coral font-medium">{r.problem}</td>
                <td className="p-4 text-cream/70">{r.cause}</td>
                <td className="p-4 text-cream/90">{r.fix}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display text-3xl text-gold mb-4">Remediation roadmap</h3>
          <ol className="flex flex-col gap-3">
            {ROADMAP.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-none w-6 h-6 rounded-full bg-coral text-white text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <span className="text-cream/85 text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="card p-6 flex flex-col gap-4">
          <h3 className="font-display text-3xl text-gold">Stack</h3>
          <ul className="text-cream/85 text-sm flex flex-col gap-2">
            <li>▸ <b>Next.js 15</b> static export, code-split 3D bundle</li>
            <li>▸ <b>React Three Fiber + drei</b> for the live 3D shirt</li>
            <li>▸ <b>Zustand</b> single-source state, no cascading re-renders</li>
            <li>▸ <b>PHP microservice</b> for save / share, proxied through a <b>Flask (Python)</b> API</li>
            <li>▸ Graceful degradation: every network path has a client-side fallback</li>
          </ul>
          <p className="text-cream/50 text-xs">
            Built by Michael Wegter as a working proof for the Upwork audit brief.
          </p>
        </div>
      </div>
    </section>
  );
}
