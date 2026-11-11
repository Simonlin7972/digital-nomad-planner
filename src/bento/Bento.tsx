import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Count, Phone, Roll, Stage, Swap } from './kit'
import type { Act } from './kit'
import { PH } from './assets/phosphor'
import tw from './assets/tw.svg'
import id from './assets/id.svg'
import pt from './assets/pt.svg'
import vn from './assets/vn.svg'
import kr from './assets/kr.svg'
import xk from './assets/xk.svg'
import hk from './assets/hk.svg'
import us from './assets/us.svg'
import sg from './assets/sg.svg'
import au from './assets/au.svg'
import th from './assets/th.svg'
import jp from './assets/jp.svg'
import my from './assets/my.svg'
import tk from './assets/TK.png'
import tr from './assets/tr.svg'
import { Avatar } from '../components/Avatar'
import { PRESETS, withOption, type Avatar as AvatarData, type Head } from '../lib/avatar'
import './Bento.css'

// The features section of Not WFH (今天不在家工作), a year planner for digital
// nomads. Twelve tiles in five rows: a wide tile and a single,
// three singles, a wide and a single, a single and a wide, three singles.
//
//   Tile       Span   Kind        The loop (each one is something the real planner does)
//   Timeline   2 × 1  Hero UI     drag across empty weeks: a stay appears; ⌘Z takes it back
//   Schengen   1 × 1  Stat        a Paris stay is added: 34 days left rolls to 20, then back as it leaves
//   Search     1 × 1  Component   type "ko", arrow down and up, Enter picks 南韓; the × clears it
//   Ticket     1 × 1  Object      dragging the booked flight's pass: it won't move, the lock says why
//   Seasons    1 × 1  Diagram     hovering months shows their rating and temperatures
//   Calendar   2 × 1  UI          pulling 東京's end onto 首爾's first day makes a travel day; ⌘Z
//   Colour     1 × 1  Component   clicking swatches recolours the stay
//   Visa       1 × 1  Component   switching the passport from 台灣 to 日本 rewrites each country's entry rule
//   Next year  2 × 1  UI          pulling 曼谷's end past 12/31, then switching to 2028, where it shows faded
//   Avatar     1 × 1  Component   trying hats on the pixel nomad, then turning it around
//   Phone      1 × 1  Device      days pass on the phone's now / next card until the next stay begins
//   Share      1 × 1  Component   the share image switches from landscape to the 9:16 story size
//
// No window chrome: the planner is a web app, so its own cards stand in.
// The loops start staggered so the grid never moves all at once.

type Flagged = { flag: string }

function Ph({ name, size = 16, className }: { name: keyof typeof PH; size?: number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" width={size} height={size} aria-hidden>
      <path d={PH[name]} fill="currentColor" />
    </svg>
  )
}

function Flag({ src, className = 'nwb-flag' }: { src: string; className?: string }) {
  return <img className={className} src={src} alt="" />
}

function Tile({ area, title, children, picture, dark }: { area: string; title: ReactNode; children?: ReactNode; picture?: ReactNode; dark?: boolean }) {
  return (
    <section className={`nwb-tile nwb-tile--${area}`} data-dark={dark || undefined} data-crop>
      {title ? (
        <p className="nwb-copy">
          {title}
          {children && <span className="nwb-desc">{children}</span>}
        </p>
      ) : (
        children
      )}
      {picture}
    </section>
  )
}

// The tile owns the crop: a Stage matches its slot's current size.
function useBox() {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ width: 340, height: 300 })
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const measure = () => {
      const r = node.getBoundingClientRect()
      setBox({ width: Math.max(1, Math.round(r.width)), height: Math.max(1, Math.round(r.height)) })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return [ref, box] as const
}

/* ---------------- Timeline (hero) ---------------- */

type HS = { draft: null | number; added: boolean }
const H0: HS = { draft: null, added: false }
const HERO_POSTER: HS = { draft: null, added: true }

// 2027's timeline starts on Monday 28 December: one column per week.
const DATES = Array.from({ length: 26 }, (_, i) => new Date(2026, 11, 28 + i * 7).getDate())
const MONTHS = [
  { col: 0, label: '1月', holiday: '元旦' },
  { col: 5, label: '2月', holiday: '春節' },
  { col: 9, label: '3月' },
  { col: 13, label: '4月', holiday: '清明' },
  { col: 17, label: '5月' },
  { col: 22, label: '6月' },
]
type Stay = Flagged & { from: number; to: number; city: string; len: string; color: string; country: string; locked?: boolean }
const STAYS: Stay[] = [
  { from: 0, to: 5, city: '台北', len: '5 週', color: '#cf4b45', country: '台灣', flag: tw },
  { from: 5, to: 9, city: '倉古', len: '4 週', color: '#2a9d8f', country: '印尼', flag: id },
  { from: 13, to: 19, city: '里斯本', len: '6 週', color: '#3b82c4', country: '葡萄牙', flag: pt, locked: true },
]
// The stay the loop adds, in the empty weeks of March
const NEW: Stay = { from: 9, to: 13, city: '峴港', len: '4 週', color: '#d97a1e', country: '越南', flag: vn }
const GAP_FROM = 9
const GAP_TO = 13
const STAY_TOP = 82
const STAY_H = 52

const heroScript = (col: number) => async (a: Act<HS>) => {
  await a.wait(900)
  const t = a.rect('track')
  const y = t.y + STAY_TOP + STAY_H / 2
  await a.move({ x: t.x + GAP_FROM * col + 6, y })
  await a.wait(220)
  a.mark('drag')
  await a.drag(
    { x: t.x + GAP_TO * col - 4, y },
    (p) => {
      // The selection snaps to half weeks, as the timeline does
      const to = Math.round(((p.x - t.x) / col) * 2) / 2
      a.put({ draft: Math.max(GAP_FROM + 0.5, Math.min(GAP_TO, to)) })
    },
    { duration: 1200, cursor: 'preserve' },
  )
  await a.set({ draft: null, added: true })
  await a.move('hero-aside')
  a.mark('added')
  await a.wait(2400)
  await a.key('cmd+z')
  await a.set({ added: false })
  await a.wait(500)
  await a.move('hero-rest')
  await a.wait(900)
}

