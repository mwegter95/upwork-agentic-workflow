import "./global.css";
import React, { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import HomeScreen from "./app/screens/HomeScreen";
import WorkoutLogScreen from "./app/screens/WorkoutLogScreen";
import ProgressScreen from "./app/screens/ProgressScreen";

const TABS = [
  { key: "today", label: "Today", icon: "◆" },
  { key: "log", label: "Log", icon: "✚" },
  { key: "progress", label: "Progress", icon: "▤" },
];

export default function App() {
  const [tab, setTab] = useState("today");
  const [seedProgram, setSeedProgram] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const startSession = (program) => {
    setSeedProgram(program);
    setTab("log");
  };

  const onSaved = () => {
    setRefreshKey((k) => k + 1);
    setTab("progress");
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View className="flex-1 bg-root" style={{ maxWidth: 480, width: "100%", alignSelf: "center" }}>
        <SafeAreaView className="flex-1 bg-root" edges={["top"]}>
          {/* Brand header */}
          <View className="px-5 pt-3 pb-3 border-b border-border-subtle flex-row items-center">
            <View className="w-7 h-7 rounded-md bg-mustard items-center justify-center mr-2.5">
              <Text className="text-root font-bold">R</Text>
            </View>
            <Text className="text-primary text-lg font-bold tracking-[1px]">REPSETTA</Text>
          </View>

          <View className="flex-1">
            {tab === "today" && <HomeScreen onStart={startSession} />}
            {tab === "log" && (
              <WorkoutLogScreen key={refreshKey + "log"} seedProgram={seedProgram} onSaved={onSaved} />
            )}
            {tab === "progress" && <ProgressScreen refreshKey={refreshKey} />}
          </View>

          {/* Bottom tab bar */}
          <View className="flex-row border-t border-border-default bg-surface" style={{ paddingBottom: Platform.OS === "web" ? 8 : 20, paddingTop: 8 }}>
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  className="flex-1 items-center py-1.5"
                >
                  <Text className="text-xl" style={{ color: active ? "#e8b820" : "#4a4858" }}>
                    {t.icon}
                  </Text>
                  <Text
                    className="text-[10px] mt-0.5 tracking-[1px]"
                    style={{ fontFamily: "monospace", color: active ? "#f2ede4" : "#8a8898" }}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}
