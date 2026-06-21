import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertsContext';
import { useTheme } from '../contexts/ThemeContext';
import GlobalSearch from './GlobalSearch';

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: '◈', roles: ['admin', 'sales', 'ops'] },
  { path: '/inventory', label: 'Inventory', icon: '◉', roles: ['admin', 'sales', 'ops'] },
  { path: '/campaigns', label: 'Campaigns', icon: '◆', roles: ['admin', 'sales', 'client'] },
  { path: '/clients', label: 'Clients', icon: '◉', roles: ['admin', 'sales'] },
  { path: '/bookings', label: 'Bookings', icon: '◎', roles: ['admin', 'sales', 'ops'] },
  { path: '/analytics', label: 'Analytics', icon: '◇', roles: ['admin', 'sales'] },
  { path: '/weather', label: 'Weather', icon: '◈', roles: ['admin', 'sales', 'ops'] },
  { path: '/ops-schedule', label: 'Ops Queue', icon: '◈', roles: ['admin', 'ops'] },
  { path: '/reports', label: 'Reports', icon: '◇', roles: ['admin', 'sales'] },
  { path: '/users', label: 'Users', icon: '◉', roles: ['admin'] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const alerts = useAlerts();
  const { theme, toggle: toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setShowNotif(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const visibleNav = NAV.filter((n) => user && n.roles.includes(user.role));

  return (
    <div className={`layout${collapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-logo">
          <span className="logo-icon">👁</span>
          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span className="logo-title">AdvertEyes</span>
              <span className="logo-sub">OOH OPS PLATFORM</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {visibleNav.map((n) => (
            <NavLink
              key={n.path}
              to={n.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? n.label : undefined}
            >
              <span className="nav-icon">{n.icon}</span>
              {!collapsed && <span className="nav-label">{n.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && user && (
            <div className="sidebar-user">
              <span className="sidebar-user-name">{user.name}</span>
              <span className={`badge badge-${user.role}`}>{user.role}</span>
            </div>
          )}
          <button className="btn btn-ghost btn-sm sidebar-toggle" onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar">
            {collapsed ? '→' : '←'}
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="gs-trigger"
              onClick={() => setSearchOpen(true)}
              title="Search (Ctrl+K / Cmd+K)"
            >
              <span>🔍</span>
              <span className="gs-trigger-text">Search...</span>
              <kbd className="gs-trigger-kbd">⌘K</kbd>
            </button>
          </div>
          <div className="topbar-right">
            <button
              className="btn btn-ghost btn-sm"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{ fontSize: 15, padding: '4px 8px' }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {user && user.role !== 'client' && (
              <div className="notif-bell" onClick={() => setShowNotif(!showNotif)} title="Alerts">
                🔔
                {alerts.total > 0 && (
                  <span className="notif-badge">{alerts.total}</span>
                )}
                {showNotif && (
                  <div className="notif-drawer">
                    <div className="notif-title">Alerts</div>
                    {alerts.highRiskUnits > 0 && (
                      <div
                        className="notif-item notif-high"
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => { navigate('/weather'); setShowNotif(false); }}
                      >
                        <span>⚠ {alerts.highRiskUnits} units HIGH install risk</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>→ Weather</span>
                      </div>
                    )}
                    {alerts.pendingBookings > 0 && (
                      <div
                        className="notif-item notif-warn"
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => { navigate('/bookings'); setShowNotif(false); }}
                      >
                        <span>◎ {alerts.pendingBookings} pending approvals</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>→ Bookings</span>
                      </div>
                    )}
                    {alerts.maintenanceUnits > 0 && (
                      <div
                        className="notif-item notif-warn"
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => { navigate('/inventory'); setShowNotif(false); }}
                      >
                        <span>🔧 {alerts.maintenanceUnits} unit{alerts.maintenanceUnits !== 1 ? 's' : ''} in maintenance</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>→ Inventory</span>
                      </div>
                    )}
                    {alerts.expiringSoon > 0 && (
                      <div
                        className="notif-item notif-info"
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => { navigate('/campaigns'); setShowNotif(false); }}
                      >
                        <span>◆ {alerts.expiringSoon} campaign{alerts.expiringSoon !== 1 ? 's' : ''} expiring soon</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>→ Campaigns</span>
                      </div>
                    )}
                    {alerts.total === 0 && (
                      <div className="notif-item" style={{ color: 'var(--text-muted)' }}>No alerts</div>
                    )}
                  </div>
                )}
              </div>
            )}
            {user && (
              <>
                <span className="topbar-user">{user.email}</span>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
              </>
            )}
          </div>
        </header>
        <div className="page-body">{children}</div>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
