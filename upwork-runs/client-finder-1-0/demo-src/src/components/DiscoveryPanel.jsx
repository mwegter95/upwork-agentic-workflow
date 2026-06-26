import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ALL_INDUSTRIES, scoreColor } from '../utils/auditUtils.js';

const API = import.meta.env.DEV
  ? 'http://localhost:5050'
  : 'https://api.michaelwegter.com';

const MAX_ROUNDS = 1; // retained for reference; pipeline now uses a reflection loop

// ── Run history (persisted to localStorage, last 10) ──────────────────────
const HISTORY_KEY = 'cf_discovery_runs';
function loadRuns() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}
function saveRuns(runs) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(runs.slice(0, 10))); }
  catch {}
}
function fmtRunTime(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch { return iso; }
}

// One-click search links for a query, opened in the user's real logged-in Chrome.
function googleUrl(q) { return `https://www.google.com/search?q=${encodeURIComponent(q)}`; }
function mapsUrl(q) { return `https://www.google.com/maps/search/${encodeURIComponent(q)}`; }

// Build the harvest bookmarklet: it scrapes business domains off the current
// Google Search / Google Maps results page and sendBeacons them to the backend,
// tagged with this user's stable token. No install, no CORS issues (text/plain).
function buildBookmarklet(api, token) {
  const fn = `(function(){
var API=${JSON.stringify(api)},TOKEN=${JSON.stringify(token)};
var SKIP=/(^|\\.)(google|gstatic|googleusercontent|youtube|youtu|bing|duckduckgo|yelp|yellowpages|facebook|fbcdn|instagram|twitter|linkedin|tripadvisor|bbb|mapquest|foursquare|angi|thumbtack|wikipedia|wikimedia|amazon|ebay|etsy|pinterest|reddit|tiktok|apple|microsoft|msn|yahoo|indeed|glassdoor|ziprecruiter|nextdoor|houzz|homeadvisor|opentable|doordash|ubereats|grubhub|booking|expedia)\\./i;
function host(h){try{return new URL(h,location.href).hostname.replace(/^www\\./,'');}catch(e){return '';}}
function add(m,h,n){var d=host(h);if(!d||SKIP.test(d)||d.indexOf('.')<0)return;if(!m[d])m[d]={name:(n||'').replace(/\\s+/g,' ').trim().slice(0,80),website:d};}
var m={},src='',q='';
if(/\\/maps/.test(location.pathname)){src='google_maps';
 document.querySelectorAll('a[href]').forEach(function(a){add(m,a.href,a.getAttribute('aria-label')||'');});
}else{src='google';q=(new URLSearchParams(location.search)).get('q')||'';
 document.querySelectorAll('a h3').forEach(function(h){var a=h.closest('a');if(a)add(m,a.href,h.textContent);});
 document.querySelectorAll('#search a[href],#rso a[href]').forEach(function(a){var hf=a.getAttribute('href')||'';if(hf.indexOf('/url?')===0){try{var qq=new URLSearchParams(hf.slice(5)).get('q');if(qq)add(m,qq,a.textContent);}catch(e){}}});
}
var items=Object.keys(m).map(function(d){return m[d];});
var body=JSON.stringify({token:TOKEN,source:src,query:q,items:items});
try{navigator.sendBeacon(API+'/clientfinder/ingest',new Blob([body],{type:'text/plain'}));}
catch(e){fetch(API+'/clientfinder/ingest',{method:'POST',headers:{'Content-Type':'text/plain'},body:body,keepalive:true,mode:'no-cors'});}
var t=document.createElement('div');t.textContent='Client Finder: sent '+items.length+' businesses';
t.style.cssText='position:fixed;z-index:2147483647;left:50%;top:18px;transform:translateX(-50%);background:#0f172a;color:#fff;padding:10px 16px;border-radius:8px;font:600 13px system-ui;box-shadow:0 6px 24px rgba(0,0,0,.45)';
document.body.appendChild(t);setTimeout(function(){t.remove();},2600);
})();`;
  return 'javascript:' + encodeURIComponent(fn);
}

function scoresFromFlags(flags) {
  const n = flags?.length || 0;
  const penalty = Math.min(n * 1.4, 7);
  const base = Math.max(1, 8 - penalty);
  const mobilePenalty = (flags || []).some(f => /responsive|viewport/i.test(f)) ? 1 : 0;
  const modernity = Math.max(1, Math.min(10, Math.round(base)));
  const mobile = Math.max(1, Math.min(10, Math.round(base - mobilePenalty)));
  const fn = Math.max(1, Math.min(10, Math.round(base + 0.5)));
  const composite = Math.round(((modernity + mobile + fn) / 3) * 10) / 10;
  return { modernity, mobile, function: fn, composite };
}

