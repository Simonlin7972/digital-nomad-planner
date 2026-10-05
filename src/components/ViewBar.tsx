import type { CSSProperties } from 'react';
import { Minus } from '@phosphor-icons/react/dist/csr/Minus';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { HOLIDAY_SETS } from '../lib/holidays';
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, type HolidayToggles, type View } from '../lib/prefs';
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
  return (
    <div className="timeline-bar">
      <div className="segmented" role="tablist" aria-label="檢視">
        {(['year', 'month'] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => onMode(m)}>
            {m === 'year' ? '年' : '月'}
          </button>
        ))}
      </div>
      <div className="toggles">
        {HOLIDAY_SETS.map((set) => (
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
          <button onClick={() => onZoom(zoom - ZOOM_STEP)} disabled={zoom <= ZOOM_MIN} aria-label="縮小" title="縮小">
            <Minus size={14} weight="bold" />
          </button>
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={ZOOM_STEP}
            value={zoom}
            onChange={(e) => onZoom(Number(e.target.value))}
            aria-label="時間軸縮放"
            style={{ '--pct': `${((zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100}%` } as CSSProperties}
          />
          <button onClick={() => onZoom(zoom + ZOOM_STEP)} disabled={zoom >= ZOOM_MAX} aria-label="放大" title="放大">
            <Plus size={14} weight="bold" />
          </button>
          <span className="zoom-value">{Math.round(zoom * 100)}%</span>
          <button className="reset" onClick={() => onZoom(ZOOM_MIN)} disabled={zoom === ZOOM_MIN}>
            符合寬度
          </button>
        </div>
      )}
    </div>
  );
}