function Block({ s, col, on = true, i = 0 }: { s: Stay; col: number; on?: boolean; i?: number }) {
  return (
    <>
      <span
        className="nwb-stay"
        data-on={on || undefined}
        style={{ left: s.from * col + 1, width: (s.to - s.from) * col - 2, background: s.color, transitionDelay: on ? `${i * 70}ms` : '0ms' }}
      >
        <b>
          {s.locked && <Ph name="Lock" size={12} />}
          {s.city}
        </b>
        <small>{s.len}</small>
      </span>
      <span className="nwb-country" data-on={on || undefined} style={{ left: s.from * col + 1, width: (s.to - s.from) * col - 2, '--c': s.color } as CSSProperties}>
        <Flag src={s.flag} />
        {s.country}
      </span>
    </>
  )
}

function Timeline({ s, col }: { s: HS; col: number }) {
  return (
    <div className="nwb-planner">
      <div className="nwb-bar">
        <span className="nwb-pill">
          2027 <Ph name="CaretDown" size={12} />
        </span>
        <span className="nwb-seg">
          <span data-on>年</span>
          <span>月</span>
        </span>
        <span className="nwb-pill">
          <Ph name="CalendarBlank" size={14} /> 假日
        </span>
      </div>
      <div className="nwb-track" data-target="track" style={{ width: DATES.length * col, backgroundSize: `${col}px 100%` }}>
        {MONTHS.map((m) => (
          <span key={m.label} className="nwb-month" style={{ left: m.col * col }}>
            {m.label}
            {m.holiday && <i>{m.holiday}</i>}
          </span>
        ))}
        {DATES.map((d, i) => (
          <span key={i} className="nwb-date" style={{ left: i * col, width: col }}>
            {d}
          </span>
        ))}
        {STAYS.map((stay, i) => (
          <Block key={stay.city} s={stay} col={col} i={i} />
        ))}
        <Block s={NEW} col={col} on={s.added} />
        {s.draft !== null && <span className="nwb-draft" style={{ left: GAP_FROM * col + 1, width: (s.draft - GAP_FROM) * col - 2 }} />}
        <span className="nwb-mark" data-target="hero-aside" style={{ left: 11 * col, top: STAY_TOP + STAY_H + 56 }} />
        <span className="nwb-mark" data-target="hero-rest" style={{ left: 7 * col, top: STAY_TOP + STAY_H + 62 }} />
      </div>
    </div>
  )
}

function Plan() {
  const [picture, box] = useBox()
  const col = box.width < 600 ? 22 : 30
  return (
    <Tile
      area="hero"
      title={<b>一整年，一條時間軸</b>}
      picture={
        <div ref={picture} className="nwb-picture nwb-picture--full">
          <Stage<HS> width={box.width} height={258} initial={H0} poster={HERO_POSTER} script={heroScript(col)} cursor={{ at: 'hero-rest' }} keys="bottom-right" className="nwb-stage">
            {(s) => <Timeline s={s} col={col} />}
          </Stage>
        </div>
      }
    >
      在空白處一拖就多一段行程，拉兩端就改日期
    </Tile>
  )
}

/* ---------------- Schengen (stat) ---------------- */

type SS = { paris: boolean }
const statScript = async (a: Act<SS>) => {
  await a.wait(2600)
  await a.set({ paris: true })
  await a.wait(3000)
  await a.set({ paris: false })
  await a.wait(2600)
}

function Schengen() {
  const [ref, box] = useBox()
  return (
    <Tile
      area="stat"
      dark
      title={null}
      picture={
        <div ref={ref} className="nwb-picture nwb-picture--fill">
          <Stage<SS> width={box.width} height={box.height} initial={{ paris: false }} poster={{ paris: false }} script={statScript} className="nwb-stage">
            {(s) => (
              <div className="nwb-stat">
                <span className="nwb-stat-lead">申根區還能待</span>
                <span className="nwb-stat-number">
                  <Count value={s.paris ? 20 : 34} duration={900} />
                  <span className="nwb-stat-unit">天</span>
                </span>
                <span className="nwb-stat-label">依 90/180 天規則，從你排的歐洲行程即時算出來</span>
                <span className="nwb-meter" aria-hidden>
                  <span className="nwb-paris" data-on={s.paris || undefined}>
                    ＋ 巴黎 · 14 天
                  </span>
                  <span className="nwb-meter-bar">
                    <span className="nwb-meter-used" style={{ width: `${((s.paris ? 70 : 56) / 90) * 100}%` }} />
                  </span>
                  <span className="nwb-meter-legend">
                    <span className="nwb-used">
                      已待
                      <Count value={s.paris ? 70 : 56} duration={900} />天
                    </span>
                    <span>90</span>
                  </span>
                </span>
              </div>
            )}
          </Stage>
        </div>
      }
    />
  )
}

/* ---------------- Search (component) ---------------- */

type QS = { q: string; focus: boolean; active: number; picked: boolean }
const Q0: QS = { q: '', focus: true, active: -1, picked: false }
const Q_POSTER: QS = { q: 'ko', focus: true, active: 0, picked: false }
type Opt = Flagged & { name: string; sub: string }
const POPULAR: Opt[] = [
  { name: '美國', sub: 'United States', flag: us },
  { name: '新加坡', sub: 'Singapore', flag: sg },
  { name: '澳洲', sub: 'Australia', flag: au },
]
const MATCHES: Opt[] = [
  { name: '南韓', sub: 'South Korea', flag: kr },
  { name: '科索沃', sub: 'Kosovo', flag: xk },
  { name: '香港', sub: 'Hong Kong', flag: hk },
]

const searchScript = async (a: Act<QS>) => {
  await a.wait(1600)
  await a.type('q', 'ko', { interval: 220 })
  await a.set({ active: 0 })
  await a.move('search-rest')
  await a.wait(700)
  await a.key('down')
  await a.set({ active: 1 })
  await a.wait(420)
  await a.key('up')
  await a.set({ active: 0 })
  await a.wait(420)
  await a.key('enter')
  await a.set({ picked: true, focus: false })
  await a.wait(2400)
  // The × empties the field and brings the whole list back, focus kept
  await a.click({ at: 'clear', x: 0.5, y: 0.5 })
  await a.set({ ...Q0 })
  await a.move('search-rest')
  await a.wait(600)
}

function Marked({ text, q }: { text: string; q: string }) {
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  )
}

