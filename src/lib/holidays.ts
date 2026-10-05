import { getLocale } from './i18n';
import { TOTAL_DAYS, YEAR, dayOfIso, type DayRange } from './weeks';

export type Holiday = DayRange & { name: string; short: string; note?: string };
export type HolidaySet = { key: 'tw' | 'au'; label: string; color: string; holidays: Holiday[] };

type Text = { zh: string; en: string };
type Source = { short: Text; name: Text; start: string; end: string; note?: Text };

const h = (short: Text, name: Text, start: string, end = start, note?: Text): Source => ({ short, name, start, end, note });
const same = (text: string): Text => ({ zh: text, en: text });

// 2026 and 2027 dates. Taiwan: the Executive Yuan's 115 and 116 年 office calendars, shown as the full days-off
// run (weekends and make-up days included). Australia: national holidays; state-only days are noted, not listed.
// Each year's timeline also shows whatever falls in the few days it borrows from the years on either side.
const SOURCES: { key: HolidaySet['key']; label: Text; color: string; holidays: Source[] }[] = [
  {
    key: 'tw',
    label: { zh: '台灣國定假日', en: 'Taiwan holidays' },
    color: '#c13515',
    holidays: [
      // 2026 (115 年): no make-up working days all year
      h({ zh: '元旦', en: 'New Year' }, { zh: '元旦', en: "New Year's Day" }, '2026-01-01'),
      h({ zh: '春節', en: 'Lunar NY' }, { zh: '春節連假', en: 'Lunar New Year holiday' }, '2026-02-14', '2026-02-22', {
        zh: '含小年夜、除夕與補假，共 9 天',
        en: "Nine days, including the two days before New Year's Day and days off in lieu",
      }),
      h({ zh: '228', en: '228' }, { zh: '和平紀念日連假', en: 'Peace Memorial Day holiday' }, '2026-02-27', '2026-03-01', {
        zh: '2/28 逢週六，2/27 補假',
        en: 'Feb 28 falls on a Saturday; Feb 27 is the day off in lieu',
      }),
      h({ zh: '清明', en: 'Qingming' }, { zh: '兒童節及清明節連假', en: "Children's Day and Tomb Sweeping Day holiday" }, '2026-04-03', '2026-04-06', {
        zh: '4/4、4/5 逢週末，4/3、4/6 補假',
        en: 'Apr 4 and 5 fall on a weekend; Apr 3 and 6 are days off in lieu',
      }),
      h({ zh: '勞動', en: 'Labor' }, { zh: '勞動節連假', en: 'Labor Day holiday' }, '2026-05-01', '2026-05-03'),
      h({ zh: '端午', en: 'Dragon Boat' }, { zh: '端午節連假', en: 'Dragon Boat Festival holiday' }, '2026-06-19', '2026-06-21'),
      h({ zh: '中秋', en: 'Mid-Autumn' }, { zh: '中秋節及教師節連假', en: "Mid-Autumn Festival and Teachers' Day holiday" }, '2026-09-25', '2026-09-28'),
      h({ zh: '國慶', en: 'National' }, { zh: '國慶日連假', en: 'National Day holiday' }, '2026-10-09', '2026-10-11', {
        zh: '10/10 逢週六，10/9 補假',
        en: 'Oct 10 falls on a Saturday; Oct 9 is the day off in lieu',
      }),
      h({ zh: '光復', en: 'Retrocession' }, { zh: '臺灣光復節連假', en: 'Taiwan Retrocession Day holiday' }, '2026-10-24', '2026-10-26', {
        zh: '10/25 逢週日，10/26 補假',
        en: 'Oct 25 falls on a Sunday; Oct 26 is the day off in lieu',
      }),
      h({ zh: '行憲', en: 'Constitution' }, { zh: '行憲紀念日連假', en: 'Constitution Day holiday' }, '2026-12-25', '2026-12-27'),
      // 2027 (116 年)
      h({ zh: '元旦', en: 'New Year' }, { zh: '元旦連假', en: "New Year's Day holiday" }, '2027-01-01', '2027-01-03'),
      h({ zh: '春節', en: 'Lunar NY' }, { zh: '春節連假', en: 'Lunar New Year holiday' }, '2027-02-04', '2027-02-10', {
        zh: '含小年夜、除夕與補假',
        en: "Includes the two days before New Year's Day and make-up days",
      }),
      h({ zh: '228', en: '228' }, { zh: '和平紀念日連假', en: 'Peace Memorial Day holiday' }, '2027-02-27', '2027-03-01', {
        zh: '2/28 逢週日，3/1 補假',
        en: 'Feb 28 falls on a Sunday; Mar 1 is the day off in lieu',
      }),
      h({ zh: '清明', en: 'Qingming' }, { zh: '兒童節及清明節連假', en: "Children's Day and Tomb Sweeping Day holiday" }, '2027-04-03', '2027-04-06', {
        zh: '4/6 補假',
        en: 'Apr 6 is a day off in lieu',
      }),
      h({ zh: '勞動', en: 'Labor' }, { zh: '勞動節連假', en: 'Labor Day holiday' }, '2027-04-30', '2027-05-02', {
        zh: '5/1 逢週六，4/30 補假',
        en: 'May 1 falls on a Saturday; Apr 30 is the day off in lieu',
      }),
      h({ zh: '端午', en: 'Dragon Boat' }, { zh: '端午節', en: 'Dragon Boat Festival' }, '2027-06-09'),
      h({ zh: '中秋', en: 'Mid-Autumn' }, { zh: '中秋節', en: 'Mid-Autumn Festival' }, '2027-09-15'),
      h({ zh: '教師', en: 'Teachers' }, { zh: '教師節', en: "Teachers' Day" }, '2027-09-28'),
      h({ zh: '國慶', en: 'National' }, { zh: '國慶日連假', en: 'National Day holiday' }, '2027-10-09', '2027-10-11', {
        zh: '10/10 逢週日，10/11 補假',
        en: 'Oct 10 falls on a Sunday; Oct 11 is the day off in lieu',
      }),
      h({ zh: '光復', en: 'Retrocession' }, { zh: '臺灣光復節連假', en: 'Taiwan Retrocession Day holiday' }, '2027-10-23', '2027-10-25'),
      h({ zh: '行憲', en: 'Constitution' }, { zh: '行憲紀念日連假', en: 'Constitution Day holiday' }, '2027-12-24', '2027-12-26', {
        zh: '12/25 逢週六，12/24 補假',
        en: 'Dec 25 falls on a Saturday; Dec 24 is the day off in lieu',
      }),
      h({ zh: '元旦', en: 'New Year' }, { zh: '2028 元旦連假', en: "New Year's Day 2028 holiday" }, '2027-12-31', '2028-01-02', {
        zh: '2028/1/1 逢週六，12/31 補假',
        en: 'Jan 1, 2028 falls on a Saturday; Dec 31 is the day off in lieu',
      }),
    ],
  },
  {
    key: 'au',
    label: { zh: '澳洲國定假日', en: 'Australia holidays' },
    color: '#1f6f8b',
    holidays: [
      // 2026
      h(same("New Year's"), same("New Year's Day"), '2026-01-01'),
      h(same('Australia Day'), same('Australia Day'), '2026-01-26'),
      h(same('Easter'), { zh: 'Easter（Good Friday – Easter Monday）', en: 'Easter (Good Friday – Easter Monday)' }, '2026-04-03', '2026-04-06', {
        zh: '週六、週日是否放假依各州而定',
        en: 'Whether Saturday and Sunday are holidays varies by state',
      }),
      h(same('Anzac'), same('Anzac Day'), '2026-04-25', '2026-04-25', {
        zh: '逢週六；新南威爾斯、首都領地、西澳 4/27 補假',
        en: 'Falls on a Saturday; NSW, the ACT and WA observe Apr 27',
      }),
      h(same("King's"), same("King's Birthday"), '2026-06-08', '2026-06-08', {
        zh: '多數州；昆士蘭 10/5、西澳 9/28',
        en: 'Most states; Queensland Oct 5, Western Australia Sep 28',
      }),
      h(same('Xmas'), same('Christmas Day & Boxing Day'), '2026-12-25', '2026-12-28', {
        zh: 'Boxing Day 逢週六，多數州 12/28 補假',
        en: 'Boxing Day falls on a Saturday; most states observe Dec 28',
      }),
      // 2027
      h(same("New Year's"), same("New Year's Day"), '2027-01-01'),
      h(same('Australia Day'), same('Australia Day'), '2027-01-26'),
      h(same('Easter'), { zh: 'Easter（Good Friday – Easter Monday）', en: 'Easter (Good Friday – Easter Monday)' }, '2027-03-26', '2027-03-29', {
        zh: '週六、週日是否放假依各州而定',
        en: 'Whether Saturday and Sunday are holidays varies by state',
      }),
      h(same('Anzac'), same('Anzac Day'), '2027-04-25', '2027-04-25', {
        zh: '逢週日，部分州 4/26 補假',
        en: 'Falls on a Sunday; some states observe Apr 26',
      }),
      h(same("King's"), same("King's Birthday"), '2027-06-14', '2027-06-14', {
        zh: '多數州；昆士蘭 10/4、西澳 9/27',
        en: 'Most states; Queensland Oct 4, Western Australia Sep 27',
      }),
      h(same('Xmas'), same('Christmas Day & Boxing Day'), '2027-12-25', '2027-12-28', {
        zh: '逢週末，12/27、12/28 補假',
        en: 'Falls on a weekend; Dec 27 and 28 are days off in lieu',
      }),
    ],
  },
];

// Years with a full set of holidays. Others get no holiday rows (rather than just the odd day borrowed from a
// neighbouring year).
const COVERED_YEARS = [2026, 2027];

// A holiday's days on this year's timeline, clipped where it runs off either end; null if it's not on it at all.
function onTimeline(start: string, end: string): DayRange | null {
  const s = dayOfIso(start);
  const e = dayOfIso(end);
  if (s === null && e === null) return null;
  return { startDay: s ?? 0, endDay: e ?? TOTAL_DAYS - 1 };
}

// The holiday sets in the current language, for the year being planned.
export function holidaySets(): HolidaySet[] {
  if (!COVERED_YEARS.includes(YEAR)) return [];
  const locale = getLocale();
  return SOURCES.map((set) => ({
    key: set.key,
    label: set.label[locale],
    color: set.color,
    holidays: set.holidays.flatMap((d) => {
      const range = onTimeline(d.start, d.end);
      return range ? [{ short: d.short[locale], name: d.name[locale], note: d.note?.[locale], ...range }] : [];
    }),
  }));
}
