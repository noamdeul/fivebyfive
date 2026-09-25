import { getExercise, WORKOUT_TEMPLATES } from './exercises';
import { resultFromLogged } from './progression';
import type {
  CustomWorkout,
  ExerciseDef,
  ExerciseId,
  ExerciseResult,
  ExerciseState,
  ExerciseStatus,
  LoggedExercise,
  LoggedSet,
  Settings,
  WorkoutSession,
  WorkoutType,
} from './types';
import { computeWarmups, warmupsToLoggedSets } from './warmups';

export function flipWorkoutType(type: WorkoutType): WorkoutType {
  return type === 'A' ? 'B' : 'A';
}

function buildWorkSets(reps: number, count: number): LoggedSet[] {
  return Array.from({ length: count }, () => ({
    reps,
    targetReps: reps,
    done: false,
    isWarmup: false,
  }));
}

function buildLoggedExercise(
  exerciseId: ExerciseId,
  state: ExerciseState,
  settings: Settings,
  customExercises: ExerciseDef[],
): LoggedExercise {
  const def = getExercise(exerciseId, customExercises);
  const weight = state.currentWeight;
  const warmups = computeWarmups(weight, settings.unit, settings.rounding, settings.barWeight);
  return {
    exerciseId,
    weight,
    warmupSets: warmupsToLoggedSets(warmups),
    workSets: buildWorkSets(def.reps, def.sets),
  };
}

/** Seed an exercise state for an id that may not have one yet (defensive: a
 *  custom workout could reference an exercise whose state was somehow dropped).
 *  Falls back to the bar weight. */
function stateFor(
  exerciseId: ExerciseId,
  exerciseStates: Record<ExerciseId, ExerciseState>,
  settings: Settings,
): ExerciseState {
  return (
    exerciseStates[exerciseId] ?? {
      exerciseId,
      currentWeight: settings.barWeight,
      consecutiveFailures: 0,
    }
  );
}

/**
 * Assemble a fresh, unlogged session for the given built-in workout type using
 * the current per-exercise progression state.
 */
export function buildSessionFromTemplate(
  type: WorkoutType,
  exerciseStates: Record<ExerciseId, ExerciseState>,
  settings: Settings,
  id: string,
  date: string,
  customExercises: ExerciseDef[] = [],
): WorkoutSession {
  const template = WORKOUT_TEMPLATES[type];
  return {
    id,
    date,
    type,
    kind: 'builtin',
    unit: settings.unit,
    exercises: template.exercises.map((exId) =>
      buildLoggedExercise(exId, stateFor(exId, exerciseStates, settings), settings, customExercises),
    ),
    completed: false,
  };
}

/**
 * Assemble a fresh, unlogged session from a user-built custom workout. Stamps
 * `kind: 'custom'` plus the workout's name and id so it stays out of the A/B
 * rotation and displays its own name.
 */
export function buildSessionFromCustom(
  workout: CustomWorkout,
  exerciseStates: Record<ExerciseId, ExerciseState>,
  settings: Settings,
  customExercises: ExerciseDef[],
  id: string,
  date: string,
): WorkoutSession {
  return {
    id,
    date,
    kind: 'custom',
    name: workout.name,
    templateId: workout.id,
    unit: settings.unit,
    exercises: workout.exercises.map((exId) =>
      buildLoggedExercise(exId, stateFor(exId, exerciseStates, settings), settings, customExercises),
    ),
    completed: false,
  };
}

/** Per-exercise success/fail results for a (typically completed) session. */
export function sessionResults(session: WorkoutSession): ExerciseResult[] {
  return session.exercises.map(resultFromLogged);
}

/** Display title for a session: a custom workout's name, otherwise the built-in
 *  "Workout A"/"Workout B". Back-compatible with sessions logged before custom
 *  workouts (no `name`). */
export function sessionTitle(session: Pick<WorkoutSession, 'name' | 'type'>): string {
  return session.name ?? `Workout ${session.type ?? ''}`.trim();
}

/** A filename-safe slug for a session, used in share/export filenames. */
export function sessionSlug(session: Pick<WorkoutSession, 'name' | 'type'>): string {
  if (session.type) return session.type;
  const slug = (session.name ?? 'custom')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return slug || 'custom';
}

/** Done/total counts for a session's sets, split into work and warmup. */
export interface SetCounts {
  workDone: number;
  workTotal: number;
  warmupDone: number;
  warmupTotal: number;
}

/** Count done vs. total sets across every exercise in a session. Drives the
 *  in-session "sets completed" counter. */
export function countSets(session: Pick<WorkoutSession, 'exercises'>): SetCounts {
  const counts: SetCounts = { workDone: 0, workTotal: 0, warmupDone: 0, warmupTotal: 0 };
  for (const ex of session.exercises) {
    counts.workTotal += ex.workSets.length;
    counts.workDone += ex.workSets.filter((s) => s.done).length;
    const warmups = ex.warmupSets ?? [];
    counts.warmupTotal += warmups.length;
    counts.warmupDone += warmups.filter((s) => s.done).length;
  }
  return counts;
}

function hasAnyDone(ex: LoggedExercise): boolean {
  return ex.workSets.some((s) => s.done) || (ex.warmupSets ?? []).some((s) => s.done);
}

/** Status of each exercise in a session, in order. See `ExerciseStatus`. An
 *  exercise counts as "moved on from" once any later exercise has a set done. */
export function exerciseStatuses(session: Pick<WorkoutSession, 'exercises'>): ExerciseStatus[] {
  const { exercises } = session;
  return exercises.map((ex, i) => {
    const allDone = ex.workSets.length > 0 && ex.workSets.every((s) => s.done);
    if (allDone) {
      return ex.workSets.every((s) => s.reps >= s.targetReps) ? 'complete' : 'partial';
    }
    const movedOn = exercises.slice(i + 1).some(hasAnyDone);
    return movedOn ? 'unfinished' : 'pending';
  });
}
