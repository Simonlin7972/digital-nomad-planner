import type { CSSProperties } from 'react';
import { Minus } from '@phosphor-icons/react/dist/csr/Minus';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { t, useLocale } from '../lib/i18n';
import type { HolidaySet } from '../lib/holidays';
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, type HolidayToggles, type View } from '../lib/prefs';
import { HolidayMenu } from './HolidayMenu';
import { YearSelect } from './YearSelect';
import './ViewBar.css';

type Props = {
  mode: View['mode'];
  onMode: (mode: View['mode']) => void;
  all: boolean; // month view: every month at once
  onAll: (all: boolean) => void;
  holidays: HolidaySet[]; // every set that can be switched on
  holidayOn: HolidayToggles;
  onToggleHoliday: (key: string) => void;
  zoom: number;
  onZoom: (next: number) => void;
};

// Controls above the calendar: year/month switch, the holiday menu and (in the year view) the zoom.
export function ViewBar({ mode, onMode, all, onAll, holidays, holidayOn, onToggleHoliday, zoom, onZoom }: Props) {
  useLocale();
  return (
    <div className="timeline-bar">
      <div className="view-pick">
        <YearSelect />
        <div className="segmented" role="tablist" aria-label={t('view.label')} style={{ '--i': mode === 'year' ? 0 : 1 } as CSSProperties}>
          {/* The white pill behind the selected tab; it slides between tabs instead of each tab painting its own. */}
          <span className="thumb" aria-hidden />
          {(['year', 'month'] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => onMode(m)}>
              {t(m === 'year' ? 'view.year' : 'view.month')}
            </button>
          ))}
        </div>
        {mode === 'month' && (
          <button role="switch" aria-checked={all} className="toggle" style={{ '--c': 'var(--text)' } as CSSProperties} onClick={() => onAll(!all)}>
            <span className="knob" />
            {t('view.all')}
          </button>
        )}
      </div>
      <HolidayMenu sets={holidays} on={holidayOn} onToggle={onToggleHoliday} />
      {mode === 'year' && (
        <div className="zoombar">
          <button onClick={() => onZoom(zoom - ZOOM_STEP)} disabled={zoom <= ZOOM_MIN} aria-label={t('zoom.out')} title={t('zoom.out')}>
            <Minus size={14} weight="bold" />
          </button>
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={ZOOM_STEP}
            value={zoom}
            onChange={(e) => onZoom(Number(e.target.value))}
            aria-label={t('zoom.label')}
            style={{ '--pct': `${((zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100}%` } as CSSProperties}
          />
          <button onClick={() => onZoom(zoom + ZOOM_STEP)} disabled={zoom >= ZOOM_MAX} aria-label={t('zoom.in')} title={t('zoom.in')}>
            <Plus size={14} weight="bold" />
          </button>
          <span className="zoom-value">{Math.round(zoom * 100)}%</span>
          <button className="reset" onClick={() => onZoom(ZOOM_MIN)} disabled={zoom === ZOOM_MIN}>
            {t('zoom.fit')}
          </button>
        </div>
      )}
    </div>
  );
}
