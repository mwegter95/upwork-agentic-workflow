import React from 'react';

export default function RoleBadge({ role }: { role: string }) {
  return <span className={`badge badge-${role}`}>{role}</span>;
}
