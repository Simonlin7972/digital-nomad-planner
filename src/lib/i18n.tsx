// A small translation layer: two dictionaries, a current locale, and helpers to read them. There is no i18n
// library because there are only a couple of hundred strings and two languages.
import { Fragment, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

export type Locale = 'zh' | 'en';

const zh = {
  'app.title': '今天不在家工作',
  'app.tagline': 'A Digital Nomad Planner',
  'app.tagline.1': 'Not Working From Home Today',
  'app.tagline.2': 'Out of office, all year',
  'app.tagline.3': 'Where to Next?',

  'unit.weeks': '{n} 週',
  'unit.day': '{n} 天',
  'unit.days': '{n} 天',
  'sep': '・',
  'paren': '（{x}）',
  'list': '、',
  'about': '{days}（約 {weeks}）',
  'with': '跟 {who}',
  'other': '其他',

  'toolbar.help': '如何使用',
  'toolbar.undo': '復原',
  'toolbar.redo': '重做',
  'toolbar.share': '分享',
  'toolbar.export': '匯出',
  'toolbar.import': '匯入',
  'toolbar.more': '更多',
  'toolbar.shortcut': '{action}（{keys}）',
  'toolbar.language': 'English',
  'toolbar.languageHint': 'Switch to English',

  'alert.pngFailed': '無法產生 PNG，請再試一次。',
  'alert.importEmpty': '檔案裡沒有可用的行程。',
  'alert.importConfirm': '匯入會取代目前的 {n} 段行程，確定嗎？',
  'alert.importFailed': '無法讀取這個檔案，請確認是先前匯出的 JSON。',

  'view.label': '檢視',
  'view.year': '年',
  'view.month': '月',
  'zoom.out': '縮小',
  'zoom.in': '放大',
  'zoom.label': '時間軸縮放',
  'zoom.fit': '符合寬度',

  'year.panHint': '拖曳可左右移動時間軸，點月份可看該月',

  'month.prev': '上個月',
  'month.next': '下個月',
  'month.stat': '已安排 {planned}・未安排 {free}',

  'summary.title': '摘要',
  'summary.time': '已安排 {planned}・未安排 {free}',
  'summary.places': '去了 {countries} 個國家・{cities} 個城市',
  'summary.flights': '約 {legs} 個航段・飛行約 {hours} 小時',
  'summary.flightsSkipped': '（{n} 段查無座標未計）',
  'summary.flightsHint': '依行程順序、兩地直線距離估算；300 公里內視為陸路不計，未含轉機',
  'rules.schengen': '申根區：任 180 天內最多 {peak} 天（上限 90）',
  'rules.schengenOver': '{date}起超過 90 天',
  'rules.schengenHint': '每一天往前回推 180 天，計算待在申根國家的天數；不含 2026/12/28 之前，也不計「歐洲」這類區域',
  'rules.taiwan': '台灣：{year} 年內 {days}（滿 183 天為稅務居住者）',
  'rules.taiwanHint': '只算排在台灣的行程，未安排的日子不算；以課稅年度 1/1–12/31 計',

  'stays.title': '行程',
  'stays.titleMonth': '行程・{month}',
  'stays.all': '全部',
  'stays.filter': '依季度篩選',
  'stays.emptyMonth': '這個月還沒有行程。在上面的月曆拖幾天試試。',
  'stays.emptyQuarter': 'Q{q} 還沒有行程。',
  'stays.empty': '還沒有行程。到上面的時間軸拖幾格試試。',
  'stays.ticket': '{place} 的機票資訊',
  'stays.edit': '編輯',
  'stays.editPlace': '編輯 {place}',
  'stays.gap': '空檔',
  'stays.gapAdd': '排一段',
  'stays.gapAddLabel': '在 {range} 排一段行程',
  'stays.schengenOver': '申根 180 天內會待到 {n} 天，超過 90 天上限',

  'backup.never': '行程還沒有備份過。',
  'backup.since': '上次備份是 {n} 天前，之後行程有變動。',
  'backup.why': '資料只存在這個瀏覽器，清除瀏覽器資料就會不見，建議匯出一份 JSON。',
  'backup.export': '匯出備份',
  'backup.later': '稍後提醒',

  'map.title': '地圖',
  'map.loading': '載入地圖中…',
  'map.empty': '排好行程後，去過的地方會出現在地圖上。',
  'map.pending': '查詢座標中…（剩 {n} 個地點）',
  'map.failed': '座標查詢失敗，請檢查網路後重新整理。',
  'map.missing': '找不到：{places}（試試改用英文或更完整的名稱）',

  'ticket.booked': '已買機票',
  'ticket.title': '機票・{place}',
  'ticket.departs': '起飛 {time}',
  'ticket.ref': '訂位代號 {ref}',
  'ticket.fare': '票價 {fare}',
  'ticket.none': '尚未填寫細節',

  'editor.edit': '編輯行程',
  'editor.new': '新增行程',
  'editor.country': '國家',
  'editor.city': '城市',
  'editor.color': '顏色',
  'editor.start': '開始日',
  'editor.end': '結束日',
  'editor.clash': '與「{place}」（{range}）重疊。',
  'editor.range': '{range}・{length}',
  'editor.companions': '跟誰去',
  'editor.companionsPh': '例：自己、家人、Amy',
  'editor.airline': '航空公司',
  'editor.airlinePh': '例：長榮航空',
  'editor.flightNo': '航班編號',
  'editor.flightNoPh': '例：BR211',
  'editor.departure': '起飛時間',
  'editor.depDate': '起飛日期',
  'editor.depTime': '起飛時刻',
  'editor.bookingRef': '訂位代號',
  'editor.bookingRefPh': '例：ABC123',
  'editor.fare': '票價',
  'editor.farePh': '例：NT$ 8,500',
  'editor.note': '備註',
  'editor.notePh': '例：回台過年、朋友婚禮',
  'editor.delete': '刪除',
  'editor.cancel': '取消',
  'editor.save': '儲存',

  'color.black': '黑',
  'color.red': '紅',
  'color.orange': '橘',
  'color.yellow': '黃',
  'color.green': '綠',
  'color.teal': '青',
  'color.blue': '藍',
  'color.purple': '紫',
  'color.pink': '粉',

  'country.placeholder': '搜尋國家，例：泰國',
  'country.empty': '找不到符合的國家。仍可照輸入的文字儲存。',
  'country.unlisted': '「{name}」不在國家清單內，會照原樣儲存。',
  'city.placeholder': '搜尋城市，例：清邁',
  'city.empty': '清單裡沒有這個城市。照輸入的文字儲存即可。',

  'date.placeholder': '選擇日期',

  'help.title': '如何使用',
  'help.close': '關閉',

  'mobile.now': '現在',
  'mobile.next': '下一站',
  'mobile.daysLeft': '還有 {days}',
  'mobile.inDays': '{days}後出發',
  'mobile.empty': '還沒有行程。在電腦上排好後匯出，再到這裡用 ⋯ 選單匯入。',
  'mobile.readOnly': '手機上只能瀏覽。要排行程或修改，請用電腦打開。',

  'season.title': '適合的季節',
  'season.best': '推薦',
  'season.fine': '普通',
  'season.avoid': '避開',
  'season.disclaimer': '一般性參考，非天氣預報',
  'season.warn': '這段時間建議避開：{why}',
  'season.warnShort': '季節不佳',

  'share.title': '分享',
  'share.alt': '整年行程圖預覽',
  'share.rendering': '產生圖片中…',
  'share.note': '圖片含時間軸、國家、假日與行程清單；不含機票細節與訂位代號。',
  'share.download': '下載 PNG',
  'share.share': '分享…',
};

const en: Record<keyof typeof zh, string> = {
  'app.title': '今天不在家工作',
  'app.tagline': 'A Digital Nomad Planner',
  'app.tagline.1': 'Not Working From Home Today',
  'app.tagline.2': 'Out of office, all year',
  'app.tagline.3': 'Where to Next?',

  'unit.weeks': '{n} wk',
  'unit.day': '{n} day',
  'unit.days': '{n} days',
  'sep': ' · ',
  'paren': ' ({x})',
  'list': ', ',
  'about': '{days} (about {weeks})',
  'with': 'with {who}',
  'other': 'Other',

  'toolbar.help': 'How to use',
  'toolbar.undo': 'Undo',
  'toolbar.redo': 'Redo',
  'toolbar.share': 'Share',
  'toolbar.export': 'Export',
  'toolbar.import': 'Import',
  'toolbar.more': 'More',
  'toolbar.shortcut': '{action} ({keys})',
  'toolbar.language': '中文',
  'toolbar.languageHint': '切換為中文',

  'alert.pngFailed': "Couldn't create the PNG. Please try again.",
  'alert.importEmpty': 'No usable stays were found in that file.',
  'alert.importConfirm': 'Importing will replace your {n} current stays. Continue?',
  'alert.importFailed': "Couldn't read that file. Make sure it's a JSON file exported from here.",

  'view.label': 'View',
  'view.year': 'Year',
  'view.month': 'Month',
  'zoom.out': 'Zoom out',
  'zoom.in': 'Zoom in',
  'zoom.label': 'Timeline zoom',
  'zoom.fit': 'Fit width',

  'year.panHint': 'Drag to pan the timeline; click a month to open it',

  'month.prev': 'Previous month',
  'month.next': 'Next month',
  'month.stat': 'Planned {planned} · Free {free}',

  'summary.title': 'Summary',
  'summary.time': 'Planned {planned} · Free {free}',
  'summary.places': '{countries} countries · {cities} cities',
  'summary.flights': 'About {legs} flights · {hours} h in the air',
  'summary.flightsSkipped': ' ({n} skipped: place not found)',
  'summary.flightsHint': 'Estimated from straight-line distance between consecutive stays; hops under 300 km count as ground travel, and layovers are ignored',
  'rules.schengen': 'Schengen: up to {peak} days in any 180 (limit 90)',
  'rules.schengenOver': 'Over 90 from {date}',
  'rules.schengenHint': 'For each day, counts the days spent in Schengen countries over the 180 days ending on it. Days before Dec 28, 2026 and broad regions such as "Europe" are not counted',
  'rules.taiwan': 'Taiwan: {days} in {year} (183 makes you a tax resident)',
  'rules.taiwanHint': 'Counts stays planned in Taiwan only, not unplanned days, over the tax year Jan 1–Dec 31',

  'stays.title': 'Itinerary',
  'stays.titleMonth': 'Itinerary · {month}',
  'stays.all': 'All',
  'stays.filter': 'Filter by quarter',
  'stays.emptyMonth': 'Nothing planned this month yet. Drag across some days in the calendar above.',
  'stays.emptyQuarter': 'Nothing planned in Q{q} yet.',
  'stays.empty': 'Nothing planned yet. Drag across the timeline above to add a stay.',
  'stays.ticket': 'Flight details for {place}',
  'stays.edit': 'Edit',
  'stays.editPlace': 'Edit {place}',
  'stays.gap': 'Free',
  'stays.gapAdd': 'Plan',
  'stays.gapAddLabel': 'Plan a stay for {range}',
  'stays.schengenOver': 'Reaches {n} Schengen days in 180, over the 90-day limit',

  'backup.never': "Your plan hasn't been backed up yet.",
  'backup.since': 'Last backup was {n} days ago, and the plan has changed since.',
  'backup.why': 'It lives only in this browser and is lost if the browsing data is cleared. Export a JSON copy to keep it safe.',
  'backup.export': 'Export backup',
  'backup.later': 'Remind me later',

  'map.title': 'Map',
  'map.loading': 'Loading map…',
  'map.empty': 'Places you plan to visit will show up here.',
  'map.pending': 'Looking up locations… ({n} to go)',
  'map.failed': "Couldn't look up locations. Check your connection and reload.",
  'map.missing': 'Not found: {places} (try a fuller name)',

  'ticket.booked': 'Flight booked',
  'ticket.title': 'Flight · {place}',
  'ticket.departs': 'Departs {time}',
  'ticket.ref': 'Booking ref {ref}',
  'ticket.fare': 'Fare {fare}',
  'ticket.none': 'No details yet',

  'editor.edit': 'Edit stay',
  'editor.new': 'New stay',
  'editor.country': 'Country',
  'editor.city': 'City',
  'editor.color': 'Color',
  'editor.start': 'Start',
  'editor.end': 'End',
  'editor.clash': 'Overlaps {place} ({range}).',
  'editor.range': '{range} · {length}',
  'editor.companions': 'With',
  'editor.companionsPh': 'e.g. solo, family, Amy',
  'editor.airline': 'Airline',
  'editor.airlinePh': 'e.g. EVA Air',
  'editor.flightNo': 'Flight no.',
  'editor.flightNoPh': 'e.g. BR211',
  'editor.departure': 'Departure',
  'editor.depDate': 'Departure date',
  'editor.depTime': 'Departure time',
  'editor.bookingRef': 'Booking ref',
  'editor.bookingRefPh': 'e.g. ABC123',
  'editor.fare': 'Fare',
  'editor.farePh': 'e.g. $280',
  'editor.note': 'Note',
  'editor.notePh': 'e.g. home for the holidays',
  'editor.delete': 'Delete',
  'editor.cancel': 'Cancel',
  'editor.save': 'Save',

  'color.black': 'Black',
  'color.red': 'Red',
  'color.orange': 'Orange',
  'color.yellow': 'Yellow',
  'color.green': 'Green',
  'color.teal': 'Teal',
  'color.blue': 'Blue',
  'color.purple': 'Purple',
  'color.pink': 'Pink',

  'country.placeholder': 'Search countries, e.g. Thailand',
  'country.empty': 'No matching country. You can still save what you typed.',
  'country.unlisted': "“{name}” isn't on the country list; it will be saved as typed.",
  'city.placeholder': 'Search cities, e.g. Chiang Mai',
  'city.empty': "That city isn't on the list. Just save what you typed.",

  'date.placeholder': 'Pick a date',

  'help.title': 'How to use',
  'help.close': 'Close',

  'mobile.now': 'Now',
  'mobile.next': 'Next',
  'mobile.daysLeft': '{days} to go',
  'mobile.inDays': 'leaving in {days}',
  'mobile.empty': 'Nothing planned yet. Plan on a computer, export, then import here from the ⋯ menu.',
  'mobile.readOnly': 'On a phone the plan is view-only. Use a computer to plan or make changes.',

  'season.title': 'When to go',
  'season.best': 'Best',
  'season.fine': 'Fine',
  'season.avoid': 'Avoid',
  'season.disclaimer': 'General guidance, not a forecast',
  'season.warn': 'Best avoided at this time: {why}',
  'season.warnShort': 'Poor season',

  'share.title': 'Share',
  'share.alt': 'Preview of the year plan image',
  'share.rendering': 'Creating the image…',
  'share.note': 'The image shows the timeline, countries, holidays and itinerary. Flight details and booking references are left out.',
  'share.download': 'Download PNG',
  'share.share': 'Share…',
};

export type Key = keyof typeof zh;
const DICT: Record<Locale, Record<Key, string>> = { zh, en };

const STORAGE_KEY = 'dnp-lang';

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    // fall through to the browser's language
  }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

