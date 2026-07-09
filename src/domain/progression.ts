import type {
  ExerciseResult,
  ExerciseState,
  LoggedExercise,
  ProgressionConfig,
} from './types';
import { roundToIncrement } from './units';

/**
 * An exercise "succeeds" only when every work set is marked done and hit (or
 * exceeded) its target reps. Warmup sets never count toward success.
 */
export function isExerciseSucceeded(logged: LoggedExercise): boolean {
  if (logged.workSets.length === 0) return false;
  return logged.workSets.every((set) => set.done && set.reps >= set.targetReps);
}

export function resultFromLogged(logged: LoggedExercise): ExerciseResult {
  return {
    exerciseId: logged.exerciseId,
    succeeded: isExerciseSucceeded(logged),
  };
}

/**
 * Pure progression/deload engine. Given an exercise's prior state and the
 * result of the session that just finished, returns its new state.
 *
 *  - Success: bank a success. Once `sessionsPerIncrement` successes (default
 *    1) are banked, add the per-exercise increment and reset the success
 *    counter. Always resets the failure counter. Failures in between do not
 *    erase banked successes.
 *  - Failure: increment the failure counter. Once it reaches the deload
 *    threshold, reduce the weight by `deloadFactor` (rounded to a loadable
 *    weight) and reset both counters. Weight is unchanged on earlier failures.
 */
export function computeNextState(
  prev: ExerciseState,
  result: ExerciseResult,
  config: ProgressionConfig,
  rounding: number,
): ExerciseState {
  if (result.succeeded) {
    const needed = config.sessionsPerIncrement?.[prev.exerciseId] ?? 1;
    const successes = (prev.successesSinceIncrement ?? 0) + 1;

    if (successes < needed) {
      return { ...prev, consecutiveFailures: 0, successesSinceIncrement: successes };
    }

    const increment = config.increments[prev.exerciseId] ?? 0;
    return {
      ...prev,
      currentWeight: roundToIncrement(prev.currentWeight + increment, rounding),
      consecutiveFailures: 0,
      successesSinceIncrement: 0,
    };
  }

  const failures = prev.consecutiveFailures + 1;

  if (failures >= config.deloadFailThreshold) {
    const deloaded = prev.currentWeight * (1 - config.deloadFactor);
    return {
      ...prev,
      currentWeight: roundToIncrement(deloaded, rounding),
      consecutiveFailures: 0,
      successesSinceIncrement: 0,
    };
  }

  return { ...prev, consecutiveFailures: failures };
}
