import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CREDS = [
  { role: 'Admin', email: 'admin@adverteyes.com', password: 'Admin123!', color: 'var(--accent)' },
  { role: 'Sales', email: 'sarah@adverteyes.com', password: 'Sales123!', color: 'var(--accent-blue)' },
  { role: 'Ops', email: 'ops@adverteyes.com', password: 'Ops1234!', color: 'var(--warning)' },
  { role: 'Client', email: 'client@forddealer.com', password: 'Client12!', color: 'var(--text-muted)' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@adverteyes.com');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(email === 'client@forddealer.com' ? '/campaigns' : '/dashboard', { replace: true });
    } catch {
      setError('Invalid credentials. Use a demo account below.');
    } finally {
      setLoading(false);
    }
  };

  const fillCred = async (c: (typeof CREDS)[number]) => {
    setEmail(c.email);
    setPassword(c.password);
    setError('');
    setLoading(true);
    try {
      await login(c.email, c.password);
      navigate(c.role === 'Client' ? '/campaigns' : '/dashboard', { replace: true });
    } catch {
      setError('Login failed . API may be offline. Credentials filled; press Sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">👁</span>
          <div>
            <div className="login-logo-text">AdvertEyes</div>
            <div className="login-logo-sub">OOH OPS PLATFORM</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="demo-creds">
          <div className="demo-creds-label">Quick-fill demo accounts</div>
          <div className="cred-cards">
            {CREDS.map((c) => (
              <div key={c.role} className="cred-card" onClick={() => fillCred(c)} title={`Login as ${c.role}`} style={{ cursor: loading ? 'wait' : 'pointer' }}>
                <div className="cred-role" style={{ color: c.color }}>{c.role}</div>
                <div className="cred-email">{c.email}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>click to log in</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
