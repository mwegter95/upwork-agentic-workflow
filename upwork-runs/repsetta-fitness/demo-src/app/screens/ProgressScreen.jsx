import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { getProgress, getWorkouts, getExercises } from "../api/client";
import { StatCard, TrendChart } from "../components/Charts";

export default function ProgressScreen({ refreshKey }) {
  const [progress, setProgress] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [exMap, setExMap] = useState({});

  useEffect(() => {
    (async () => {
      const [p, w, ex] = await Promise.all([getProgress(), getWorkouts(), getExercises()]);
      setProgress(p);
      setWorkouts(w);
      setExMap(Object.fromEntries(ex.map((e) => [e.id, e])));
    })();
  }, [refreshKey]);

  if (!progress) {
    return (
      <View className="flex-1 items-center justify-center bg-root">
        <ActivityIndicator color="#e8b820" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-root" contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text className="text-secondary text-[11px] tracking-[3px] mb-1" style={{ fontFamily: "monospace" }}>
        PROGRESS
      </Text>
      <Text className="text-primary text-3xl font-bold mb-5">Your Stats</Text>

      <View className="flex-row gap-3 mb-3">
        <StatCard label="WORKOUTS" value={progress.totalWorkouts} accent="#12b4c8" />
        <StatCard label="STREAK" value={`${progress.currentStreak}d`} accent="#6ed46a" />
      </View>
      <View className="mb-5">
        <StatCard label="TOTAL VOLUME (LB)" value={Number(progress.totalVolume).toLocaleString()} accent="#e8b820" />
      </View>

      {progress.trend && progress.trend.length > 0 && (
        <View className="mb-6">
          <TrendChart data={progress.trend} />
        </View>
      )}

      <Text className="text-secondary text-[11px] tracking-[2px] mb-3" style={{ fontFamily: "monospace" }}>
        HISTORY
      </Text>
      {workouts.map((w) => {
        const vol = w.sets.reduce((s, x) => s + Number(x.reps) * Number(x.weight), 0);
        const exCount = new Set(w.sets.map((s) => s.exerciseId)).size;
        return (
          <View key={w.id} className="bg-card rounded-xl border border-border-default p-4 mb-2.5">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-primary text-base font-semibold">{w.name}</Text>
              <Text className="text-secondary text-xs" style={{ fontFamily: "monospace" }}>
                {w.date}
              </Text>
            </View>
            <Text className="text-secondary text-xs" style={{ fontFamily: "monospace" }}>
              {w.sets.length} sets · {exCount} exercises · {vol.toLocaleString()} lb
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}
