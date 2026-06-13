// Bundled fallback data. Used when the backend is unreachable so the iframe
// demo never shows a blank screen or a console error pre-deploy / offline.

export const EXERCISES = [
  { id: 1, name: "Barbell Bench Press", muscle: "Chest", equipment: "Barbell" },
  { id: 2, name: "Incline Dumbbell Press", muscle: "Chest", equipment: "Dumbbell" },
  { id: 3, name: "Overhead Press", muscle: "Shoulders", equipment: "Barbell" },
  { id: 4, name: "Lateral Raise", muscle: "Shoulders", equipment: "Dumbbell" },
  { id: 5, name: "Tricep Pushdown", muscle: "Triceps", equipment: "Cable" },
  { id: 6, name: "Skull Crusher", muscle: "Triceps", equipment: "EZ Bar" },
];

export const TODAY_PROGRAM = {
  name: "Push Day A",
  focus: "Chest / Shoulders / Triceps",
  exercises: [
    { exerciseId: 1, targetSets: 4, targetReps: 8, targetWeight: 135 },
    { exerciseId: 3, targetSets: 3, targetReps: 10, targetWeight: 95 },
    { exerciseId: 5, targetSets: 3, targetReps: 12, targetWeight: 50 },
  ],
};

export const PAST_WORKOUTS = [
  {
    id: "w1",
    date: "2026-06-10",
    name: "Push Day A",
    sets: [
      { exerciseId: 1, reps: 8, weight: 135 },
      { exerciseId: 1, reps: 8, weight: 135 },
      { exerciseId: 1, reps: 7, weight: 135 },
      { exerciseId: 3, reps: 10, weight: 95 },
      { exerciseId: 3, reps: 9, weight: 95 },
      { exerciseId: 5, reps: 12, weight: 50 },
    ],
  },
  {
    id: "w2",
    date: "2026-06-08",
    name: "Push Day A",
    sets: [
      { exerciseId: 1, reps: 8, weight: 130 },
      { exerciseId: 1, reps: 7, weight: 130 },
      { exerciseId: 3, reps: 10, weight: 90 },
      { exerciseId: 5, reps: 12, weight: 45 },
    ],
  },
  {
    id: "w3",
    date: "2026-06-05",
    name: "Push Day A",
    sets: [
      { exerciseId: 1, reps: 8, weight: 125 },
      { exerciseId: 3, reps: 9, weight: 85 },
      { exerciseId: 5, reps: 10, weight: 45 },
    ],
  },
];

export const PROGRESS = {
  totalWorkouts: 3,
  totalVolume: 18240,
  currentStreak: 3,
  trend: [
    { date: "2026-06-05", volume: 3750 },
    { date: "2026-06-08", volume: 5830 },
    { date: "2026-06-10", volume: 8660 },
  ],
};
