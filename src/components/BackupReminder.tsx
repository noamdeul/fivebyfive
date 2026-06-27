import { useState } from 'react';
import { backupReminder } from '../domain/backup';
import { useBackupExport } from '../hooks/useBackupExport';
import { useAppStore } from '../store/useAppStore';

/**
 * Non-intrusive nudge shown when completed workouts have been logged since the
 * last backup. Exporting (or dismissing) hides it; exporting advances the last
 * backup time so it stays hidden until new data is logged.
 */
export function BackupReminder() {
  const history = useAppStore((s) => s.history);
  const lastBackupAt = useAppStore((s) => s.lastBackupAt);
  const exportBackup = useBackupExport();
  const [dismissed, setDismissed] = useState(false);

  const { due, unbackedUp } = backupReminder(history, lastBackupAt);
  if (!due || dismissed) return null;

  return (
    <div className="backup-banner">
      <span>
        {unbackedUp} workout{unbackedUp === 1 ? '' : 's'} since your last backup
      </span>
      <button onClick={exportBackup}>Export backup</button>
      <button aria-label="Dismiss" onClick={() => setDismissed(true)}>
        ✕
      </button>
    </div>
  );
}
