import type { CSSProperties, ReactNode } from 'react';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { CalendarBlank } from '@phosphor-icons/react/dist/csr/CalendarBlank';
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown';
import { Check } from '@phosphor-icons/react/dist/csr/Check';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { GlobeHemisphereWest } from '@phosphor-icons/react/dist/csr/GlobeHemisphereWest';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { Avatar } from '../components/Avatar';
import { Flag } from '../components/Flag';
import { PRESETS } from '../lib/avatar';
import { PALETTE } from '../lib/storage';
import '../components/Dialog.css';
import '../components/Editor.css';
import '../components/Combobox.css';
import '../components/DatePicker.css';
import '../components/ViewBar.css';
import '../components/YearSelect.css';
import '../components/Toolbar.css';
import '../components/YearView.css';
import './DesignSystem.css';

// A dev-only reference of the planner's foundations and base components. The tokens and component styles are
// the app's own (base.css and the component stylesheets imported above); hover, focus and pressed are shown at
// rest through the .is-* twins that forceStates.ts makes from those stylesheets. The numbers in the tables below
// record what the CSS uses today; they are not tokens unless the name starts with --.
// Dev tool, Chinese only: its text is not in the i18n dictionaries.

type State = { label: string; cls?: string; disabled?: boolean };
const HOVER: State = { label: 'Hover', cls: 'is-hover' };
const FOCUS: State = { label: 'Focus', cls: 'is-focus' };
const PRESSED: State = { label: 'Pressed', cls: 'is-hover is-active' };
const DEFAULT: State = { label: 'Default' };
const DISABLED: State = { label: 'Disabled', disabled: true };
const BUTTON_STATES = [DEFAULT, HOVER, FOCUS, PRESSED, DISABLED];

const SECTIONS = [
  ['color', 'Color 顏色'],
  ['type', 'Typography 字體'],
  ['spacing', 'Spacing 間距'],
  ['layout', 'Layout 版面'],
  ['radius', 'Corner radius 圓角'],
  ['shadow', 'Shadow 陰影'],
  ['button', 'Button 按鈕'],
  ['toggle', 'Toggle 開關'],
  ['tabs', 'Tabs 分頁切換'],
  ['dropdown', 'Dropdown 下拉選單'],
  ['input', 'Input 輸入框'],
  ['slider', 'Slider 滑桿'],
  ['stay', 'Stay 停留區塊'],
  ['country', 'Country bar 國家條'],
  ['swatch', 'Swatch 色票'],
  ['dialog', 'Dialog 對話框'],
  ['avatar', 'Avatar 紙娃娃'],
] as const;

const COLOR_TOKENS = [
  ['--bg', '#faf9f6', '頁面底色（點陣紙）'],
  ['--dot', '#d3cfc6', '背景點陣'],
  ['--surface', '#ffffff', '卡片、面板、對話框、按鈕'],
  ['--subtle', '#f7f7f7', 'Hover 底色、分頁軌道、選單項目'],
  ['--text', '#222222', '主要文字、Primary 按鈕、Focus 外框'],
  ['--muted', '#6a6a6a', '次要文字、未選分頁、圖示'],
  ['--line', '#ebebeb', '分隔線'],
  ['--line-strong', '#dddddd', '按鈕與卡片邊框'],
  ['--accent', '#ff385c', '「今天」標記'],
  ['--accent-dark', '#e00b41', 'Accent 加深'],
  ['--danger', '#c13515', '刪除、錯誤訊息'],
];

const RAW_COLORS = [
  ['#b0b0b0', '輸入框邊框、placeholder、開關關閉時的軌道'],
  ['#000000', 'Primary 按鈕 hover'],
  ['#fff0f3', '年檢視「今天」那一格'],
];

const HOLIDAY_COLORS = [
  ['#c13515', '台灣國定假日'],
  ['#1f6f8b', '澳洲（NSW）假日'],
];

const TYPE_SCALE: [number, number, string][] = [
  [40, 600, '頁面標題 h1'],
  [18, 600, '區塊標題 h2'],
  [16, 600, '對話框標題'],
  [15, 400, '輸入框文字、手機選單項目'],
  [14, 600, '按鈕、選單項目（400）'],
  [13, 400, '次要控制項：分頁、年份、縮放、說明文字'],
  [12, 600, '欄位標籤、提示（400）'],
  [11, 600, '日曆星期、時間軸小字'],
];

