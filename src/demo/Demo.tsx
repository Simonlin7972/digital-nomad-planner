import { useState } from 'react';
import type { ReactNode } from 'react';
import { AirlineCombobox, CityCombobox, CountryCombobox, FlightNoCombobox } from '../components/Combobox';
import { DatePicker } from '../components/DatePicker';
import { SeasonStrip } from '../components/SeasonStrip';
import { Toolbar } from '../components/Toolbar';
import { YearSelect } from '../components/YearSelect';
import { AvatarPicker } from '../profile/AvatarPicker';
import { DEFAULT_AVATAR } from '../lib/avatar';
import { cityFitsCountry } from '../lib/cities';
import { YEAR, dayOfIso } from '../lib/weeks';
import { t, useLocale } from '../lib/i18n';
import { PALETTE, type ColorKey } from '../lib/storage';
import '../components/Dialog.css';
import '../components/Editor.css';
import './Demo.css';

// The demo page (dev only, /demo/): a row of 9:16 canvases, each holding a live app component at phone size, for
// recording reels. Add a canvas by appending to REELS; the component inside is the real one, with the editor's
// field styles, so it looks and behaves exactly as in the planner. Chinese only, like the other dev pages.

// Canvas size in CSS pixels: 9:16, half of the reel's 1080×1920. Record at 2× device pixels for full size. The
// components inside keep their real size and sit in the middle.
export const REEL_W = 540;
export const REEL_H = 960;

type Reel = { id: string; title: string; note: string; render: () => ReactNode };

// The country field from the stay editor: a searchable list with flags, free text accepted.
function CountryField() {
  const [country, setCountry] = useState('');
  return (
    <div className="editor demo-card">
      <label className="field">
        國家
        <CountryCombobox value={country} onChange={setCountry} recent={['th', 'jp', 'pt']} />
      </label>
    </div>
  );
}

// The start and end dates from the stay editor: two calendars that tint the days between them, each bounded by
// the other. No plan behind it, so the only limits are the two ends.
function DateFields() {
  const [start, setStart] = useState(`${YEAR}-03-02`);
  const [end, setEnd] = useState(`${YEAR}-03-28`);
  return (
    <div className="editor demo-card">
      <div className="dates">
        <div className="field">
          開始
          <DatePicker value={start} onChange={setStart} max={end} rangeWith={end} label="開始" />
        </div>
        <div className="field">
          結束
          <DatePicker value={end} onChange={setEnd} min={start} rangeWith={start} align="right" label="結束" />
        </div>
      </div>
    </div>
  );
}

// The country and city pair: the city list follows the chosen country, and a city picked with no country brings
// its country along. The list hangs under the pair, as in the editor.
function PlaceFields() {
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  return (
    <div className="editor demo-card">
      <div className="dates place">
        <label>
          國家
          <CountryCombobox
            value={country}
            onChange={setCountry}
            onSettle={(c) => !cityFitsCountry(c, city) && setCity('')}
            recent={['th', 'jp', 'pt']}
          />
        </label>
        <label>
          城市
          <CityCombobox
            value={city}
            country={country}
            onChange={setCity}
            onPickCountry={setCountry}
            recent={[
              { city: 'Chiang Mai', country: 'th' },
              { city: 'Tokyo', country: 'jp' },
            ]}
          />
        </label>
      </div>
    </div>
  );
}

// The ticket's airline and flight number: airlines come with logos, and the flight number field offers the picked
// airline's code to start from plus numbers already in the plan.
function FlightFields() {
  const [airline, setAirline] = useState('');
  const [flightNo, setFlightNo] = useState('');
  return (
    <div className="editor demo-card">
      <div className="dates place wide">
        <label>
          航空公司
          <AirlineCombobox value={airline} onChange={setAirline} recent={[]} />
        </label>
        <label>
          航班編號
          <FlightNoCombobox value={flightNo} airline={airline} onChange={setFlightNo} recent={['BR211', 'TG635']} />
        </label>
      </div>
    </div>
  );
}

