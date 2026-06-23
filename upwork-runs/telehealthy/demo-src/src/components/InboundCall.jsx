import { useState, useEffect, useRef, useCallback } from "react";
import { useWebLLM, detectIntent } from "../hooks/useWebLLM.js";
import { faqResponses, availableSlots, providers } from "../data/mockData.js";

// Conversation copy EN/ES
const COPY = {
  en: {
    greeting: "Thank you for calling TeleHealthy! I'm your AI health assistant. How can I help you today?",
    initChips: ["Book an appointment", "Ask about our hours", "Ask about insurance", "Ask about telehealth", "This is urgent"],
    bookAskWho: "I can help you schedule an appointment. Are you a new or existing patient?",
    bookWhoChips: ["New Patient", "Existing Patient"],
    bookAskName: (who) => `Wonderful! ${who === "New Patient" ? "Welcome to TeleHealthy! " : ""}May I have your full name, please?`,
    bookAskReason: (name) => `Thank you, ${name}. What's the reason for your visit today?`,
    bookReasonChips: ["Initial Evaluation", "Follow-up Visit", "Medication Review", "Telehealth Consult"],
    bookAskTime: (reason) => `Got it -- ${reason}. What date and time works best for you? We're available Monday through Friday, 8 AM to 6 PM.`,
    bookConfirm: (data) => `Perfect, ${data.name}! I've scheduled your ${data.reason} for ${data.slot} with ${data.provider}. You'll receive an SMS confirmation shortly. Is there anything else I can help with?`,
    bookConfirmChips: ["No, thank you!", "I have another question"],
    faqAsk: "Of course! What would you like to know?",
    faqTopics: ["Hours", "Insurance", "Telehealth", "New Patient", "Location"],
    faqFollowChips: ["Ask something else", "That's all, thank you"],
    closing: "It was my pleasure assisting you today. We look forward to seeing you at TeleHealthy. Goodbye and take care!",
    escalateLow: "I want to make sure you get the right support. Let me connect you with one of our care coordinators right away. Please hold.",
    escalateUrgent: "I'm connecting you immediately to our on-call clinical team. Please stay on the line.",
    endChips: ["End Call"],
    callerName: "Incoming Caller",
    callerPhone: "+1 (555) ??? ????",
  },
  es: {
    greeting: "¡Gracias por llamar a TeleHealthy! Soy su asistente de salud virtual. ¿En qué puedo ayudarle hoy?",
    initChips: ["Hacer una cita", "Preguntar sobre horarios", "Preguntar sobre seguro", "Preguntar sobre telesalud", "Es una urgencia"],
    bookAskWho: "Puedo ayudarle a programar una cita. ¿Es usted paciente nuevo o establecido?",
    bookWhoChips: ["Paciente Nuevo", "Paciente Establecido"],
    bookAskName: (who) => `¡Excelente! ${who === "Paciente Nuevo" ? "¡Bienvenido a TeleHealthy! " : ""}¿Podría darme su nombre completo?`,
    bookAskReason: (name) => `Gracias, ${name}. ¿Cuál es el motivo de su visita hoy?`,
    bookReasonChips: ["Evaluación Inicial", "Visita de Seguimiento", "Revisión de Medicación", "Consulta de Telesalud"],
    bookAskTime: (reason) => `Entendido -- ${reason}. ¿Qué fecha y hora le conviene? Tenemos disponibilidad de lunes a viernes, de 8 AM a 6 PM.`,
    bookConfirm: (data) => `¡Perfecto, ${data.name}! He programado su ${data.reason} para el ${data.slot} con ${data.provider}. Recibirá un SMS de confirmación en breve. ¿Hay algo más en lo que pueda ayudarle?`,
    bookConfirmChips: ["No, gracias", "Tengo otra pregunta"],
    faqAsk: "¡Claro! ¿Qué le gustaría saber?",
    faqTopics: ["Horarios", "Seguro", "Telesalud", "Nuevo Paciente", "Ubicación"],
    faqFollowChips: ["Preguntar algo más", "Es todo, gracias"],
    closing: "Ha sido un placer asistirle hoy. ¡Le esperamos en TeleHealthy! Adiós y que tenga un buen día.",
    escalateLow: "Quiero asegurarme de que reciba el apoyo adecuado. Permítame conectarle con uno de nuestros coordinadores ahora mismo. Por favor, espere.",
    escalateUrgent: "Le estoy conectando de inmediato con nuestro equipo clínico de guardia. Por favor, no cuelgue.",
    endChips: ["Finalizar Llamada"],
    callerName: "Llamada Entrante",
    callerPhone: "+1 (555) ??? ????",
  },
};

