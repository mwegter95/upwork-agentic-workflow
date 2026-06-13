import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";

// Live rest timer between sets. setInterval countdown with a circular SVG
// progress ring, plus start/skip/+15s controls. Web-safe audio cue via the
// Web Audio API when the timer hits zero (no native audio module).

const SIZE = 168;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

function beep() {
  try {
    if (typeof window === "undefined" || !window.AudioContext) return;
    const ctx = new window.AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {}
}

export default function RestTimer({ duration = 90, onDone }) {
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(true);
  const total = useRef(duration);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          beep();
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const pct = total.current > 0 ? remaining / total.current : 0;
  const dashoffset = CIRC * (1 - pct);
  const mm = String(Math.floor(remaining / 60)).padStart(1, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const addTime = () => {
    total.current += 15;
    setRemaining((r) => r + 15);
    if (!running) setRunning(true);
  };

  return (
    <View className="items-center bg-card rounded-2xl border border-border-default p-5">
      <Text className="text-secondary text-[11px] tracking-[2px] mb-3" style={{ fontFamily: "monospace" }}>
        REST TIMER
      </Text>
      <View style={{ width: SIZE, height: SIZE }} className="items-center justify-center">
        <Svg width={SIZE} height={SIZE} style={{ position: "absolute" }}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="#2c2a38" strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={remaining === 0 ? "#6ed46a" : "#e8b820"}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRC}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <Text className="text-primary text-5xl font-bold" style={{ fontFamily: "monospace" }}>
          {mm}:{ss}
        </Text>
      </View>

      <View className="flex-row gap-3 mt-5">
        <Pressable
          onPress={() => setRunning((v) => !v)}
          className="px-4 py-2 rounded-lg bg-surface border border-border-default"
        >
          <Text className="text-primary font-semibold">{running ? "Pause" : "Resume"}</Text>
        </Pressable>
        <Pressable onPress={addTime} className="px-4 py-2 rounded-lg bg-surface border border-border-default">
          <Text className="text-primary font-semibold">+15s</Text>
        </Pressable>
        <Pressable onPress={onDone} className="px-4 py-2 rounded-lg bg-mustard">
          <Text className="text-root font-bold">Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}
