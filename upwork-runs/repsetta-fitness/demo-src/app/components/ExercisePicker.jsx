import React from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";

// Catalog modal: tap an exercise to add it to the active session.

export default function ExercisePicker({ visible, exercises, onPick, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-surface rounded-t-3xl border-t border-border-default max-h-[75%] p-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-primary text-lg font-bold" style={{ fontFamily: "System" }}>
              Add Exercise
            </Text>
            <Pressable onPress={onClose} className="px-3 py-1">
              <Text className="text-secondary text-base">Close</Text>
            </Pressable>
          </View>
          <ScrollView>
            {exercises.map((ex) => (
              <Pressable
                key={ex.id}
                onPress={() => onPick(ex)}
                className="bg-card rounded-xl border border-border-subtle px-4 py-3 mb-2 flex-row items-center justify-between"
              >
                <View>
                  <Text className="text-primary text-base font-semibold">{ex.name}</Text>
                  <Text className="text-secondary text-xs mt-0.5" style={{ fontFamily: "monospace" }}>
                    {ex.muscle} · {ex.equipment}
                  </Text>
                </View>
                <Text className="text-mustard text-2xl">+</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
