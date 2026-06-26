import { useState } from 'react';
import { ScoreBar, ScoreChip } from './StatusBadge.jsx';
import { dmInitials, ALL_STATUSES } from '../utils/auditUtils.js';

const API = import.meta.env.DEV
  ? 'http://localhost:5050'
  : 'https://api.michaelwegter.com';

export default function DrillDownModal({ lead, onClose, onUpdate }) {
  const [notes, setNotes] = useState(lead.notes || '');
  const [status, setStatus] = useState(lead.outreach_status || 'New');
  const [saving, setSaving] = useState(false);

  // Captured screenshots (multi-view from rescrape) — fall back to the single one.
  const shots = (Array.isArray(lead.screenshots) && lead.screenshots.length
    ? lead.screenshots
    : (lead.screenshot_url ? [lead.screenshot_url] : [])).filter(Boolean);
  const [active, setActive] = useState(shots[0] || null);
  const resolveShot = (s) => (s && s.startsWith('/')) ? `${API}${s}` : s;

  function fmtDate(s) {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return s; }
  }

  async function save() {
    setSaving(true);
    await onUpdate(lead.id, { notes, outreach_status: status });
    setSaving(false);
    onClose();
  }

  const flags = Array.isArray(lead.stack_flags) ? lead.stack_flags : (typeof lead.stack_flags === 'string' ? JSON.parse(lead.stack_flags || '[]') : []);
  const qnotes = Array.isArray(lead.quality_notes)
    ? lead.quality_notes
    : (typeof lead.quality_notes === 'string' ? (() => { try { return JSON.parse(lead.quality_notes || '[]'); } catch { return []; } })() : []);
  const initials = dmInitials(lead.dm_name);

  return (
    <div className="cf-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cf-modal">
        <div className="cf-modal-header">
          <div>
            <h2>{lead.company_name}</h2>
            <div style={{ fontSize: 12, color: 'var(--cf-subtext)', marginTop: 2 }}>
              {lead.industry} &bull; {lead.city}, MN &bull; {lead.employee_count} employees
            </div>
          </div>
          <button className="cf-close-btn" onClick={onClose}>&#x2715;</button>
        </div>

        <div className="cf-modal-body">
          {/* LEFT: screenshot + flags */}
          <div className="cf-modal-left">
            {/* Screenshot(s) */}
            <div className="cf-modal-section">
              <h3>{shots.length > 1 ? `Captured Views (${shots.length})` : 'Homepage Screenshot'}</h3>
              {shots.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <img
                    className="cf-screenshot"
                    src={resolveShot(active)}
                    alt={`${lead.company_name} view`}
                    onError={e => { e.target.style.visibility = 'hidden'; }}
                  />
                  {shots.length > 1 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {shots.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setActive(s)}
                          style={{
                            width: 52, height: 34, padding: 0, borderRadius: 4, overflow: 'hidden',
                            border: `2px solid ${s === active ? 'var(--cf-primary)' : 'var(--cf-border)'}`,
                            cursor: 'pointer', background: 'var(--cf-surface-2)',
                          }}
                          title={`View ${i + 1}`}
                        >
                          <img src={resolveShot(s)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  width: '100%',
                  aspectRatio: '4/3',
                  background: 'var(--cf-surface-2)',
                  border: '1px solid var(--cf-border)',
                  borderRadius: 'var(--cf-radius-md)',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  color: 'var(--cf-muted)',
                  fontSize: 12,
                }}>
                  <div style={{ fontSize: 28 }}>🖥️</div>
                  <div style={{ textAlign: 'center', lineHeight: 1.4 }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>https://{lead.website}</div>
                    <div style={{ marginTop: 4 }}>No screenshot yet — use Rescrape to capture views</div>
                  </div>
                </div>
              )}
              <a className="cf-website-link" href={`https://${lead.website}`} target="_blank" rel="noreferrer">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                {lead.website}
              </a>
            </div>

            {/* Outdated stack flags */}
            {flags.length > 0 && (
              <div className="cf-modal-section">
                <h3>Detected Issues</h3>
                <div className="cf-stack-flags">
                  {flags.map(f => <span key={f} className="cf-stack-flag">{f}</span>)}
                </div>
              </div>
            )}

            {/* Website quality notes from the Playwright navigation/testing */}
            {qnotes.length > 0 && (
              <div className="cf-modal-section">
                <h3>Website Quality</h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5, margin: 0, padding: 0 }}>
                  {qnotes.map((n, i) => {
                    const bad = /no |missing|not |insecure|outdated|legacy|does not/i.test(n);
                    return (
                      <li key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 12, color: 'var(--cf-subtext)' }}>
                        <span style={{ color: bad ? 'var(--cf-score-low)' : 'var(--cf-score-high)', flexShrink: 0, marginTop: 1 }}>{bad ? '⚠' : '✓'}</span>
                        <span>{n}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Contact info */}
            <div className="cf-modal-section">
              <h3>Contact Info</h3>
              {lead.email && (
                <div className="cf-contact-row">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--cf-subtext)" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>
                  <span className="cf-contact-val">{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="cf-contact-row">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--cf-subtext)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>
                  <span className="cf-contact-val">{lead.phone}</span>
                </div>
              )}
              {lead.contact_form_url && (
                <div className="cf-contact-row">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--cf-subtext)" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  <a href={`https://${lead.contact_form_url}`} target="_blank" rel="noreferrer" className="cf-contact-val" style={{ fontSize: 11 }}>
                    Contact form
                  </a>
                </div>
              )}
              {!lead.email && !lead.phone && !lead.contact_form_url && (
                <div style={{ fontSize: 12, color: 'var(--cf-muted)' }}>No contact info extracted</div>
              )}
            </div>

            <div className="cf-timestamp">
              Updated: {fmtDate(lead.updated_at)}<br />
              Added: {fmtDate(lead.created_at)}
            </div>
          </div>

          {/* RIGHT: scores + DM + status */}
          <div className="cf-modal-right">
            {/* Company info */}
            <div className="cf-modal-section">
              <h3>Company</h3>
              <div className="cf-info-row"><span className="label">Industry</span><span className="value">{lead.industry}</span></div>
              <div className="cf-info-row"><span className="label">Location</span><span className="value">{lead.city}, MN</span></div>
              <div className="cf-info-row"><span className="label">Employees</span><span className="value">{lead.employee_count}</span></div>
              <div className="cf-info-row"><span className="label">Outdated Stack</span>
                <span className="value">
                  {lead.outdated_stack
                    ? <span className="cf-outdated-yes">⚠ Yes</span>
                    : <span className="cf-outdated-no">✓ No</span>}
                </span>
              </div>
            </div>

            {/* Audit scores */}
            <div className="cf-modal-section">
              <h3>Technical Audit Scores</h3>
              <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                {[
                  { label: 'Modernity', val: lead.score_modernity },
                  { label: 'Mobile', val: lead.score_mobile },
                  { label: 'Function', val: lead.score_function },
                ].map(({ label, val }) => (
                  <div key={label} className="cf-audit-score-item">
                    <div className="score-val" style={{ color: val >= 7 ? 'var(--cf-score-high)' : val >= 4 ? 'var(--cf-score-mid)' : 'var(--cf-score-low)' }}>
                      {val ?? '—'}
                    </div>
                    <div className="score-sub">{label}</div>
                  </div>
                ))}
                <div className="cf-audit-score-item" style={{ marginLeft: 'auto' }}>
                  <div className="score-val">
                    <ScoreChip score={lead.composite_score} size="lg" />
                  </div>
                  <div className="score-sub">Composite</div>
                </div>
              </div>
              <ScoreBar score={lead.score_modernity} label="UI Modernity" />
              <div style={{ height: 6 }} />
              <ScoreBar score={lead.score_mobile} label="Mobile Responsive" />
              <div style={{ height: 6 }} />
              <ScoreBar score={lead.score_function} label="Functionality" />
            </div>

            {/* Decision Maker */}
            {lead.dm_name && (
              <div className="cf-modal-section">
                <h3>Key Decision Maker</h3>
                <div className="cf-dm-card">
                  <div className="cf-dm-avatar">{initials}</div>
                  <div className="cf-dm-info">
                    <div className="cf-dm-name">{lead.dm_name}</div>
                    <div className="cf-dm-title">{lead.dm_title}</div>
                    <div className="cf-dm-meta">
                      <span className="cf-seniority-badge">{lead.dm_seniority}</span>
                      <span className="cf-source-badge">{lead.dm_source || 'Apollo'}</span>
                      {lead.dm_linkedin && (
                        <a href={lead.dm_linkedin} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--cf-primary)' }}>
                          LinkedIn ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                {lead.dm_seniority === 'C-Suite' && (
                  <div style={{ fontSize: 11, color: 'var(--cf-subtext)', marginTop: 4 }}>
                    * Last name masked per Apollo free-tier data policy
                  </div>
                )}
              </div>
            )}

            {/* Outreach */}
            <div className="cf-modal-section">
              <h3>Outreach</h3>
              <div className="cf-form-group" style={{ marginBottom: 10 }}>
                <label>Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="cf-form-group">
                <label>Notes</label>
                <textarea
                  className="cf-notes-area"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add outreach notes..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="cf-btn cf-btn-secondary" onClick={onClose}>Cancel</button>
              <button className="cf-btn cf-btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
