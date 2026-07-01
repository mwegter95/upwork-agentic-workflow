import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#1D4ED8','#15803D','#B45309','#B91C1C','#7C3AED'];

function exportPDF(roleLabel, kpis) {
  import('jspdf').then(({ default: jsPDF }) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text(`AgriPro ${roleLabel} Dashboard Report`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    doc.setFontSize(12);
    let y = 36;
    kpis.forEach(k => {
      doc.text(`${k.label}: ${k.value}`, 14, y);
      y += 8;
    });
    doc.save(`agripro-${roleLabel.toLowerCase()}-report.pdf`);
  });
}

function exportExcel(roleLabel, rows) {
  import('xlsx').then(XLSX => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `agripro-${roleLabel.toLowerCase()}-report.xlsx`);
  });
}

// Procurement dashboard
function ProcurementDash({ campaigns, inspections }) {
  const kpis = [
    { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'active').length },
    { label: 'Total Target Volume', value: campaigns.reduce((a,c) => a+c.targetVolume,0).toLocaleString() + ' bu' },
    { label: 'Total Procured', value: campaigns.reduce((a,c) => a+c.procuredVolume,0).toLocaleString() + ' bu' },
    { label: 'Pending Approvals', value: campaigns.reduce((a,c) => a+(c.pendingApprovals||0),0) },
  ];
  const chartData = campaigns.map(c => ({ name: c.name.split(' ').slice(0,2).join(' '), Target: c.targetVolume, Procured: c.procuredVolume }));
  return (
    <div>
      <div className="kpi-grid">
        {kpis.map(k => (
          <div key={k.label} className="card kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 300, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>Campaign Volume: Target vs Procured</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => v.toLocaleString() + ' bu'} />
              <Legend />
              <Bar dataKey="Target" fill="#D6D3C8" radius={[3,3,0,0]} />
              <Bar dataKey="Procured" fill="#1D4ED8" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ flex: '0 0 200px', padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Actions</div>
          <button className="btn btn-primary w-full" style={{ marginBottom: 8 }} onClick={() => exportPDF('Procurement', kpis)}>Export PDF Report</button>
          <button className="btn btn-secondary w-full" onClick={() => exportExcel('Procurement', campaigns.map(c => ({ ID: c.id, Name: c.name, Crop: c.crop, State: c.state, Status: c.status, Procured: c.procuredVolume, Target: c.targetVolume })))}>Export Excel</button>
        </div>
      </div>
    </div>
  );
}

// Quality dashboard
function QualityDash({ inspections }) {
  const pass = inspections.filter(i => !i.anomalyFlags || i.anomalyFlags.length === 0).length;
  const warn = inspections.filter(i => i.anomalyFlags && i.anomalyFlags.length > 0 && !i.anomalyFlags.some(f=>f.severity==='reject')).length;
  const reject = inspections.filter(i => i.anomalyFlags && i.anomalyFlags.some(f=>f.severity==='reject')).length;
  const pending = inspections.filter(i => i.stage === 'lab_review').length;
  const kpis = [
    { label: 'Pending Lab Review', value: pending, cls: 'kpi-warn' },
    { label: 'All Clear', value: pass, cls: 'kpi-pass' },
    { label: 'Flagged (Warn)', value: warn, cls: 'kpi-warn' },
    { label: 'Rejected', value: reject, cls: 'kpi-reject' },
  ];
  const pieData = [
    { name: 'Pass', value: pass }, { name: 'Warn', value: warn }, { name: 'Reject', value: reject },
  ];
  const pieColors = ['#15803D','#D97706','#B91C1C'];
  return (
    <div>
      <div className="kpi-grid">
        {kpis.map(k => (
          <div key={k.label} className="card kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className={`kpi-value ${k.cls}`}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 280, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>Inspection QC Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 280, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Flagged Inspections</div>
          {inspections.filter(i => i.anomalyFlags && i.anomalyFlags.length > 0).map(ins => (
            <div key={ins.id} style={{ padding: '8px 0', borderBottom: '1px solid #F0EDE8', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, flex: 1 }}>{ins.id}</span>
              <span style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>{ins.anomalyFlags.length} flag{ins.anomalyFlags.length>1?'s':''}</span>
              <span className={`chip ${ins.anomalyFlags.some(f=>f.severity==='reject') ? 'chip-reject' : 'chip-warn'}`} style={{ fontSize: 10 }}>
                {ins.anomalyFlags.some(f=>f.severity==='reject') ? 'REJECT' : 'WARN'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Warehouse dashboard
function WarehouseDash({ bins }) {
  const totalCap = bins.reduce((a,b) => a+b.maxCapacity, 0);
  const totalAlloc = bins.reduce((a,b) => a+b.allocated, 0);
  const nearFull = bins.filter(b => b.allocated / b.maxCapacity >= 0.9).length;
  const kpis = [
    { label: 'Total Bins', value: bins.length },
    { label: 'Total Capacity', value: totalCap.toLocaleString() + ' bu' },
    { label: 'Allocated', value: totalAlloc.toLocaleString() + ' bu' },
    { label: 'Near-Full Bins', value: nearFull, cls: nearFull > 0 ? 'kpi-warn' : '' },
  ];
  const chartData = bins.map(b => ({ name: b.binId, Allocated: b.allocated, Available: b.maxCapacity - b.allocated }));
  return (
    <div>
      <div className="kpi-grid">
        {kpis.map(k => (
          <div key={k.label} className="card kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className={`kpi-value ${k.cls||''}`}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 300, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>Bin Fill Rates</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => v.toLocaleString() + ' bu'} />
              <Legend />
              <Bar dataKey="Allocated" stackId="a" fill="#B5651D" radius={[0,0,0,0]} />
              <Bar dataKey="Available" stackId="a" fill="#E7E5E0" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 280, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Bin Status</div>
          <div className="bin-grid" style={{ gridTemplateColumns: '1fr' }}>
            {bins.map(b => {
              const pct = Math.round((b.allocated / b.maxCapacity) * 100);
              const color = pct >= 90 ? 'var(--clr-reject)' : pct >= 70 ? 'var(--clr-warn)' : 'var(--clr-pass)';
              return (
                <div key={b.binId} className="card bin-card" style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="bin-title">{b.binId}</div>
                    <span className="bin-fill-pct" style={{ color }}>{pct}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginBottom: 6 }}>{b.commodity} · {b.location}</div>
                  <div className="bin-fill-track">
                    <div className="bin-fill-bar" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 4 }}>
                    {b.allocated.toLocaleString()} / {b.maxCapacity.toLocaleString()} bu
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Management dashboard
function ManagementDash({ campaigns, inspections, bins }) {
  const trendData = [
    { week: 'Sep W1', inspections: 6, anomalies: 1 },
    { week: 'Sep W2', inspections: 9, anomalies: 2 },
    { week: 'Sep W3', inspections: 11, anomalies: 1 },
    { week: 'Sep W4', inspections: 8, anomalies: 3 },
    { week: 'Oct W1', inspections: 14, anomalies: 2 },
    { week: 'Oct W2', inspections: 10, anomalies: 3 },
  ];
  const kpis = [
    { label: 'Active Campaigns', value: campaigns.filter(c=>c.status==='active').length },
    { label: 'Total Inspections', value: inspections.length },
    { label: 'Anomaly Flags', value: inspections.filter(i=>i.anomalyFlags&&i.anomalyFlags.length>0).length, cls: 'kpi-warn' },
    { label: 'Warehouse Fill', value: Math.round(bins.reduce((a,b)=>a+b.allocated,0)/bins.reduce((a,b)=>a+b.maxCapacity,0)*100) + '%' },
  ];
  return (
    <div>
      <div className="kpi-grid">
        {kpis.map(k => (
          <div key={k.label} className="card kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className={`kpi-value ${k.cls||''}`}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 300, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>Weekly Inspection Throughput</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="inspections" stroke="#1D4ED8" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="anomalies" stroke="#B91C1C" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ flex: '0 0 200px', padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Reports</div>
          <button className="btn btn-primary w-full" style={{ marginBottom: 8 }} onClick={() => exportPDF('Management', kpis)}>Export PDF</button>
          <button className="btn btn-secondary w-full" onClick={() => exportExcel('Management', inspections.map(i => ({ ID: i.id, LotID: i.lotId, Crop: i.crop, Stage: i.stage, Flags: (i.anomalyFlags||[]).length, Volume: i.volume })))}>Export Excel</button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ role, campaigns, inspections, bins }) {
  const dashMap = {
    procurement: <ProcurementDash campaigns={campaigns} inspections={inspections} />,
    quality: <QualityDash inspections={inspections} />,
    warehouse: <WarehouseDash bins={bins} />,
    management: <ManagementDash campaigns={campaigns} inspections={inspections} bins={bins} />,
  };
  const labelMap = { procurement: 'Procurement', quality: 'Quality / Lab', warehouse: 'Warehouse', management: 'Management' };
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div className="section-title">{labelMap[role] || 'Dashboard'} Overview</div>
        <div className="section-sub">Live metrics and reporting for your role</div>
      </div>
      {dashMap[role] || <div className="section-sub">No dashboard for this role.</div>}
    </div>
  );
}
