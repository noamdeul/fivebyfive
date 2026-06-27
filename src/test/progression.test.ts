import { describe, expect, it } from 'vitest';
import { computeNextState, isExerciseSucceeded } from '../domain/progression';
import type { ExerciseState, LoggedExercise, ProgressionConfig } from '../domain/types';

const config: ProgressionConfig = {
  increments: { squat: 2.5, bench: 2.5, row: 2.5, ohp: 2.5, deadlift: 5 },
  deloadFactor: 0.1,
  deloadFailThreshold: 3,
};

function state(currentWeight: number, consecutiveFailures = 0): ExerciseState {
  return { exerciseId: 'squat', currentWeight, consecutiveFailures };
}

function workSets(reps: number[], done = true) {
  return reps.map((r) => ({ reps: r, targetReps: 5, done, isWarmup: false }));
}

describe('isExerciseSucceeded', () => {
  it('succeeds when all work sets are done and hit target reps', () => {
    const logged: LoggedExercise = {
      exerciseId: 'squat',
      weight: 60,
      warmupSets: [],
      workSets: workSets([5, 5, 5, 5, 5]),
    };
    expect(isExerciseSucceeded(logged)).toBe(true);
  });

  it('fails when a work set is short of target reps', () => {
    const logged: LoggedExercise = {
      exerciseId: 'squat',
      weight: 60,
      warmupSets: [],
      workSets: workSets([5, 5, 5, 5, 3]),
    };
    expect(isExerciseSucceeded(logged)).toBe(false);
  });

  it('fails when a work set is not marked done', () => {
    const logged: LoggedExercise = {
      exerciseId: 'squat',
      weight: 60,
      warmupSets: [],
      workSets: [...workSets([5, 5, 5, 5]), { reps: 5, targetReps: 5, done: false, isWarmup: false }],
    };
    expect(isExerciseSucceeded(logged)).toBe(false);
  });

  it('fails with no work sets', () => {
    expect(
      isExerciseSucceeded({ exerciseId: 'squat', weight: 60, warmupSets: [], workSets: [] }),
    ).toBe(false);
  });
});

describe('computeNextState', () => {
  it('adds the increment on success and resets failures', () => {
    const next = computeNextState(
      state(60, 2),
      { exerciseId: 'squat', succeeded: true },
      config,
      2.5,
    );
    expect(next.currentWeight).toBe(62.5);
    expect(next.consecutiveFailures).toBe(0);
  });

  it('uses the deadlift increment for deadlifts', () => {
    const next = computeNextState(
      { exerciseId: 'deadlift', currentWeight: 100, consecutiveFailures: 0 },
      { exerciseId: 'deadlift', succeeded: true },
      config,
      2.5,
    );
    expect(next.currentWeight).toBe(105);
  });

  it('treats a missing increment as zero (weight unchanged on success)', () => {
    const sparse: ProgressionConfig = { ...config, increments: {} as ProgressionConfig['increments'] };
    const next = computeNextState(state(60, 0), { exerciseId: 'squat', succeeded: true }, sparse, 2.5);
    expect(next.currentWeight).toBe(60);
    expect(next.consecutiveFailures).toBe(0);
  });

  it('keeps the weight but counts the failure on the first two misses', () => {
    const first = computeNextState(state(100, 0), { exerciseId: 'squat', succeeded: false }, config, 2.5);
    expect(first.currentWeight).toBe(100);
    expect(first.consecutiveFailures).toBe(1);

    const second = computeNextState(first, { exerciseId: 'squat', succeeded: false }, config, 2.5);
    expect(second.currentWeight).toBe(100);
    expect(second.consecutiveFailures).toBe(2);
  });

  it('deloads by 10% (rounded) on the third consecutive failure', () => {
    const third = computeNextState(state(100, 2), { exerciseId: 'squat', succeeded: false }, config, 2.5);
    // 100 * 0.9 = 90, already on the grid.
    expect(third.currentWeight).toBe(90);
    expect(third.consecutiveFailures).toBe(0);
  });

  it('rounds the deloaded weight to a loadable increment', () => {
    // 95 * 0.9 = 85.5 -> snaps to 85 on a 2.5 grid.
    const next = computeNextState(state(95, 2), { exerciseId: 'squat', succeeded: false }, config, 2.5);
    expect(next.currentWeight).toBe(85);
  });

  it('models a full fail -> fail -> fail -> deload -> success cycle', () => {
    let s = state(100, 0);
    s = computeNextState(s, { exerciseId: 'squat', succeeded: false }, config, 2.5);
    s = computeNextState(s, { exerciseId: 'squat', succeeded: false }, config, 2.5);
    s = computeNextState(s, { exerciseId: 'squat', succeeded: false }, config, 2.5);
    expect(s.currentWeight).toBe(90);
    expect(s.consecutiveFailures).toBe(0);
    s = computeNextState(s, { exerciseId: 'squat', succeeded: true }, config, 2.5);
    expect(s.currentWeight).toBe(92.5);
  });
});
