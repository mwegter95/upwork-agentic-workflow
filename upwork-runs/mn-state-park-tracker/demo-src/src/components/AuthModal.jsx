import { useState } from 'react';
import { api } from '../api/client.js';

export default function AuthModal({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const path = mode === 'login' ? '/mn-parks/auth/login' : '/mn-parks/auth/register';
      const data = await api.post(path, { email, password });
      localStorage.setItem('mn_parks_token', data.token);
      localStorage.setItem('mn_parks_email', data.email);
      onAuth(data.token, data.email);
    } catch (err) {
      let msg = err.message || 'Something went wrong';
      try { const parsed = JSON.parse(msg); msg = parsed.error || msg; } catch {}
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@mnparks.test');
    setPassword('Parks2024!');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-logo">🌲</div>
        <h1 className="modal-title">MN Park Tracker</h1>
        <p className="modal-subtitle">Track every park you've explored across Minnesota</p>

        {error && <div className="modal-error">{error}</div>}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          <button type="submit" className="btn-navy" disabled={loading} style={{width:'100%',justifyContent:'center',padding:'11px'}}>
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="demo-hint">
          <strong>Try the demo:</strong>{' '}
          <button onClick={fillDemo} style={{background:'none',border:'none',color:'var(--teal)',cursor:'pointer',textDecoration:'underline',fontSize:'0.78rem'}}>
            Fill demo credentials
          </button>
          {' '}(demo@mnparks.test / Parks2024!)
        </div>

        <div className="modal-toggle">
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button onClick={() => { setMode('register'); setError(''); }}>Sign up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
