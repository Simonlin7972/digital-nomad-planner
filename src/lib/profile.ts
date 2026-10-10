// "About me" settings from the profile page (/profile/): things that make the planner's numbers fit the person
// using it. Kept per browser in `dnp-profile`, apart from the plan: not exported, not undoable. Read with
// getProfile() each time it is needed (the profile page is a separate document, so the planner picks up changes
// on its next load).

import { sanitizeAvatar, type Avatar } from './avatar';

export type TempUnit = 'c' | 'f';
export const BACKUP_DAYS = [0, 3, 7, 14] as const; // 0: no reminder

export type Profile = {
  nickname: string; // shown on the shared image
  homeCountry: string; // stored like a stay's country: ISO code, or free text
  homeCity: string; // stored like a stay's city: a listed city's English name, or free text
  passport: string; // ISO code of the passport's country; '' if not given
  taxResidence: string; // ISO code of the country whose 183-day line to count; '' to hide it
  tempUnit: TempUnit;
  backupDays: (typeof BACKUP_DAYS)[number];
  avatar: Avatar | null; // the paper-doll character (lib/avatar.ts); null until one is saved
};

export const DEFAULT_PROFILE: Profile = {
  nickname: '',
  homeCountry: '',
  homeCity: '',
  passport: '',
  // The planner counted Taiwan's 183 days before this setting existed, so that stays the default.
  taxResidence: 'tw',
  tempUnit: 'c',
  backupDays: 7,
  avatar: null,
};

const KEY = 'dnp-profile';
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function getProfile(): Profile {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Record<string, unknown> | null;
    if (!raw || typeof raw !== 'object') return DEFAULT_PROFILE;
    return {
      nickname: text(raw.nickname, 30),
      homeCountry: text(raw.homeCountry, 40),
      homeCity: text(raw.homeCity, 40),
      passport: text(raw.passport, 40),
      taxResidence: typeof raw.taxResidence === 'string' ? text(raw.taxResidence, 40) : DEFAULT_PROFILE.taxResidence,
      tempUnit: raw.tempUnit === 'f' ? 'f' : 'c',
      backupDays: (BACKUP_DAYS as readonly unknown[]).includes(raw.backupDays)
        ? (raw.backupDays as Profile['backupDays'])
        : DEFAULT_PROFILE.backupDays,
      avatar: raw.avatar ? sanitizeAvatar(raw.avatar) : null,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // storage unavailable: the settings just won't be remembered
  }
}

// Citizens of these can stay in the Schengen area without the 90/180 limit (EU, EEA and Switzerland).
const FREE_MOVEMENT = new Set([
  'at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'gr', 'hu', 'ie', 'it', 'lv', 'lt', 'lu',
  'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se', 'is', 'li', 'no', 'ch',
]);

// Whether the Schengen 90/180 count means anything for this person.
export const schengenApplies = () => !FREE_MOVEMENT.has(getProfile().passport);
