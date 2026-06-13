import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { getExercises, saveWorkout } from "../api/client";
import ExercisePicker from "../components/ExercisePicker";
import SetRow from "../components/SetRow";
import RestTimer from "../components/RestTimer";

// HERO SCREEN: pick exercises -> log sets (reps + weight) -> live rest timer
// between sets -> save the session to the backend.

let uid = 0;
const newSet = (seed = {}) => ({
  key: ++uid,
  reps: seed.reps != null ? String(seed.reps) : "",
  weight: seed.weight != null ? String(seed.weight) : "",
  logged: false,
});

export default function WorkoutLogScreen({ seedProgram, onSaved }) {
  const [catalog, setCatalog] = useState([]);
  const [exMap, setExMap] = useState({});
  const [items, setItems] = useState([]); // [{ exerciseId, name, sets: [] }]
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    (async () => {
      const ex = await getExercises();
      setCatalog(ex);
      const map = Object.fromEntries(ex.map((e) => [e.id, e]));
      setExMap(map);
      if (seedProgram && items.length === 0) {
        setItems(
          seedProgram.exercises.map((pe) => ({
            exerciseId: pe.exerciseId,
            name: map[pe.exerciseId] ? map[pe.exerciseId].name : `Exercise ${pe.exerciseId}`,
            sets: [newSet({ reps: pe.targetReps, weight: pe.targetWeight })],
          }))
        );
      }
    })();
  }, []);

  const addExercise = (ex) => {
    setItems((prev) => [...prev, { exerciseId: ex.id, name: ex.name, sets: [newSet()] }]);
    setPickerOpen(false);
  };

  const updateSet = (ei, si, set) =>
    setItems((prev) =>
      prev.map((it, i) => (i === ei ? { ...it, sets: it.sets.map((s, j) => (j === si ? set : s)) } : it))
    );

  const logSet = (ei, si) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === ei ? { ...it, sets: it.sets.map((s, j) => (j === si ? { ...s, logged: true } : s)) } : it
      )
    );
    setShowTimer(true); // auto-start rest timer
  };

  const addSet = (ei) =>
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== ei) return it;
        const last = it.sets[it.sets.length - 1];
        return { ...it, sets: [...it.sets, newSet({ reps: last?.reps, weight: last?.weight })] };
      })
    );

  const loggedSets = items.flatMap((it) =>
    it.sets.filter((s) => s.logged && s.reps && s.weight).map((s) => ({
      exerciseId: it.exerciseId,
      reps: Number(s.reps),
      weight: Number(s.weight),
    }))
  );
  const volume = loggedSets.reduce((sum, s) => sum + s.reps * s.weight, 0);

  const save = async () => {
    if (loggedSets.length === 0) {
      setSavedMsg("Log at least one set first.");
      return;
    }
    setSaving(true);
    setSavedMsg("");
    await saveWorkout({ name: seedProgram?.name || "Workout", sets: loggedSets });
    setSaving(false);
    setSavedMsg("Saved.");
    onSaved && onSaved();
  };

  if (catalog.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-root">
        <ActivityIndicator color="#e8b820" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-root">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 160 }}>
        <Text className="text-secondary text-[11px] tracking-[3px] mb-1" style={{ fontFamily: "monospace" }}>
          LOG WORKOUT
        </Text>
        <Text className="text-primary text-3xl font-bold mb-5">{seedProgram?.name || "Free Session"}</Text>

        {showTimer && (
          <View className="mb-5">
            <RestTimer duration={90} onDone={() => setShowTimer(false)} />
          </View>
        )}

        {items.map((it, ei) => (
          <View key={ei} className="bg-card rounded-2xl border border-border-default p-4 mb-4">
            <Text className="text-primary text-lg font-bold mb-1">{it.name}</Text>
            <View className="flex-row gap-2 mb-1 mt-2">
              <Text className="text-muted w-6 text-center text-[10px]" style={{ fontFamily: "monospace" }}>
                #
              </Text>
              <Text className="text-muted flex-1 text-[10px]" style={{ fontFamily: "monospace" }}>
                WEIGHT
              </Text>
              <Text className="text-muted flex-1 text-[10px]" style={{ fontFamily: "monospace" }}>
                REPS
              </Text>
              <Text className="text-muted w-[58px] text-center text-[10px]" style={{ fontFamily: "monospace" }}>
                SET
              </Text>
            </View>
            {it.sets.map((s, si) => (
              <SetRow
                key={s.key}
                index={si}
                set={s}
                logged={s.logged}
                onChange={(ns) => updateSet(ei, si, ns)}
                onLog={() => logSet(ei, si)}
              />
            ))}
            <Pressable onPress={() => addSet(ei)} className="mt-2 py-2 items-center rounded-lg border border-border-default">
              <Text className="text-secondary text-sm">+ Add set</Text>
            </Pressable>
          </View>
        ))}

        <Pressable
          onPress={() => setPickerOpen(true)}
          className="py-3 items-center rounded-xl border border-dashed border-border-active mb-4"
        >
          <Text className="text-cyan font-semibold">+ Add Exercise</Text>
        </Pressable>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border-default px-5 py-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-secondary text-xs" style={{ fontFamily: "monospace" }}>
            {loggedSets.length} sets · {volume.toLocaleString()} lb volume
          </Text>
          {savedMsg ? <Text className="text-parrot-green text-xs">{savedMsg}</Text> : null}
        </View>
        <Pressable onPress={save} disabled={saving} className="bg-mustard rounded-xl py-3.5 items-center">
          <Text className="text-root font-bold">{saving ? "Saving..." : "Save Workout"}</Text>
        </Pressable>
      </View>

      <ExercisePicker
        visible={pickerOpen}
        exercises={catalog}
        onPick={addExercise}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}
