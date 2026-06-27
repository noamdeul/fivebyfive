import { describe, expect, it } from 'vitest';
import {
  convertWeight,
  formatWeight,
  kgToLb,
  lbToKg,
  roundToIncrement,
} from '../domain/units';

describe('units', () => {
  it('rounds to the nearest increment', () => {
    expect(roundToIncrement(47.3, 2.5)).toBe(47.5);
    expect(roundToIncrement(46.1, 2.5)).toBe(45);
    expect(roundToIncrement(100, 5)).toBe(100);
  });

  it('avoids floating point fuzz', () => {
    expect(roundToIncrement(42.5 + 2.5, 2.5)).toBe(45);
  });

  it('converts kg <-> lb', () => {
    expect(kgToLb(100)).toBeCloseTo(220.46, 1);
    expect(lbToKg(45)).toBeCloseTo(20.41, 1);
  });

  it('converts and snaps to target rounding', () => {
    // 20 kg ~= 44.09 lb -> snaps to 45 lb on a 5 lb grid.
    expect(convertWeight(20, 'kg', 'lb', 5)).toBe(45);
    // 100 lb ~= 45.36 kg -> snaps to 45 kg on a 2.5 kg grid.
    expect(convertWeight(100, 'lb', 'kg', 2.5)).toBe(45);
  });

  it('is a no-op when units match', () => {
    expect(convertWeight(60, 'kg', 'kg', 2.5)).toBe(60);
  });

  it('formats weights', () => {
    expect(formatWeight(60, 'kg')).toBe('60 kg');
    expect(formatWeight(42.5, 'kg')).toBe('42.5 kg');
    expect(formatWeight(45, 'lb')).toBe('45 lb');
  });
});