// The locale lives outside React so that plain functions (date labels, the PNG export) can read it too.
let locale: Locale = initialLocale();
const listeners = new Set<() => void>();

export const getLocale = (): Locale => locale;

export function setLocale(next: Locale) {
  if (next === locale) return;
  locale = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // the choice just won't be remembered
  }
  listeners.forEach((notify) => notify());
}

// Re-renders the calling component when the language changes. Text comes from t(), which reads the current
// locale, so a component only needs to call this once to stay up to date.
export function useLocale(): Locale {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    getLocale,
  );
}

const PLACEHOLDER = /\{(\w+)\}/g;

// Translated text, with {name} placeholders filled from `vars`.
export function t(key: Key, vars?: Record<string, string | number>): string {
  return DICT[locale][key].replace(PLACEHOLDER, (_, name: string) => String(vars?.[name] ?? ''));
}

// Like t(), but placeholders can be React nodes (e.g. a bold number), so word order can differ per language.
export function tr(key: Key, vars: Record<string, ReactNode>): ReactNode {
  const parts = DICT[locale][key].split(PLACEHOLDER);
  // split() with a capture group alternates literal text and placeholder names.
  return parts.map((part, i) => <Fragment key={i}>{i % 2 ? vars[part] : part}</Fragment>);
}

// "1 day" / "3 days"; Chinese has no plural.
export const daysText = (n: number) => t(n === 1 ? 'unit.day' : 'unit.days', { n });
