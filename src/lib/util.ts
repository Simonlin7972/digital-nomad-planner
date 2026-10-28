// Whether `q` is one slip away from `term` or from its start: a letter wrong, missing or extra. Search uses it as
// a last rank, once there are enough letters to go on.
export function nearMatch(q: string, term: string): boolean {
  if (q.length < 4) return false;
  return [term, term.slice(0, q.length), term.slice(0, q.length + 1)].some((t) => within1(q, t));
}
function within1(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (i === a.length && i === b.length) return true;
  // Past the first difference the rest must agree, allowing one substitution, one letter missing or one extra
  return a.slice(i + 1) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i) || a.slice(i) === b.slice(i + 1);
}

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// The platform's shortcut prefix, for showing keyboard shortcuts.
export const MOD = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';
