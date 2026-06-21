import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchInventory, fetchCampaigns, fetchClients } from '../api';
import type { Unit, Campaign, Client } from '../api';

type SearchResult =
  | { kind: 'unit'; item: Unit }
  | { kind: 'campaign'; item: Campaign }
  | { kind: 'client'; item: Client };

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(255,107,26,0.35)', color: 'inherit', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !loaded) {
      Promise.all([fetchInventory(), fetchCampaigns(), fetchClients()]).then(([u, c, cl]) => {
        setUnits(u); setCampaigns(c); setClients(cl); setLoaded(true);
      }).catch(() => {});
    }
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open, loaded]);

  const results: SearchResult[] = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];
    units.forEach((u) => { if (u.name.toLowerCase().includes(q) || u.city.toLowerCase().includes(q)) out.push({ kind: 'unit', item: u }); });
    campaigns.forEach((c) => { if (c.name.toLowerCase().includes(q) || (c.client_name ?? '').toLowerCase().includes(q)) out.push({ kind: 'campaign', item: c }); });
    clients.forEach((cl) => { if (cl.name.toLowerCase().includes(q) || cl.industry.toLowerCase().includes(q)) out.push({ kind: 'client', item: cl }); });
    return out.slice(0, 10);
  }, [query, units, campaigns, clients]);

  const go = useCallback((r: SearchResult) => {
    if (r.kind === 'unit') navigate('/inventory');
    else if (r.kind === 'campaign') navigate('/campaigns');
    else navigate('/clients');
    onClose();
  }, [navigate, onClose]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { setActiveIdx((i) => Math.min(i + 1, results.length - 1)); e.preventDefault(); }
    if (e.key === 'ArrowUp') { setActiveIdx((i) => Math.max(i - 1, 0)); e.preventDefault(); }
    if (e.key === 'Enter' && results[activeIdx]) { go(results[activeIdx]); }
  };

  useEffect(() => { setActiveIdx(0); }, [results.length]);

  if (!open) return null;

  const kindLabel = (k: string) =>
    k === 'unit' ? '◉ Unit' : k === 'campaign' ? '◆ Campaign' : '◉ Client';
  const kindColor = (k: string) =>
    k === 'unit' ? 'var(--accent)' : k === 'campaign' ? 'var(--accent-blue)' : 'var(--success)';

  return (
    <div className="gs-overlay" onClick={onClose}>
      <div className="gs-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKey}>
        <div className="gs-search-row">
          <span className="gs-search-icon">🔍</span>
          <input
            ref={inputRef}
            className="gs-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search units, campaigns, clients..."
            autoComplete="off"
          />
          {query && (
            <button className="gs-clear" onClick={() => setQuery('')}>✕</button>
          )}
          <kbd className="gs-esc">Esc</kbd>
        </div>

        {query.trim() && (
          <div className="gs-results">
            {results.length === 0 ? (
              <div className="gs-empty">No results for "{query}"</div>
            ) : (
              results.map((r, i) => {
                const label =
                  r.kind === 'unit' ? r.item.name :
                  r.kind === 'campaign' ? r.item.name :
                  r.item.name;
                const sub =
                  r.kind === 'unit' ? `${r.item.city}, ${r.item.state} - ${r.item.type} - $${r.item.monthly_rate.toLocaleString()}/mo` :
                  r.kind === 'campaign' ? `${r.item.client_name ?? ''} - ${r.item.status}` :
                  `${r.item.industry} - ${r.item.contact}`;
                return (
                  <div
                    key={`${r.kind}-${r.kind === 'unit' ? r.item.id : r.kind === 'campaign' ? r.item.id : r.item.id}`}
                    className={`gs-result-item${i === activeIdx ? ' active' : ''}`}
                    onClick={() => go(r)}
                    onMouseEnter={() => setActiveIdx(i)}
                  >
                    <div className="gs-result-kind" style={{ color: kindColor(r.kind) }}>
                      {kindLabel(r.kind)}
                    </div>
                    <div className="gs-result-label">{highlight(label, query)}</div>
                    <div className="gs-result-sub">{sub}</div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {!query.trim() && (
          <div className="gs-hint">
            <div style={{ display: 'flex', gap: 20, color: 'var(--text-muted)', fontSize: 12 }}>
              <span>↑↓ navigate</span>
              <span>↵ go to page</span>
              <span>Esc close</span>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['billboard', 'dooh', 'truckside', 'Ford', 'Tampa', 'active'].map((t) => (
                <button key={t} className="gs-tag" onClick={() => setQuery(t)}>{t}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
