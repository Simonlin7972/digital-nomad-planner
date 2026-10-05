import { useEffect, useState } from 'react';
import { backedUp, daysSinceBackup, loadBackup, saveBackup, shouldRemind, snoozed, track } from '../lib/backup';
import type { Stay } from '../lib/storage';

// Tracks how long the plan has gone without an export. `markBackedUp` is called after an export or an import
// (an imported file is already a copy on disk); `snooze` hides the reminder for a few days.
export function useBackupReminder(stays: Stay[]) {
  const [state, setState] = useState(loadBackup);

  useEffect(() => setState((prev) => track(prev, stays, Date.now())), [stays]);
  useEffect(() => saveBackup(state), [state]);

  const now = Date.now();
  return {
    remind: stays.length > 0 && shouldRemind(state, now),
    daysSince: daysSinceBackup(state, now),
    markBackedUp: (saved: Stay[]) => setState(backedUp(saved, Date.now())),
    snooze: () => setState((prev) => snoozed(prev, Date.now())),
  };
}
