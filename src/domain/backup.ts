import type { WorkoutSession } from './types';

export interface BackupReminder {
  /** True when there are completed workouts not yet covered by a backup. */
  due: boolean;
  /** Number of completed workouts logged since the last backup. */
  unbackedUp: number;
}

/**
 * Decide whether to nudge the user to back up. Counts completed sessions logged
 * since `lastBackupAt` (all of them when there has never been a backup).
 */
export function backupReminder(
  history: WorkoutSession[],
  lastBackupAt: string | null,
): BackupReminder {
  const unbackedUp = history.filter(
    (s) => s.completed && (lastBackupAt == null || s.date > lastBackupAt),
  ).length;
  return { due: unbackedUp > 0, unbackedUp };
}

/** Date-stamped backup filename, e.g. fivebyfive-backup-2026-06-27.json */
export function backupFileName(dateIso: string): string {
  return `fivebyfive-backup-${dateIso.slice(0, 10)}.json`;
}
