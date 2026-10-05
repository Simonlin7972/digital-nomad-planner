import { YEAR } from './weeks';

// Hands a blob to the browser as a download named after the plan and the day it was saved.
export function download(blob: Blob, ext: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  // Stamp the file with the day it was saved (local time), so successive backups don't share a name.
  const now = new Date();
  const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((n) => String(n).padStart(2, '0')).join('-');
  a.download = `nomad-plan-${YEAR}_${today}.${ext}`;
  a.click();
  URL.revokeObjectURL(a.href);
}
