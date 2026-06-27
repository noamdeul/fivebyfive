import { useCallback } from 'react';
import { backupFileName } from '../domain/backup';
import { useAppStore } from '../store/useAppStore';

/**
 * Returns a callback that downloads the current state as a JSON backup file and
 * stamps the backup time. Shared by the Settings export button and the backup
 * reminder nudge so both flows record that a backup happened.
 */
export function useBackupExport() {
  const exportData = useAppStore((s) => s.exportData);
  const markBackedUp = useAppStore((s) => s.markBackedUp);

  return useCallback(() => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFileName(new Date().toISOString());
    a.click();
    URL.revokeObjectURL(url);
    markBackedUp();
  }, [exportData, markBackedUp]);
}
