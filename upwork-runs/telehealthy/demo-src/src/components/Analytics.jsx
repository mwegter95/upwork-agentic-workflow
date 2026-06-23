import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { analyticsData } from "../data/mockData.js";

const { callVolume, intentBreakdown, kpis, transcripts } = analyticsData;
const INTENT_COLORS = ["#0D9488", "#059669", "#EF4444"];

const KPI_CARDS = [
  { label: "Total Calls (7d)", value: kpis.totalCalls, sub: "this week", icon: "📞" },
  { label: "Booking Rate", value: kpis.bookingRate, sub: "of inbound calls", icon: "📅" },
  { label: "Escalation Rate", value: kpis.escalationRate, sub: "warm transfers", icon: "🚨" },
  { label: "Avg Confidence", value: kpis.avgConfidence, sub: "AI accuracy score", icon: "🧠" },
  { label: "Avg Handle Time", value: kpis.avgHandleTime, sub: "per call", icon: "⏱" },
  { label: "SMS Sent", value: kpis.smsConfirmations, sub: "confirmations", icon: "📱" },
];

function IntentCell({ intent }) {
  const cls = intent === "BOOK" ? "book" : intent === "FAQ" ? "faq" : "escalate";
  return <span className={`intent-cell ${cls}`}>{intent}</span>;
}

function ConfidenceMini({ value }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.7 ? "#10B981" : value >= 0.45 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 60, height: 5, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span className="conf-mono">{pct}%</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "white", border: "1px solid #CCFBF1", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
        <div style={{ color: "#0D9488" }}>{payload[0].value} calls</div>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "white", border: "1px solid #CCFBF1", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
        <div style={{ fontWeight: 700 }}>{payload[0].name}</div>
        <div style={{ color: "#0D9488" }}>{payload[0].value}%</div>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  return (
    <div>
      {/* KPI Cards */}
      <div className="kpi-grid">
        {KPI_CARDS.map((card) => (
          <div key={card.label} className="kpi-card">
            <div className="kpi-label">{card.icon} {card.label}</div>
            <div className="kpi-value">{card.value}</div>
            <div className="kpi-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Bar chart */}
        <div className="chart-card">
          <div className="chart-title">Call Volume (Last 7 Days)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={callVolume} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CCFBF1" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="calls" fill="#0D9488" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie / Doughnut */}
        <div className="chart-card">
          <div className="chart-title">Intent Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <PieChart width={160} height={160}>
              <Pie
                data={intentBreakdown}
                cx={80}
                cy={80}
                innerRadius={48}
                outerRadius={72}
                dataKey="value"
                paddingAngle={3}
              >
                {intentBreakdown.map((_, i) => (
                  <Cell key={i} fill={INTENT_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
              {intentBreakdown.map((item, i) => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)" }}>
                  <span className="legend-dot" style={{ background: INTENT_COLORS[i] }} />
                  {item.name} — <strong style={{ color: "var(--text)" }}>{item.value}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Log */}
      <div className="analytics-section-title">Recent Call Transcripts</div>
      <div className="transcript-log-wrap">
        <table className="transcript-log-table">
          <thead>
            <tr>
              <th>Caller ID</th>
              <th>Intent</th>
              <th>Duration</th>
              <th>Confidence</th>
              <th>Summary</th>
              <th>Escalated</th>
            </tr>
          </thead>
          <tbody>
            {transcripts.map((t) => (
              <tr key={t.id}>
                <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{t.caller}</td>
                <td><IntentCell intent={t.intent} /></td>
                <td style={{ fontFamily: "'DM Mono', monospace" }}>{t.duration}</td>
                <td><ConfidenceMini value={t.confidence} /></td>
                <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{t.summary}</td>
                <td style={{ textAlign: "center", fontSize: 16 }}>
                  {t.escalated ? "🚨" : "✅"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
