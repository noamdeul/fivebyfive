import { describe, expect, it } from 'vitest';
import { computeWarmups, warmupsToLoggedSets } from '../domain/warmups';
import { BAR_WEIGHT } from '../domain/units';

describe('computeWarmups', () => {
  it('does just the bar when the working weight is at or below the bar', () => {
    expect(computeWarmups(BAR_WEIGHT.kg, 'kg', 2.5)).toEqual([{ weight: 20, reps: 5 }]);
    // Below the bar collapses to the same single bar set.
    expect(computeWarmups(10, 'kg', 2.5)).toEqual([{ weight: 20, reps: 5 }]);
  });

  it('opens with two bar sets then ramps up for a heavy working weight', () => {
    const warmups = computeWarmups(100, 'kg', 2.5);
    expect(warmups[0]).toEqual({ weight: 20, reps: 5 });
    expect(warmups[1]).toEqual({ weight: 20, reps: 5 });
    // 50% / 70% / 90% of 100, all on the grid.
    expect(warmups.slice(2)).toEqual([
      { weight: 50, reps: 5 },
      { weight: 70, reps: 3 },
      { weight: 90, reps: 2 },
    ]);
  });

  it('keeps every ramp set strictly below the working weight and ascending', () => {
    const warmups = computeWarmups(100, 'kg', 2.5);
    for (const w of warmups) {
      expect(w.weight).toBeLessThan(100);
    }
    const weights = warmups.map((w) => w.weight);
    for (let i = 1; i < weights.length; i++) {
      expect(weights[i]).toBeGreaterThanOrEqual(weights[i - 1]);
    }
  });

  it('drops ramp sets that would fall at or below the bar', () => {
    // Just above the bar: the 50%/70% ramps land at/under the bar and are
    // skipped, leaving only the 90% ramp after the two bar sets.
    const warmups = computeWarmups(25, 'kg', 2.5);
    expect(warmups).toEqual([
      { weight: 20, reps: 5 },
      { weight: 20, reps: 5 },
      { weight: 22.5, reps: 2 },
    ]);
  });

  it('never duplicates a weight across ramp sets', () => {
    const warmups = computeWarmups(100, 'kg', 2.5);
    // The two opening bar sets are intentionally equal; ramp weights are unique.
    const rampWeights = warmups.slice(2).map((w) => w.weight);
    expect(new Set(rampWeights).size).toBe(rampWeights.length);
  });

  it('uses the pound bar for lb sessions', () => {
    const warmups = computeWarmups(135, 'lb', 5);
    expect(warmups[0]).toEqual({ weight: 45, reps: 5 });
    expect(warmups[1]).toEqual({ weight: 45, reps: 5 });
    for (const w of warmups.slice(2)) {
      expect(w.weight).toBeGreaterThan(45);
      expect(w.weight).toBeLessThan(135);
    }
  });
});

describe('warmupsToLoggedSets', () => {
  it('marks sets as warmups, not done, with target reps matching reps', () => {
    const logged = warmupsToLoggedSets([
      { weight: 20, reps: 5 },
      { weight: 50, reps: 3 },
    ]);
    expect(logged).toEqual([
      { reps: 5, targetReps: 5, done: false, isWarmup: true, weight: 20 },
      { reps: 3, targetReps: 3, done: false, isWarmup: true, weight: 50 },
    ]);
  });

  it('returns an empty list for no warmups', () => {
    expect(warmupsToLoggedSets([])).toEqual([]);
  });
});
