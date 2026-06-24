import { useState, useRef, useCallback } from 'react';
import { ALL_INDUSTRIES, scoreColor } from '../utils/auditUtils.js';

const API = import.meta.env.DEV
  ? 'http://localhost:5050'
  : 'https://api.michaelwegter.com';

const MAX_ROUNDS = 2;
const REFINEMENT_THRESHOLD = 5.5;

function buildRefinement(avgScore, industry, round) {
  if (avgScore > REFINEMENT_THRESHOLD) {
    const olderIndustries = ['Manufacturing & Logistics', 'Home & Commercial Services', 'Professional Services'];
    const smallerCities = ['St. Cloud', 'Mankato', 'Moorhead', 'Brainerd', 'Winona', 'Duluth'];
    return {
      industry: olderIndustries[round % olderIndustries.length],
      city: smallerCities[Math.floor(Math.random() * smallerCities.length)] + ' MN',
      reason: `avg ${avgScore.toFixed(1)} too high — targeting older-stack industries in smaller cities`,
    };
  }
  return null;
}

export default function DiscoveryPanel({ onClose, onLeadsAdded, runAudit, gpuReady, setAuditLog }) {
  const [industry, setIndustry] = useState('');
  const [region, setRegion] = useState('Both');
  const [keywords, setKeywords] = useState('');

  const [phase, setPhase] = useState('config');
  const [log, setLog] = useState([]);
  const [sites, setSites] = useState([]);
  const [newLeads, setNewLeads] = useState([]);

  const abortRef = useRef(false);

  function addLog(type, msg) {
    setLog(prev => [...prev, { type, msg }]);
  }

  const runPipeline = useCallback(async () => {
    abortRef.current = false;
    setPhase('running');
    setLog([]);
    setSites([]);
    setNewLeads([]);

    const allLeads = [];
    let currentIndustry = industry;
    let currentRefinements = {};

    for (let round = 0; round < MAX_ROUNDS; round++) {
      if (abortRef.current) break;

      // ── Stage 1: Serper search ───────────────────────────────────────────
      addLog('stage', `Round ${round + 1} — Searching (${currentIndustry || 'all industries'}, ${region})`);
      let businesses = [];
      try {
        const res = await fetch(`${API}/clientfinder/discover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ industry: currentIndustry, region, keywords, refinements: currentRefinements }),
          signal: AbortSignal.timeout(15000),
        });
        const d = await res.json();
        if (!d.ok) {
          addLog('warn', d.error?.includes('SERPER_API_KEY')
            ? 'SERPER_API_KEY not configured — using demo businesses'
            : `Search error: ${d.error}`);
          businesses = _mockBusinesses(currentIndustry || 'Home & Commercial Services', region, round);
        } else {
          businesses = d.businesses;
          addLog('ok', `Found ${businesses.length} businesses (query: "${d.query}")`);
        }
      } catch (e) {
        addLog('warn', `Search unavailable — using demo businesses`);
        businesses = _mockBusinesses(currentIndustry || 'Home & Commercial Services', region, round);
      }

      if (abortRef.current || !businesses.length) break;

      // ── Stage 2: Playwright scrape (SSE) ────────────────────────────────
      addLog('stage', `Scraping ${businesses.length} sites with Playwright…`);
      const roundSites = [];

      try {
        const res = await fetch(`${API}/clientfinder/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businesses }),
          signal: AbortSignal.timeout(120000),
        });
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        while (true) {
          if (abortRef.current) break;
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const chunks = buf.split('\n\n');
          buf = chunks.pop();
          for (const chunk of chunks) {
            const m = chunk.match(/^data: (.+)$/m);
            if (!m) continue;
            try {
              const evt = JSON.parse(m[1]);
              if (evt.event === 'site') {
                roundSites.push(evt.data);
                setSites(prev => [...prev, { ...evt.data, auditStatus: 'queued' }]);
                addLog('site', `Scraped: ${evt.data.name} — ${evt.data.stack_flags?.length || 0} flags`);
              } else if (evt.event === 'site_error') {
                addLog('warn', `Skip ${evt.data.name}: ${evt.data.error}`);
              }
            } catch {}
          }
        }
        addLog('ok', `Scrape done — ${roundSites.length} sites captured`);
      } catch (e) {
        addLog('warn', `Scraper offline — using placeholder data`);
        for (const biz of businesses) {
          const flags = ['Legacy WordPress','Non-responsive layout'].slice(0, 1 + Math.floor(Math.random() * 2));
          const site = { idx: roundSites.length, name: biz.name, website: biz.website, city: biz.city, screenshot_url: null, emails: [], phones: [], stack_flags: flags };
          roundSites.push(site);
          setSites(prev => [...prev, { ...site, auditStatus: 'queued' }]);
        }
      }

      if (abortRef.current) break;

      // ── Stage 3: WebGPU audit per screenshot ────────────────────────────
      addLog('stage', `WebGPU audit — SmolVLM analyzing ${roundSites.length} screenshots…`);
      const auditedSites = [];

      for (const site of roundSites) {
        if (abortRef.current) break;
        setSites(prev => prev.map(s => s.name === site.name ? { ...s, auditStatus: 'running' } : s));

        let ar = null;
        if (runAudit && gpuReady && site.screenshot_url) {
          try {
            addLog('audit', `Auditing ${site.name}…`);
            const imgUrl = site.screenshot_url.startsWith('/') ? `${API}${site.screenshot_url}` : site.screenshot_url;
            ar = await runAudit(imgUrl);
          } catch (e) {
            addLog('warn', `Audit failed for ${site.name}`);
          }
        }

        if (!ar) {
          const penalty = (site.stack_flags?.length || 0) * 1.2;
          const base = 5 - penalty;
          ar = {
            modernity: Math.max(1, Math.min(10, Math.round(base + (Math.random() * 2 - 1)))),
            mobile:    Math.max(1, Math.min(10, Math.round(base + (Math.random() * 2 - 1)))),
            function:  Math.max(1, Math.min(10, Math.round(base + Math.random()))),
            notes: site.stack_flags?.length ? `Detected: ${site.stack_flags.slice(0,2).join(', ')}` : 'No major issues detected.',
            outdated_signs: site.stack_flags || [],
            backend: 'heuristic',
          };
        }

        const composite = Math.round(((ar.modernity + ar.mobile + ar.function) / 3) * 10) / 10;
        auditedSites.push({ ...site, auditResult: ar, composite });
        setSites(prev => prev.map(s => s.name === site.name ? { ...s, auditStatus: 'done', auditResult: ar, composite } : s));

        if (setAuditLog) {
          setAuditLog(prev => [{
            id: Date.now(),
            name: site.name,
            website: site.website,
            screenshot_url: site.screenshot_url,
            ...ar,
            composite,
            ts: new Date().toISOString(),
          }, ...prev]);
        }
        addLog('audit', `${site.name}: ${composite}/10 (${ar.backend})`);
      }

      // ── Refinement decision ─────────────────────────────────────────────
      const avgComposite = auditedSites.length
        ? auditedSites.reduce((s, x) => s + (x.composite || 5), 0) / auditedSites.length
        : 5;
      addLog('info', `Batch avg: ${avgComposite.toFixed(1)}/10`);

      if (round < MAX_ROUNDS - 1) {
        const ref = buildRefinement(avgComposite, currentIndustry, round);
        if (ref) {
          addLog('refine', `Refining next round: ${ref.reason}`);
          currentIndustry = ref.industry;
          currentRefinements = { industry: ref.industry, city: ref.city };
        } else {
          addLog('ok', `Good batch — skipping further rounds`);
          await _enrichAndSave(auditedSites, allLeads, addLog);
          break;
        }
      }

      await _enrichAndSave(auditedSites, allLeads, addLog);
    }

    if (!abortRef.current && allLeads.length > 0) {
      onLeadsAdded(allLeads);
      setNewLeads(allLeads);
    }
    if (!abortRef.current) setPhase('done');
  }, [industry, region, keywords, runAudit, gpuReady, setAuditLog, onLeadsAdded]);

  async function _enrichAndSave(auditedSites, allLeads, addLog) {
    if (!auditedSites.length) return;
    addLog('stage', `Enriching ${auditedSites.length} leads via Apollo…`);
    let enrichMap = {};
    try {
      const res = await fetch(`${API}/clientfinder/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: auditedSites.map(s => ({ name: s.name, industry: s.industry || '', city: s.city })) }),
        signal: AbortSignal.timeout(8000),
      });
      const d = await res.json();
      if (d.ok) {
        for (const r of d.results) enrichMap[r.name] = r;
        addLog('ok', `Enriched ${d.results.length} leads with DM contact info`);
      }
    } catch {}

    for (const site of auditedSites) {
      const dm = enrichMap[site.name] || {};
      const ar = site.auditResult || {};
      allLeads.push({
        id: Date.now() + Math.floor(Math.random() * 9999),
        company_name: site.name,
        industry: site.industry || '',
        city: site.city, state: 'MN',
        employee_count: null,
        website: site.website,
        screenshot_url: site.screenshot_url || null,
        score_modernity: ar.modernity || 5,
        score_mobile: ar.mobile || 5,
        score_function: ar.function || 5,
        composite_score: site.composite || 5,
        outdated_stack: (site.composite || 5) < 5 || (site.stack_flags?.length || 0) > 0,
        stack_flags: [...(site.stack_flags || []), ...(ar.outdated_signs || [])].filter((v,i,a) => a.indexOf(v) === i),
        dm_name: dm.dm_name || '',
        dm_title: dm.dm_title || '',
        dm_seniority: dm.dm_seniority || '',
        dm_source: 'Apollo', dm_linkedin: dm.dm_linkedin || '',
        email: dm.email || (site.emails?.[0] || null),
        phone: dm.phone || (site.phones?.[0] || null),
        contact_form_url: dm.contact_form_url || null,
        outreach_status: 'New',
        notes: ar.notes ? `AI audit: ${ar.notes}` : '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isNew: true,
      });
    }
  }

  const ICON = { stage:'▶', ok:'✓', info:'·', warn:'⚠', error:'✗', site:'📄', audit:'🔬', refine:'🔄' };
  const COLOR = {
    stage:'var(--cf-primary)', ok:'var(--cf-score-high)', info:'var(--cf-subtext)',
    warn:'var(--cf-score-mid)', error:'var(--cf-score-low)',
    site:'var(--cf-text)', audit:'#a78bfa', refine:'#38bdf8',
  };

  return (
    <>
      <div className="cf-drawer-overlay" onClick={onClose} />
      <div className="cf-drawer" style={{ width: 560 }}>
        <div className="cf-drawer-header">
          <div>
            <h2>Run Discovery</h2>
            <div style={{ fontSize: 12, color: 'var(--cf-subtext)', marginTop: 2 }}>
              Serper → Playwright → WebGPU audit → Apollo enrich
            </div>
          </div>
          <button className="cf-close-btn" onClick={onClose}>&#x2715;</button>
        </div>

        <div className="cf-drawer-body">
          {phase === 'config' && (
            <>
              <div className="cf-form-row">
                <div className="cf-form-group">
                  <label>Industry</label>
                  <select value={industry} onChange={e => setIndustry(e.target.value)}>
                    <option value="">All Industries</option>
                    {ALL_INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div className="cf-form-group">
                  <label>Region</label>
                  <select value={region} onChange={e => setRegion(e.target.value)}>
                    <option>Both</option><option>Twin Cities</option><option>Greater MN</option>
                  </select>
                </div>
              </div>
              <div className="cf-form-group">
                <label>Keywords (optional)</label>
                <input type="text" placeholder='e.g. "HVAC" or "no website"' value={keywords} onChange={e => setKeywords(e.target.value)} />
              </div>
              <div style={{
                padding: '10px 12px', borderRadius: 'var(--cf-radius-md)', marginTop: 4,
                background: gpuReady ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${gpuReady ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                fontSize: 12, color: 'var(--cf-subtext)',
              }}>
                <strong style={{ color: gpuReady ? 'var(--cf-score-high)' : 'var(--cf-score-mid)' }}>
                  {gpuReady ? '● WebGPU ready' : '● WebGPU not initialized'}
                </strong>
                {' — '}
                {gpuReady
                  ? 'SmolVLM will audit each screenshot live and guide search refinement.'
                  : 'Open the AI Audit tab to initialize the model first. Heuristic scoring will be used otherwise.'}
              </div>
            </>
          )}

          {(phase === 'running' || phase === 'done') && (
            <>
              {sites.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cf-subtext)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Sites ({sites.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {sites.map((site, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '7px 10px', background: 'var(--cf-surface-2)', border: '1px solid var(--cf-border)', borderRadius: 'var(--cf-radius-md)' }}>
                        <div style={{ width: 56, height: 34, flexShrink: 0, background: 'var(--cf-surface)', borderRadius: 3, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                          {site.screenshot_url
                            ? <img src={`${API}${site.screenshot_url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; }} />
                            : '🌐'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--cf-subtext)' }}>{site.website} · {site.city}</div>
                          {site.stack_flags?.length > 0 && (
                            <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
                              {site.stack_flags.slice(0,2).map((f,fi) => (
                                <span key={fi} style={{ fontSize: 9, padding: '1px 4px', borderRadius: 2, background: 'rgba(239,68,68,0.12)', color: '#FCA5A5' }}>{f}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'center', width: 36, flexShrink: 0 }}>
                          {site.auditStatus === 'running' && <div style={{ fontSize: 9, color: 'var(--cf-primary)' }}>…</div>}
                          {site.auditStatus === 'queued' && <div style={{ fontSize: 9, color: 'var(--cf-muted)' }}>—</div>}
                          {site.auditStatus === 'done' && site.composite != null && (
                            <div style={{ fontSize: 16, fontWeight: 700, color: scoreColor(site.composite), fontFamily: 'JetBrains Mono' }}>
                              {site.composite}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, lineHeight: 1.7, background: 'var(--cf-surface)', border: '1px solid var(--cf-border)', borderRadius: 'var(--cf-radius-md)', padding: '8px 12px', maxHeight: 180, overflowY: 'auto' }}>
                {log.map((e, i) => (
                  <div key={i} style={{ color: COLOR[e.type] || 'var(--cf-subtext)' }}>
                    <span style={{ opacity: 0.5, marginRight: 5 }}>{ICON[e.type] || '·'}</span>{e.msg}
                  </div>
                ))}
                {phase === 'running' && <div style={{ color: 'var(--cf-primary)' }}>⏳ Running…</div>}
              </div>
            </>
          )}

          {phase === 'done' && newLeads.length > 0 && (
            <div style={{ marginTop: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--cf-radius-md)', padding: '12px 14px' }}>
              <div style={{ fontWeight: 600, color: 'var(--cf-score-high)', marginBottom: 4 }}>✓ Discovery Complete</div>
              <div style={{ fontSize: 13, color: 'var(--cf-subtext)' }}>
                {newLeads.length} new leads added with live audit scores and contact info.
              </div>
              <button className="cf-btn cf-btn-secondary" style={{ marginTop: 10 }}
                onClick={() => { setPhase('config'); setLog([]); setSites([]); setNewLeads([]); }}>
                Run Again
              </button>
            </div>
          )}
        </div>

        <div className="cf-drawer-footer">
          {phase === 'config' && (
            <button className="cf-btn cf-btn-primary" style={{ width: '100%' }} onClick={runPipeline}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Run Discovery Pipeline
            </button>
          )}
          {phase === 'running' && (
            <button className="cf-btn cf-btn-secondary" style={{ width: '100%' }} onClick={() => { abortRef.current = true; setPhase('config'); }}>Stop</button>
          )}
          {phase === 'done' && (
            <button className="cf-btn cf-btn-primary" style={{ width: '100%' }} onClick={onClose}>View New Leads in CRM</button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Demo-mode mock businesses ─────────────────────────────────────────────────
const _MOCK = {
  'Entertainment':              [{ name:'Memory Lanes Bowling', website:'memorylanesbowling.com' },{ name:'Northside Family Fun Center', website:'northsidefamilyfun.com' },{ name:'Lakewood Axe Throwing', website:'lakewoodaxe.com' }],
  'Professional Services':      [{ name:'Riverside Law Offices', website:'riversidelawmn.com' },{ name:'Summit CPA Partners', website:'summitcpamn.com' },{ name:'Northland Architecture Group', website:'northlandarch.com' }],
  'Home & Commercial Services': [{ name:'Apex Heating & Cooling', website:'apexhvacmn.com' },{ name:'Great Plains Landscaping', website:'greatplainslawn.com' },{ name:'Metro Plumbing Services', website:'metroplumbingmn.com' }],
  'Healthcare & Wellness':      [{ name:'Cedar Family Dentistry', website:'cedarfamilydental.com' },{ name:'Lakeview Physical Therapy', website:'lakeviewpt.com' },{ name:'Pinecrest Med Spa', website:'pinecrestmedspa.com' }],
  'Retail & Hospitality':       [{ name:'Ironwood Craft Brewing', website:'ironwoodbrewing.com' },{ name:'Prairie Table Restaurant', website:'prairietable.com' },{ name:'Bluebird Boutique', website:'bluebirdstyle.com' }],
  'Manufacturing & Logistics':  [{ name:'North Central Machine Works', website:'ncmachineworks.com' },{ name:'Great River Freight', website:'greatriverfreight.com' },{ name:'Superior Metal Fab', website:'superiormetalfab.com' }],
};
const _TC  = ['Minneapolis','St. Paul','Bloomington','Edina','Eden Prairie','Plymouth'];
const _GMN = ['Duluth','Rochester','St. Cloud','Mankato','Moorhead','Brainerd'];

function _mockBusinesses(industry, region, round) {
  const pool = _MOCK[industry] || _MOCK['Home & Commercial Services'];
  const cities = region === 'Greater MN' ? _GMN : region === 'Twin Cities' ? _TC : [..._TC, ..._GMN];
  return pool.map((b, i) => ({ ...b, city: cities[(i + round) % cities.length], address: '' }));
}
