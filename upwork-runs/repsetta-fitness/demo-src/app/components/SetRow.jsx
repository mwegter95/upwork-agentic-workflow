import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";

// One logged set: editable reps + weight, plus the set index.

export default function SetRow({ index, set, onChange, onLog, logged }) {
  return (
    <View className="flex-row items-center gap-2 py-1.5">
      <Text className="text-secondary w-6 text-center" style={{ fontFamily: "monospace" }}>
        {index + 1}
      </Text>

      <View className="flex-1 flex-row items-center bg-surface rounded-lg border border-border-default px-3">
        <TextInput
          value={String(set.weight)}
          onChangeText={(t) => onChange({ ...set, weight: t.replace(/[^0-9.]/g, "") })}
          keyboardType="numeric"
          className="flex-1 text-primary py-2"
          placeholder="0"
          placeholderTextColor="#4a4858"
        />
        <Text className="text-muted text-xs" style={{ fontFamily: "monospace" }}>
          lb
        </Text>
      </View>

      <View className="flex-1 flex-row items-center bg-surface rounded-lg border border-border-default px-3">
        <TextInput
          value={String(set.reps)}
          onChangeText={(t) => onChange({ ...set, reps: t.replace(/[^0-9]/g, "") })}
          keyboardType="numeric"
          className="flex-1 text-primary py-2"
          placeholder="0"
          placeholderTextColor="#4a4858"
        />
        <Text className="text-muted text-xs" style={{ fontFamily: "monospace" }}>
          reps
        </Text>
      </View>

      {logged ? (
        <View className="w-[58px] items-center">
          <Text className="text-parrot-green text-lg">✓</Text>
        </View>
      ) : (
        <Pressable onPress={onLog} className="w-[58px] items-center py-2 rounded-lg bg-mustard">
          <Text className="text-root font-bold text-xs">Log</Text>
        </Pressable>
      )}
    </View>
  );
}
