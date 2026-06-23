import { useState } from "react";
import InboundCall from "./components/InboundCall.jsx";
import OutboundDialer from "./components/OutboundDialer.jsx";
import CrmPanel from "./components/CrmPanel.jsx";
import Analytics from "./components/Analytics.jsx";

const TABS = [
  { id: "inbound", label: "Inbound", icon: "📞", desc: "AI Receptionist" },
  { id: "outbound", label: "Outbound", icon: "📤", desc: "Auto Dialer" },
  { id: "crm", label: "CRM", icon: "👥", desc: "Patient Records" },
  { id: "analytics", label: "Analytics", icon: "📊", desc: "Call Intelligence" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("inbound");
  const [language, setLanguage] = useState("en");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🩺</span>
          <span className="logo-text">TeleHealthy</span>
        </div>

        <nav className="sidebar-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`nav-item${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.desc}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="lang-row">
            <button
              className={`lang-btn${language === "en" ? " active" : ""}`}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
            <button
              className={`lang-btn${language === "es" ? " active" : ""}`}
              onClick={() => setLanguage("es")}
            >
              ES
            </button>
          </div>
          <div className="sim-label">AI Simulation</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1 className="content-title">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h1>
          <span className="ai-badge">Voice Ops Console</span>
        </header>

        <div className="content-body">
          {activeTab === "inbound" && <InboundCall language={language} />}
          {activeTab === "outbound" && <OutboundDialer language={language} />}
          {activeTab === "crm" && <CrmPanel />}
          {activeTab === "analytics" && <Analytics />}
        </div>
      </main>
    </div>
  );
}
