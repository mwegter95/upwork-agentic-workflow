import React from 'react';
import { ROLES } from '../data/mockData.js';

export default function RoleLogin({ onSelect }) {
  return (
    <div className="role-login">
      <div className="role-login-logo">
        <div style={{ fontSize: 40, marginBottom: 10 }}>🌾</div>
        <div className="role-login-title">AgriPro Operations Console</div>
        <div className="role-login-sub">Select your role to enter the platform</div>
      </div>
      <div className="role-cards">
        {ROLES.map(role => (
          <div key={role.id} className="role-card" onClick={() => onSelect(role)}>
            <div className="role-card-icon">{role.icon}</div>
            <div className="role-card-label">{role.label}</div>
            <div className="role-card-desc">{role.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', textAlign: 'center', maxWidth: 420 }}>
        Demo of an agricultural operations platform. All data is illustrative.
        Role selection simulates RBAC-gated views without requiring real auth infrastructure.
      </div>
    </div>
  );
}
