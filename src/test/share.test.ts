import { describe, expect, it } from 'vitest';
import { buildShareModel, buildShareText, formatDuration } from '../domain/share';
import type { LoggedExercise, WorkoutSession } from '../domain/types';

function workSet(reps: number, targetReps = 5, done = true) {
  return { reps, targetReps, done, isWarmup: false };
}

function exercise(
  exerciseId: LoggedExercise['exerciseId'],
  weight: number,
  reps: number[],
): LoggedExercise {
  return {
    exerciseId,
    weight,
    warmupSets: [],
    workSets: reps.map((r) => workSet(r)),
  };
}

function session(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: 'id-1',
    date: '2026-06-27T18:30:00.000Z',
    type: 'A',
    unit: 'kg',
    completed: true,
    exercises: [
      exercise('squat', 100, [5, 5, 5, 5, 5]),
      exercise('bench', 60, [5, 5, 5, 5, 5]),
      exercise('row', 50, [5, 5, 5, 5, 5]),
    ],
    ...overrides,
  };
}

describe('buildShareModel', () => {
  it('captures title, weights and reps for each exercise', () => {
    const model = buildShareModel(session());
    expect(model.title).toBe('Workout A');
    expect(model.exercises.map((e) => e.name)).toEqual([
      'Squat',
      'Bench Press',
      'Barbell Row',
    ]);
    expect(model.exercises[0].weight).toBe('100 kg');
    expect(model.exercises[0].sets.map((s) => s.reps)).toEqual([5, 5, 5, 5, 5]);
  });

  it('formats weight in the session unit', () => {
    const model = buildShareModel(session({ unit: 'lb' }));
    expect(model.exercises[0].weight).toBe('100 lb');
  });

  it('marks a set as hit only when done and at/over target reps', () => {
    const s = session({
      exercises: [exercise('squat', 100, [5, 5, 4, 5, 5])],
    });
    const model = buildShareModel(s);
    const hits = model.exercises[0].sets.map((x) => x.hit);
    expect(hits).toEqual([true, true, false, true, true]);
  });

  it('summarizes how many exercises succeeded', () => {
    const s = session({
      exercises: [
        exercise('squat', 100, [5, 5, 5, 5, 5]),
        exercise('bench', 60, [5, 5, 5, 5, 4]),
        exercise('row', 50, [5, 5, 5, 5, 5]),
      ],
    });
    const model = buildShareModel(s);
    expect(model.summaryText).toBe('2/3 exercises completed');
    expect(model.allSucceeded).toBe(false);
  });

  it('flags an all-success session', () => {
    const model = buildShareModel(session());
    expect(model.summaryText).toBe('3/3 exercises completed');
    expect(model.allSucceeded).toBe(true);
  });

  it('builds a stable, locale-independent filename from the ISO date', () => {
    const model = buildShareModel(session());
    expect(model.fileName).toBe('fivebyfive-workout-A-2026-06-27.png');
  });
});

describe('formatDuration', () => {
  it('formats m:ss and h:mm:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(185)).toBe('3:05');
    expect(formatDuration(3725)).toBe('1:02:05');
  });
});

describe('buildShareText', () => {
  const rest = { normal: 90, heavy: 180, deadlift: 300 };

  it('lists warmups and work sets with weights and reps', () => {
    const s = session({
      exercises: [
        {
          ...exercise('squat', 100, [5, 5, 5, 5, 4]),
          warmupSets: [
            { reps: 5, targetReps: 5, done: true, isWarmup: true, weight: 20 },
            { reps: 3, targetReps: 3, done: false, isWarmup: true, weight: 60 },
          ],
        },
      ],
    });
    const text = buildShareText(s);
    expect(text).toContain('Workout A');
    expect(text).toContain('Work sets: 5/5 · Warmups: 1/2');
    expect(text).toContain('Squat · 100 kg ✕');
    expect(text).toContain('  Warmup 1: 5 × 20 kg');
    expect(text).toContain('  Warmup 2: 3 × 60 kg (skipped)');
    expect(text).toContain('  Set 1: 5 × 100 kg ✓');
    expect(text).toContain('  Set 5: 4 × 100 kg ✕');
  });

  it('uses real rest gaps and total duration when sets are timestamped', () => {
    const at = (sec: number) => new Date(Date.UTC(2026, 5, 27, 18, 0, sec)).toISOString();
    const ex: LoggedExercise = {
      exerciseId: 'squat',
      weight: 100,
      warmupSets: [
        { reps: 5, targetReps: 5, done: true, isWarmup: true, weight: 20, completedAt: at(0) },
      ],
      workSets: [
        { ...workSet(5), completedAt: at(60) },
        { ...workSet(5), completedAt: at(245) },
      ],
    };
    const text = buildShareText(session({ exercises: [ex] }), [], rest);
    expect(text).toMatch(/Warmup 1: 5 × 20 kg$/m);
    expect(text).toContain('Set 1: 5 × 100 kg ✓ · rest 1:00');
    expect(text).toContain('Set 2: 5 × 100 kg ✓ · rest 3:05');
    expect(text).toContain('Duration: 4:05');
    expect(text).not.toContain('planned');
  });

  it('falls back to planned rest when there are no timestamps', () => {
    const s = session({
      exercises: [exercise('squat', 100, [5]), exercise('deadlift', 140, [5])],
    });
    const text = buildShareText(s, [], rest);
    expect(text).toContain('Rest: 3:00 between sets (planned)');
    expect(text).toContain('Rest: 5:00 between sets (planned)');
    expect(text).not.toContain('Duration');
  });
});
