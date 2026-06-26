import { useState, useEffect, useCallback, useRef } from 'react';
import { SEED_LEADS } from '../data/seedLeads.js';

const API = import.meta.env.DEV
  ? 'http://localhost:5050'
  : 'https://api.michaelwegter.com';

const LS_KEY = 'cf10_leads_v1';

function loadFromLS() {
  try {
    const s = localStorage.getItem(LS_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}
function saveToLS(leads) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(leads)); } catch {}
}

export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('loading'); // 'api' | 'local'
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/clientfinder/leads`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const arr = data.leads || [];
      if (!mountedRef.current) return;
      setLeads(arr);
      setMode('api');
      saveToLS(arr);
    } catch (err) {
      if (!mountedRef.current) return;
      // fallback to localStorage or seed
      const cached = loadFromLS();
      const fallback = cached || SEED_LEADS;
      setLeads(fallback);
      setMode('local');
      if (!cached) saveToLS(SEED_LEADS);
      setError('Backend offline — running in local mode.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateLead = useCallback(async (id, patch) => {
    setLeads(prev => {
      const next = prev.map(l => l.id === id ? { ...l, ...patch, updated_at: new Date().toISOString() } : l);
      saveToLS(next);
      return next;
    });
    if (mode === 'api') {
      try {
        await fetch(`${API}/clientfinder/leads/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
      } catch {}
    }
  }, [mode]);

  const addLeads = useCallback((newLeads) => {
    setLeads(prev => {
      const next = [...newLeads, ...prev];
      saveToLS(next);
      return next;
    });
    if (mode === 'api') {
      fetch(`${API}/clientfinder/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeads),
      }).catch(() => {});
    }
  }, [mode]);

  const deleteLead = useCallback(async (id) => {
    setLeads(prev => {
      const next = prev.filter(l => l.id !== id);
      saveToLS(next);
      return next;
    });
    if (mode === 'api') {
      try {
        await fetch(`${API}/clientfinder/leads/${id}`, { method: 'DELETE' });
      } catch {}
    }
  }, [mode]);

  const deleteLeads = useCallback(async (ids) => {
    const idSet = new Set(ids);
    setLeads(prev => {
      const next = prev.filter(l => !idSet.has(l.id));
      saveToLS(next);
      return next;
    });
    if (mode === 'api') {
      await Promise.all([...idSet].map(id =>
        fetch(`${API}/clientfinder/leads/${id}`, { method: 'DELETE' }).catch(() => {})
      ));
    }
  }, [mode]);

  // Apply a server-truth patch to a lead already updated remotely (e.g. after rescrape)
  const applyLeadPatch = useCallback((id, patch) => {
    setLeads(prev => {
      const next = prev.map(l => l.id === id ? { ...l, ...patch, updated_at: new Date().toISOString() } : l);
      saveToLS(next);
      return next;
    });
  }, []);

  const addSingleLead = useCallback(async (lead) => {
    const newLead = { ...lead, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    setLeads(prev => {
      const next = [newLead, ...prev];
      saveToLS(next);
      return next;
    });
    if (mode === 'api') {
      try {
        const res = await fetch(`${API}/clientfinder/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        });
        if (res.ok) {
          const d = await res.json();
          if (d.ids?.[0]) {
            setLeads(prev => prev.map(l => l.id === newLead.id ? { ...l, id: d.ids[0] } : l));
          }
        }
      } catch {}
    }
    return newLead;
  }, [mode]);

  const stats = {
    total: leads.length,
    byStatus: leads.reduce((acc, l) => { acc[l.outreach_status] = (acc[l.outreach_status] || 0) + 1; return acc; }, {}),
    avgScore: leads.length ? Math.round(leads.reduce((s, l) => s + (l.composite_score || 0), 0) / leads.length * 10) / 10 : 0,
    outdatedCount: leads.filter(l => l.outdated_stack).length,
  };

  return { leads, loading, error, mode, stats, fetchLeads, updateLead, addLeads, addSingleLead, deleteLead, deleteLeads, applyLeadPatch };
}