function Search() {
  const [picture, box] = useBox()
  return (
    <Tile
      area="search"
      title={<b>中英日都能搜</b>}
      picture={
        <div ref={picture} className="nwb-picture nwb-picture--full">
          <Stage<QS> width={box.width} height={226} initial={Q0} poster={Q_POSTER} script={searchScript} cursor={{ at: 'search-rest' }} keys="bottom-right" className="nwb-stage">
            {(s) => {
              const rows = s.q ? MATCHES.filter((m) => m.sub.toLowerCase().includes(s.q.toLowerCase())) : POPULAR
              const open = s.focus && !s.picked
              return (
                <div className="nwb-combo">
                  <span className="nwb-field" data-target="field" data-cursor="ibeam" data-focus={s.focus || s.picked || undefined}>
                    {s.picked ? <Flag src={kr} /> : <Ph name="MagnifyingGlass" size={16} />}
                    <span className="nwb-typed">{s.picked ? '南韓' : s.q || <span className="nwb-ph">搜尋國家，例：泰國</span>}</span>
                    <span className="nwb-clear" data-target="clear" data-on={s.q || s.picked ? true : undefined}>
                      <Ph name="X" size={10} />
                    </span>
                  </span>
                  <span className="nwb-list" data-open={open || undefined}>
                    {!s.q && <span className="nwb-group">熱門</span>}
                    {rows.map((m, i) => (
                      <span key={m.name} className="nwb-option" data-active={i === s.active || undefined}>
                        <Flag src={m.flag} />
                        <span>{m.name}</span>
                        <small>
                          <span>
                            <Marked text={m.sub} q={s.q} />
                          </span>
                        </small>
                      </span>
                    ))}
                  </span>
                  <span className="nwb-mark" data-target="search-rest" style={{ right: 6, top: 196 }} />
                </div>
              )
            }}
          </Stage>
        </div>
      }
    >
      符合的字直接標出來
    </Tile>
  )
}

/* ---------------- Ticket (object) ---------------- */

type TS = { dx: number; shake: boolean; pulse: boolean }
const T0: TS = { dx: 0, shake: false, pulse: false }

const ticketScript = async (a: Act<TS>) => {
  await a.wait(2400)
  await a.move({ at: 'pass', x: 0.62, y: 0.42 })
  await a.wait(200)
  const from = a.center('pass')
  await a.drag(
    { x: from.x + 90, y: from.y - 6 },
    (p) => a.put({ dx: Math.min(8, Math.max(0, (p.x - from.x) * 0.1)) }),
    { duration: 800 },
  )
  // It springs back and shakes; the lock says why
  await a.set({ dx: 0, shake: true, pulse: true })
  await a.wait(500)
  await a.set({ shake: false })
  await a.move('ticket-rest')
  await a.wait(1800)
  await a.set({ pulse: false })
  await a.wait(1600)
}

function Ticket() {
  return (
    <Tile
      area="ticket"
      title={<b>買了機票就鎖住</b>}
      picture={
        <div className="nwb-picture nwb-picture--small">
          <Stage<TS> width={360} height={246} initial={T0} poster={{ dx: 0, shake: false, pulse: true }} script={ticketScript} cursor={{ at: 'ticket-rest' }} className="nwb-stage">
            {(s) => (
              <>
                <div className="nwb-pass" data-target="pass" data-cursor="open" data-shake={s.shake || undefined} style={{ translate: `${s.dx}px 0` }}>
                  <span className="nwb-pass-top">
                    <img className="nwb-pass-logo" src={tk} alt="" />
                    <span className="nwb-pass-air">土耳其航空</span>
                    <span className="nwb-pass-no">TK 1759</span>
                  </span>
                  <span className="nwb-pass-route">
                    <span>
                      <b>IST</b>
                      <small>伊斯坦堡</small>
                    </span>
                    <span className="nwb-pass-line" />
                    <span>
                      <b>LIS</b>
                      <small>里斯本</small>
                    </span>
                  </span>
                  <span className="nwb-pass-when">4月2日 · 08:40</span>
                  <span className="nwb-pass-fields">
                    <span>
                      <small>登機門</small>B12
                    </span>
                    <span>
                      <small>座位</small>23A
                    </span>
                    <span>
                      <small>艙等</small>經濟
                    </span>
                  </span>
                  <span className="nwb-lock" data-pulse={s.pulse || undefined}>
                    <Ph name="Lock" size={14} /> 已鎖定
                  </span>
                </div>
                <span className="nwb-mark" data-target="ticket-rest" style={{ left: 316, top: 150 }} />
              </>
            )}
          </Stage>
        </div>
      }
    >
      拖不動，也不會被隔壁推走
    </Tile>
  )
}

/* ---------------- Seasons (diagram) ---------------- */

// Chiang Mai, from src/lib/seasons.ts: 2 best, 1 fine, 0 avoid; highs and lows in °C
const RATINGS = [2, 1, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2]
const HIGHS = [29, 32, 35, 36, 34, 32, 31, 31, 31, 31, 30, 28]
const LOWS = [14, 15, 19, 22, 23, 23, 23, 23, 23, 22, 19, 15]
const KIND = ['avoid', 'fine', 'best'] as const
const KIND_ZH = ['避開', '普通', '推薦']
const STAY_MONTHS = [2, 3] // the stay runs through March and April

type MS = { hover: number | null }
const seasonScript = async (a: Act<MS>) => {
  await a.wait(1800)
  for (const m of [2, 3, 10]) {
    await a.move({ at: `mo-${m}`, x: 0.5, y: 0.75 })
    await a.set({ hover: m })
    await a.wait(m === 10 ? 2000 : 1300)
  }
  await a.set({ hover: null })
  await a.move('season-rest')
  await a.wait(1800)
}

function Seasons() {
  const [picture, box] = useBox()
  return (
    <Tile
      area="season"
      title={<b>什麼時候去最好</b>}
      picture={
        <div ref={picture} className="nwb-picture nwb-picture--full">
          <Stage<MS> width={box.width} height={226} initial={{ hover: null }} poster={{ hover: 2 }} script={seasonScript} cursor={{ at: 'season-rest' }} className="nwb-stage">
            {(s) => (
              <div className="nwb-season">
                <span className="nwb-season-city">
                  <Flag src={th} />
                  清邁
                  <span className="nwb-warn">
                    <Ph name="Warning" size={13} /> 季節不佳
                  </span>
                </span>
                <span className="nwb-months">
                  {RATINGS.map((r, m) => (
                    <span key={m} className={`nwb-mo nwb-mo--${KIND[r]}`} data-target={`mo-${m}`} data-in={STAY_MONTHS.includes(m) || undefined}>
                      {m + 1}
                      <span className="nwb-tip" data-on={s.hover === m || undefined}>
                        {m + 1}月・{KIND_ZH[r]}・{LOWS[m]}–{HIGHS[m]}°C
                      </span>
                    </span>
                  ))}
                </span>
                <span className="nwb-season-note">
                  <b>3–4月</b> 燒山季，空氣品質常是全球最差之一
                </span>
                <span className="nwb-legend">
                  <span>
                    <i className="nwb-mo--best" />
                    推薦
                  </span>
                  <span>
                    <i className="nwb-mo--fine" />
                    普通
                  </span>
                  <span>
                    <i className="nwb-mo--avoid" />
                    避開
                  </span>
                </span>
                <span className="nwb-mark" data-target="season-rest" style={{ right: 4, top: 196 }} />
              </div>
            )}
          </Stage>
        </div>
      }
    >
      71 個城市，每個月都有評等
    </Tile>
  )
}