const SPACING: [number, string][] = [
  [4, '圖示按鈕內距、最小間隔'],
  [6, '選單上下距、標籤與欄位'],
  [8, '按鈕之間、選單項目內距'],
  [10, '按鈕內距（垂直）、選單項目'],
  [12, '欄位內距、並排欄位間距'],
  [16, '按鈕內距（水平）、對話框區塊、手機頁邊'],
  [20, '對話框標題內距'],
  [24, '面板內距、面板間距、對話框水平內距'],
  [32, '大區塊之間'],
  [40, '桌面頁邊'],
];

const RADII: [string, string, string][] = [
  ['2–4px', '2px', '時間軸上的小元素、滑桿軌道'],
  ['6px', '6px', '小標籤、日曆格'],
  ['8px', '8px', '輸入框、選單項目、對話框按鈕'],
  ['--radius', 'var(--radius)', '12px：下拉選單、彈出層、票券區塊'],
  ['--radius-lg', 'var(--radius-lg)', '16px：面板、對話框、手機底部選單'],
  ['999px', '999px', '膠囊：按鈕、分頁切換、開關'],
  ['50%', '50%', '圓形：色票、日期、滑桿把手'],
];

const SHADOWS: [string, string, string][] = [
  ['--shadow-card', 'var(--shadow-card)', '面板'],
  ['--shadow-pop', 'var(--shadow-pop)', '下拉選單、彈出層、對話框'],
  ['thumb', '0 1px 3px rgb(0 0 0 / 0.15)', '分頁切換的白色滑塊'],
  ['stay', '0 1px 2px rgb(0 0 0 / 0.16)', '時間軸上的停留區塊'],
  ['stay:hover', '0 4px 12px rgb(0 0 0 / 0.22)', '停留區塊 hover'],
  ['stay:drag', '0 8px 20px rgb(0 0 0 / 0.3)', '停留區塊拖曳中'],
  ['focus ring', '0 0 0 2px var(--surface), 0 0 0 4px var(--text)', '色票選取（其他元件用 2px outline）'],
];

const LAYOUT: [string, string][] = [
  ['頁面最大寬度', '1600px（.app）'],
  ['桌面頁邊', '40px；手機 16px 加安全區'],
  ['手機斷點', '寬 ≤ 720px，或觸控螢幕高 ≤ 500px（NARROW_QUERY）'],
  ['對話框寬度', '440px（說明與分享較寬）'],
  ['面板', 'flex 換行，間距 24px，最小寬 280px'],
  ['更新日誌內文寬', '760px'],
  ['觸控目標', '手機上至少 44px（選單項目 48px）'],
];

