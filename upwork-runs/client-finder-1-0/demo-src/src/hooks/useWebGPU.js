import { useState, useCallback, useRef } from 'react';

// In-browser TEXT model (WebGPU). It does NOT analyze screenshots — it writes
// smarter search queries and decides which pages Playwright should capture.
// Llama-3.2-1B-Instruct is a strong small instruct model that runs on an M1 Air.
const MODEL_ID = 'onnx-community/Llama-3.2-1B-Instruct';

function extractAssistant(out) {
  // transformers.js text-generation returns either a string or, for chat input,
  // an array of messages whose last entry is the assistant reply.
  const g = out?.[0]?.generated_text ?? out?.generated_text ?? out;
  if (Array.isArray(g)) return (g.at(-1)?.content ?? '').trim();
  return String(g || '').trim();
}

// Coerce one query item to a string. The model sometimes returns objects like
// {"query":"..."} or {"q":"...","city":"..."} instead of a bare string.
function coerceToQuery(x) {
  if (typeof x === 'string') return x.trim();
  if (x && typeof x === 'object') {
    const cand = x.query ?? x.q ?? x.search ?? x.text ?? x.term
      ?? Object.values(x).find(v => typeof v === 'string');
    return String(cand || '').trim();
  }
  return '';
}

function parseJsonArray(text) {
  const m = text.match(/\[[\s\S]*?\]/);
  if (!m) return [];
  try {
    const arr = JSON.parse(m[0]);
    return Array.isArray(arr) ? arr.map(coerceToQuery).filter(Boolean) : [];
  } catch { return []; }
}

// Real Minnesota cities the model is told to choose from, so it can never invent
// a typo'd place like "miniapolis". Used for prompting and location variety.
const MN_CITIES = [
  'Minneapolis', 'St. Paul', 'Bloomington', 'Plymouth', 'Maple Grove', 'Eden Prairie',
  'Edina', 'Minnetonka', 'Brooklyn Park', 'Woodbury', 'Eagan', 'Burnsville', 'Lakeville',
  'Blaine', 'St. Louis Park', 'Roseville', 'Shakopee', 'Apple Valley', 'Coon Rapids',
  'Rochester', 'Duluth', 'St. Cloud', 'Mankato', 'Moorhead', 'Winona', 'Bemidji',
  'Brainerd', 'Owatonna', 'Faribault', 'Willmar', 'Alexandria', 'Fergus Falls', 'Hibbing',
];