/* ---------------- Calendar (wide UI) ---------------- */

// March 2027 starts on a Monday. 東京 runs to the 10th, 首爾 starts on the 12th;
// the loop pulls 東京's end onto the 12th, which becomes a travel day.
type CS = { end: number; shared: boolean }
const REST_END = 3 // in columns of the second week (the 8th is column 0): the end of the 10th
const SHARED_END = 4.5 // half of the 12th
const C0: CS = { end: REST_END, shared: false }

const calScript = async (a: Act<CS>) => {
  await a.wait(2000)
  const g = a.rect('cal-week')
  const cw = g.width / 7
  await a.move({ at: 'tk-end', x: 0.5, y: 0.5 })
  await a.wait(220)
  a.mark('pull')
  await a.drag(
    { x: g.x + SHARED_END * cw, y: a.center('tk-end').y },
    (p) => a.put({ end: Math.max(REST_END, Math.min(SHARED_END, (p.x - g.x) / cw)) }),
    { duration: 1000, cursor: 'preserve' },
  )
  await a.set({ end: SHARED_END, shared: true })
  await a.move('cal-aside')
  a.mark('travel')
  await a.wait(2600)
  await a.key('cmd+z')
  await a.set({ ...C0 })
  await a.wait(500)
  await a.move('cal-rest')
  await a.wait(900)
}

function CBar({ from, to, color, label, flag, end, target, shared }: { from: number; to: number; color: string; label?: string; flag?: string; end?: boolean; target?: string; shared?: boolean }) {
  return (
    <span className="nwb-cbar" data-shared={shared || undefined} style={{ left: `calc(${from} * var(--cw) + 1px)`, width: `calc(${to - from} * var(--cw) - 2px)`, background: color }}>
      {label && (
        <>
          {flag && <Flag src={flag} className="nwb-cflag" />}
          {label}
        </>
      )}
      {end && <span className="nwb-cend" data-target={target} data-cursor="resize-ew" />}
    </span>
  )
}

