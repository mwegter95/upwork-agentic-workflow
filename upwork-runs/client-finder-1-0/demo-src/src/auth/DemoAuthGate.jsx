import { useState, useEffect, useCallback, useRef } from 'react';

// Must match the site's owner account. Only this user may open the demo.
const OWNER_EMAIL = 'zweetztuph@gmail.com';
const API = import.meta.env.DEV ? 'http://localhost:5050' : 'https://api.michaelwegter.com';
// Shared with michaelwegter.com (same origin), so signing in on the site unlocks
// this demo automatically and vice versa.
const TOKEN_KEY = 'mw-auth-token';
const USER_KEY = 'mw-auth-user';

function getToken() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
function setStored(token, user) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user)); else localStorage.removeItem(USER_KEY);
  } catch {}
}

/**
 * DemoAuthGate — private access wrapper for Client Finder.
 *
 * Renders the app only for the signed-in owner. Anyone else (signed out, or a
 * valid but non-owner account) gets a locked screen. The token lives in shared
 * same-origin localStorage, so a site sign-in unlocks this immediately.
 */
export default function DemoAuthGate({ children }) {
  const [status, setStatus] = useState('checking'); // checking | locked | denied | authed
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const pwRef = useRef(null);

  const verify = useCallback(async (token) => {
    if (!token) { setStatus('locked'); return; }
    try {
      const r = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('expired');
      const d = await r.json();
      const ok = (d?.user?.email || '').toLowerCase() === OWNER_EMAIL;
      if (ok) { setStatus('authed'); }
      else { setStatus('denied'); }
    } catch {
      setStored(null, null);
      setStatus('locked');
    }
  }, []);

  useEffect(() => { verify(getToken()); }, [verify]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch(`${API}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Login failed');
      setStored(d.token, d.user);
      if ((d.user?.email || '').toLowerCase() === OWNER_EMAIL) setStatus('authed');
      else setStatus('denied');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
      setPassword('');
    }
  };

  if (status === 'authed') return children;

  if (status === 'checking') {
    return (
      <div style={wrap}>
        <div style={{ color: 'var(--cf-subtext)', fontSize: 14 }}>Checking access…</div>
      </div>
    );
  }

  const denied = status === 'denied';
  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: 30, marginBottom: 10 }}>🔒</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--cf-text)', margin: '0 0 6px' }}>Client Finder 1.0</h1>
        <p style={{ fontSize: 13, color: 'var(--cf-subtext)', lineHeight: 1.6, margin: '0 0 18px' }}>
          This is a private tool. Sign in with the owner account to continue.
        </p>

        {denied ? (
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: 'var(--cf-score-mid)', marginBottom: 14 }}>
              This account does not have access to Client Finder.
            </div>
            <button style={btn} onClick={() => { setStored(null, null); setStatus('locked'); setEmail(''); }}>
              Sign in as a different account
            </button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ textAlign: 'left' }}>
            <label style={lbl}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="username" placeholder="you@example.com" style={inp} />
            <label style={{ ...lbl, marginTop: 12 }}>Password</label>
            <input ref={pwRef} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password" placeholder="••••••••" style={inp} />
            {error && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--cf-score-low)' }}>{error}</div>}
            <button type="submit" disabled={submitting || !email || !password}
              style={{ ...btn, marginTop: 18, opacity: submitting || !email || !password ? 0.55 : 1 }}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const wrap = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'var(--cf-bg)', padding: 20, fontFamily: 'system-ui, sans-serif',
};
const card = {
  width: '100%', maxWidth: 380, background: 'var(--cf-surface)',
  border: '1px solid var(--cf-border)', borderRadius: 'var(--cf-radius-lg)',
  padding: '30px 26px', textAlign: 'center', boxShadow: 'var(--cf-shadow-lg)',
};
const lbl = { display: 'block', fontSize: 12, color: 'var(--cf-subtext)', marginBottom: 5 };
const inp = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px',
  background: 'var(--cf-surface-2)', border: '1px solid var(--cf-border)',
  borderRadius: 'var(--cf-radius-md)', color: 'var(--cf-text)', fontSize: 14, outline: 'none',
};
const btn = {
  width: '100%', padding: '11px', background: 'var(--cf-primary)', color: '#fff',
  border: 'none', borderRadius: 'var(--cf-radius-md)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};