export default function DiscoveryPanel({ onClose, onLeadsAdded, reflectOnResults, generateNavPlan, generateQueries, gpuReady }) {
  const [industry, setIndustry] = useState('');
  const [region, setRegion] = useState('Both');
  const [keywords, setKeywords] = useState('');
  const [mode, setMode] = useState('assisted'); // 'assisted' (your Chrome) | 'automated' (server)

  const [phase, setPhase] = useState('config');
  const [log, setLog] = useState([]);
  const [sites, setSites] = useState([]);
  const [newLeads, setNewLeads] = useState([]);
  const [runs, setRuns] = useState(loadRuns);
  const [viewRun, setViewRun] = useState(null);

  // Assisted-mode state: clean query links + the live harvested-businesses buffer.
  const [harvestQueries, setHarvestQueries] = useState([]);
  const [harvested, setHarvested] = useState([]);
  const [planLoading, setPlanLoading] = useState(false);
  const bookmarkletRef = useRef(null);

  // Stable per-user harvest token, so the bookmarklet is dragged to the bar once.
  const harvestToken = useMemo(() => {
    try {
      let t = localStorage.getItem('cf_harvest_token');
      if (!t) { t = 'h' + Math.random().toString(36).slice(2, 12); localStorage.setItem('cf_harvest_token', t); }
      return t;
    } catch { return 'h' + Math.random().toString(36).slice(2, 12); }
  }, []);
  const bookmarklet = useMemo(() => buildBookmarklet(API, harvestToken), [harvestToken]);
  // React strips javascript: hrefs, so assign it to the anchor imperatively.
  useEffect(() => {
    if (bookmarkletRef.current) bookmarkletRef.current.setAttribute('href', bookmarklet);
  }, [bookmarklet, phase]);

  // Poll the harvest buffer while the assisted harvest screen is open.
  useEffect(() => {
    if (phase !== 'harvest') return;
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch(`${API}/clientfinder/harvest/${harvestToken}`);
        const d = await r.json();
        if (alive && d.ok) setHarvested(d.businesses || []);
      } catch {}
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => { alive = false; clearInterval(id); };
  }, [phase, harvestToken]);

  const abortRef = useRef(false);
  // Mirror log/sites synchronously so a finished run can be snapshotted to history.
  const logRef = useRef([]);
  const sitesRef = useRef([]);

  const logEndRef = useRef(null);
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [log]);

  function addLog(type, msg) {
    const entry = { type, msg };
    logRef.current = [...logRef.current, entry];
    setLog(prev => [...prev, entry]);
  }

  function pushSite(siteObj) {
    sitesRef.current = [...sitesRef.current, siteObj];
    setSites(prev => [...prev, siteObj]);
  }

  function persistRun(leadCount) {
    const run = {
      id: Date.now(),
      ts: new Date().toISOString(),
      params: { industry: industry || 'All Industries', region, keywords },
      leadCount,
      log: logRef.current,
      sites: sitesRef.current,
    };
    const next = [run, ...loadRuns().filter(r => r.id !== run.id)].slice(0, 10);
    saveRuns(next);
    setRuns(next);
  }

  // Verify + screenshot + score + enrich + save a set of candidate sites with the
  // backend Playwright robot. Shared by automated discovery and assisted harvest.
  const runAudit = useCallback(async (candidates, { reset = true } = {}) => {
    if (reset) {
      abortRef.current = false;
      setViewRun(null);
      setPhase('running');
      setLog([]); setSites([]); setNewLeads([]);
      logRef.current = []; sitesRef.current = [];
    }
    const allLeads = [];
    try {
      if (!candidates.length) {
        addLog('warn', 'No sites to audit.');
        persistRun(0); setPhase('done'); return;
      }
      // Ask the LLM which page types to capture so each lead gets a multi-view gallery.
      let navKeywords = [];
      if (generateNavPlan) {
        try {
          navKeywords = await generateNavPlan({ industry: industry || '' }) || [];
          if (navKeywords.length) addLog('audit', `AI nav plan: capture ${navKeywords.join(', ')}`);
        } catch {}
      }
      addLog('stage', `Verifying & screenshotting ${candidates.length} sites with Playwright (multi-page)…`);
      const byDomain = new Map(candidates.map(c => [(c.website || '').toLowerCase(), c]));
      const verified = [];
      const ac = new AbortController();
      let idleTimer = setTimeout(() => ac.abort(), 90000);
      const bump = () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => ac.abort(), 90000); };
      try {
        const res = await fetch(`${API}/clientfinder/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businesses: candidates, extra_views: true, nav_keywords: navKeywords }),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) throw new Error(`scrape HTTP ${res.status}`);
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        while (true) {
          if (abortRef.current) { ac.abort(); break; }
          const { done, value } = await reader.read();
          if (done) break;
          bump();
          buf += dec.decode(value, { stream: true });
          const chunks = buf.split('\n\n');
          buf = chunks.pop();
          for (const chunk of chunks) {
            const m = chunk.match(/^data: (.+)$/m);
            if (!m) continue;
            let evt; try { evt = JSON.parse(m[1]); } catch { continue; }
            if (evt.event === 'site') {
              const d = evt.data;
              const meta = byDomain.get((d.website || '').toLowerCase()) || {};
              const site = { ...d, industry: meta.industry || industry || '' };
              verified.push(site);
              const sc = scoresFromFlags(site.stack_flags);
              pushSite({ ...site, auditStatus: 'done', composite: sc.composite });
              addLog('site', `✓ ${site.name || site.website} — score ${sc.composite}/10, ${site.stack_flags?.length || 0} flags, ${site.screenshots?.length || 1} view(s)`);
            } else if (evt.event === 'site_error') {
              addLog('info', `  ↳ skip ${evt.data.website || evt.data.name} (${(evt.data.error || 'unreachable').split(':')[0]})`);
            } else if (evt.event === 'error') {
              addLog('warn', evt.data.msg || 'Scrape error');
            }
          }
        }
        clearTimeout(idleTimer);
      } catch (e) {
        clearTimeout(idleTimer);
        if (!verified.length) addLog('error', `Verification failed: ${e.message || e}`);
        else addLog('warn', `Verification ended early — continuing with ${verified.length} sites`);
      }

      if (!verified.length) { persistRun(0); setPhase('done'); return; }

      const scoredSites = verified.map(site => {
        const sc = scoresFromFlags(site.stack_flags);
        return { ...site, scores: sc, composite: sc.composite };
      });
      await _enrichAndSave(scoredSites, allLeads, addLog);

      if (!abortRef.current && allLeads.length > 0) {
        onLeadsAdded(allLeads);
        setNewLeads(allLeads);
      }
      persistRun(allLeads.length);
      setPhase('done');
    } catch (e) {
      addLog('error', `Audit failed: ${e.message || e}`);
      persistRun(allLeads.length);
      setPhase('done');
    }
  }, [industry, generateNavPlan, onLeadsAdded]);

  const runPipeline = useCallback(async () => {
    abortRef.current = false;
    setPhase('running');
    setViewRun(null);
    setLog([]);
    setSites([]);
    setNewLeads([]);
    logRef.current = [];
    sitesRef.current = [];

    // POST /search — runs the search sources only (no verify/screenshot), fast.
    async function search(body) {
      const res = await fetch(`${API}/clientfinder/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(150000),
      });
      if (!res.ok) throw new Error(`search HTTP ${res.status}`);
      return res.json();
    }

    // Dedupe candidates across all queries by domain.
    const candMap = new Map();
    function addCandidates(cands) {
      let added = 0;
      for (const c of cands || []) {
        const key = (c.website || c.name || '').toLowerCase();
        if (key && !candMap.has(key)) { candMap.set(key, c); added++; }
      }
      return added;
    }
    const fmtSources = (s) => (s && Object.keys(s).length)
      ? ` [${Object.entries(s).map(([k, v]) => `${k}:${v}`).join(' ')}]` : '';
    // Log the deep per-source diagnostics (why each engine returned what it did).
    function logDiags(diags) {
      for (const d of diags || []) {
        const kept = d.kept ?? 0;
        addLog(kept > 0 ? 'ok' : 'warn', `      ${(d.source || '?').toUpperCase()}: ${d.note || 'no detail'}`);
      }
    }

    try {
      // ── 1. Deterministic seed queries ──────────────────────────────────
      addLog('stage', `Building deterministic seed queries (${industry || 'all industries'}, ${region})…`);
      const seed = await search({ industry, region, keywords });
      if (!seed.ok) throw new Error(seed.error || 'search failed');
      addLog('ok', `Search engine ran ${seed.by_query.length} seed queries`);
      for (const g of seed.by_query) {
        const added = addCandidates(g.candidates);
        addLog(g.candidates.length ? 'site' : 'info',
          `“${g.q}” → ${g.candidates.length} candidates${fmtSources(g.sources)} (+${added} new)`);
        logDiags(g.diags);
      }

      // ── 2. AI reflects on each query's results, proposes an improvement ──
      const improved = [];
      if (reflectOnResults) {
        addLog('stage', 'AI reflecting on each query to find better candidates…');
        for (const g of seed.by_query) {
          if (abortRef.current) break;
          addLog('audit', `Thinking about “${g.q}”…`);
          let r = { thought: '', query: '' };
          try { r = await reflectOnResults({ query: g.q, candidates: g.candidates }); }
          catch { addLog('warn', '  ↳ reflection failed'); continue; }
          if (r.thought) addLog('audit', `💭 ${r.thought}`);
          const q2 = (r.query || '').trim();
          if (q2 && q2.toLowerCase() !== g.q.toLowerCase() && !improved.includes(q2)) {
            addLog('refine', `↳ improved query: “${q2}”`);
            improved.push(q2);
          } else {
            addLog('info', '  ↳ keeping the original (no better query)');
          }
        }
      } else {
        addLog('info', 'AI engine not loaded — skipping reflection (open the AI Engine tab to enable it)');
      }

      // ── 3. Re-run the AI-improved queries ──────────────────────────────
      if (improved.length && !abortRef.current) {
        addLog('stage', `Re-running ${improved.length} AI-improved queries…`);
        try {
          const r2 = await search({ queries: improved });
          if (r2.ok) {
            for (const g of r2.by_query) {
              const added = addCandidates(g.candidates);
              addLog(g.candidates.length ? 'site' : 'info',
                `“${g.q}” → ${g.candidates.length} candidates${fmtSources(g.sources)} (+${added} new)`);
              logDiags(g.diags);
            }
          }
        } catch (e) {
          addLog('warn', `Improved-query search failed: ${e.message || e}`);
        }
      }

      const candidates = [...candMap.values()].slice(0, 18);
      addLog('ok', `Aggregated ${candidates.length} unique candidates to verify`);
      if (!candidates.length) {
        addLog('warn', 'No candidates found — try a different industry, region, or keyword.');
        persistRun(0);
        setPhase('done');
        return;
      }

      // ── 4. Hand off to the shared audit (verify + screenshot + score + save) ──
      await runAudit(candidates, { reset: false });
    } catch (e) {
      addLog('error', `Discovery failed: ${e.message || e}`);
      persistRun(0);
      setPhase('done');
    }
  }, [industry, region, keywords, reflectOnResults, runAudit]);

  // ── Assisted mode: build clean search links, then poll the harvest buffer ──
  const startAssisted = useCallback(async () => {
    abortRef.current = false;
    setViewRun(null);
    setHarvested([]);
    setHarvestQueries([]);
    setPlanLoading(true);
    setPhase('harvest');
    try { await fetch(`${API}/clientfinder/harvest/${harvestToken}/clear`, { method: 'POST' }); } catch {}
    let qs = [];
    try {
      const r = await fetch(`${API}/clientfinder/plan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, region, keywords }),
      });
      const d = await r.json();
      if (d.ok) qs = (d.queries || []).map(p => p.q).filter(Boolean);
    } catch {}
    if (generateQueries) {
      try {
        const ai = await generateQueries({ industry, region, keywords, count: 4 });
        for (const q of ai) if (q && !qs.some(x => x.toLowerCase() === q.toLowerCase())) qs.push(q);
      } catch {}
    }
    setHarvestQueries(qs.slice(0, 10));
    setPlanLoading(false);
  }, [industry, region, keywords, generateQueries, harvestToken]);

  const auditHarvested = useCallback(() => {
    const cands = harvested.map(b => ({ name: b.name, website: b.website, industry: industry || '' }));
    runAudit(cands, { reset: true });
  }, [harvested, industry, runAudit]);

  const clearHarvest = useCallback(async () => {
    try { await fetch(`${API}/clientfinder/harvest/${harvestToken}/clear`, { method: 'POST' }); } catch {}
    setHarvested([]);
  }, [harvestToken]);

  async function _enrichAndSave(scoredSites, allLeads, addLog) {
    if (!scoredSites.length) return;
    addLog('stage', `Enriching ${scoredSites.length} leads with decision-maker info…`);
    let enrichMap = {};
    try {
      const res = await fetch(`${API}/clientfinder/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: scoredSites.map(s => ({ name: s.name, industry: s.industry || '', city: s.city })) }),
        signal: AbortSignal.timeout(8000),
      });
      const d = await res.json();
      if (d.ok) {
        for (const r of d.results) enrichMap[r.name] = r;
        addLog('ok', `Enriched ${d.results.length} leads with DM contact info`);
      }
    } catch {}

    for (const site of scoredSites) {
      const dm = enrichMap[site.name] || {};
      const sc = site.scores || scoresFromFlags(site.stack_flags);
      allLeads.push({
        id: Date.now() + Math.floor(Math.random() * 9999),
        company_name: site.name,
        industry: site.industry || '',
        city: site.city, state: 'MN',
        employee_count: null,
        website: site.website,
        screenshot_url: site.screenshot_url || null,
        screenshots: site.screenshots || (site.screenshot_url ? [site.screenshot_url] : []),
        quality_notes: site.quality_notes || [],
        score_modernity: sc.modernity,
        score_mobile: sc.mobile,
        score_function: sc.function,
        composite_score: sc.composite,
        outdated_stack: sc.composite < 5 || (site.stack_flags?.length || 0) > 0,
        stack_flags: site.stack_flags || [],
        dm_name: dm.dm_name || '',
        dm_title: dm.dm_title || '',
        dm_seniority: dm.dm_seniority || '',
        dm_source: 'Apollo', dm_linkedin: dm.dm_linkedin || '',
        email: dm.email || (site.emails?.[0] || null),
        phone: dm.phone || (site.phones?.[0] || null),
        contact_form_url: dm.contact_form_url || null,
        outreach_status: 'New',
        notes: '',
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

  // Shared sites + activity-log view, used both live and when replaying history.
  const sitesLogView = (sitesArr, logArr, live) => (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── Sites panel ─────────────────────────────────────────── */}
      <div style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cf-subtext)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, flexShrink: 0 }}>
          Sites ({sitesArr.length})
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 2 }}>
          {sitesArr.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--cf-muted)', padding: '8px 2px' }}>
              {live ? 'Searching for real, reachable businesses…' : 'No sites captured.'}
            </div>
          )}
          {sitesArr.map((site, i) => (
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
                {site.composite != null && (
                  <div style={{ fontSize: 16, fontWeight: 700, color: scoreColor(site.composite), fontFamily: 'JetBrains Mono' }}>
                    {site.composite}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Activity log panel (dedicated, always readable) ──────── */}
      <div style={{ flex: '0 0 auto', height: 220, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--cf-subtext)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Activity Log ({logArr.length})
          </span>
          {live && (
            <span style={{ fontSize: 10, color: 'var(--cf-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="cf-pulse-dot" /> live
            </span>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'JetBrains Mono', fontSize: 11, lineHeight: 1.7, background: 'var(--cf-surface)', border: '1px solid var(--cf-border)', borderRadius: 'var(--cf-radius-md)', padding: '8px 12px' }}>
          {logArr.map((e, i) => (
            <div key={i} style={{ color: COLOR[e.type] || 'var(--cf-subtext)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <span style={{ opacity: 0.5, marginRight: 5 }}>{ICON[e.type] || '·'}</span>{e.msg}
            </div>
          ))}
          {live && <div style={{ color: 'var(--cf-primary)' }}>⏳ Running…</div>}
          {live && <div ref={logEndRef} />}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="cf-drawer-overlay" onClick={onClose} />
      <div className="cf-drawer" style={{ width: 560 }}>
        <div className="cf-drawer-header">
          <div>
            <h2>Run Discovery</h2>
            <div style={{ fontSize: 12, color: 'var(--cf-subtext)', marginTop: 2 }}>
              Search in your browser → harvest real businesses → robot screenshots &amp; audits each site
            </div>
          </div>
          <button className="cf-close-btn" onClick={onClose}>&#x2715;</button>
        </div>

        <div className="cf-drawer-body">
          {phase === 'config' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {[
                  { id: 'assisted', label: 'Assisted', sub: 'Search in your Chrome' },
                  { id: 'automated', label: 'Automated', sub: 'Server scrapes (may be blocked)' },
                ].map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    style={{
                      flex: 1, textAlign: 'left', cursor: 'pointer', padding: '10px 12px',
                      borderRadius: 'var(--cf-radius-md)',
                      border: `1px solid ${mode === m.id ? 'var(--cf-primary)' : 'var(--cf-border)'}`,
                      background: mode === m.id ? 'rgba(99,102,241,0.10)' : 'var(--cf-surface-2)',
                      color: 'var(--cf-text)',
                    }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--cf-subtext)', marginTop: 2 }}>{m.sub}</div>
                  </button>
                ))}
              </div>
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
              {mode === 'assisted' ? (
                <div style={{
                  padding: '10px 12px', borderRadius: 'var(--cf-radius-md)', marginTop: 4,
                  background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                  fontSize: 12, color: 'var(--cf-subtext)',
                }}>
                  <strong style={{ color: 'var(--cf-primary)' }}>● Assisted mode</strong>
                  {' '}You open the searches in your own logged-in Chrome (no captchas), click the Harvest bookmarklet on each results page, and the backend robot screenshots and audits every site it collects. The most reliable way to find real leads.
                </div>
              ) : (
                <div style={{
                  padding: '10px 12px', borderRadius: 'var(--cf-radius-md)', marginTop: 4,
                  background: gpuReady ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                  border: `1px solid ${gpuReady ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                  fontSize: 12, color: 'var(--cf-subtext)',
                }}>
                  <strong style={{ color: gpuReady ? 'var(--cf-score-high)' : 'var(--cf-score-mid)' }}>
                    {gpuReady ? '● AI engine ready' : '● AI engine not initialized'}
                  </strong>
                  {'. '}
                  {gpuReady
                    ? 'The in-browser LLM will write smarter, more varied search queries for this run. Note: the server scrapers are often bot-blocked, so Assisted mode is recommended.'
                    : 'Open the AI Engine tab to load the model for AI-written queries. Note: the server scrapers are often bot-blocked, so Assisted mode is recommended.'}
                </div>
              )}

              {runs.length > 0 && (
                <button className="cf-btn cf-btn-secondary" style={{ width: '100%', marginTop: 10 }}
                  onClick={() => { setViewRun(null); setPhase('history'); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
                  View Past Runs ({runs.length})
                </button>
              )}
            </>
          )}

          {phase === 'harvest' && (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', paddingRight: 2 }}>
              {/* Step 1: one-time bookmarklet setup */}
              <div style={{ padding: '12px 14px', background: 'var(--cf-surface-2)', border: '1px solid var(--cf-border)', borderRadius: 'var(--cf-radius-md)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cf-text)', marginBottom: 6 }}>1. One-time setup</div>
                <div style={{ fontSize: 12, color: 'var(--cf-subtext)', marginBottom: 8 }}>
                  Drag this button up to your browser&apos;s bookmarks bar. You only do this once.
                </div>
                <a ref={bookmarkletRef} href="#" onClick={e => e.preventDefault()} draggable="true"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'var(--cf-primary)', color: '#fff', borderRadius: 6, fontWeight: 600, fontSize: 12, textDecoration: 'none', cursor: 'grab' }}>
                  📥 Harvest to Client Finder
                </a>
              </div>

              {/* Step 2: clickable searches */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cf-text)', marginBottom: 6 }}>2. Run these searches in your Chrome</div>
                <div style={{ fontSize: 11.5, color: 'var(--cf-subtext)', marginBottom: 8 }}>
                  Open each one, then click your Harvest bookmarklet on the results page. Use Google and Maps for more coverage.
                </div>
                {planLoading && <div style={{ fontSize: 12, color: 'var(--cf-muted)' }}>Building clean search queries…</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {harvestQueries.map((q, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--cf-surface-2)', border: '1px solid var(--cf-border)', borderRadius: 'var(--cf-radius-md)' }}>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q}</span>
                      <a href={googleUrl(q)} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 600, color: 'var(--cf-primary)', textDecoration: 'none', padding: '3px 8px', border: '1px solid var(--cf-border)', borderRadius: 5 }}>Google</a>
                      <a href={mapsUrl(q)} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 600, color: 'var(--cf-primary)', textDecoration: 'none', padding: '3px 8px', border: '1px solid var(--cf-border)', borderRadius: 5 }}>Maps</a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: live harvested buffer */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cf-text)' }}>
                    3. Harvested
                    <span style={{ color: 'var(--cf-primary)' }}> {harvested.length}</span> businesses
                  </span>
                  {harvested.length > 0 && (
                    <button onClick={clearHarvest} style={{ fontSize: 11, color: 'var(--cf-subtext)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
                  )}
                </div>
                {harvested.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--cf-muted)', padding: '8px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="cf-pulse-dot" /> Waiting for you to harvest from a results page…
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {harvested.map((b, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '5px 10px', background: 'var(--cf-surface)', border: '1px solid var(--cf-border)', borderRadius: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                        <span style={{ fontSize: 10.5, color: 'var(--cf-subtext)', marginLeft: 'auto', flexShrink: 0 }}>{b.website}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {phase === 'history' && (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <button className="cf-btn cf-btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }}
                  onClick={() => (viewRun ? setViewRun(null) : setPhase('config'))}>
                  ← Back
                </button>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--cf-subtext)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {viewRun ? 'Run Detail' : `Past Runs (${runs.length})`}
                </span>
                {!viewRun && runs.length > 0 && (
                  <button className="cf-btn cf-btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }}
                    onClick={() => { saveRuns([]); setRuns([]); setPhase('config'); }}>
                    Clear
                  </button>
                )}
                {viewRun && <span style={{ width: 56 }} />}
              </div>

              {!viewRun && (
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {runs.map(r => (
                    <button key={r.id} onClick={() => setViewRun(r)}
                      style={{ textAlign: 'left', cursor: 'pointer', padding: '10px 12px', background: 'var(--cf-surface-2)', border: '1px solid var(--cf-border)', borderRadius: 'var(--cf-radius-md)', color: 'var(--cf-text)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{r.params?.industry || 'All Industries'}</span>
                        <span style={{ fontSize: 11, color: 'var(--cf-subtext)' }}>{fmtRunTime(r.ts)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--cf-subtext)', marginTop: 3 }}>
                        {r.params?.region || 'Both'}{r.params?.keywords ? ` · “${r.params.keywords}”` : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'var(--cf-muted)', fontFamily: 'JetBrains Mono' }}>
                        <span>{r.sites?.length || 0} sites</span>
                        <span>{r.leadCount || 0} leads</span>
                        <span>{r.log?.length || 0} log lines</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {viewRun && (
                <>
                  <div style={{ flexShrink: 0, fontSize: 12, color: 'var(--cf-subtext)' }}>
                    <strong style={{ color: 'var(--cf-text)' }}>{viewRun.params?.industry || 'All Industries'}</strong>
                    {' · '}{viewRun.params?.region || 'Both'}
                    {viewRun.params?.keywords ? ` · “${viewRun.params.keywords}”` : ''}
                    {' · '}{fmtRunTime(viewRun.ts)}
                  </div>
                  {sitesLogView(viewRun.sites || [], viewRun.log || [], false)}
                </>
              )}
            </div>
          )}

          {(phase === 'running' || phase === 'done') && sitesLogView(sites, log, phase === 'running')}

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
          {phase === 'config' && mode === 'assisted' && (
            <button className="cf-btn cf-btn-primary" style={{ width: '100%' }} onClick={startAssisted}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Build Search Links
            </button>
          )}
          {phase === 'config' && mode === 'automated' && (
            <button className="cf-btn cf-btn-primary" style={{ width: '100%' }} onClick={runPipeline}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Run Discovery Pipeline
            </button>
          )}
          {phase === 'harvest' && (
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button className="cf-btn cf-btn-secondary" style={{ flex: '0 0 auto' }} onClick={() => setPhase('config')}>Back</button>
              <button className="cf-btn cf-btn-primary" style={{ flex: 1 }} disabled={harvested.length === 0} onClick={auditHarvested}>
                Audit {harvested.length} {harvested.length === 1 ? 'Site' : 'Sites'}
              </button>
            </div>
          )}
          {phase === 'running' && (
            <button className="cf-btn cf-btn-secondary" style={{ width: '100%' }} onClick={() => { abortRef.current = true; setPhase(mode === 'assisted' ? 'harvest' : 'config'); }}>Stop</button>
          )}
          {phase === 'done' && (
            <button className="cf-btn cf-btn-primary" style={{ width: '100%' }} onClick={onClose}>View New Leads in CRM</button>
          )}
        </div>
      </div>
    </>
  );
}