// Clean a model-written query down to one usable Google search string. The 1B
// model loves to stuff queries with operators, repeats, and run-on locations, so
// we strip operators, collapse duplicate words, and cap the length.
function sanitizeQuery(raw) {
  let q = coerceToQuery(raw);
  if (!q) return '';
  q = q.replace(/[\"“”]/g, ' ')                       // drop quotes
       .replace(/-?\b(site|inurl|intitle|filetype):\S+/gi, ' ') // drop operators
       .replace(/[|•·,]+/g, ' ')                       // separators -> space
       .replace(/\s+/g, ' ')
       .trim();
  // Collapse consecutive duplicate words (case-insensitive): "minneapolis minneapolis".
  const words = q.split(' ');
  const out = [];
  for (const w of words) {
    if (!out.length || out[out.length - 1].toLowerCase() !== w.toLowerCase()) out.push(w);
  }
  q = out.slice(0, 11).join(' ').trim();
  return q;
}

export function useWebGPU() {
  const [gpuInfo, setGpuInfo] = useState(null);
  const [backend, setBackend] = useState(null); // 'webgpu' | 'wasm'
  const [modelReady, setModelReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState(null);

  // The loaded text-generation pipeline, reused for all calls.
  const modelRef = useRef(null);

  const detectGPU = useCallback(async () => {
    if (!navigator.gpu) {
      setGpuInfo({ available: false, reason: 'navigator.gpu not found — browser does not support WebGPU' });
      setBackend('wasm');
      return;
    }
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        setGpuInfo({ available: false, reason: 'No GPU adapter found' });
        setBackend('wasm');
        return;
      }
      let info = {};
      try { info = await adapter.requestAdapterInfo(); } catch {}
      const limits = adapter.limits;
      setGpuInfo({
        available: true,
        vendor: info.vendor || 'Unknown',
        architecture: info.architecture || 'Unknown',
        device: info.device || 'Unknown',
        maxBufferSize: limits?.maxBufferSize ? (limits.maxBufferSize / 1e9).toFixed(2) + ' GB' : 'Unknown',
        maxBindGroups: limits?.maxBindGroups ?? 'Unknown',
      });
      setBackend('webgpu');
    } catch (e) {
      setGpuInfo({ available: false, reason: e.message });
      setBackend('wasm');
    }
  }, []);

  // Load the text-generation pipeline once.
  const initModel = useCallback(async () => {
    if (modelRef.current) { setModelReady(true); return; }
    setLoading(true);
    setProgress(0);
    setProgressMsg('Initializing language model…');
    setError(null);
    try {
      const { pipeline } = await import('@huggingface/transformers');
      const dev = backend === 'webgpu' ? 'webgpu' : 'wasm';

      const progressCb = (p) => {
        if (p.status === 'downloading' || p.status === 'progress') {
          const pct = p.total ? Math.round((p.loaded / p.total) * 90) : 0;
          setProgress(5 + pct);
          setProgressMsg(`Downloading… ${p.total ? Math.round((p.loaded / p.total) * 100) : '?'}%`);
        } else if (p.status === 'loading') {
          setProgress(96);
          setProgressMsg('Loading weights…');
        }
      };

      setProgressMsg(`Loading Llama-3.2-1B on ${dev.toUpperCase()}…`);
      setProgress(4);
      const generator = await pipeline('text-generation', MODEL_ID, {
        device: dev,
        dtype: dev === 'webgpu' ? 'q4f16' : 'q4',
        progress_callback: progressCb,
      });

      modelRef.current = generator;
      setModelReady(true);
      setProgress(100);
      setProgressMsg('Language model ready');
    } catch (e) {
      setError(e.message || 'Model load failed');
    } finally {
      setLoading(false);
    }
  }, [backend]);

  const _chat = useCallback(async (system, user, maxTokens = 256) => {
    if (!modelRef.current) await initModel();
    if (!modelRef.current) throw new Error('Model not loaded');
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];
    const out = await modelRef.current(messages, {
      max_new_tokens: maxTokens,
      do_sample: true,
      temperature: 0.8,
      top_p: 0.9,
      repetition_penalty: 1.2,
    });
    return extractAssistant(out);
  }, [initModel]);

  // Generate diverse, concrete search queries for finding outdated SMB websites.
  const generateQueries = useCallback(async ({ industry, region, keywords, count = 8 }) => {
    const cityPool = MN_CITIES.slice(0, 18).join(', ');
    const sys = 'You write short, natural Google search queries for a web-design agency hunting small local Minnesota businesses with outdated websites. Output ONLY a JSON array of plain strings. No objects, no operators, no extra text.';
    const usr = `Write ${count} Google search queries to find ${industry || 'small local businesses'} across Minnesota.
Strict rules:
- Format every query exactly as: "<business type> <City> MN". Nothing else.
- Use ONLY these real Minnesota cities (copy them exactly, never invent or misspell a city): ${cityPool}.
- Each query = ONE business type + ONE city. Keep it under 6 words.
- Vary both the business type and the city across the list. Spread across different cities.
- No quotes, no minus signs, no "site:", no extra qualifiers, no repeated words.${keywords ? `\n- Prefer this business type when it fits: ${keywords}.` : ''}
Return ONLY a JSON array of ${count} strings.
Example: ["dental clinic Rochester MN", "auto repair shop Duluth MN", "bakery Mankato MN"]`;
    const text = await _chat(sys, usr, 320);
    return parseJsonArray(text).map(sanitizeQuery).filter(Boolean).slice(0, count);
  }, [_chat]);

  // Reflect on one query's results and propose a better/different query.
  const reflectOnResults = useCallback(async ({ query, candidates }) => {
    const list = (candidates || []).slice(0, 10)
      .map(c => `- ${c.name || '?'} (${c.website || '?'})`).join('\n') || '(no results)';
    // Offer a handful of real nearby/alternate cities to pick from.
    const pool = [...MN_CITIES].sort(() => Math.random() - 0.5).slice(0, 8).join(', ');
    const sys = 'You refine ONE Google search query to surface more small LOCAL Minnesota businesses with outdated websites. Output ONLY one JSON object: {"thought": string, "query": string}. The query must be a short, natural search string, no operators.';
    const usr = `Original query: "${query}"
Results it returned:
${list}

Step 1 ("thought"): in ONE short sentence, judge whether these are good leads (independent local businesses that may have an outdated website, NOT directories, chains, wikis, or dictionaries).
Step 2 ("query"): write ONE better query. Change EXACTLY ONE thing from the original: either swap to a different real Minnesota city from this list (${pool}), OR use a more specific business sub-type. Keep the format "<business type> <City> MN", under 6 words, no quotes, no operators, no repeated words.
Output ONLY: {"thought":"...","query":"..."}`;
    try {
      const text = await _chat(sys, usr, 200);
      const m = text.match(/\{[\s\S]*?\}/);
      if (m) {
        const o = JSON.parse(m[0]);
        return { thought: String(o.thought || '').slice(0, 220), query: sanitizeQuery(o.query ?? o) };
      }
    } catch {}
    return { thought: '', query: '' };
  }, [_chat]);

  // Decide which internal page keywords are most worth capturing for an audit.
  const generateNavPlan = useCallback(async ({ industry }) => {
    const sys = 'You help a website-quality reviewer decide which pages of a small business site to screenshot. Reply with a JSON array of lowercase strings only.';
    const usr = `For a ${industry || 'small business'} website, list up to 5 URL path keywords most useful to capture when judging the site's quality (e.g. "about","services","contact","pricing","gallery","menu","products").
Return ONLY a JSON array of lowercase keyword strings.`;
    try {
      const text = await _chat(sys, usr, 120);
      return parseJsonArray(text).map(s => s.toLowerCase().replace(/[^a-z]/g, '')).filter(Boolean).slice(0, 5);
    } catch { return []; }
  }, [_chat]);

  return {
    gpuInfo, backend, modelReady, loading, progress, progressMsg, error,
    detectGPU, initModel, generateQueries, reflectOnResults, generateNavPlan,
  };
}