// The colour swatches from the stay editor: one radio per palette colour, the picked one ringed.
function ColourField() {
  const [color, setColor] = useState<ColorKey>('red');
  return (
    <div className="editor demo-card">
      <div className="field">
        顏色
        <div className="swatches" role="radiogroup" aria-label="顏色">
          {PALETTE.map((c) => (
            <button
              key={c.key}
              type="button"
              role="radio"
              aria-checked={c.key === color}
              aria-label={t(`color.${c.key}`)}
              title={t(`color.${c.key}`)}
              className={`swatch${c.key === color ? ' selected' : ''}`}
              style={{ background: c.hex }}
              onClick={() => setColor(c.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// The "when to go" strip from the stay editor: Chiang Mai over its smoke season, so the toggle carries the warning
// and the months fold open with March and April outlined.
function SeasonField() {
  const range = { startDay: dayOfIso(`${YEAR}-03-10`) ?? 0, endDay: dayOfIso(`${YEAR}-04-20`) ?? 0 };
  return (
    <div className="editor demo-card">
      <SeasonStrip place={{ country: 'th', city: 'Chiang Mai' }} range={range} />
    </div>
  );
}

// The header's action row with its ⋯ menu: undo and redo icons, then the menu that pops out of the button's
// corner. Nothing behind the actions here; the file picker and the product page link still open, as in the app.
const noop = () => {};
function MenuRow() {
  return (
    <div className="demo-row">
      <Toolbar
        readOnly={false}
        canUndo
        canRedo={false}
        hasStays
        canExport
        onHelp={noop}
        onUndo={noop}
        onRedo={noop}
        onShare={noop}
        onExport={noop}
        onTransfer={noop}
        onReport={noop}
        onImport={noop}
      />
    </div>
  );
}

// The paper-doll picker from the settings page: the figure on a tint, turn and random under it, and tabs of
// tiles beside it. Picks change the figure here only; nothing is saved.
function AvatarTiles() {
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  return (
    <div className="editor demo-card wide">
      <AvatarPicker value={avatar} onChange={setAvatar} />
    </div>
  );
}

// The year pill from the view bar, controlled here so a pick changes this canvas only, never the planner's year.
function YearPill() {
  const [year, setYear] = useState<number>(YEAR);
  return (
    <div className="demo-row">
      <YearSelect value={year} onChange={setYear} />
    </div>
  );
}

const REELS: Reel[] = [
  { id: 'country', title: '國家搜尋選單', note: '編輯視窗的國家欄位：點開列表、輸入搜尋、方向鍵選取', render: () => <CountryField /> },
  { id: 'dates', title: '日期選擇', note: '編輯視窗的開始、結束日期：月曆從欄位的角落長出來，兩端之間的日子會上色', render: () => <DateFields /> },
  { id: 'place', title: '國家與城市', note: '城市清單跟著國家走；沒選國家時挑一個城市，國家會跟著填上', render: () => <PlaceFields /> },
  { id: 'flight', title: '航空公司與航班', note: '航空公司帶 logo；航班編號欄位先給航空公司代碼，再列出用過的班號', render: () => <FlightFields /> },
  { id: 'colour', title: '顏色', note: '編輯視窗的顏色色票：點一下換色，選到的那顆套上一圈框，滑過時放大', render: () => <ColourField /> },
  { id: 'season', title: '季節', note: '編輯視窗的「什麼時候去」：清邁三、四月的煙季，按鈕帶警告，展開看十二個月的評等和原因', render: () => <SeasonField /> },
  { id: 'menu', title: '⋯ 選單', note: '頁首的動作列：復原、重做，和從 ⋯ 按鈕右上角長出來的選單；Esc 或點外面收回', render: () => <MenuRow /> },
  { id: 'avatar', title: '角色', note: '設定頁的紙娃娃：左邊是人物，右邊分頁裡每個選項都是穿上它的縮圖，滑過先預覽、點了才換', render: () => <AvatarTiles /> },
  { id: 'year', title: '年份選單', note: '檢視列的年份：藥丸按鈕打開四個年份的選單，選到的打勾；這裡只換畫布上的數字，不會動到規劃頁', render: () => <YearPill /> },
];

function Canvas({ reel }: { reel: Reel }) {
  return (
    <figure className="reel" id={reel.id}>
      <div className="reel-canvas" style={{ width: REEL_W, height: REEL_H }}>
        {reel.render()}
      </div>
      <figcaption>
        <b>{reel.title}</b>
        <span>{reel.note}</span>
        <code>
          {REEL_W}×{REEL_H} · 9:16
        </code>
      </figcaption>
    </figure>
  );
}

export function Demo() {
  useLocale();
  return (
    <div className="demo">
      <header className="demo-head">
        <h1>Demo</h1>
        <p>9:16 的畫布，每一格放一個真的元件，原尺寸、置中。瀏覽器放大到 200% 就是 1080×1920。</p>
      </header>
      <main className="demo-reels">
        {REELS.map((reel) => (
          <Canvas key={reel.id} reel={reel} />
        ))}
      </main>
    </div>
  );
}
