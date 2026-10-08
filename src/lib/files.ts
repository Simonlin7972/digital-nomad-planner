import { YEAR } from './weeks';

// The plan's file name, stamped with the day it was saved (local time) so successive backups don't share a name,
// and with the year being planned unless the file holds every year.
export function fileName(ext: string, withYear = true): string {
  const now = new Date();
  const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((n) => String(n).padStart(2, '0')).join('-');
  return withYear ? `nomad-plan-${YEAR}_${today}.${ext}` : `nomad-plan_${today}.${ext}`;
}

// Hands a blob to the browser as a download, named like a plan file unless given a name.
export function download(blob: Blob, ext: string, withYear = true, name?: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name ?? fileName(ext, withYear);
  a.click();
  URL.revokeObjectURL(a.href);
}
