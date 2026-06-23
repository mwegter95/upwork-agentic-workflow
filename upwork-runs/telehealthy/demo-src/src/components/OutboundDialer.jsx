import { useState, useRef } from "react";
import { crmContacts, outboundScripts } from "../data/mockData.js";

const REMINDER_LABEL = {
  appointment_reminder: { label: "APPT", cls: "appt" },
  reactivation_outreach: { label: "REACT", cls: "react" },
  post_visit_followup: { label: "FOLLOW", cls: "followup" },
};

function initials(name) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function ScriptVar({ children }) {
  return <span className="script-var">{children}</span>;
}

function renderScript(contact) {
  const { name, scriptVars, reminderType } = contact;
  const vars = { name, ...scriptVars };
  const lines = outboundScripts[reminderType]?.(vars) || [];

  const typeLabels = {
    appointment_reminder: "Appointment Reminder",
    reactivation_outreach: "Reactivation Outreach",
    post_visit_followup: "Post-Visit Follow-Up",
  };

  return { lines, typeLabel: typeLabels[reminderType] || reminderType };
}

function highlightVars(text, vars) {
  // Bold any occurrence of variable values
  const parts = [];
  let remaining = text;
  const sorted = Object.entries(vars).sort((a, b) => b[1].length - a[1].length);

  for (const [, val] of sorted) {
    if (!val || val === "undefined") continue;
    const idx = remaining.indexOf(val);
    if (idx !== -1) {
      if (idx > 0) parts.push(remaining.slice(0, idx));
      parts.push({ type: "var", val });
      remaining = remaining.slice(idx + val.length);
    }
  }
  parts.push(remaining);

  return parts.map((p, i) =>
    typeof p === "string" ? (
      <span key={i}>{p}</span>
    ) : (
      <ScriptVar key={i}>{p.val}</ScriptVar>
    )
  );
}

