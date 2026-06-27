import { describe, expect, it } from 'vitest';
import { backupFileName, backupReminder } from '../domain/backup';
import type { WorkoutSession } from '../domain/types';

function session(date: string, completed = true): WorkoutSession {
  return { id: date, date, type: 'A', unit: 'kg', exercises: [], completed };
}

describe('backupReminder', () => {
  it('is not due when there is no history', () => {
    expect(backupReminder([], null)).toEqual({ due: false, unbackedUp: 0 });
  });

  it('counts every completed session when never backed up', () => {
    const history = [session('2026-01-01T00:00:00Z'), session('2026-01-03T00:00:00Z')];
    expect(backupReminder(history, null)).toEqual({ due: true, unbackedUp: 2 });
  });

  it('is not due when the last backup is after the newest session', () => {
    const history = [session('2026-01-01T00:00:00Z'), session('2026-01-03T00:00:00Z')];
    expect(backupReminder(history, '2026-01-04T00:00:00Z')).toEqual({
      due: false,
      unbackedUp: 0,
    });
  });

  it('counts only sessions newer than the last backup', () => {
    const history = [
      session('2026-01-01T00:00:00Z'),
      session('2026-01-03T00:00:00Z'),
      session('2026-01-05T00:00:00Z'),
    ];
    expect(backupReminder(history, '2026-01-02T00:00:00Z')).toEqual({
      due: true,
      unbackedUp: 2,
    });
  });

  it('ignores in-progress (not completed) sessions', () => {
    const history = [session('2026-01-05T00:00:00Z', false)];
    expect(backupReminder(history, null)).toEqual({ due: false, unbackedUp: 0 });
  });
});

describe('backupFileName', () => {
  it('uses the date portion of an ISO timestamp', () => {
    expect(backupFileName('2026-06-27T13:45:09.123Z')).toBe('fivebyfive-backup-2026-06-27.json');
  });
});
