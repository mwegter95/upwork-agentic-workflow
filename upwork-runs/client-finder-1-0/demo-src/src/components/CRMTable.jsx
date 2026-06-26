import { useState, useMemo, useCallback } from 'react';
import { ScoreChip, StatusBadge } from './StatusBadge.jsx';
import { ALL_INDUSTRIES, ALL_STATUSES, TWIN_CITIES, scoreColor, statusClass, dmInitials } from '../utils/auditUtils.js';
import { exportCSV } from '../utils/csvExport.js';
import DrillDownModal from './DrillDownModal.jsx';

const API = import.meta.env.DEV
  ? 'http://localhost:5050'
  : 'https://api.michaelwegter.com';

function fmtShortDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

const COLS = [
  { key: 'check', label: '', sort: false, cls: 'col-check' },
  { key: '_row', label: '#', sort: false, cls: 'col-num' },
  { key: 'company_name', label: 'Company', sort: true, cls: 'col-name' },
  { key: 'industry', label: 'Industry', sort: true, cls: 'col-ind' },
  { key: 'city', label: 'City', sort: true, cls: 'col-city' },
  { key: 'employee_count', label: 'Emp', sort: true, cls: 'col-emp' },
  { key: 'composite_score', label: 'Score', sort: true, cls: 'col-score' },
  { key: 'outdated_stack', label: 'Outdated', sort: true, cls: 'col-stack' },
  { key: 'dm_name', label: 'Decision Maker', sort: true, cls: 'col-dm' },
  { key: 'outreach_status', label: 'Status', sort: true, cls: 'col-status' },
  { key: 'created_at', label: 'Added', sort: true, cls: 'col-date' },
  { key: '_actions', label: '', sort: false, cls: 'col-act' },
];

