import { Link } from 'react-router-dom'
import { workSamples } from '../data/workSamples'

/**
 * WorkSamples - gallery of client-proposal demos.
 *
 * Mirrors the Apps page but reads from the separate workSamples registry. Each
 * card links to /work-samples/:slug, which AppFrame renders as a full-viewport
 * iframe of the same-origin demo under /demos/<slug>/.
 *
 * Self-contained styling via the site design tokens so it stays consistent
 * without depending on MacDesktop internals.
 */
export default function WorkSamples() {
  return (
    <section className="mac-section mac-section-full" style={{ paddingTop: '72px', paddingBottom: '0' }}>
      <div className="container" style={{ paddingTop: '0', paddingBottom: '40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <span className="label" style={{ display: 'block', marginBottom: '12px' }}>
            Client Work
          </span>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(38px, 6vw, 68px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 0.95,
            color: 'var(--text-primary)',
            marginBottom: '16px',
          }}>Work Samples</h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '520px' }}>
            Real, working demos built to answer real project briefs. Click any one
            to open and use it yourself.
          </p>
        </div>

        {workSamples.length === 0 ? (
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            color: 'var(--text-muted)',
            border: '1px dashed var(--border-default)',
            padding: '32px',
            textAlign: 'center',
          }}>
            First sample coming soon.
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {workSamples.map((s) => (
              <Link
                key={s.id}
                to={`/work-samples/${s.slug}`}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderTop: `3px solid ${s.color}`,
                  padding: '22px',
                  transition: 'background 0.2s, transform 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '26px', lineHeight: 1 }}>{s.icon}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: s.color,
                  }}>{s.category}</span>
                </div>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                }}>{s.title}</h2>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '16px',
                }}>{s.description}</p>
                {s.client && (
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '12px',
                  }}>
                    {s.client}{s.date ? ` · ${s.date}` : ''}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
