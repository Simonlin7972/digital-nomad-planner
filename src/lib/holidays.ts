import { getLocale } from './i18n';
import { dayOfIso, type DayRange } from './weeks';

export type Holiday = DayRange & { name: string; short: string; note?: string };
export type HolidaySet = { key: 'tw' | 'au'; label: string; color: string; holidays: Holiday[] };

type Text = { zh: string; en: string };
type Source = { short: Text; name: Text; start: string; end: string; note?: Text };

const h = (short: Text, name: Text, start: string, end = start, note?: Text): Source => ({ short, name, start, end, note });
const same = (text: string): Text => ({ zh: text, en: text });

// 2027 dates. Taiwan: the Executive Yuan's 116 年 office calendar, shown as the full days-off run
// (weekends and make-up days included). Australia: national holidays; state-only days are noted, not listed.
const SOURCES: { key: HolidaySet['key']; label: Text; color: string; holidays: Source[] }[] = [
  {
    key: 'tw',
    label: { zh: '台灣國定假日', en: 'Taiwan holidays' },
    color: '#c13515',
    holidays: [
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

// The holiday sets in the current language.
export function holidaySets(): HolidaySet[] {
  const locale = getLocale();
  return SOURCES.map((set) => ({
    key: set.key,
    label: set.label[locale],
    color: set.color,
    holidays: set.holidays.map((d) => ({
      short: d.short[locale],
      name: d.name[locale],
      note: d.note?.[locale],
      startDay: dayOfIso(d.start)!,
      endDay: dayOfIso(d.end)!,
    })),
  }));
}