export function DesignSystem() {
  return (
    <div className="ds">
      <nav className="ds-nav" aria-label="目錄">
        <p className="ds-brand">今天不在家工作</p>
        <p className="ds-kicker">Design System</p>
        <p className="ds-group">Foundations</p>
        {SECTIONS.slice(0, 6).map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        <p className="ds-group">Components</p>
        {SECTIONS.slice(6).map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>

      <main className="ds-main">
        <header className="ds-head">
          <h1>Design System</h1>
          <p>
            規劃器實際在用的 token 與基本元件。樣式直接取自 <code>src/styles/base.css</code> 和各元件的 CSS，改那裡這頁就跟著變。
            Hover、Focus、Pressed 是把真實 CSS 的 <code>:hover</code> 等規則複製成 class 呈現的，每個元件也都可以直接操作。
          </p>
        </header>

        <Section id="color" title="Color 顏色" note="以 --name 開頭的是 :root 上的 CSS 變數；其他是寫死在元件裡的色碼。">
          <h3>Tokens</h3>
          <div className="ds-swatches">
            {COLOR_TOKENS.map(([name, hex, use]) => (
              <figure key={name} className="ds-color">
                <div className="ds-chip" style={{ background: `var(${name})` }} />
                <figcaption><code>{name}</code><span>{hex}</span><small>{use}</small></figcaption>
              </figure>
            ))}
          </div>
          <h3>寫死的色碼</h3>
          <div className="ds-swatches">
            {RAW_COLORS.map(([hex, use]) => (
              <figure key={hex} className="ds-color">
                <div className="ds-chip" style={{ background: hex }} />
                <figcaption><code>{hex}</code><small>{use}</small></figcaption>
              </figure>
            ))}
          </div>
          <h3>停留顏色（PALETTE）</h3>
          <div className="ds-swatches">
            {PALETTE.map(({ key, hex }) => (
              <figure key={key} className="ds-color small">
                <div className="ds-chip" style={{ background: hex }} />
                <figcaption><code>{key}</code><span>{hex}</span></figcaption>
              </figure>
            ))}
          </div>
          <h3>假日</h3>
          <div className="ds-swatches">
            {HOLIDAY_COLORS.map(([hex, use]) => (
              <figure key={use} className="ds-color small">
                <div className="ds-chip" style={{ background: hex }} />
                <figcaption><code>{hex}</code><small>{use}</small></figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section id="type" title="Typography 字體" note="字型 975HazyGo，只用 400 與 600 兩種字重（不要用 500、700）。英文副標用 Pixelify Sans，只出現在標題下那一行。">
          <div className="ds-faces">
            <div className="ds-face">
              <span className="ds-face-sample">今天不在家 Aa 123</span>
              <code>975HazyGo 400</code>
            </div>
            <div className="ds-face">
              <span className="ds-face-sample" style={{ fontWeight: 600 }}>今天不在家 Aa 123</span>
              <code>975HazyGo 600</code>
            </div>
            <div className="ds-face">
              <span className="ds-face-sample tagline-face">A Digital Nomad Planner</span>
              <code>Pixelify Sans 400 · .tagline</code>
            </div>
          </div>
          <table className="ds-table">
            <thead><tr><th>Size</th><th>Weight</th><th>範例</th><th>用在</th></tr></thead>
            <tbody>
              {TYPE_SCALE.map(([size, weight, use]) => (
                <tr key={size}>
                  <td><code>{size}px</code></td>
                  <td><code>{weight}</code></td>
                  <td><span style={{ fontSize: size, fontWeight: weight, lineHeight: 1.2, whiteSpace: 'nowrap' }}>在清邁工作一個月</span></td>
                  <td className="ds-muted">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section id="spacing" title="Spacing 間距" note="沒有間距變數；這是 CSS 裡最常出現的數值，大致是 4 的倍數加上 6、10。">
          <div className="ds-spacing">
            {SPACING.map(([px, use]) => (
              <div key={px} className="ds-space-row">
                <code>{px}px</code>
                <div className="ds-space-bar" style={{ width: px }} />
                <span className="ds-muted">{use}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="layout" title="Layout 版面">
          <div className="ds-layout-demo" aria-hidden="true">
            <div className="ds-l-page">
              <div className="ds-l-top"><span>標題</span><span>工具列</span></div>
              <div className="ds-l-view">年／月檢視</div>
              <div className="ds-l-panels"><div>摘要</div><div>停留清單</div></div>
            </div>
            <span className="ds-l-gutter">40px</span>
          </div>
          <table className="ds-table">
            <tbody>
              {LAYOUT.map(([k, v]) => (
                <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section id="radius" title="Corner radius 圓角">
          <div className="ds-tiles">
            {RADII.map(([name, value, use]) => (
              <figure key={name} className="ds-tile">
                <div className="ds-radius-box" style={{ borderRadius: value }} />
                <figcaption><code>{name}</code><small>{use}</small></figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section id="shadow" title="Shadow 陰影">
          <div className="ds-tiles">
            {SHADOWS.map(([name, value, use]) => (
              <figure key={name} className="ds-tile">
                <div className="ds-shadow-box" style={{ boxShadow: value }} />
                <figcaption><code>{name}</code><small>{use}</small></figcaption>
              </figure>
            ))}
          </div>
          <h3>Focus 外框</h3>
          <p className="ds-note">鍵盤 focus、展開中的選單、開啟的開關都用同一圈：<code>outline: 2px solid var(--text)</code>。按鈕畫在外側（offset 2px），欄位與膠囊畫在內側（offset -1px，邊框隱藏）。</p>
        </Section>

        <Section id="button" title="Button 按鈕" note="所有 <button> 都有基本樣式：14px／600、膠囊形、按下時縮到 96%。Hover 只在有滑鼠的裝置生效。">
          <StateTable
            states={BUTTON_STATES}
            rows={[
              ['Secondary', '<button>', (s) => <button {...stateProps(s)}>匯出</button>],
              ['Primary', '.primary', (s) => <button {...stateProps(s, 'primary')}>儲存</button>],
              ['Danger', '.danger', (s) => <button {...stateProps(s, 'danger')}>刪除這段停留</button>],
              ['With icon', '.actions button', (s) => (
                <div className="actions"><button {...stateProps(s)}><DownloadSimple size={16} weight="bold" />匯出</button></div>
              )],
              ['Icon only', '.actions .icon', (s) => (
                <div className="actions"><button {...stateProps(s, 'icon')} aria-label="復原"><ArrowCounterClockwise size={16} weight="bold" /></button></div>
              )],
              ['Dialog', '.buttons button', (s) => (
                <div className="buttons ds-flat"><button {...stateProps(s, 'primary')}>儲存</button></div>
              )],
            ]}
          />
        </Section>

        <Section id="toggle" title="Toggle 開關" note="role=switch 的按鈕。開啟時軌道填色（--c，假日開關用各自的顏色），外圍加上 2px 深色框。">
          <StateTable
            states={BUTTON_STATES}
            rows={[
              ['Off', 'aria-checked=false', (s) => <Toggle state={s} on={false} />],
              ['On', 'aria-checked=true', (s) => <Toggle state={s} on />],
              ['On · 假日色', '--c', (s) => <Toggle state={s} on color="#c13515" label="台灣假日" />],
            ]}
          />
        </Section>

        <Section id="tabs" title="Tabs 分頁切換" note="年／月切換（.segmented）。白色滑塊移到已選的那一頁；分頁本身從不塗底色，所以 hover 不會讓已選的那頁變灰。狀態標在右邊那一頁。">
          <StateTable
            states={[
              { label: 'Inactive' },
              { label: 'Inactive · Hover', cls: 'is-hover' },
              { label: 'Inactive · Focus', cls: 'is-focus' },
              { label: 'Active' },
              { label: 'Active · Focus', cls: 'is-focus' },
            ]}
            rows={[['Segmented', '.segmented', (s, i) => <Segmented selected={i >= 3 ? 1 : 0} state={s} />]]}
          />
        </Section>

        <Section id="dropdown" title="Dropdown 下拉選單" note="年份選單（.year-button + .year-menu）。工具列的 ⋯ 選單（.more-menu）是同一套樣式。">
          <h3>觸發按鈕</h3>
          <StateTable
            states={[DEFAULT, HOVER, FOCUS, { label: 'Open' }, DISABLED]}
            rows={[['Trigger', '.year-button', (s, i) => (
              <button type="button" className={cls('year-button', s)} disabled={s.disabled} aria-expanded={i === 3} aria-haspopup="menu">
                2027<CaretDown size={14} weight="bold" />
              </button>
            )]]}
          />
          <h3>選單</h3>
          <div className="ds-menu-demo">
            <div className="year-menu ds-static" role="menu">
              <button type="button" role="menuitemradio" aria-checked="false">2026</button>
              <button type="button" role="menuitemradio" aria-checked="true">2027<Check size={14} weight="bold" /></button>
              <button type="button" role="menuitemradio" aria-checked="false" className="is-hover">2028</button>
              <button type="button" role="menuitemradio" aria-checked="false" disabled>2025</button>
            </div>
            <ul className="ds-legend">
              <li><b>Default</b> 2026：400 字重，無底色</li>
              <li><b>Selected</b> 2027：600 字重加勾勾</li>
              <li><b>Hover / Focus</b> 2028：--subtle 底色，focus 不另畫外框</li>
              <li><b>Disabled</b> 2025：40% 透明度</li>
            </ul>
          </div>
        </Section>

        <Section id="input" title="Input 輸入框" note="編輯器裡所有欄位同一個樣子：靜止時 1px 灰框，hover 換深色框，focus／展開時內側 2px 深色框。輸入框沒有專屬的 disabled 樣式（瀏覽器預設）。">
          <div className="editor ds-bare">
            <StateTable
              states={[{ label: 'Empty' }, HOVER, FOCUS, { label: 'Filled' }, { label: 'Error' }, DISABLED]}
              rows={[
                ['Text', '.editor input', (s, i) => (
                  <div className="field">
                    <input className={s.cls} placeholder="清邁" defaultValue={i === 3 || i === 4 ? '清邁' : ''} disabled={s.disabled} aria-label="城市" />
                    {i === 4 && <p className="error">日期和其他停留重疊</p>}
                  </div>
                )],
                ['Date', '.datepicker-field', (s, i) => (
                  <button type="button" className={cls('datepicker-field', s)} disabled={s.disabled} aria-label="日期">
                    <CalendarBlank size={16} weight="bold" />
                    {i === 3 || i === 4 ? <span>2027/03/01</span> : <span className="empty">選擇日期</span>}
                  </button>
                )],
                ['Combobox', '.combo', (s, i) => (
                  <div className="combo">
                    <div className="combo-input">
                      <span className="field-icon"><GlobeHemisphereWest size={16} weight="bold" /></span>
                      <input className={s.cls} placeholder="國家" defaultValue={i === 3 || i === 4 ? '泰國' : ''} disabled={s.disabled} aria-label="國家" />
                    </div>
                  </div>
                )],
              ]}
            />
            <h3>Combobox 選單展開</h3>
            <div className="combo ds-combo-demo">
              <div className="combo-input">
                <span className="field-icon"><GlobeHemisphereWest size={16} weight="bold" /></span>
                <input className="is-focus" defaultValue="泰" aria-label="國家" />
                <ul className="combo-list ds-static" role="listbox">
                  <li role="option" aria-selected="true" className="active">泰國<small>Active（鍵盤或滑鼠所在）</small></li>
                  <li role="option" aria-selected="false">泰國以外的地方<small>Default</small></li>
                  <li className="none">沒有符合的國家（None）</li>
                </ul>
              </div>
              <p className="combo-hint">提示文字：.combo-hint，12px muted</p>
            </div>
          </div>
        </Section>

        <Section id="slider" title="Slider 滑桿" note="縮放滑桿：細軌道塗到把手位置（--pct），白色圓形把手。Hover 放大 10%，按住 18%。">
          <StateTable
            states={[DEFAULT, HOVER, FOCUS, PRESSED]}
            rows={[['Range', '.zoombar input', (s) => (
              <div className="zoombar ds-flat">
                <input type="range" className={s.cls} min={0} max={100} defaultValue={40} style={{ '--pct': '40%' } as CSSProperties} aria-label="縮放" />
              </div>
            )]]}
          />
        </Section>

        <Section id="stay" title="Stay 停留區塊" note="年檢視時間軸上的一段停留（.stay）。底色是停留選的顏色，兩端是拉長用的把手（.handle）。Hover 浮起並露出淡淡的把手線；滑到把手上把手變暗、線變實；拖曳中浮更高、第二行改成日期；複製時和別段重疊就變成虛線外框。">
          <StateTable
            states={[DEFAULT, HOVER, { label: 'Edge hover' }, { label: 'Dragging' }, { label: 'Blocked' }]}
            rows={[
              ['Stay', '.stay', (s, i) => <StayBlock state={s} i={i} place="雪梨" color={PALETTE[8].hex} />],
              ['季節警示', '.stay strong svg', (s, i) => <StayBlock state={s} i={i} place="曼谷" color={PALETTE[2].hex} warn />],
              ['窄區塊', '文字截斷', (s, i) => <StayBlock state={s} i={i} place="布宜諾斯艾利斯" color={PALETTE[6].hex} narrow />],
            ]}
          />
          <h3>Selection 拖選中</h3>
          <p className="ds-note">在空白處拖曳新增停留時的預覽（.selection）：深色虛線框、8% 黑底，中間顯示長度。</p>
          <div className="ds-track"><div className="selection">4 週</div></div>
        </Section>

        <Section id="country" title="Country bar 國家條" note="時間軸下方的國家條（.country-bar），把同一國家連續的停留併成一條：國旗加國名，底色是停留顏色的 30%（color-mix），文字一律 --text。沒有互動狀態；太窄時國名截斷。">
          <div className="ds-cbars">
            {COUNTRIES.map(([code, name], i) => (
              <div key={code} className="ds-cbar">
                <div className="country-bar" style={{ '--c': PALETTE[i].hex } as CSSProperties}>
                  <Flag country={code} />
                  <span>{name}</span>
                </div>
                <code>{PALETTE[i].key}</code>
              </div>
            ))}
            <div className="ds-cbar narrow">
              <div className="country-bar" style={{ '--c': PALETTE[6].hex } as CSSProperties}>
                <Flag country="AR" />
                <span>阿根廷共和國</span>
              </div>
              <code>窄：截斷</code>
            </div>
          </div>
        </Section>

        <Section id="swatch" title="Swatch 色票" note="編輯器挑停留顏色。選中的那個外圍兩圈：白色 2px，再深色 2px。">
          <StateTable
            states={[DEFAULT, HOVER, FOCUS, { label: 'Selected' }]}
            rows={[['Swatch', '.swatch', (s, i) => (
              <div className="swatches">
                <button type="button" className={cls(i === 3 ? 'swatch selected' : 'swatch', s)} style={{ background: PALETTE[6].hex }} aria-label="藍" />
              </div>
            )]]}
          />
        </Section>

        <Section id="dialog" title="Dialog 對話框" note="停留編輯器與說明共用的外殼（.editor）。手機上變成從底部升起的 sheet。">
          <div className="editor ds-dialog" role="dialog" aria-label="範例對話框">
            <h2>編輯停留</h2>
            <label>城市<input placeholder="清邁" /></label>
            <div className="field">
              顯示假日
              <Toggle state={DEFAULT} on label="台灣假日" />
            </div>
            <div className="buttons">
              <button type="button" className="danger">刪除</button>
              <span className="spacer" />
              <button type="button">取消</button>
              <button type="button" className="primary">儲存</button>
            </div>
          </div>
        </Section>

        <Section id="avatar" title="Avatar 紙娃娃" note="設定頁挑的角色（lib/avatar.ts）。畫布 32×32，人物 16×24 置中；部位用字元畫，8 字元的列左右鏡像。幾秒眨一次眼（減少動態時不眨）。這裡是 10 個預設角色，64px（2 倍）。">
          <div className="ds-avatars">
            {PRESETS.map((p) => (
              <div key={p.id}>
                <Avatar avatar={p.avatar} />
                <code>{p.id}</code>
              </div>
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
}

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className="ds-section">
      <h2>{title}</h2>
      {note && <p className="ds-note">{note}</p>}
      {children}
    </section>
  );
}

type Row = [label: string, selector: string, render: (s: State, i: number) => ReactNode];

// Variants down, states across.
function StateTable({ states, rows }: { states: State[]; rows: Row[] }) {
  return (
    <div className="ds-scroll">
      <table className="ds-states">
        <thead>
          <tr>
            <th />
            {states.map((s) => <th key={s.label} scope="col">{s.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, selector, render]) => (
            <tr key={label}>
              <th scope="row">{label}<code>{selector}</code></th>
              {states.map((s, i) => <td key={s.label}>{render(s, i)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cls(base: string | undefined, s: State) {
  return [base, s.cls].filter(Boolean).join(' ') || undefined;
}

function stateProps(s: State, base?: string) {
  return { type: 'button' as const, className: cls(base, s), disabled: s.disabled };
}

function Toggle({ state, on, color = 'var(--text)', label = '全部假日' }: { state: State; on: boolean; color?: string; label?: string }) {
  return (
    <button {...stateProps(state, 'toggle')} role="switch" aria-checked={on} style={{ '--c': color } as CSSProperties}>
      <span className="knob" />
      {label}
    </button>
  );
}

const COUNTRIES = [
  ['TW', '台灣'],
  ['JP', '日本'],
  ['PT', '葡萄牙'],
  ['MX', '墨西哥'],
  ['GE', '喬治亞'],
  ['VN', '越南'],
  ['ID', '印尼'],
  ['TH', '泰國'],
  ['AU', '澳洲'],
];

// Columns: default, hover, edge hover, dragging, blocked (see the stay section's states).
function StayBlock({ state, i, place, color, warn, narrow }: { state: State; i: number; place: string; color: string; warn?: boolean; narrow?: boolean }) {
  const hover = i === 1 || i === 2;
  const className = ['stay', hover && 'is-hover', i === 3 && 'active', i === 4 && 'blocked'].filter(Boolean).join(' ');
  return (
    <div className={narrow ? 'ds-track narrow' : 'ds-track'} title={state.label}>
      <div className={className} style={{ background: color }}>
        <span className="handle" data-edge="l" />
        <span className="label">
          <strong>
            {warn && <Warning size={12} weight="bold" aria-label="季節提醒" />}
            {place}
          </strong>
          <small>{i === 3 ? '2027/3/1 – 4/8' : '5.5 週'}</small>
        </span>
        <span className={i === 2 ? 'handle is-hover' : 'handle'} data-edge="r" />
      </div>
    </div>
  );
}

function Segmented({ selected, state }: { selected: number; state: State }) {
  return (
    <div className="segmented" role="tablist" style={{ '--i': selected } as CSSProperties}>
      <span className="thumb" />
      {['年', '月'].map((label, i) => (
        <button key={label} type="button" role="tab" aria-selected={i === selected} className={i === 1 ? state.cls : undefined}>
          {label}
        </button>
      ))}
    </div>
  );
}