export default function CRMTable({ leads, stats, loading, error, mode, updateLead, addSingleLead, deleteLead, deleteLeads, applyLeadPatch, generateNavPlan, onDiscovery }) {
  const [search, setSearch] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterOutdated, setFilterOutdated] = useState('');
  const [smb, setSmb] = useState(true);
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState(new Set());
  const [drillLead, setDrillLead] = useState(null);
  const [bulkStatus, setBulkStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);   // { ids: [...], label }
  const [rescrape, setRescrape] = useState(null);             // { total, done, items, running }

  const filtered = useMemo(() => {
    let arr = leads;
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(l =>
        l.company_name?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.dm_name?.toLowerCase().includes(q) ||
        l.website?.toLowerCase().includes(q)
      );
    }
    if (filterIndustry) arr = arr.filter(l => l.industry === filterIndustry);
    if (filterStatus) arr = arr.filter(l => l.outreach_status === filterStatus);
    if (filterRegion === 'Twin Cities') arr = arr.filter(l => TWIN_CITIES.has(l.city));
    if (filterRegion === 'Greater MN') arr = arr.filter(l => !TWIN_CITIES.has(l.city));
    if (filterOutdated === 'Y') arr = arr.filter(l => l.outdated_stack);
    if (filterOutdated === 'N') arr = arr.filter(l => !l.outdated_stack);
    // SMB focus keeps 5-200 employee businesses AND any with unknown size
    // (discovered leads have no employee count yet, so never hide them here).
    if (smb) arr = arr.filter(l => !l.employee_count || (l.employee_count >= 5 && l.employee_count <= 200));

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...arr].sort((a, b) => {
      if (sortKey === 'created_at' || sortKey === 'updated_at') {
        return ((new Date(a[sortKey] || 0).getTime()) - (new Date(b[sortKey] || 0).getTime())) * dir;
      }
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      if (typeof av === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [leads, search, filterIndustry, filterStatus, filterRegion, filterOutdated, smb, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(l => l.id)));
  }

  async function applyBulkStatus() {
    if (!bulkStatus || selected.size === 0) return;
    for (const id of selected) {
      await updateLead(id, { outreach_status: bulkStatus });
    }
    setSelected(new Set());
    setBulkStatus('');
  }

  function requestDeleteSelected() {
    if (selected.size === 0) return;
    setConfirmDelete({ ids: [...selected], label: `${selected.size} lead${selected.size !== 1 ? 's' : ''}` });
  }

  function requestDeleteOne(lead) {
    setConfirmDelete({ ids: [lead.id], label: lead.company_name });
  }

  async function performDelete() {
    if (!confirmDelete) return;
    const { ids } = confirmDelete;
    if (ids.length === 1) await deleteLead(ids[0]);
    else await deleteLeads(ids);
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
    setConfirmDelete(null);
  }

  async function rescrapeSelected() {
    if (selected.size === 0) return;
    const ids = [...selected];
    setRescrape({ total: ids.length, done: 0, items: [], running: true });

    // Ask the in-browser LLM which page types to prioritize (best-effort).
    let navKeywords = [];
    if (generateNavPlan) {
      try { navKeywords = await generateNavPlan({ industry: '' }) || []; } catch {}
    }

    try {
      const res = await fetch(`${API}/clientfinder/rescrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: ids, nav_keywords: navKeywords }),
        signal: AbortSignal.timeout(180000),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const chunks = buf.split('\n\n');
        buf = chunks.pop();
        for (const chunk of chunks) {
          const m = chunk.match(/^data: (.+)$/m);
          if (!m) continue;
          let evt; try { evt = JSON.parse(m[1]); } catch { continue; }
          if (evt.event === 'lead') {
            const d = evt.data;
            const shots = Array.isArray(d.screenshots) && d.screenshots.length
              ? d.screenshots
              : (d.screenshot_url ? [d.screenshot_url] : []);
            applyLeadPatch(d.id, {
              screenshot_url: d.screenshot_url,
              screenshots: shots,
              quality_notes: d.quality_notes || [],
              stack_flags: d.stack_flags,
              outdated_stack: d.outdated_stack,
              score_modernity: d.score_modernity,
              score_mobile: d.score_mobile,
              score_function: d.score_function,
              composite_score: d.composite_score,
              ...(d.email ? { email: d.email } : {}),
              ...(d.phone ? { phone: d.phone } : {}),
            });
            setRescrape(prev => prev ? { ...prev, done: prev.done + 1, items: [...prev.items, { name: d.name, ok: true, score: d.composite_score, flags: d.stack_flags?.length || 0, shots: shots.length }] } : prev);
          } else if (evt.event === 'lead_error') {
            setRescrape(prev => prev ? { ...prev, done: prev.done + 1, items: [...prev.items, { name: evt.data.name, ok: false, error: evt.data.error }] } : prev);
          } else if (evt.event === 'error') {
            setRescrape(prev => prev ? { ...prev, error: evt.data.msg } : prev);
          }
        }
      }
    } catch (e) {
      setRescrape(prev => prev ? { ...prev, error: e.message || 'Rescrape unavailable (backend offline)' } : prev);
    } finally {
      setRescrape(prev => prev ? { ...prev, running: false } : prev);
    }
  }

  function handleExport() {
    const rows = selected.size > 0 ? filtered.filter(l => selected.has(l.id)) : filtered;
    exportCSV(rows);
  }

  const sortArrow = (key) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* KPI Bar */}
      <div className="cf-kpi-bar">
        {[
          { label: 'Total Leads', value: stats.total, sub: `${filtered.length} visible`, color: 'var(--cf-primary)' },
          { label: 'New', value: stats.byStatus?.New || 0, sub: 'Not contacted', color: 'var(--cf-status-new)' },
          { label: 'Contacted', value: stats.byStatus?.Contacted || 0, sub: 'Awaiting reply', color: 'var(--cf-status-contacted)' },
          { label: 'In Progress', value: stats.byStatus?.['In Progress'] || 0, sub: 'Active conversations', color: 'var(--cf-status-inprogress)' },
          { label: 'Avg Score', value: stats.avgScore, sub: 'Composite audit', color: scoreColor(stats.avgScore) },
          { label: 'Outdated Stack', value: `${stats.outdatedCount}`, sub: `${leads.length ? Math.round(stats.outdatedCount/leads.length*100) : 0}% of leads`, color: 'var(--cf-score-low)' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="cf-kpi">
            <span className="cf-kpi-label">{label}</span>
            <span className="cf-kpi-value" style={{ color }}>{value}</span>
            <span className="cf-kpi-sub">{sub}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="cf-toolbar">
        <div className="cf-toolbar-left">
          <div className="cf-search">
            <span className="cf-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search company, city, decision maker..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button style={{ color: 'var(--cf-subtext)', fontSize: 14 }} onClick={() => setSearch('')}>×</button>}
          </div>

          <button className="cf-btn cf-btn-primary" onClick={onDiscovery}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Run Discovery
          </button>

          <button className="cf-btn cf-btn-secondary" onClick={() => setShowAddModal(true)}>
            + Add Lead
          </button>
        </div>

        <div className="cf-toolbar-right">
          {selected.size > 0 && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value)}
                style={{ fontSize: 12 }}
              >
                <option value="">Bulk Status...</option>
                {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <button className="cf-btn cf-btn-secondary" onClick={applyBulkStatus} disabled={!bulkStatus}>
                Apply ({selected.size})
              </button>
              <button className="cf-btn cf-btn-secondary" onClick={rescrapeSelected} title="Re-run screenshot + tech audit for selected leads">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                Rescrape ({selected.size})
              </button>
              <button className="cf-btn cf-btn-danger" onClick={requestDeleteSelected} title="Delete selected leads">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                Delete ({selected.size})
              </button>
            </div>
          )}
          <button className="cf-btn cf-btn-secondary" onClick={handleExport}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            CSV
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="cf-filter-bar">
        <div className="cf-filter-group">
          <label>Industry</label>
          <select value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}>
            <option value="">All</option>
            {ALL_INDUSTRIES.map(i => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div className="cf-filter-group">
          <label>Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All</option>
            {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="cf-filter-group">
          <label>Region</label>
          <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
            <option value="">All MN</option>
            <option>Twin Cities</option>
            <option>Greater MN</option>
          </select>
        </div>
        <div className="cf-filter-group">
          <label>Outdated</label>
          <select value={filterOutdated} onChange={e => setFilterOutdated(e.target.value)} style={{ minWidth: 80 }}>
            <option value="">All</option>
            <option value="Y">Yes</option>
            <option value="N">No</option>
          </select>
        </div>
        <label className="cf-toggle">
          <input type="checkbox" checked={smb} onChange={e => setSmb(e.target.checked)} />
          <span className="cf-toggle-track" />
          SMB only (5-200 / unknown)
        </label>
        {mode === 'local' && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--cf-status-inprogress)' }}>
            ⚡ Local mode
          </span>
        )}
        {error && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--cf-muted)' }}>{error}</span>}
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="cf-bulk-bar">
          <input type="checkbox" className="cf-checkbox" checked={selected.size === filtered.length} onChange={toggleAll} />
          <span>{selected.size} lead{selected.size !== 1 ? 's' : ''} selected</span>
          <button className="cf-btn cf-btn-ghost" style={{ fontSize: 12 }} onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="cf-table-wrap">
        {loading ? (
          <div className="cf-empty"><div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div><h3>Loading leads...</h3></div>
        ) : filtered.length === 0 ? (
          <div className="cf-empty">
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            <h3>No leads match your filters</h3>
            <p>Try broadening your search or running Discovery to find more leads.</p>
          </div>
        ) : (
          <table className="cf-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input type="checkbox" className="cf-checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
                </th>
                <th className="col-num">#</th>
                {COLS.slice(2, -1).map(col => (
                  <th
                    key={col.key}
                    className={`${col.cls} ${sortKey === col.key ? 'sort-active' : ''}`}
                    onClick={() => col.sort && handleSort(col.key)}
                    style={col.sort ? { cursor: 'pointer' } : {}}
                  >
                    {col.label}{col.sort ? sortArrow(col.key) : ''}
                  </th>
                ))}
                <th className="col-act">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, idx) => {
                const isSelected = selected.has(lead.id);
                return (
                  <tr
                    key={lead.id}
                    className={isSelected ? 'selected' : ''}
                    onClick={() => setDrillLead(lead)}
                    style={{ cursor: 'pointer' }}
                    title="Click row to view details"
                  >
                    <td className="col-check" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="cf-checkbox" checked={isSelected} onChange={() => toggleSelect(lead.id)} />
                    </td>
                    <td className="col-num">{idx + 1}</td>
                    <td className="col-name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {lead._isNew && <span className="cf-new-indicator" title="Newly discovered" />}
                        <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lead.company_name}>
                          {lead.company_name}
                        </span>
                      </div>
                    </td>
                    <td className="col-ind" title={lead.industry}>
                      <span className="cf-tag-pill" style={{ fontSize: 10 }}>{lead.industry?.split(' ')[0]}</span>
                    </td>
                    <td className="col-city">{lead.city}</td>
                    <td className="col-emp" style={{ fontVariantNumeric: 'tabular-nums' }}>{lead.employee_count}</td>
                    <td className="col-score">
                      <ScoreChip score={lead.composite_score} />
                    </td>
                    <td className="col-stack">
                      {lead.outdated_stack
                        ? <span className="cf-outdated-yes">⚠ Yes</span>
                        : <span className="cf-outdated-no">✓ No</span>}
                    </td>
                    <td className="col-dm">
                      {lead.dm_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            width: 22, height: 22,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--cf-primary), var(--cf-accent))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
                          }}>
                            {dmInitials(lead.dm_name)}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.dm_name}</div>
                            <div style={{ fontSize: 10, color: 'var(--cf-subtext)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.dm_title}</div>
                          </div>
                        </div>
                      ) : <span style={{ color: 'var(--cf-muted)' }}>—</span>}
                    </td>
                    <td className="col-status" onClick={e => e.stopPropagation()}>
                      <select
                        className={`cf-status-select cf-chip cf-status-chip ${statusClass(lead.outreach_status)}`}
                        value={lead.outreach_status}
                        onChange={e => updateLead(lead.id, { outreach_status: e.target.value })}
                      >
                        {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="col-date" style={{ fontSize: 11, color: 'var(--cf-subtext)', whiteSpace: 'nowrap' }} title={lead.created_at || ''}>
                      {fmtShortDate(lead.created_at)}
                    </td>
                    <td className="col-act" onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <a
                          href={`https://${lead.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="cf-btn cf-btn-ghost"
                          style={{ padding: '4px 6px', display: 'inline-flex', alignItems: 'center' }}
                          title="Visit website"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </a>
                        <button
                          className="cf-btn cf-btn-ghost cf-btn-ghost-danger"
                          style={{ padding: '4px 6px' }}
                          title="Delete lead"
                          onClick={() => requestDeleteOne(lead)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Drill-down modal */}
      {drillLead && (
        <DrillDownModal
          lead={drillLead}
          onClose={() => setDrillLead(null)}
          onUpdate={async (id, patch) => {
            await updateLead(id, patch);
            setDrillLead(prev => prev ? { ...prev, ...patch } : null);
          }}
        />
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onAdd={addSingleLead}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <ConfirmDeleteModal
          label={confirmDelete.label}
          count={confirmDelete.ids.length}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={performDelete}
        />
      )}

      {/* Rescrape progress */}
      {rescrape && (
        <RescrapeModal
          state={rescrape}
          onClose={() => { setRescrape(null); setSelected(new Set()); }}
        />
      )}
    </div>
  );
}

function ConfirmDeleteModal({ label, count, onCancel, onConfirm }) {
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    await onConfirm();
  }
  return (
    <div className="cf-modal-overlay cf-add-modal" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="cf-modal" style={{ maxWidth: 420 }}>
        <div className="cf-modal-header">
          <h2>Delete {count > 1 ? `${count} leads` : 'lead'}?</h2>
          <button className="cf-close-btn" onClick={onCancel}>&#x2715;</button>
        </div>
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 36, height: 36, flexShrink: 0, borderRadius: '50%',
              background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cf-score-low)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div style={{ fontSize: 13, color: 'var(--cf-subtext)', lineHeight: 1.5 }}>
              {count > 1
                ? <>You're about to permanently remove <strong style={{ color: 'var(--cf-text)' }}>{count} leads</strong> from the CRM.</>
                : <>You're about to permanently remove <strong style={{ color: 'var(--cf-text)' }}>{label}</strong> from the CRM.</>}
              <div style={{ marginTop: 4 }}>This action cannot be undone.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="cf-btn cf-btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
            <button className="cf-btn cf-btn-danger" onClick={confirm} disabled={busy}>
              {busy ? 'Deleting…' : (count > 1 ? `Delete ${count}` : 'Delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RescrapeModal({ state, onClose }) {
  const { total, done, items, running, error } = state;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="cf-modal-overlay cf-add-modal" onClick={e => e.target === e.currentTarget && !running && onClose()}>
      <div className="cf-modal" style={{ maxWidth: 480 }}>
        <div className="cf-modal-header">
          <div>
            <h2>Rescraping leads</h2>
            <div style={{ fontSize: 12, color: 'var(--cf-subtext)', marginTop: 2 }}>
              Playwright captures the homepage, a full-page scroll &amp; key internal pages, and records website-quality notes
            </div>
          </div>
          {!running && <button className="cf-close-btn" onClick={onClose}>&#x2715;</button>}
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--cf-subtext)', marginBottom: 5 }}>
              <span>{running ? 'Capturing…' : 'Complete'}</span>
              <span>{done} / {total}</span>
            </div>
            <div style={{ height: 6, background: 'var(--cf-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--cf-primary)', transition: 'width 0.3s' }} />
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'var(--cf-score-mid)', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--cf-radius-md)', padding: '8px 10px' }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '6px 8px', background: 'var(--cf-surface-2)', borderRadius: 'var(--cf-radius-md)' }}>
                <span style={{ color: it.ok ? 'var(--cf-score-high)' : 'var(--cf-score-low)' }}>{it.ok ? '✓' : '✗'}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
                {it.ok
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {it.shots > 1 && <span style={{ fontSize: 10, color: 'var(--cf-subtext)' }}>{it.shots} views</span>}
                      <span style={{ color: scoreColor(it.score), fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{it.score} · {it.flags} flags</span>
                    </span>
                  : <span style={{ color: 'var(--cf-muted)', fontSize: 11 }}>{it.error}</span>}
              </div>
            ))}
          </div>

          {!running && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="cf-btn cf-btn-primary" onClick={onClose}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddLeadModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    company_name: '', industry: ALL_INDUSTRIES[0], city: 'Minneapolis',
    employee_count: '', website: '', dm_name: '', dm_title: '', dm_seniority: 'C-Suite',
    email: '', phone: '', contact_form_url: '', outreach_status: 'New', notes: '',
    score_modernity: 5, score_mobile: 5, score_function: 5,
    composite_score: 5, outdated_stack: false, stack_flags: [],
  });

  function set(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.company_name) return;
    const comp = Math.round(((Number(form.score_modernity) + Number(form.score_mobile) + Number(form.score_function)) / 3) * 10) / 10;
    await onAdd({ ...form, employee_count: Number(form.employee_count) || 0, composite_score: comp });
    onClose();
  }

  return (
    <div className="cf-modal-overlay cf-add-modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cf-modal" style={{ maxWidth: 560 }}>
        <div className="cf-modal-header">
          <h2>Add Lead Manually</h2>
          <button className="cf-close-btn" onClick={onClose}>&#x2715;</button>
        </div>
        <form className="cf-add-form" onSubmit={submit}>
          <div className="cf-form-group">
            <label>Company Name *</label>
            <input required value={form.company_name} onChange={e => set('company_name', e.target.value)} />
          </div>
          <div className="cf-add-form-row">
            <div className="cf-form-group">
              <label>Industry</label>
              <select value={form.industry} onChange={e => set('industry', e.target.value)}>
                {ALL_INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div className="cf-form-group">
              <label>City</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
          </div>
          <div className="cf-add-form-row">
            <div className="cf-form-group">
              <label>Website</label>
              <input placeholder="domain.com" value={form.website} onChange={e => set('website', e.target.value)} />
            </div>
            <div className="cf-form-group">
              <label>Employees</label>
              <input type="number" min="1" value={form.employee_count} onChange={e => set('employee_count', e.target.value)} />
            </div>
          </div>
          <div className="cf-add-form-row">
            <div className="cf-form-group">
              <label>Decision Maker Name</label>
              <input placeholder="Jane D." value={form.dm_name} onChange={e => set('dm_name', e.target.value)} />
            </div>
            <div className="cf-form-group">
              <label>Title</label>
              <input placeholder="Owner" value={form.dm_title} onChange={e => set('dm_title', e.target.value)} />
            </div>
          </div>
          <div className="cf-add-form-row">
            <div className="cf-form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="cf-form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="cf-add-form-row">
            <div className="cf-form-group">
              <label>Status</label>
              <select value={form.outreach_status} onChange={e => set('outreach_status', e.target.value)}>
                {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="cf-form-group">
              <label>Outdated Stack</label>
              <select value={form.outdated_stack ? 'Yes' : 'No'} onChange={e => set('outdated_stack', e.target.value === 'Yes')}>
                <option>No</option><option>Yes</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="cf-btn cf-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="cf-btn cf-btn-primary">Add Lead</button>
          </div>
        </form>
      </div>
    </div>
  );
}
