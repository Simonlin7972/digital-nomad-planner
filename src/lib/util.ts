export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// The platform's shortcut prefix, for showing keyboard shortcuts.
export const MOD = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';
