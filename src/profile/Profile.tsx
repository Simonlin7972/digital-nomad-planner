import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { House } from '@phosphor-icons/react/dist/csr/House';
import { Megaphone } from '@phosphor-icons/react/dist/csr/Megaphone';
import { CityCombobox, CountryCombobox } from '../components/Combobox';
import { PixelNomad } from '../components/PixelNomad';
import { CHANGELOG } from '../lib/changelog';
import { normalizeCity } from '../lib/cities';
import { normalizeCountry } from '../lib/flags';
import { LOCALES, LOCALE_NAMES, langTag, setLocale, t, useLocale } from '../lib/i18n';
import { APP_URL, CHANGELOG_URL, HOME_URL } from '../lib/links';
import { loadHolidayToggles, saveHolidayToggles, type HolidayToggles } from '../lib/prefs';
import { BACKUP_DAYS, getProfile, saveProfile, type Profile as ProfileData } from '../lib/profile';
import { DEFAULT_AVATAR, sameAvatar } from '../lib/avatar';
import { renderAvatarPng } from '../lib/exportPng';
import { download } from '../lib/files';
import { AvatarPicker } from './AvatarPicker';
import '../components/Editor.css';
import './Profile.css';

// The profile page (/profile/): your paper-doll character, who you are, how things are shown, how often to remind about backups, and what
// this is. Everything saves as soon as it changes, to this browser only; the planner reads it
// on its next load. The character is the exception: it is saved with its own button.
export function Profile() {
  const locale = useLocale();
  document.title = `${t('profile.title')} — ${t('app.title')}`;
  document.documentElement.lang = langTag(locale);

  const [profile, setProfile] = useState(getProfile);
  const [holidays, setHolidays] = useState(loadHolidayToggles);
  const [saved, setSaved] = useState(false);
  // The character is the one setting that waits for Save: picks change this draft, and leaving drops it.
  // Until one is saved the picker starts from the default; saving that unchanged is allowed too.
  const savedAvatar = profile.avatar ?? DEFAULT_AVATAR;
  const [avatar, setAvatar] = useState(savedAvatar);
  const unsaved = !sameAvatar(avatar, savedAvatar);
  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  // Each change is written straight away; a small note confirms it.
  const flash = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };
  // Functional, because picking a city also brings its country along: two updates in one go.
  const update = (patch: Partial<ProfileData>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      // Places are stored the way stays store them: country codes and listed cities' English names.
      next.homeCountry = normalizeCountry(next.homeCountry);
      next.homeCity = normalizeCity(next.homeCountry, next.homeCity);
      next.passport = normalizeCountry(next.passport);
      next.taxResidence = normalizeCountry(next.taxResidence);
      saveProfile(next);
      return next;
    });
    flash();
  };
  const toggleHoliday = (key: keyof HolidayToggles) => {
    const next = { ...holidays, [key]: !holidays[key] };
    setHolidays(next);
    saveHolidayToggles(next);
    flash();
  };
  const latest = CHANGELOG[0]?.date;

  return (
    <div className="profile">
      <header className="p-nav">
        <a className="p-brand" href={APP_URL}>
          <PixelNomad />
          <span>{t('app.title')}</span>
        </a>
        <a className="p-back" href={APP_URL}>
          <ArrowLeft size={14} weight="bold" /> {t('profile.back')}
        </a>
      </header>

      <main className="editor">
        <div className="p-head">
          <h1>{t('profile.title')}</h1>
          <span className={`p-saved${saved ? ' on' : ''}`} role="status">
            <CheckCircle size={14} weight="bold" /> {t('profile.saved')}
          </span>
        </div>

        <Section title={t('profile.avatar')}>
          <AvatarPicker
            value={avatar}
            onChange={setAvatar}
            onDownload={!unsaved && profile.avatar ? () => void renderAvatarPng(avatar).then((b) => download(b, 'png', false, 'nomad-avatar.png')) : undefined}
          />
          {/* Save and cancel appear only once something changed; before the first save they stay, so the default can be kept */}
          {(unsaved || profile.avatar === null) && (
            <div className="p-save">
              {unsaved && <span className="p-unsaved">{t('profile.avatarUnsaved')}</span>}
              {unsaved && (
                <button type="button" onClick={() => setAvatar(savedAvatar)}>
                  {t('profile.avatarCancel')}
                </button>
              )}
              <button type="button" className="primary" onClick={() => update({ avatar })}>
                {t('profile.avatarSave')}
              </button>
            </div>
          )}
        </Section>

        <Section title={t('profile.me')}>
          <Row label={t('profile.nickname')}>
            <input value={profile.nickname} maxLength={30} placeholder={t('profile.nicknamePh')} onChange={(e) => update({ nickname: e.target.value })} />
          </Row>
          <Row label={t('profile.home')}>
            <div className="dates place">
              <CountryCombobox value={profile.homeCountry} onChange={(v) => update({ homeCountry: v })} recent={[]} />
              <CityCombobox
                value={profile.homeCity}
                country={profile.homeCountry}
                onChange={(v) => update({ homeCity: v })}
                onPickCountry={(c) => update({ homeCountry: c })}
                recent={[]}
              />
            </div>
          </Row>
          <Row label={t('profile.passport')}>
            <CountryCombobox value={profile.passport} onChange={(v) => update({ passport: v })} recent={[]} />
          </Row>
          <Row label={t('profile.residence')}>
            <CountryCombobox value={profile.taxResidence} onChange={(v) => update({ taxResidence: v })} recent={[]} />
          </Row>
        </Section>

        <Section title={t('profile.display')}>
          <Row label={t('profile.language')}>
            <Options
              value={locale}
              options={LOCALES.map((l) => ({ value: l, label: LOCALE_NAMES[l], lang: langTag(l) }))}
              onChange={(l) => {
                setLocale(l);
                flash();
              }}
            />
          </Row>
          <Row label={t('profile.holidays')}>
            <div className="p-toggles">
              {(['tw', 'au'] as const).map((key) => (
                <button key={key} type="button" role="switch" aria-checked={holidays[key]} className="toggle" style={{ '--c': 'var(--text)' } as CSSProperties} onClick={() => toggleHoliday(key)}>
                  <span className="knob" />
                  {t(key === 'tw' ? 'profile.holidayTw' : 'profile.holidayAu')}
                </button>
              ))}
            </div>
          </Row>
          <Row label={t('profile.temp')}>
            <Options
              value={profile.tempUnit}
              options={[
                { value: 'c' as const, label: '°C' },
                { value: 'f' as const, label: '°F' },
              ]}
              onChange={(tempUnit) => update({ tempUnit })}
            />
          </Row>
        </Section>

        <Section title={t('profile.data')}>
          <Row label={t('profile.backup')}>
            <Options
              value={profile.backupDays}
              options={BACKUP_DAYS.map((d) => ({ value: d, label: d ? t('profile.backupDays', { n: d }) : t('profile.backupOff') }))}
              onChange={(backupDays) => update({ backupDays })}
            />
          </Row>
        </Section>

        <Section title={t('profile.about')}>
          <p className="p-about">{t('profile.aboutText')}</p>
          {latest && <p className="p-note">{t('profile.updated', { date: new Date(`${latest}T00:00:00`).toLocaleDateString(langTag(locale), { year: 'numeric', month: 'long', day: 'numeric' }) })}</p>}
          <nav className="p-links">
            <a href={HOME_URL}>
              <House size={16} weight="bold" /> {t('footer.home')}
            </a>
            <a href={CHANGELOG_URL}>
              <Megaphone size={16} weight="bold" /> {t('changelog.title')}
            </a>
          </nav>
          <p className="p-note">{t('landing.footer')}</p>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="p-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

// One setting: its name on the left, the control on the right.
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="p-row">
      <div className="p-label">
        <span>{label}</span>
      </div>
      <div className="p-control">{children}</div>
    </div>
  );
}

// A row of pill buttons, one of which is chosen.
function Options<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; lang?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="p-options" role="radiogroup">
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === value} lang={o.lang} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
