// Small per-browser preferences: which view is open, which holiday sets are on, the timeline zoom.
// None of this is part of the plan, so it isn't exported or undoable.
import type { HolidaySet } from './holidays';

export type View = { mode: 'year' | 'month'; month: number };
export type HolidayToggles = Record<HolidaySet['key'], boolean>;

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 6;
export const ZOOM_STEP = 0.25;

const VIEW_KEY = 'dnp-view';
const HOLIDAYS_KEY = 'dnp-holidays';
const ZOOM_KEY = 'dnp-zoom';

function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable: the preference just won't be remembered
  }
}

export function loadView(): View {
  const v = read(VIEW_KEY) as Partial<View> | null;
  const month = Number.isInteger(v?.month) && v!.month! >= 0 && v!.month! <= 11 ? v!.month! : 0;
  return { mode: v?.mode === 'month' ? 'month' : 'year', month };
}
export const saveView = (view: View) => write(VIEW_KEY, view);

export function loadHolidayToggles(): HolidayToggles {
  const saved = read(HOLIDAYS_KEY) as Partial<HolidayToggles> | null;
  return { tw: saved?.tw === true, au: saved?.au === true };
}
export const saveHolidayToggles = (toggles: HolidayToggles) => write(HOLIDAYS_KEY, toggles);

export function loadZoom(): number {
  const z = Number(read(ZOOM_KEY));
  return z >= ZOOM_MIN && z <= ZOOM_MAX ? z : ZOOM_MIN;
}
export const saveZoom = (zoom: number) => write(ZOOM_KEY, zoom);