function Calendar() {
  const [picture, box] = useBox()
  return (
    <Tile
      area="cal"
      title={<b>移動日也算得清楚</b>}
      picture={
        <div ref={picture} className="nwb-picture nwb-picture--full">
          <Stage<CS> width={box.width} height={232} initial={C0} poster={{ end: SHARED_END, shared: true }} script={calScript} cursor={{ at: 'cal-rest' }} keys="bottom-right" className="nwb-stage">
            {(s) => (
              <div className="nwb-cal">
                <div className="nwb-cal-head">
                  <span className="nwb-cal-nav">
                    <Ph name="CaretLeft" size={14} />
                  </span>
                  <b>2027 年 3 月</b>
                  <span className="nwb-cal-nav">
                    <Ph name="CaretRight" size={14} />
                  </span>
                </div>
                <div className="nwb-cal-days">
                  {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                {[0, 1, 2].map((w) => (
                  <div key={w} className="nwb-cal-week" data-target={w === 1 ? 'cal-week' : undefined}>
                    {Array.from({ length: 7 }, (_, d) => (
                      <span key={d} className="nwb-cal-day">
                        {w * 7 + d + 1}
                      </span>
                    ))}
                    {w === 0 && <CBar from={0} to={7} color="#c2548f" label="東京" flag={jp} />}
                    {w === 1 && (
                      <>
                        <CBar from={0} to={s.end} color="#c2548f" end target="tk-end" />
                        <CBar from={s.shared ? SHARED_END : 4} to={7} color="#3b82c4" label="首爾" flag={kr} shared={s.shared} />
                        <span className="nwb-plane" data-on={s.shared || undefined} style={{ left: `calc(${SHARED_END} * var(--cw))` }}>
                          <Ph name="Airplane" size={12} />
                        </span>
                        <span className="nwb-travel" data-on={s.shared || undefined} style={{ left: `calc(4 * var(--cw))` }}>
                          移動日
                        </span>
                        <span className="nwb-mark" data-target="cal-aside" style={{ left: `calc(5.6 * var(--cw))`, top: 56 }} />
                        <span className="nwb-mark" data-target="cal-rest" style={{ left: `calc(2.2 * var(--cw))`, top: 56 }} />
                      </>
                    )}
                    {w === 2 && <CBar from={0} to={7} color="#3b82c4" label="首爾" flag={kr} />}
                  </div>
                ))}
              </div>
            )}
          </Stage>
        </div>
      }
    >
      結束日拉到下一段的第一天，那天就算在兩段
    </Tile>
  )
}

/* ---------------- Colour (component) ---------------- */

const PALETTE = ['#222222', '#cf4b45', '#d97a1e', '#a8841f', '#4a9d5b', '#2a9d8f', '#3b82c4', '#7c5cc4', '#c2548f']
type WS = { c: number }
const swatchScript = async (a: Act<WS>) => {
  await a.wait(3000)
  for (const c of [4, 7, 2]) {
    await a.click({ at: `sw-${c}`, x: 0.62, y: 0.68 })
    await a.set({ c })
    await a.wait(1300)
  }
  await a.move('swatch-rest')
  await a.wait(1500)
}

function Colour() {
  const [picture, box] = useBox()
  return (
    <Tile
      area="swatch"
      title={<b>一段一個顏色</b>}
      picture={
        <div ref={picture} className="nwb-picture nwb-picture--full">
          <Stage<WS> width={box.width} height={236} initial={{ c: 2 }} poster={{ c: 4 }} script={swatchScript} cursor={{ at: 'swatch-rest' }} className="nwb-stage">
            {(s) => (
              <div className="nwb-swatch">
                <span className="nwb-sw-stay" style={{ background: PALETTE[s.c] }}>
                  <b>檳城</b>
                  <small>3 週</small>
                </span>
                <span className="nwb-sw-country" style={{ '--c': PALETTE[s.c] } as CSSProperties}>
                  <Flag src={my} />
                  馬來西亞
                </span>
                <span className="nwb-sw-label">顏色</span>
                <span className="nwb-sw-row">
                  {PALETTE.map((hex, i) => (
                    <span key={hex} className="nwb-sw" data-target={`sw-${i}`} data-cursor="pointer" data-on={s.c === i || undefined} style={{ background: hex }} />
                  ))}
                </span>
                <span className="nwb-mark" data-target="swatch-rest" style={{ right: 8, top: 196 }} />
              </div>
            )}
          </Stage>
        </div>
      }
    >
      同一個地方，下次自動沿用
    </Tile>
  )
}

/* ---------------- Visa (component) ---------------- */

// From the planner's bundled Passport Index snapshot (src/data/visa.json, 2026-02-17)
type Pass = 'tw' | 'jp'
type Rule = { text: string; kind: 'free' | 'evisa' }
const PASSPORTS: Record<Pass, Flagged & { name: string }> = {
  tw: { name: '台灣', flag: tw },
  jp: { name: '日本', flag: jp },
}
const VISA_ROWS: (Flagged & { country: string; rule: Record<Pass, Rule> })[] = [
  { country: '越南', flag: vn, rule: { tw: { text: '需事先申請電子簽證', kind: 'evisa' }, jp: { text: '免簽 45 天', kind: 'free' } } },
  { country: '土耳其', flag: tr, rule: { tw: { text: '需事先申請電子簽證', kind: 'evisa' }, jp: { text: '免簽 90 天', kind: 'free' } } },
  { country: '馬來西亞', flag: my, rule: { tw: { text: '免簽 30 天', kind: 'free' }, jp: { text: '免簽 90 天', kind: 'free' } } },
]

// `rows` is the passport each row has caught up with, so the rows change one after another
type VS = { pass: Pass; open: boolean; hover: Pass | null; rows: Pass[] }
const V0: VS = { pass: 'tw', open: false, hover: null, rows: ['tw', 'tw', 'tw'] }

const visaScript = async (a: Act<VS>) => {
  for (const to of ['jp', 'tw'] as Pass[]) {
    await a.wait(to === 'jp' ? 2200 : 2600)
    await a.click({ at: 'pp', x: 0.5, y: 0.5 })
    await a.set({ open: true, hover: null })
    await a.move({ at: `pp-${to}`, x: 0.35, y: 0.5 })
    await a.set({ hover: to })
    await a.wait(200)
    await a.click({ at: `pp-${to}`, x: 0.35, y: 0.5 })
    await a.set({ pass: to, open: false })
    await a.move('visa-rest')
    const rows: Pass[] = VISA_ROWS.map(() => (to === 'jp' ? 'tw' : 'jp'))
    for (let i = 0; i < rows.length; i++) {
      await a.wait(i === 0 ? 120 : 110)
      rows[i] = to
      a.put({ rows: [...rows] })
    }
  }
  await a.wait(1200)
}

function Visa() {
  const [picture, box] = useBox()
  return (
    <Tile
      area="visa"
      title={<b>換一本護照，簽證規則跟著換</b>}
      picture={
        <div ref={picture} className="nwb-picture nwb-picture--full">
          <Stage<VS> width={box.width} height={226} initial={V0} poster={{ ...V0, pass: 'jp', rows: ['jp', 'jp', 'jp'] }} script={visaScript} cursor={{ at: 'visa-rest' }} className="nwb-stage">
            {(s) => (
              <div className="nwb-visa">
                <span className="nwb-pp" data-target="pp" data-cursor="pointer" data-focus={s.open || undefined}>
                  <span className="nwb-pp-label">護照</span>
                  <Flag src={PASSPORTS[s.pass].flag} />
                  <Swap id={s.pass} className="nwb-pp-name">
                    {PASSPORTS[s.pass].name}
                  </Swap>
                  <Ph name="CaretDown" size={12} className="nwb-pp-caret" />
                </span>
                <span className="nwb-visa-rows">
                  {VISA_ROWS.map((r, i) => {
                    const rule = r.rule[s.rows[i]]
                    return (
                      <span key={r.country} className="nwb-visa-row">
                        <Flag src={r.flag} />
                        <span>{r.country}</span>
                        <Swap id={s.rows[i]} className="nwb-rule-slot">
                          <span className={`nwb-rule nwb-rule--${rule.kind}`}>{rule.text}</span>
                        </Swap>
                      </span>
                    )
                  })}
                </span>
                <span className="nwb-list nwb-pp-menu" data-open={s.open || undefined}>
                  {(Object.keys(PASSPORTS) as Pass[]).map((p) => (
                    <span key={p} className="nwb-option" data-target={`pp-${p}`} data-active={s.hover === p || undefined}>
                      <Flag src={PASSPORTS[p].flag} />
                      <span>{PASSPORTS[p].name}</span>
                      {s.pass === p && <Ph name="CheckCircle" size={14} className="nwb-pp-check" />}
                    </span>
                  ))}
                </span>
                <span className="nwb-mark" data-target="visa-rest" style={{ right: 6, top: 200 }} />
              </div>
            )}
          </Stage>
        </div>
      }
    >
      依你的護照顯示每個國家能待多久
    </Tile>
  )
}

/* ---------------- Next year (wide UI) ---------------- */

// Days from Monday 1 November 2027. The year line is 1 January 2028 (day 61);
// 2028's timeline starts on Monday 27 December (day 56), as the planner's does.
const NY_WEEKS = Array.from({ length: 22 }, (_, i) => new Date(2027, 10, 1 + i * 7).getDate())
const NY_MONTHS = [
  { day: 0, label: '11月' },
  { day: 30, label: '12月' },
  { day: 61, label: '1月', year: '2028' },
  { day: 92, label: '2月' },
  { day: 121, label: '3月' },
]
const YEAR_LINE = 61
const BKK_FROM = 28
const BKK_END = 49 // end of 19 December, exclusive
const BKK_LONG = 70 // end of 9 January 2028
const NEXT_START = 56

type YS = { end: number; year: 2027 | 2028; menu: boolean; hover: number | null }
const Y0: YS = { end: BKK_END, year: 2027, menu: false, hover: null }

const yearScript = (dayPx: number) => async (a: Act<YS>) => {
  await a.wait(1800)
  // Pull 曼谷's end past the year line; it snaps to half weeks, as the timeline does
  await a.move({ at: 'bkk-end', x: 0.5, y: 0.5 })
  await a.wait(200)
  const from = a.center('bkk-end')
  a.mark('pull')
  await a.drag(
    { x: from.x + (BKK_LONG - BKK_END) * dayPx, y: from.y },
    (p) => {
      const d = BKK_END + (p.x - from.x) / dayPx
      a.put({ end: Math.max(BKK_END, Math.min(BKK_LONG, Math.round(d / 3.5) * 3.5)) })
    },
    { duration: 1200, cursor: 'preserve' },
  )
  await a.set({ end: BKK_LONG })
  await a.move('year-aside')
  a.mark('spilled')
  await a.wait(1500)
  // Over to 2028, where the stay shows faded at the start
  for (const y of [2028, 2027] as const) {
    await a.click({ at: 'year-pill', x: 0.5, y: 0.5 })
    await a.set({ menu: true, hover: null })
    await a.move({ at: `yr-${y}`, x: 0.4, y: 0.5 })
    await a.set({ hover: y })
    await a.wait(180)
    await a.click({ at: `yr-${y}`, x: 0.4, y: 0.5 })
    await a.set({ menu: false, year: y })
    await a.move('year-aside')
    if (y === 2028) a.mark('next')
    await a.wait(y === 2028 ? 2600 : 900)
  }
  // And back: the stay ends in December again
  await a.move({ at: 'bkk-end', x: 0.5, y: 0.5 })
  await a.wait(160)
  const back = a.center('bkk-end')
  await a.drag(
    { x: back.x - (BKK_LONG - BKK_END) * dayPx, y: back.y },
    (p) => {
      const d = BKK_LONG + (p.x - back.x) / dayPx
      a.put({ end: Math.max(BKK_END, Math.min(BKK_LONG, Math.round(d / 3.5) * 3.5)) })
    },
    { duration: 900, cursor: 'preserve' },
  )
  await a.set({ end: BKK_END })
  await a.move('year-rest')
  await a.wait(1200)
}

type NyStay = Flagged & { from: number; to: number; city: string; len: string; color: string; year: 2027 | 2028 }
const NY_STAYS: NyStay[] = [
  { from: 0, to: 28, city: '河內', len: '4 週', color: '#2a9d8f', flag: vn, year: 2027 },
  { from: 70, to: 98, city: '峇里島', len: '4 週', color: '#d97a1e', flag: id, year: 2028 },
  { from: 98, to: 119, city: '吉隆坡', len: '3 週', color: '#7c5cc4', flag: my, year: 2028 },
]

function NextYear() {
  const [picture, box] = useBox()
  const narrow = box.width < 600
  const col = narrow ? 30 : 44
  const dayPx = col / 7
  const x = (d: number) => d * dayPx
  // Where the track starts in each year's view, in days
  const offset = (s: YS) => (s.year === 2028 ? NEXT_START : narrow ? 14 : 0)
  return (
    <Tile
      area="year"
      title={<b>行程可以跨年</b>}
      picture={
        <div ref={picture} className="nwb-picture nwb-picture--full">
          <Stage<YS> width={box.width} height={252} initial={Y0} poster={{ ...Y0, end: BKK_LONG }} script={yearScript(dayPx)} cursor={{ at: 'year-rest' }} className="nwb-stage">
            {(s) => {
              const weeks = (s.end - BKK_FROM) / 7
              const spilled = s.end > YEAR_LINE
              return (
                <div className="nwb-planner nwb-ny" data-year={s.year}>
                  <div className="nwb-bar">
                    <span className="nwb-pill" data-target="year-pill" data-cursor="pointer" data-focus={s.menu || undefined}>
                      <Roll>{String(s.year)}</Roll> <Ph name="CaretDown" size={12} />
                    </span>
                    <span className="nwb-seg">
                      <span data-on>年</span>
                      <span>月</span>
                    </span>
                    <span className="nwb-list nwb-yr-menu" data-open={s.menu || undefined}>
                      {[2026, 2027, 2028].map((y) => (
                        <span key={y} className="nwb-option" data-target={`yr-${y}`} data-active={s.hover === y || undefined}>
                          <span>{y}</span>
                          {s.year === y && <Ph name="CheckCircle" size={14} className="nwb-pp-check" />}
                        </span>
                      ))}
                    </span>
                  </div>
                  <div className="nwb-ny-clip">
                    <div className="nwb-ny-track" style={{ translate: `${-x(offset(s))}px 0`, width: x(NY_WEEKS.length * 7), backgroundSize: `${col}px 100%` }}>
                      {/* The other year, beyond this timeline's end */}
                      <span className="nwb-ny-other" data-on={s.year === 2027 || undefined} style={{ left: x(YEAR_LINE), right: 0 }} />
                      <span className="nwb-ny-other" data-on={s.year === 2028 || undefined} style={{ left: 0, width: x(YEAR_LINE) }} />
                      <span className="nwb-ny-line" style={{ left: x(YEAR_LINE) }} />
                      {NY_MONTHS.map((m) => (
                        <span key={m.label} className="nwb-month" style={{ left: x(m.day) }}>
                          {m.label}
                          {m.year && <i className="nwb-ny-yr">{m.year}</i>}
                        </span>
                      ))}
                      {NY_WEEKS.map((d, i) => (
                        <span key={i} className="nwb-date" style={{ left: i * col, width: col }}>
                          {d}
                        </span>
                      ))}
                      {NY_STAYS.map((st) => (
                        <span key={st.city} className="nwb-stay" data-on={st.year === s.year || undefined} style={{ left: x(st.from) + 1, width: x(st.to - st.from) - 2, background: st.color }}>
                          <b>
                            <Flag src={st.flag} className="nwb-sflag" />
                            {st.city}
                          </b>
                          <small>{st.len}</small>
                        </span>
                      ))}
                      {/* 曼谷 belongs to 2027's plan: solid there, a faded ghost in 2028 */}
                      <span className="nwb-stay" data-on={s.year === 2027 || undefined} data-spill={spilled || undefined} style={{ left: x(BKK_FROM) + 1, width: x(s.end - BKK_FROM) - 2, background: '#cf4b45', '--spill': `${x(s.end - YEAR_LINE)}px` } as CSSProperties}>
                        <b>
                          <Flag src={th} className="nwb-sflag" />
                          曼谷
                        </b>
                        <small>
                          <Roll>{`${Math.round(weeks)} 週`}</Roll>
                        </small>
                        <span className="nwb-cend" data-target="bkk-end" data-cursor="resize-ew" />
                      </span>
                      <span className="nwb-stay nwb-ghost" data-on={s.year === 2028 || undefined} style={{ left: x(NEXT_START) + 1, width: x(BKK_LONG - NEXT_START) - 2 }}>
                        <b>曼谷</b>
                        <small>2027 的行程</small>
                      </span>
                      <span className="nwb-ny-tag" data-on={(spilled && s.year === 2027) || undefined} style={{ left: x(YEAR_LINE) + 8 }}>
                        延到 2028 · 1月9日
                      </span>
                      <span className="nwb-mark" data-target="year-aside" style={{ left: x(offset(s)) + (narrow ? 200 : 330), top: 196 }} />
                      <span className="nwb-mark" data-target="year-rest" style={{ left: x(offset(s)) + (narrow ? 120 : 200), top: 200 }} />
                    </div>
                  </div>
                </div>
              )
            }}
          </Stage>
        </div>
      }
    >
      拉過 12/31 就延到明年，明年那頁也看得到
    </Tile>
  )
}

/* ---------------- Avatar (component) ---------------- */

// The planner's own paper-doll code (src/lib/avatar.ts), the backpacker preset
const NOMAD: AvatarData = withOption(PRESETS[4].avatar, 'head', 'cap')
const HATS: { id: Head; name: string }[] = [
  { id: 'none', name: '無' },
  { id: 'cap', name: '棒球帽' },
  { id: 'bucket', name: '漁夫帽' },
  { id: 'straw', name: '草帽' },
]
type AS = { head: Head; back: boolean }
const A0: AS = { head: 'cap', back: false }

const avatarScript = async (a: Act<AS>) => {
  await a.wait(2000)
  for (const head of ['bucket', 'straw'] as Head[]) {
    await a.click({ at: `hat-${head}`, x: 0.55, y: 0.6 })
    await a.set({ head })
    await a.wait(1300)
  }
  await a.click({ at: 'turn', x: 0.5, y: 0.5 })
  await a.set({ back: true })
  a.mark('back')
  await a.wait(1800)
  await a.click({ at: 'turn', x: 0.5, y: 0.5 })
  await a.set({ back: false })
  await a.wait(900)
  await a.click({ at: 'hat-cap', x: 0.55, y: 0.6 })
  await a.set({ head: 'cap' })
  await a.move('avatar-rest')
  await a.wait(1400)
}

function Nomad() {
  const [picture, box] = useBox()
  return (
    <Tile
      area="avatar"
      title={<b>做一個自己的小人</b>}
      picture={
        <div ref={picture} className="nwb-picture nwb-picture--full">
          <Stage<AS> width={box.width} height={286} initial={A0} poster={{ head: 'straw', back: false }} script={avatarScript} cursor={{ at: 'avatar-rest' }} className="nwb-stage">
            {(s) => {
              const look = withOption(NOMAD, 'head', s.head)
              return (
                <div className="nwb-av">
                  <span className="nwb-av-stage">
                    <span className="nwb-av-floor" />
                    <Avatar key={s.back ? 'back' : 'front'} avatar={look} animate view={s.back ? 'back' : 'front'} className="nwb-av-figure" />
                    <span className="nwb-av-turn" data-target="turn" data-cursor="pointer" data-on={s.back || undefined}>
                      <Ph name="ArrowsClockwise" size={15} />
                    </span>
                  </span>
                  <span className="nwb-av-label">帽子</span>
                  <span className="nwb-av-tiles">
                    {HATS.map((h) => (
                      <span key={h.id} className="nwb-av-tile" data-target={`hat-${h.id}`} data-cursor="pointer" data-on={s.head === h.id || undefined} title={h.name}>
                        {h.id === 'none' ? <span className="nwb-av-none">無</span> : <Avatar avatar={withOption(NOMAD, 'head', h.id)} focus="head" bare className="nwb-av-part" />}
                      </span>
                    ))}
                  </span>
                  <span className="nwb-mark" data-target="avatar-rest" style={{ right: 8, top: 262 }} />
                </div>
              )
            }}
          </Stage>
        </div>
      }
    >
      帽子、包包、寵物都能換
    </Tile>
  )
}

/* ---------------- Phone (device) ---------------- */

// MobileItinerary's now / next card, a few days of March 2027 passing
const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六']
type PS = { day: number; asleep: boolean }
const P0: PS = { day: 8, asleep: false }

const phoneScript = async (a: Act<PS>) => {
  for (const day of [9, 10, 11]) {
    await a.wait(day === 9 ? 2200 : 1500)
    await a.set({ day })
  }
  a.mark('next')
  await a.wait(3200)
  // The screen sleeps; it wakes on the first morning again
  await a.set({ asleep: true })
  await a.wait(520)
  await a.snap({ day: 8 })
  await a.set({ asleep: false })
  await a.wait(400)
}

function NowCard({ day }: { day: number }) {
  const seoul = day >= 11
  const now = seoul
    ? { city: '首爾', country: '南韓', flag: kr, range: '3月11日 – 3月31日', n: day - 10, total: 21, color: '#3b82c4' }
    : { city: '東京', country: '日本', flag: jp, range: '3月1日 – 3月10日', n: day, total: 10, color: '#c2548f' }
  const next = seoul ? { city: '釜山', country: '南韓', flag: kr, range: '4月1日 – 4月14日', start: 32 } : { city: '首爾', country: '南韓', flag: kr, range: '3月11日 – 3月31日', start: 11 }
  const left = now.total - now.n + 1
  return (
    <div className="nwb-now">
      <div key={now.city} className="nwb-now-part">
        <span className="nwb-now-tag">現在</span>
        <span className="nwb-now-place">
          <Flag src={now.flag} />
          {now.city}
          <small>{now.country}</small>
        </span>
        <span className="nwb-now-line">{now.range}</span>
        <span className="nwb-now-bar">
          <i style={{ width: `${(now.n / now.total) * 100}%`, background: now.color }} />
        </span>
        <span className="nwb-now-line">
          <Roll>{`第 ${now.n} / ${now.total} 天 · 還有 ${left} 天`}</Roll>
        </span>
      </div>
      <span className="nwb-now-rule" />
      <div key={next.city} className="nwb-now-part">
        <span className="nwb-now-tag">下一站</span>
        <span className="nwb-now-place">
          <Flag src={next.flag} />
          {next.city}
          <small>{next.country}</small>
        </span>
        <span className="nwb-now-line">
          {next.range} · <Roll>{`${next.start - day} 天後出發`}</Roll>
        </span>
      </div>
    </div>
  )
}

function PhoneNow() {
  const [picture, box] = useBox()
  return (
    <Tile
      area="phone"
      title={<b>手機上看現在和下一站</b>}
      picture={
        <div ref={picture} className="nwb-picture nwb-picture--phone">
          <Stage<PS> width={box.width} height={292} initial={P0} poster={P0} script={phoneScript} className="nwb-stage nwb-phone-stage">
            {(s) => (
              <Phone width={350} wallpaper="#faf9f6" className="nwb-phone">
                <div className="nwb-mobile">
                  <span className="nwb-mobile-date">
                    <Roll>{`3月${s.day}日 星期${WEEKDAY[(s.day + 0) % 7]}`}</Roll>
                  </span>
                  <NowCard day={s.day} />
                </div>
                <span className="nwb-sleep" data-on={s.asleep || undefined} />
              </Phone>
            )}
          </Stage>
        </div>
      }
    >
      出門時打開就知道還剩幾天
    </Tile>
  )
}

/* ---------------- Share (component) ---------------- */

type HS2 = { mode: 'land' | 'port' }
const shareScript = async (a: Act<HS2>) => {
  await a.wait(2200)
  await a.click({ at: 'seg-port', x: 0.5, y: 0.5 })
  await a.set({ mode: 'port' })
  a.mark('portrait')
  await a.wait(1700)
  await a.click({ at: 'download', x: 0.5, y: 0.55 })
  await a.wait(1500)
  await a.click({ at: 'seg-land', x: 0.5, y: 0.5 })
  await a.set({ mode: 'land' })
  await a.move('share-rest')
  await a.wait(1500)
}

const MINI = ['#cf4b45', '#2a9d8f', '#d97a1e', '#3b82c4', '#c2548f', '#4a9d5b']

// The exported image in miniature: drawn at its own size and faded, never stretched
function MiniLand() {
  return (
    <span className="nwb-mini nwb-mini--land">
      <i className="nwb-mini-title" />
      <span className="nwb-mini-track">
        {[14, 10, 18, 12, 20, 16].map((w, i) => (
          <i key={i} style={{ flex: w, background: MINI[i] }} />
        ))}
      </span>
      <span className="nwb-mini-chips">
        {[14, 10, 18, 12, 20, 16].map((w, i) => (
          <i key={i} style={{ flex: w, background: `color-mix(in srgb, ${MINI[i]} 22%, white)` }} />
        ))}
      </span>
      <span className="nwb-mini-cols">
        {[0, 1].map((c) => (
          <span key={c}>
            {[0, 1, 2].map((r) => (
              <span key={r} className="nwb-mini-row">
                <i style={{ background: MINI[c * 3 + r] }} />
                <b style={{ width: 18 + ((r * 7 + c * 5) % 12) }} />
              </span>
            ))}
          </span>
        ))}
      </span>
    </span>
  )
}

function MiniPort() {
  return (
    <span className="nwb-mini nwb-mini--port">
      <i className="nwb-mini-title" />
      <span className="nwb-mini-track">
        {[14, 10, 18, 12, 20, 16].map((w, i) => (
          <i key={i} style={{ flex: w, background: MINI[i] }} />
        ))}
      </span>
      {MINI.map((c, r) => (
        <span key={c} className="nwb-mini-row">
          <i style={{ background: c }} />
          <b style={{ width: 14 + ((r * 7) % 14) }} />
        </span>
      ))}
    </span>
  )
}

function Share() {
  const [picture, box] = useBox()
  return (
    <Tile
      area="share"
      title={<b>一鍵產生行程圖</b>}
      picture={
        <div ref={picture} className="nwb-picture nwb-picture--full">
          <Stage<HS2> width={box.width} height={292} initial={{ mode: 'land' }} poster={{ mode: 'port' }} script={shareScript} cursor={{ at: 'share-rest' }} className="nwb-stage">
            {(s) => (
              <div className="nwb-share">
                <span className="nwb-share-head">
                  <b>分享</b>
                  <span className="nwb-share-x">
                    <Ph name="X" size={12} />
                  </span>
                </span>
                <span className="nwb-share-seg" data-mode={s.mode}>
                  <i className="nwb-share-thumb" />
                  <span data-target="seg-land" data-cursor="pointer" data-on={s.mode === 'land' || undefined}>
                    橫式
                  </span>
                  <span data-target="seg-port" data-cursor="pointer" data-on={s.mode === 'port' || undefined}>
                    直式（限動）
                  </span>
                </span>
                <span className="nwb-share-well">
                  <span className="nwb-share-img" data-mode={s.mode}>
                    <span className="nwb-share-layer" data-on={s.mode === 'land' || undefined}>
                      <MiniLand />
                    </span>
                    <span className="nwb-share-layer" data-on={s.mode === 'port' || undefined}>
                      <MiniPort />
                    </span>
                  </span>
                </span>
                <span className="nwb-share-buttons">
                  <span className="nwb-btn">
                    <Ph name="ShareNetwork" size={14} /> 分享…
                  </span>
                  <span className="nwb-btn nwb-btn--primary" data-target="download" data-cursor="pointer">
                    <Ph name="DownloadSimple" size={14} /> 下載 PNG
                  </span>
                </span>
                <span className="nwb-share-note">圖片含時間軸、國家、假日與行程清單；不含機票細節與訂位代號</span>
                <span className="nwb-mark" data-target="share-rest" style={{ right: -14, top: 150 }} />
              </div>
            )}
          </Stage>
        </div>
      }
    >
      橫的直的都有，直接貼限動
    </Tile>
  )
}

export default function NotWfhBento() {
  return (
    <div className="notwfh-bento">
      <div className="nwb-grid">
        <Plan />
        <Schengen />
        <Search />
        <Ticket />
        <Seasons />
        <Calendar />
        <Colour />
        <Visa />
        <NextYear />
        <Nomad />
        <PhoneNow />
        <Share />
      </div>
    </div>
  )
}
