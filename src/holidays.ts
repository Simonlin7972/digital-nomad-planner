import { dayOfIso, type DayRange } from './weeks';

export type Holiday = DayRange & { name: string; short: string; note?: string };
export type HolidaySet = { key: 'tw' | 'au'; label: string; color: string; holidays: Holiday[] };

const h = (short: string, name: string, start: string, end = start, note?: string): Holiday => ({
  short,
  name,
  startDay: dayOfIso(start)!,
  endDay: dayOfIso(end)!,
  note,
});

// 2027 dates. Taiwan: the Executive Yuan's 116 年 office calendar, shown as the full days-off run
// (weekends and make-up days included). Australia: national holidays; state-only days are noted, not listed.
export const HOLIDAY_SETS: HolidaySet[] = [
  {
    key: 'tw',
    label: '台灣國定假日',
    color: '#c13515',
    holidays: [
      h('元旦', '元旦連假', '2027-01-01', '2027-01-03'),
      h('春節', '春節連假', '2027-02-04', '2027-02-10', '含小年夜、除夕與補假'),
      h('228', '和平紀念日連假', '2027-02-27', '2027-03-01', '2/28 逢週日，3/1 補假'),
      h('清明', '兒童節及清明節連假', '2027-04-03', '2027-04-06', '4/6 補假'),
      h('勞動', '勞動節連假', '2027-04-30', '2027-05-02', '5/1 逢週六，4/30 補假'),
      h('端午', '端午節', '2027-06-09'),
      h('中秋', '中秋節', '2027-09-15'),
      h('教師', '教師節', '2027-09-28'),
      h('國慶', '國慶日連假', '2027-10-09', '2027-10-11', '10/10 逢週日，10/11 補假'),
      h('光復', '臺灣光復節連假', '2027-10-23', '2027-10-25'),
      h('行憲', '行憲紀念日連假', '2027-12-24', '2027-12-26', '12/25 逢週六，12/24 補假'),
      h('元旦', '2028 元旦連假', '2027-12-31', '2028-01-02', '2028/1/1 逢週六，12/31 補假'),
    ],
  },
  {
    key: 'au',
    label: '澳洲國定假日',
    color: '#1f6f8b',
    holidays: [
      h("New Year's", "New Year's Day", '2027-01-01'),
      h('Australia Day', 'Australia Day', '2027-01-26'),
      h('Easter', 'Easter（Good Friday – Easter Monday）', '2027-03-26', '2027-03-29', '週六、週日是否放假依各州而定'),
      h('Anzac', 'Anzac Day', '2027-04-25', '2027-04-25', '逢週日，部分州 4/26 補假'),
      h("King's", "King's Birthday", '2027-06-14', '2027-06-14', '多數州；昆士蘭 10/4、西澳 9/27'),
      h('Xmas', 'Christmas Day & Boxing Day', '2027-12-25', '2027-12-28', '逢週末，12/27、12/28 補假'),
    ],
  },
];
