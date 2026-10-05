import type { CSSProperties } from 'react';
import { Minus } from '@phosphor-icons/react/dist/csr/Minus';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { holidaySets } from '../lib/holidays';
import { t, useLocale } from '../lib/i18n';
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, type HolidayToggles, type View } from '../lib/prefs';
import { YearSelect } from './YearSelect';
import './ViewBar.css';

type Props = {
  mode: View['mode'];
  onMode: (mode: View['mode']) => void;
  holidayOn: HolidayToggles;
  onToggleHoliday: (key: keyof HolidayToggles) => void;
  zoom: number;
  onZoom: (next: number) => void;
};

// Controls above the calendar: year/month switch, holiday toggles and (in the year view) the zoom.
export function ViewBar({ mode, onMode, holidayOn, onToggleHoliday, zoom, onZoom }: Props) {
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
      </div>
      <div className="toggles">
        {holidaySets().map((set) => (
          <button
            key={set.key}
            role="switch"
            aria-checked={holidayOn[set.key]}
            className="toggle"
            style={{ '--c': set.color } as CSSProperties}
            onClick={() => onToggleHoliday(set.key)}
          >
            <span className="knob" />
            {set.label}
          </button>
        ))}
      </div>
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
