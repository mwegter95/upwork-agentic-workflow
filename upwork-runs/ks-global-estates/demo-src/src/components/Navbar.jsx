import { useState } from 'react';

export default function Navbar({ view, setView, favCount, menuOpen, setMenuOpen }) {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="navbar-wordmark">
          <span className="wordmark-ks">KS</span>
          <span className="wordmark-sep"></span>
          <span className="wordmark-full">Global Estates</span>
        </div>
      </div>

      <div className="navbar-center desktop-only">
        <button
          className={`nav-tab${view === 'browse' ? ' active' : ''}`}
          onClick={() => setView('browse')}
        >
          Browse
        </button>
        <button
          className={`nav-tab${view === 'favorites' ? ' active' : ''}`}
          onClick={() => setView('favorites')}
        >
          Saved
          {favCount > 0 && <span className="fav-badge">{favCount}</span>}
        </button>
      </div>

      <div className="navbar-right desktop-only">
        <span className="label-caps navbar-tagline">Global Luxury Real Estate</span>
      </div>

      <button className="burger mobile-only" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
        <span></span><span></span><span></span>
      </button>

      {menuOpen && (
        <div className="mobile-menu" onClick={() => setMenuOpen(false)}>
          <button
            className={`nav-tab${view === 'browse' ? ' active' : ''}`}
            onClick={() => setView('browse')}
          >
            Browse Properties
          </button>
          <button
            className={`nav-tab${view === 'favorites' ? ' active' : ''}`}
            onClick={() => setView('favorites')}
          >
            Saved {favCount > 0 && `(${favCount})`}
          </button>
        </div>
      )}

      <style>{`
        .navbar {
          display: flex;
          align-items: center;
          height: var(--nav-h);
          padding: 0 24px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          position: relative;
          z-index: 100;
          flex-shrink: 0;
        }
        .navbar-left { display: flex; align-items: center; }
        .navbar-wordmark { display: flex; align-items: center; gap: 10px; }
        .wordmark-ks {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 400;
          letter-spacing: 0.08em;
          color: var(--ink);
        }
        .wordmark-sep {
          width: 1px;
          height: 18px;
          background: var(--gold);
          opacity: 0.6;
          display: block;
        }
        .wordmark-full {
          font-family: var(--font-ui);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--mid);
        }
        .navbar-center { display: flex; align-items: center; gap: 4px; margin: 0 auto; }
        .nav-tab {
          background: none;
          border: none;
          font-family: var(--font-ui);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--mid);
          padding: 6px 14px;
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: color var(--transition), background var(--transition);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .nav-tab:hover { color: var(--ink); background: rgba(184,151,90,0.06); }
        .nav-tab.active { color: var(--ink); font-weight: 600; }
        .nav-tab.active::after {
          content: '';
          display: block;
          position: absolute;
          bottom: 0;
          height: 2px;
          background: var(--gold);
        }
        .fav-badge {
          background: var(--gold);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 10px;
          line-height: 1.4;
        }
        .navbar-right { display: flex; align-items: center; }
        .navbar-tagline { color: var(--mid); }
        .burger {
          display: none;
          flex-direction: column;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          margin-left: auto;
        }
        .burger span {
          display: block;
          width: 20px;
          height: 1.5px;
          background: var(--ink);
        }
        .mobile-menu {
          position: absolute;
          top: var(--nav-h);
          left: 0;
          right: 0;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 200;
        }
        .mobile-menu .nav-tab {
          justify-content: flex-start;
          padding: 10px 16px;
        }
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
        }
        .mobile-only { display: none; }
      `}</style>
    </nav>
  );
}
