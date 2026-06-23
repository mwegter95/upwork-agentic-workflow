import { useState, useRef } from "react";

const SYSTEM_PROMPT_EN = `You are TeleHealthy's AI receptionist for a medical/psychiatry practice. Be concise, warm, professional. After EVERY response, on a new line append ONLY this JSON: {"intent":"BOOK|FAQ|ESCALATE","confidence":0.0} where confidence is 0.0 to 1.0. Keep responses to 1-2 sentences max.`;

const SYSTEM_PROMPT_ES = `Eres la recepcionista de IA de TeleHealthy para una clinica medica. Se concisa, calida y profesional. Despues de CADA respuesta, en una linea nueva agrega solo este JSON: {"intent":"BOOK|FAQ|ESCALATE","confidence":0.0}. Respuestas en 1-2 oraciones maximo.`;

export function useWebLLM(language = "en") {
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error | unavailable
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadStatusText, setLoadStatusText] = useState("");
  const engineRef = useRef(null);

  const hasWebGPU =
    typeof navigator !== "undefined" && typeof navigator.gpu !== "undefined" && !!navigator.gpu;

  async function init() {
    if (!hasWebGPU) {
      setStatus("unavailable");
      return;
    }
    try {
      setStatus("loading");
      setLoadProgress(0);
      const webllm = await import("https://esm.run/@mlc-ai/web-llm");
      engineRef.current = await webllm.CreateMLCEngine(
        "Llama-3.2-1B-Instruct-q4f16_1-MLC",
        {
          initProgressCallback: ({ progress, text }) => {
            setLoadProgress(Math.round((progress || 0) * 100));
            setLoadStatusText(text || "");
          },
        }
      );
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  // Returns { text, intent, confidence } or null if engine not ready
  async function chat(history, userInput) {
    if (!engineRef.current) return null;
    try {
      const systemPrompt = language === "es" ? SYSTEM_PROMPT_ES : SYSTEM_PROMPT_EN;
      const reply = await engineRef.current.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: userInput },
        ],
        temperature: 0.4,
        max_tokens: 150,
      });
      const raw = reply.choices[0].message.content;
      // Parse the appended JSON confidence line
      const jsonMatch = raw.match(/\{[^}]+\}/);
      let intent = null, confidence = 0.75;
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          intent = parsed.intent;
          confidence = parsed.confidence;
        } catch {}
      }
      const text = raw.replace(/\{[^}]+\}/, "").trim();
      return { text, intent, confidence };
    } catch {
      return null;
    }
  }

  return {
    init,
    chat,
    status,
    loadProgress,
    loadStatusText,
    hasWebGPU,
    isReady: status === "ready",
  };
}

// Scripted fallback intent detection (keyword-based)
export function detectIntent(text) {
  const lower = text.toLowerCase();
  const escalateKW = ["emergency", "crisis", "suicidal", "prescription", "refill", "urgent", "chest pain", "hurt myself", "medication"];
  const bookKW = ["book", "schedule", "appointment", "see doctor", "visit", "available", "slot", "reschedule", "cancel"];
  const faqKW = ["hours", "open", "insurance", "telehealth", "online", "location", "address", "new patient", "eligibility", "cost", "accept", "video"];

  if (escalateKW.some((k) => lower.includes(k))) return { intent: "ESCALATE", confidence: 0.34 };
  if (bookKW.some((k) => lower.includes(k))) return { intent: "BOOK", confidence: 0.87 };
  if (faqKW.some((k) => lower.includes(k))) return { intent: "FAQ", confidence: 0.91 };
  return { intent: "UNCLEAR", confidence: 0.43 };
}
