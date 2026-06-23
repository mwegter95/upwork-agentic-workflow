import { useState } from "react";
import { crmContacts } from "../data/mockData.js";

const REMINDER_LABELS = {
  appointment_reminder: "Reminder",
  reactivation_outreach: "Reactivation",
  post_visit_followup: "Follow-Up",
};

function initials(name) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function CrmPanel() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const filtered = crmContacts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.insurance.toLowerCase().includes(q) ||
      c.provider.toLowerCase().includes(q) ||
      c.tags.some((t) => t.includes(q));
    const matchStatus = filterStatus === "all" || c.patientStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  function toggleExpand(id) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="crm-toolbar">
        <input
          className="crm-search"
          placeholder="Search name, insurance, provider, tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {["all", "existing", "new", "inactive"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: "1.5px solid",
              borderColor: filterStatus === s ? "var(--primary)" : "var(--border-mid)",
              background: filterStatus === s ? "#CCFBF1" : "white",
              color: filterStatus === s ? "var(--primary-dark)" : "var(--text-muted)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {s === "all" ? `All (${crmContacts.length})` : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Phone</th>
              <th>Insurance</th>
              <th>Provider</th>
              <th>Last Visit</th>
              <th>Next Appt</th>
              <th>Status</th>
              <th>Tags</th>
              <th>Campaign</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <>
                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => toggleExpand(c.id)}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="contact-avatar" style={{ width: 30, height: 30, fontSize: 11, flexShrink: 0 }}>{initials(c.name)}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text)" }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{c.phone}</td>
                  <td style={{ fontSize: 12 }}>{c.insurance}</td>
                  <td style={{ fontSize: 12, fontWeight: 500 }}>{c.provider}</td>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--text-muted)" }}>
                    {c.lastVisit || <span style={{ color: "#94A3B8" }}>None</span>}
                  </td>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                    {c.nextAppt ? (
                      <span style={{ color: "var(--primary)", fontWeight: 600 }}>{c.nextAppt.split(" ")[0]}</span>
                    ) : (
                      <span style={{ color: "#94A3B8" }}>--</span>
                    )}
                  </td>
                  <td>
                    <span className={`patient-status ${c.patientStatus}`}>{c.patientStatus}</span>
                  </td>
                  <td>
                    {c.tags.map((t) => <span key={t} className="tag-pill">{t}</span>)}
                  </td>
                  <td style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {REMINDER_LABELS[c.reminderType] || c.reminderType}
                  </td>
                  <td>
                    <button className="crm-action-btn" onClick={(e) => { e.stopPropagation(); toggleExpand(c.id); }}>
                      {expanded === c.id ? "Close" : "View"}
                    </button>
                  </td>
                </tr>
                {expanded === c.id && (
                  <tr key={`${c.id}-detail`}>
                    <td colSpan={10} style={{ padding: 0, background: "#F0FDFA" }}>
                      <div style={{ padding: "14px 20px", borderTop: "2px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)", marginBottom: 8 }}>Contact Details</div>
                          {[["Email", c.email], ["Phone", c.phone], ["Language", c.language === "es" ? "Spanish" : "English"]].map(([k, v]) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                              <span style={{ color: "var(--text-muted)" }}>{k}</span>
                              <span style={{ fontWeight: 500 }}>{v}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)", marginBottom: 8 }}>Care Details</div>
                          {[["Provider", c.provider], ["Insurance", c.insurance], ["Last Visit", c.lastVisit || "N/A"], ["Next Appt", c.nextAppt || "Not scheduled"]].map(([k, v]) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                              <span style={{ color: "var(--text-muted)" }}>{k}</span>
                              <span style={{ fontWeight: 500 }}>{v}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)", marginBottom: 8 }}>Script Variables</div>
                          {Object.entries(c.scriptVars).map(([k, v]) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                              <span style={{ color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{k}</span>
                              <span className="script-var" style={{ fontSize: 11 }}>{v}</span>
                            </div>
                          ))}
                          <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>Campaign Type</div>
                            <span className={`reminder-badge ${c.reminderType === "appointment_reminder" ? "appt" : c.reminderType === "reactivation_outreach" ? "react" : "followup"}`} style={{ fontSize: 11 }}>
                              {REMINDER_LABELS[c.reminderType]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No contacts match your search.
          </div>
        )}
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)", textAlign: "right" }}>
        Showing {filtered.length} of {crmContacts.length} patients &bull; Powered by GoHighLevel-style CRM schema
      </div>
    </div>
  );
}
