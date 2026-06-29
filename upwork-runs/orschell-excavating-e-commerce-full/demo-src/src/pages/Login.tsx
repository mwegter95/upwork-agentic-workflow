import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ font: '700 28px "Barlow Condensed"', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🏗 Orschell Supply</Link>
          <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14 }}>{mode === 'login' ? 'Sign in to your account' : 'Create an account'}</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, border: 'var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }} style={{ flex: 1, padding: '9px 0', background: mode === m ? 'var(--accent)' : 'transparent', border: 'none', color: mode === m ? '#fff' : 'var(--muted)', fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
            </div>

            {error && <p style={{ color: 'var(--danger)', fontSize: 13, background: 'rgba(232,64,64,0.1)', padding: '8px 12px', borderRadius: 'var(--radius)' }}>{error}</p>}

            <button type="submit" className="btn" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> {mode === 'login' ? 'Signing In...' : 'Creating Account...'}</> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--muted)' }}>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>Demo credentials:</p>
            <p>Admin: admin@orschellsupply.com / Admin1234!</p>
            <p>Customer: demo@customer.com / Demo1234!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
