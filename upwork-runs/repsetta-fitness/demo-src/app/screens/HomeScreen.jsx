import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { getTodayProgram, getExercises } from "../api/client";

export default function HomeScreen({ onStart }) {
  const [program, setProgram] = useState(null);
  const [exMap, setExMap] = useState({});

  useEffect(() => {
    (async () => {
      const [p, ex] = await Promise.all([getTodayProgram(), getExercises()]);
      setProgram(p);
      setExMap(Object.fromEntries(ex.map((e) => [e.id, e])));
    })();
  }, []);

  if (!program) {
    return (
      <View className="flex-1 items-center justify-center bg-root">
        <ActivityIndicator color="#e8b820" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-root" contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text className="text-secondary text-[11px] tracking-[3px] mb-1" style={{ fontFamily: "monospace" }}>
        TODAY
      </Text>
      <Text className="text-primary text-3xl font-bold mb-1">{program.name}</Text>
      <Text className="text-secondary text-sm mb-6">{program.focus || "Guided session"}</Text>

      <View className="bg-card rounded-2xl border border-border-default p-5 mb-5">
        <Text className="text-secondary text-[11px] tracking-[2px] mb-4" style={{ fontFamily: "monospace" }}>
          PROGRAM
        </Text>
        {program.exercises.map((pe, i) => {
          const ex = exMap[pe.exerciseId];
          return (
            <View
              key={i}
              className="flex-row items-center justify-between py-3 border-b border-border-subtle last:border-0"
            >
              <View>
                <Text className="text-primary text-base font-semibold">
                  {ex ? ex.name : `Exercise ${pe.exerciseId}`}
                </Text>
                <Text className="text-secondary text-xs mt-0.5" style={{ fontFamily: "monospace" }}>
                  {ex ? ex.muscle : ""}
                </Text>
              </View>
              <Text className="text-mustard font-semibold" style={{ fontFamily: "monospace" }}>
                {pe.targetSets} x {pe.targetReps} @ {pe.targetWeight}
              </Text>
            </View>
          );
        })}
      </View>

      <Pressable onPress={() => onStart(program)} className="bg-mustard rounded-2xl py-4 items-center">
        <Text className="text-root text-base font-bold">Start Session</Text>
      </Pressable>
      <Text className="text-muted text-xs text-center mt-3">
        Loads today's exercises into the workout logger.
      </Text>
    </ScrollView>
  );
}