// FAQ key map (chip label → faqResponses key)
const FAQ_KEY_MAP = {
  Hours: "hours", Horarios: "hours",
  Insurance: "insurance", Seguro: "insurance",
  Telehealth: "telehealth", Telesalud: "telehealth",
  "New Patient": "New Patient", "Nuevo Paciente": "New Patient",
  Location: "location", Ubicación: "location",
};

// Pipeline nodes
const PIPELINE = ["Greeting", "Intent Detect", "Booking / FAQ", "Webhook", "SMS"];
const PIPELINE_ICONS = ["👋", "🧠", "📋", "🔗", "📱"];

function now() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatTimer(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function confidenceClass(c) {
  if (c >= 0.7) return "high";
  if (c >= 0.45) return "mid";
  return "low";
}

export default function InboundCall({ language = "en" }) {
  const c = COPY[language] || COPY.en;
  const { init, chat, status: llmStatus, loadProgress, loadStatusText, hasWebGPU, isReady } = useWebLLM(language);

  // ── Call state ──────────────────────────────────────────────────────
  const [callState, setCallState] = useState("idle"); // idle|connecting|active|ended
  const [callStatus, setCallStatus] = useState("idle"); // idle|connecting|active|transferring|ended
  const [phase, setPhase] = useState("greeting"); // conversation phase
  const [messages, setMessages] = useState([]);
  const [intent, setIntent] = useState(null); // BOOK|FAQ|ESCALATE|UNCLEAR|null
  const [confidence, setConfidence] = useState(0);
  const [pipelineStep, setPipelineStep] = useState(-1); // 0-4
  const [booking, setBooking] = useState({ who: null, name: null, reason: null, slot: null, provider: null });
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [smsLog, setSmsLog] = useState([]);
  const [timer, setTimer] = useState(0);
  const [quickReplies, setQuickReplies] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [transferInfo, setTransferInfo] = useState(null);
  const [llmHistory, setLlmHistory] = useState([]);

  const timerRef = useRef(null);
  const transcriptRef = useRef(null);

  // ── Timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (callState === "active") {
      timerRef.current = setInterval(() => setTimer((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Message helpers ─────────────────────────────────────────────────
  const addMsg = useCallback((role, text) => {
    setMessages((prev) => [...prev, { role, text, ts: now() }]);
    if (role === "ai") {
      setLlmHistory((prev) => [...prev, { role: "assistant", content: text }]);
    } else {
      setLlmHistory((prev) => [...prev, { role: "user", content: text }]);
    }
  }, []);

  const aiSay = useCallback((text, nextReplies = [], nextPhase = null, delay = 700) => {
    setTimeout(() => {
      addMsg("ai", text);
      if (nextReplies.length) setQuickReplies(nextReplies);
      else setQuickReplies([]);
      if (nextPhase) setPhase(nextPhase);
    }, delay);
  }, [addMsg]);

  // ── Start call ──────────────────────────────────────────────────────
  function startCall() {
    setCallState("connecting");
    setCallStatus("connecting");
    setMessages([]);
    setLlmHistory([]);
    setPhase("greeting");
    setIntent(null);
    setConfidence(0);
    setPipelineStep(-1);
    setBooking({ who: null, name: null, reason: null, slot: null, provider: null });
    setBookingConfirmed(null);
    setSmsLog([]);
    setTimer(0);
    setQuickReplies([]);
    setShowInput(false);
    setInputVal("");
    setTransferInfo(null);

    setTimeout(() => {
      setCallState("active");
      setCallStatus("active");
      setPipelineStep(0); // Greeting node
      aiSay(c.greeting, c.initChips, "greeting", 400);
    }, 1500);
  }

  // ── End call ────────────────────────────────────────────────────────
  function endCall() {
    setCallState("ended");
    setCallStatus("ended");
    setQuickReplies([]);
    setShowInput(false);
    clearInterval(timerRef.current);
  }

  // ── Handle user response ─────────────────────────────────────────────
  async function handleUserReply(text) {
    if (!text.trim()) return;
    addMsg("user", text);
    setInputVal("");
    setQuickReplies([]);
    setShowInput(false);

    // Attempt WebLLM if ready
    if (isReady && phase === "greeting") {
      const result = await chat(llmHistory, text);
      if (result) {
        const det = { intent: result.intent || "UNCLEAR", confidence: result.confidence || 0.5 };
        routeFromIntent(det, result.text);
        return;
      }
    }

    // Scripted fallback routing
    processPhase(text);
  }

  function routeFromIntent({ intent: det, confidence: conf }, aiText) {
    setPipelineStep(1); // Intent Detect
    setIntent(det);
    setConfidence(conf);
    if (aiText) addMsg("ai", aiText);

    if (det === "ESCALATE" || conf < 0.45) {
      triggerEscalation(conf < 0.45 ? "low" : "urgent");
    } else if (det === "BOOK") {
      setPipelineStep(2);
      aiSay(c.bookAskWho, c.bookWhoChips, "booking_who");
    } else if (det === "FAQ") {
      setPipelineStep(2);
      aiSay(c.faqAsk, c.faqTopics, "faq_topic");
    } else {
      aiSay(c.faqAsk, c.faqTopics, "faq_topic");
    }
  }

  function processPhase(text) {
    const lower = text.toLowerCase();

    if (phase === "greeting") {
      // Detect from quick chip or free text
      let det;
      if (text === c.initChips[4] || lower.includes("urgent") || lower.includes("emergency") || lower.includes("crisis")) {
        det = { intent: "ESCALATE", confidence: 0.34 };
      } else if (c.initChips.slice(0, 1).includes(text) || lower.includes("book") || lower.includes("appoint") || lower.includes("schedule") || lower.includes("hacer una cita")) {
        det = { intent: "BOOK", confidence: 0.88 };
      } else if (lower.includes("hour") || lower.includes("insurance") || lower.includes("telehealth") || lower.includes("telesalud") || lower.includes("horario") || lower.includes("seguro") || lower.includes("ubicac")) {
        det = { intent: "FAQ", confidence: 0.91 };
      } else {
        det = detectIntent(text);
      }

      setPipelineStep(1);
      setIntent(det.intent);
      setConfidence(det.confidence);

      if (det.intent === "ESCALATE" || det.confidence < 0.45) {
        triggerEscalation(det.confidence < 0.45 ? "low" : "urgent");
      } else if (det.intent === "BOOK") {
        setPipelineStep(2);
        aiSay(c.bookAskWho, c.bookWhoChips, "booking_who");
      } else {
        setPipelineStep(2);
        aiSay(c.faqAsk, c.faqTopics, "faq_topic");
      }

    } else if (phase === "booking_who") {
      setBooking((b) => ({ ...b, who: text }));
      aiSay(c.bookAskName(text), [], "booking_name", 600);
      setTimeout(() => setShowInput(true), 800);

    } else if (phase === "booking_name") {
      const name = text.trim() || "Patient";
      setBooking((b) => ({ ...b, name }));
      aiSay(c.bookAskReason(name), c.bookReasonChips, "booking_reason");

    } else if (phase === "booking_reason") {
      setBooking((b) => ({ ...b, reason: text }));
      aiSay(c.bookAskTime(text), availableSlots, "booking_time");

    } else if (phase === "booking_time") {
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const data = { ...booking, slot: text, provider };
      setBooking(data);
      aiSay(c.bookConfirm(data), c.bookConfirmChips, "booking_confirm", 800);
      setTimeout(() => {
        setBookingConfirmed(data);
        setPipelineStep(3); // Webhook
        setTimeout(() => {
          setPipelineStep(4); // SMS
          setSmsLog((prev) => [
            ...prev,
            {
              text: `SMS sent: Appointment confirmed for ${data.name} on ${data.slot} with ${data.provider} at TeleHealthy.`,
              ts: now(),
            },
          ]);
        }, 1200);
      }, 1200);

    } else if (phase === "booking_confirm") {
      if (text.includes("thank") || text.includes("gracias") || text === c.bookConfirmChips[0]) {
        aiSay(c.closing, [], "closing", 600);
        setTimeout(endCall, 3500);
      } else {
        setPipelineStep(2);
        aiSay(c.faqAsk, c.faqTopics, "faq_topic");
      }

    } else if (phase === "faq_topic") {
      const faqKey = FAQ_KEY_MAP[text] || "hours";
      const answer = (faqResponses[faqKey] || faqResponses.hours)[language] || faqResponses[faqKey]?.en;
      aiSay(answer, c.faqFollowChips, "faq_follow");
      setPipelineStep(3);

    } else if (phase === "faq_follow") {
      if (text.includes("else") || text.includes("another") || text.includes("otra") || text.includes("algo")) {
        aiSay(c.faqAsk, c.faqTopics, "faq_topic");
      } else {
        aiSay(c.closing, [], "closing", 600);
        setTimeout(endCall, 3500);
      }

    } else if (phase === "closing") {
      endCall();

    } else {
      // fallback for end chip
      if (text.includes("End") || text.includes("Finalizar")) endCall();
    }
  }

  function triggerEscalation(type) {
    setCallStatus("transferring");
    setPipelineStep(2);
    setIntent("ESCALATE");
    setConfidence(type === "low" ? 0.34 : 0.31);
    const msg = type === "urgent" ? c.escalateUrgent : c.escalateLow;
    aiSay(msg, [], "escalating", 600);
    setTimeout(() => {
      setTransferInfo({
        name: "Care Coordinator",
        ext: "x204",
        badge: type === "urgent" ? "ON-CALL CLINICAL" : "CARE COORDINATOR",
        note: type === "urgent"
          ? "Clinical escalation -- please hold for priority handoff."
          : "AI confidence below threshold (< 45%). Warm transfer initiated.",
      });
      setTimeout(endCall, 5000);
    }, 2000);
  }

  // ── Render helpers ──────────────────────────────────────────────────
  function renderStatusPill() {
    const labels = {
      idle: "IDLE",
      connecting: "CONNECTING",
      active: "ACTIVE",
      transferring: "TRANSFERRING",
      ended: "ENDED",
    };
    return (
      <span className={`status-pill ${callStatus}`}>
        <span className="status-dot" />
        {labels[callStatus] || "IDLE"}
      </span>
    );
  }

  function renderIntentBadge() {
    if (!intent) return null;
    const map = {
      BOOK: { cls: "book", label: "📅 BOOK APPT" },
      FAQ: { cls: "faq", label: "❓ FAQ" },
      ESCALATE: { cls: "escalate", label: "🚨 ESCALATE" },
      UNCLEAR: { cls: "unclear", label: "⚠ UNCLEAR" },
    };
    const b = map[intent];
    if (!b) return null;
    return <span className={`intent-badge ${b.cls}`}>{b.label}</span>;
  }

  function renderConfidenceBar() {
    if (!intent) return null;
    const pct = Math.round(confidence * 100);
    return (
      <div className="confidence-wrap">
        <div className="confidence-header">
          <span className="confidence-label-text">AI Confidence</span>
          <span className="confidence-value">{pct}%</span>
        </div>
        <div className="confidence-bar-bg">
          <div
            className={`confidence-bar-fill ${confidenceClass(confidence)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  function renderPipeline() {
    if (pipelineStep < 0) return null;
    return (
      <div className="pipeline-viz">
        {PIPELINE.map((label, i) => {
          const isEscalate = intent === "ESCALATE" && i === 2;
          const lit = i <= pipelineStep;
          const connLit = i < pipelineStep;
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", flex: i < PIPELINE.length - 1 ? "1" : undefined }}>
              <div className="pipeline-node">
                <div className={`pipeline-circle${lit ? (isEscalate ? " escalate-lit" : " lit") : ""}`}>
                  {lit ? (
                    <span style={{ color: "white", fontSize: 13 }}>{PIPELINE_ICONS[i]}</span>
                  ) : (
                    <span style={{ fontSize: 12, opacity: 0.4 }}>{PIPELINE_ICONS[i]}</span>
                  )}
                </div>
                <span className={`pipeline-node-label${lit ? " lit" : ""}`}>{label}</span>
              </div>
              {i < PIPELINE.length - 1 && (
                <div className={`pipeline-connector${connLit ? " lit" : ""}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── WebLLM Banner ───────────────────────────────────────────────────
  function renderLLMBanner() {
    const statusMap = {
      idle: hasWebGPU ? "WebGPU detected -- click to load Llama 3.2 1B" : "Scripted AI (WebGPU not available in this browser)",
      loading: `Loading model... ${loadProgress}% -- ${loadStatusText || "initializing"}`,
      ready: "Llama 3.2-1B-Instruct active (WebGPU)",
      error: "Model load failed -- using scripted AI",
      unavailable: "Scripted AI mode (WebGPU not detected)",
    };
    const dotClass = llmStatus === "ready" ? "ready" : llmStatus === "loading" ? "loading" : llmStatus === "error" ? "error" : "";

    return (
      <div className="webllm-banner">
        <div className="webllm-left" style={{ flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={`webllm-dot${dotClass ? " " + dotClass : ""}`} />
            <span className="webllm-status">{statusMap[llmStatus] || statusMap.idle}</span>
          </div>
          {llmStatus === "loading" && (
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${loadProgress}%` }} />
            </div>
          )}
        </div>
        {hasWebGPU && llmStatus === "idle" && (
          <button className="load-ai-btn" onClick={init}>Load AI</button>
        )}
      </div>
    );
  }

  // ── Idle state ──────────────────────────────────────────────────────
  if (callState === "idle") {
    return (
      <div>
        {renderLLMBanner()}
        <button className="start-call-btn" onClick={startCall}>
          <span className="start-call-icon">📞</span>
          <span className="start-call-label">Simulate Inbound Call</span>
          <span className="start-call-sub">Start a live AI receptionist session</span>
        </button>
        <div style={{ marginTop: 16, background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)", marginBottom: 10 }}>What this demo shows</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              ["📅", "Appointment booking", "Full multi-step scheduling with provider assignment"],
              ["❓", "FAQ handling", "Insurance, hours, telehealth, new patient info"],
              ["🚨", "Warm escalation", "Auto-transfer when confidence drops below 45%"],
              ["📱", "SMS confirmation", "Simulated webhook triggers + SMS log"],
              ["🧠", "Intent detection", "BOOK / FAQ / ESCALATE with live confidence meter"],
              ["🔗", "Pipeline viz", "Real-time automation flow visualization"],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ display: "flex", gap: 10, padding: "10px", background: "var(--bg)", borderRadius: 8 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Ended state ─────────────────────────────────────────────────────
  if (callState === "ended") {
    const wasEscalated = intent === "ESCALATE";
    const wasBooked = !!bookingConfirmed;
    return (
      <div>
        {renderLLMBanner()}
        <div className="call-ended-card">
          <div className="call-ended-icon">{wasEscalated ? "🚨" : wasBooked ? "✅" : "📞"}</div>
          <div className="call-ended-title">
            {wasEscalated ? "Call Escalated" : wasBooked ? "Appointment Booked" : "Call Completed"}
          </div>
          <div className="call-ended-sub">
            Duration: {formatTimer(timer)} &nbsp;|&nbsp; Intent: {intent || "N/A"} &nbsp;|&nbsp; Confidence: {Math.round(confidence * 100)}%
          </div>
          {wasBooked && bookingConfirmed && (
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, textAlign: "left" }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--primary)", marginBottom: 8 }}>Booking Summary</div>
              {[["Patient", bookingConfirmed.name], ["Reason", bookingConfirmed.reason], ["Appointment", bookingConfirmed.slot], ["Provider", bookingConfirmed.provider]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          )}
          {smsLog.length > 0 && (
            <div style={{ background: "#F0FDFA", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, textAlign: "left" }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--primary)", marginBottom: 6 }}>SMS Sent</div>
              {smsLog.map((s, i) => <div key={i} style={{ fontSize: 12, color: "var(--text)" }}>{s.text}</div>)}
            </div>
          )}
          <button className="new-call-btn" onClick={() => { setCallState("idle"); setCallStatus("idle"); }}>
            Start New Call
          </button>
        </div>
      </div>
    );
  }

  // ── Active call ─────────────────────────────────────────────────────
  return (
    <div>
      {renderLLMBanner()}
      <div className="inbound-layout">
        {/* LEFT: Transcript + Input */}
        <div className="inbound-main">
          {/* Call card top */}
          <div className="call-card">
            <div className="call-card-top">
              <div className="avatar-wrap">
                <div className={`avatar-circle${callStatus === "active" || callStatus === "transferring" ? " live" : ""}`}>
                  📞
                </div>
              </div>
              <div className="call-info">
                <div className="call-info-name">{c.callerName}</div>
                <div className="call-info-phone">{c.callerPhone}</div>
              </div>
              <div className="call-timer">{formatTimer(timer)}</div>
            </div>

            <div className="status-row">
              {renderStatusPill()}
              {renderIntentBadge()}
            </div>

            {renderConfidenceBar()}

            <div className={`waveform${callStatus === "active" ? " active" : ""}`}>
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
            </div>

            {renderPipeline()}
          </div>

          {/* Transcript */}
          <div className="transcript-panel" ref={transcriptRef}>
            {messages.length === 0 ? (
              <div className="transcript-empty">Connecting...</div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`transcript-msg ${m.role}`}>
                  <div className={`bubble ${m.role}`}>{m.text}</div>
                  <div className="bubble-time">{m.ts}</div>
                </div>
              ))
            )}
          </div>

          {/* Quick replies + text input */}
          {quickReplies.length > 0 && (
            <div className="quick-replies">
              {quickReplies.map((r) => (
                <button key={r} className="quick-chip" onClick={() => handleUserReply(r)}>
                  {r}
                </button>
              ))}
            </div>
          )}

          {showInput && (
            <div className="call-input-row">
              <input
                className="call-input"
                placeholder="Type your name..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && inputVal.trim()) handleUserReply(inputVal); }}
                autoFocus
              />
              <button className="call-send-btn" onClick={() => { if (inputVal.trim()) handleUserReply(inputVal); }}>
                Send
              </button>
            </div>
          )}

          {callStatus === "active" && phase !== "closing" && (
            <div style={{ marginTop: 10 }}>
              <button className="end-call-btn" onClick={endCall}>End Call</button>
            </div>
          )}
        </div>

        {/* RIGHT: Status cards */}
        <div className="inbound-sidebar">
          {/* Booking card */}
          {bookingConfirmed && (
            <div className="booking-card">
              <div className="booking-card-title">✅ Appointment Confirmed</div>
              {[["Patient", bookingConfirmed.name], ["Reason", bookingConfirmed.reason], ["Date & Time", bookingConfirmed.slot], ["Provider", bookingConfirmed.provider]].map(([k, v]) => (
                <div key={k} className="booking-row">
                  <span className="booking-row-label">{k}</span>
                  <span className="booking-row-value">{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Transfer card */}
          {transferInfo && (
            <div className="transfer-card">
              <div className="transfer-card-title">🚨 {transferInfo.badge}</div>
              <div className="transfer-card-text">{transferInfo.note}</div>
              <div className="transfer-coordinator">
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{transferInfo.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                  Extension {transferInfo.ext} &nbsp;•&nbsp; On hold...
                </div>
              </div>
            </div>
          )}

          {/* SMS Log */}
          <div className="sms-log">
            <div className="sms-log-header">📱 SMS Log</div>
            {smsLog.length === 0 ? (
              <div className="sms-empty">No messages sent yet</div>
            ) : (
              smsLog.map((s, i) => (
                <div key={i} className="sms-item">
                  <span className="sms-icon">💬</span>
                  <div className="sms-body">
                    <div className="sms-text">{s.text}</div>
                    <div className="sms-time">{s.ts}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Live stats */}
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)", marginBottom: 10 }}>Session Stats</div>
            {[
              ["Duration", formatTimer(timer)],
              ["AI Engine", isReady ? "WebGPU LLM" : "Scripted"],
              ["Language", language === "es" ? "Español" : "English"],
              ["Intent", intent || "--"],
              ["Phase", phase.replace(/_/g, " ")],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)" }}>{k}</span>
                <span style={{ fontWeight: 600, fontFamily: k === "Duration" ? "'DM Mono', monospace" : undefined }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
