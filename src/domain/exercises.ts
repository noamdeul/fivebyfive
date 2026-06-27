import type { ExerciseDef, ExerciseId, WorkoutTemplate, WorkoutType } from './types';

export const EXERCISES: Record<ExerciseId, ExerciseDef> = {
  squat: { id: 'squat', name: 'Squat', sets: 5, reps: 5 },
  bench: { id: 'bench', name: 'Bench Press', sets: 5, reps: 5 },
  row: { id: 'row', name: 'Barbell Row', sets: 5, reps: 5 },
  ohp: { id: 'ohp', name: 'Overhead Press', sets: 5, reps: 5 },
  deadlift: { id: 'deadlift', name: 'Deadlift', sets: 1, reps: 5 },
};

export const ALL_EXERCISE_IDS: ExerciseId[] = ['squat', 'bench', 'row', 'ohp', 'deadlift'];

export const WORKOUT_TEMPLATES: Record<WorkoutType, WorkoutTemplate> = {
  A: { type: 'A', exercises: ['squat', 'bench', 'row'] },
  B: { type: 'B', exercises: ['squat', 'ohp', 'deadlift'] },
};

export function getExercise(id: ExerciseId): ExerciseDef {
  return EXERCISES[id];
}
