import type { Unit } from './types';

const LB_PER_KG = 2.2046226218;

/** Standard empty Olympic barbell weight, per unit. */
export const BAR_WEIGHT: Record<Unit, number> = {
  kg: 20,
  lb: 45,
};

/** Default smallest loadable increment (plate pair), per unit. */
export const DEFAULT_ROUNDING: Record<Unit, number> = {
  kg: 2.5,
  lb: 5,
};

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}

/** Snap a weight to the nearest multiple of `increment`. */
export function roundToIncrement(weight: number, increment: number): number {
  if (increment <= 0) return weight;
  const snapped = Math.round(weight / increment) * increment;
  // Avoid floating-point fuzz like 47.50000000001.
  return Math.round(snapped * 100) / 100;
}

/** Convert a weight from one unit to another, snapped to the target rounding. */
export function convertWeight(
  weight: number,
  from: Unit,
  to: Unit,
  rounding: number,
): number {
  if (from === to) return weight;
  const converted = from === 'kg' ? kgToLb(weight) : lbToKg(weight);
  return roundToIncrement(converted, rounding);
}

export function formatWeight(weight: number, unit: Unit): string {
  const rounded = Math.round(weight * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text} ${unit}`;
}
