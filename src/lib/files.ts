import { YEAR } from './weeks';

// The plan's file name, stamped with the day it was saved (local time) so successive backups don't share a name.
export function fileName(ext: string): string {
  const now = new Date();
  const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((n) => String(n).padStart(2, '0')).join('-');
  return `nomad-plan-${YEAR}_${today}.${ext}`;
}

// Hands a blob to the browser as a download.
export function download(blob: Blob, ext: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName(ext);
  a.click();
  URL.revokeObjectURL(a.href);
}