export default function OutboundDialer({ language = "en" }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [callState, setCallState] = useState("idle"); // idle|connecting|active|ended
  const [progress, setProgress] = useState([]); // shown lines so far
  const lineRef = useRef(null);

  const filtered = crmContacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.provider.toLowerCase().includes(q) ||
      c.tags.some((t) => t.includes(q))
    );
  });

  function startOutboundCall() {
    if (!selected) return;
    setCallState("connecting");
    setProgress([]);

    const { lines } = renderScript(selected);
    const vars = { name: selected.name, ...selected.scriptVars };

    setTimeout(() => {
      setCallState("active");
      let delay = 300;
      lines.forEach((line, idx) => {
        const dur = line.speaker === "ai" ? 2200 : 1400;
        setTimeout(() => {
          setProgress((prev) => [...prev, line]);
          if (lineRef.current) lineRef.current.scrollTop = lineRef.current.scrollHeight;
        }, delay);
        delay += dur;
      });
      setTimeout(() => setCallState("ended"), delay);
    }, 1600);
  }

  function reset() {
    setCallState("idle");
    setProgress([]);
  }

  const { lines: scriptLines, typeLabel } = selected ? renderScript(selected) : { lines: [], typeLabel: "" };
  const vars = selected ? { name: selected.name, ...selected.scriptVars } : {};

  return (
    <div className="outbound-layout">
      {/* LEFT: Contact List */}
      <div className="contact-panel">
        <div className="contact-panel-header">CRM Contacts ({filtered.length})</div>
        <input
          className="contact-search"
          placeholder="Search name, provider, tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="contact-list">
          {filtered.map((c) => {
            const rb = REMINDER_LABEL[c.reminderType] || { label: "?", cls: "appt" };
            return (
              <div
                key={c.id}
                className={`contact-item${selected?.id === c.id ? " selected" : ""}`}
                onClick={() => { setSelected(c); setCallState("idle"); setProgress([]); }}
              >
                <div className="contact-avatar">{initials(c.name)}</div>
                <div className="contact-name-wrap">
                  <div className="contact-name">{c.name}</div>
                  <div className="contact-type">{c.provider} &bull; {c.patientStatus}</div>
                </div>
                <span className={`reminder-badge ${rb.cls}`}>{rb.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Script + Call */}
      <div className="outbound-main">
        {!selected ? (
          <div className="script-card">
            <div className="script-empty">
              <span style={{ fontSize: 36 }}>👥</span>
              <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Select a contact</div>
              <div style={{ marginTop: 4, color: "var(--text-muted)", fontSize: 12 }}>Choose a patient from the CRM list to generate their dynamic outbound script</div>
            </div>
          </div>
        ) : (
          <>
            {/* Contact info card */}
            <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="contact-avatar" style={{ width: 44, height: 44, fontSize: 14, flexShrink: 0 }}>{initials(selected.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {selected.phone} &bull; {selected.insurance} &bull; {selected.provider}
                  </div>
                  <div style={{ marginTop: 5, display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {selected.tags.map((t) => <span key={t} className="tag-pill">{t}</span>)}
                    <span className={`patient-status ${selected.patientStatus}`}>{selected.patientStatus}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Last Visit</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, marginTop: 2 }}>{selected.lastVisit || "N/A"}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 6 }}>Next Appt</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, marginTop: 2 }}>{selected.nextAppt?.split(" ")[0] || "None"}</div>
                </div>
              </div>
            </div>

            {/* Script preview */}
            <div className="script-card">
              <div className="script-header">
                <span className="script-title">Outbound Script</span>
                <span className="script-type-badge">{typeLabel}</span>
              </div>
              <div className="script-body">
                {scriptLines.map((line, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px",
                      color: line.speaker === "ai" ? "var(--primary)" : "var(--text-muted)",
                      marginRight: 8,
                    }}>
                      {line.speaker === "ai" ? "AI" : "Patient"}
                    </span>
                    <span>{highlightVars(line.text, vars)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Call actions */}
            <div className="outbound-actions">
              <button
                className="start-outbound-btn"
                onClick={callState === "idle" || callState === "ended" ? startOutboundCall : undefined}
                disabled={callState === "connecting" || callState === "active"}
              >
                {callState === "connecting" ? "⏳ Connecting..." :
                  callState === "active" ? "📞 Call in Progress..." :
                    callState === "ended" ? "🔄 Call Again" : "📤 Start Outbound Call"}
              </button>
              {callState === "ended" && (
                <button onClick={reset} style={{ padding: "10px 16px", border: "1px solid var(--border)", borderRadius: 10, background: "white", fontFamily: "Inter,sans-serif", fontSize: 13, cursor: "pointer", color: "var(--text-muted)" }}>
                  Reset
                </button>
              )}
            </div>

            {/* Live call panel */}
            {(callState === "active" || callState === "connecting" || callState === "ended") && (
              <div className="outbound-call-panel">
                <div className="outbound-call-header">
                  <div className={`avatar-circle${callState === "active" ? " live" : ""}`} style={{ width: 40, height: 40, fontSize: 14 }}>
                    {initials(selected.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selected.phone}</div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <span className={`status-pill ${callState === "active" ? "active" : callState === "connecting" ? "connecting" : "ended"}`}>
                      <span className="status-dot" />
                      {callState === "connecting" ? "CONNECTING" : callState === "active" ? "ACTIVE" : "COMPLETED"}
                    </span>
                  </div>
                </div>

                <div ref={lineRef} style={{ maxHeight: 280, overflowY: "auto" }}>
                  {callState === "connecting" && (
                    <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 13 }}>
                      ⏳ Placing call...
                    </div>
                  )}
                  {progress.map((line, i) => (
                    <div key={i} className="outbound-line">
                      <span className={`outbound-speaker ${line.speaker}`}>
                        {line.speaker === "ai" ? "AI" : "Patient"}
                      </span>
                      <span className={`outbound-bubble ${line.speaker}`}>
                        {highlightVars(line.text, vars)}
                      </span>
                    </div>
                  ))}
                  {callState === "ended" && progress.length > 0 && (
                    <div style={{ textAlign: "center", marginTop: 14, padding: "10px", background: "#D1FAE5", borderRadius: 8, fontSize: 12, color: "#065F46", fontWeight: 700 }}>
                      ✅ Call completed successfully
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
