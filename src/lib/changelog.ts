// Reads CHANGELOG.md (bundled as text at build time) into days of bilingual entries for the /changelog/ page.
// The file's format is described in its own header comment.
import raw from '../../CHANGELOG.md?raw';

export type ChangeEntry = { zh: string; en: string };
export type ChangeDay = { date: string; entries: ChangeEntry[] }; // date is YYYY-MM-DD

export function parseChangelog(text: string): ChangeDay[] {
  const days: ChangeDay[] = [];
  for (const line of text.replace(/<!--[\s\S]*?-->/g, '').split('\n')) {
    const heading = /^##\s+(\d{4}-\d{2}-\d{2})\s*$/.exec(line);
    const item = /^-\s+(.+)$/.exec(line);
    const en = /^\s+EN:\s*(.+)$/.exec(line);
    if (heading) days.push({ date: heading[1], entries: [] });
    else if (item && days.length) days[days.length - 1].entries.push({ zh: item[1].trim(), en: '' });
    else if (en && days.length) {
      const last = days[days.length - 1].entries.at(-1);
      if (last) last.en = en[1].trim();
    }
  }
  // Newest first, whatever order the file is in; an entry missing its English line falls back to the Chinese.
  return days
    .filter((d) => d.entries.length)
    .map((d) => ({ ...d, entries: d.entries.map((e) => ({ zh: e.zh, en: e.en || e.zh })) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const CHANGELOG = parseChangelog(raw);
