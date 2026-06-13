import React from "react";
import { View, Text } from "react-native";
import Svg, { Rect, Line } from "react-native-svg";

export function StatCard({ label, value, accent = "#e8b820" }) {
  return (
    <View className="flex-1 bg-card rounded-xl border border-border-default p-3.5">
      <Text className="text-secondary text-[10px] tracking-[1.5px] mb-1.5" style={{ fontFamily: "monospace" }}>
        {label}
      </Text>
      <Text className="text-2xl font-bold" style={{ color: accent }}>
        {value}
      </Text>
    </View>
  );
}

// Simple volume bar chart drawn with react-native-svg (no chart lib).
export function TrendChart({ data }) {
  const W = 300;
  const H = 150;
  const pad = 24;
  const max = Math.max(1, ...data.map((d) => d.volume));
  const n = data.length || 1;
  const barW = (W - pad * 2) / n - 10;

  return (
    <View className="bg-card rounded-xl border border-border-default p-4">
      <Text className="text-secondary text-[11px] tracking-[2px] mb-3" style={{ fontFamily: "monospace" }}>
        VOLUME PER SESSION (LB)
      </Text>
      <Svg width={W} height={H}>
        <Line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#2c2a38" strokeWidth={1} />
        {data.map((d, i) => {
          const h = ((H - pad * 2) * d.volume) / max;
          const x = pad + i * ((W - pad * 2) / n) + 5;
          return (
            <Rect
              key={i}
              x={x}
              y={H - pad - h}
              width={barW}
              height={h}
              rx={4}
              fill={i === data.length - 1 ? "#e8b820" : "#12b4c8"}
            />
          );
        })}
      </Svg>
      <View className="flex-row justify-between px-5 mt-1">
        {data.map((d, i) => (
          <Text key={i} className="text-muted text-[9px]" style={{ fontFamily: "monospace" }}>
            {d.date.slice(5)}
          </Text>
        ))}
      </View>
    </View>
  );
}
