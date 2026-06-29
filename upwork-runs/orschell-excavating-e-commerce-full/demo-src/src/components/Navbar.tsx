import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount, openDrawer } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const active = (path: string) => location.pathname === path ? { borderBottom: '2px solid var(--accent)', color: 'var(--accent)' } : {};

  return (
    <nav style={{ background: '#0D0F12', borderBottom: '2px solid var(--accent)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 56, gap: 32 }}>
        <Link to="/" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 22, letterSpacing: '0.06em', color: 'var(--accent)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          🏗 Orschell Supply
        </Link>

        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flex: 1 }}>
          <Link to="/shop" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 0', ...active('/shop') }}>Shop</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 0', color: 'var(--yellow)', ...active('/admin') }}>Admin</Link>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={openDrawer}
            style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 18, position: 'relative', padding: 4 }}
            title="Cart"
          >
            🛒
            {itemCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{ background: 'var(--bg-card)', border: '1px solid #3E434D', color: 'var(--text)', padding: '6px 12px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span style={{ width: 24, height: 24, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 700 }}>
                  {user.name[0]?.toUpperCase()}
                </span>
                {user.name.split(' ')[0]}
              </button>
              {menuOpen && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: 'var(--bg-card)', border: 'var(--border)', borderRadius: 'var(--radius)', minWidth: 160, zIndex: 200 }} onMouseLeave={() => setMenuOpen(false)}>
                  <Link to="/account" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 16px', fontSize: 13, borderBottom: 'var(--border)' }}>My Account</Link>
                  <Link to="/orders" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 16px', fontSize: 13, borderBottom: 'var(--border)' }}>My Orders</Link>
                  {user.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 16px', fontSize: 13, borderBottom: 'var(--border)', color: 'var(--yellow)' }}>Admin Panel</Link>}
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 13, background: 'none', border: 'none', color: 'var(--danger)' }}>Log Out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-sm">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
