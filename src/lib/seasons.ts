// When to go: for the most popular nomad bases, how good each month is and why. Hand-written general guidance
// (climate normals, monsoons, smoke, heat, crowds), not a forecast. Only listed cities have it; every other place
// simply shows nothing.
import { getLocale } from './i18n';
import type { Stay } from './storage';
import { dateOfDay, type DayRange } from './weeks';

export type Rating = 0 | 1 | 2; // 0 avoid, 1 fine, 2 best
export type SeasonNote = { months: number[]; kind: 'best' | 'avoid' | 'note'; zh: string; en: string }; // months 0–11
// ratings Jan–Dec; highs and lows are typical daily maximum and minimum in °C, rounded climate normals
export type Season = { ratings: Rating[]; highs: number[]; lows: number[]; notes: SeasonNote[] };

// "11-2" → [10, 11, 0, 1]; "7,8" → [6, 7]. Months are written 1–12 here for readability.
function months(spec: string): number[] {
  return spec.split(',').flatMap((part) => {
    const [a, b = a] = part.split('-').map(Number);
    const out: number[] = [];
    for (let m = a; ; m = (m % 12) + 1) {
      out.push(m - 1);
      if (m === b) break;
    }
    return out;
  });
}

const best = (spec: string, zh: string, en: string): SeasonNote => ({ months: months(spec), kind: 'best', zh, en });
const avoid = (spec: string, zh: string, en: string): SeasonNote => ({ months: months(spec), kind: 'avoid', zh, en });
const note = (spec: string, zh: string, en: string): SeasonNote => ({ months: months(spec), kind: 'note', zh, en });
// Average daily highs and lows, Jan to Dec, as comma lists.
const temps = (highs: string, lows: string) => ({ highs: highs.split(',').map(Number), lows: lows.split(',').map(Number) });
// Ratings as twelve digits, Jan to Dec.
const season = (ratings: string, { highs, lows }: { highs: number[]; lows: number[] }, ...notes: SeasonNote[]): Season => ({
  ratings: [...ratings].map(Number) as Rating[],
  highs,
  lows,
  notes,
});

// Keyed by how stays store places: ISO code / English city name. A place that shares its weather with a
// neighbour points at it in ALIASES below.
const SEASONS: Record<string, Season> = {
  // Southeast Asia
  'th/Chiang Mai': season('210011111122', temps('29,32,35,36,34,32,31,31,31,31,30,28', '14,15,19,22,23,23,23,23,23,22,19,15'),
    best('11-1', '涼季，晴朗乾爽；11 月有水燈節', 'Cool, dry and clear; Yi Peng lantern festival in November'),
    avoid('3-4', '燒山季，空氣品質常是全球最差之一', 'Burning season: some of the worst air quality in the world'),
    note('2', '月底開始起霾', 'Smoke starts building late in the month'),
    note('5-10', '雨季，午後陣雨', 'Rainy season, afternoon showers')),
  'th/Bangkok': season('221111111122', temps('32,33,34,35,34,33,33,33,32,32,32,31', '22,24,26,27,26,26,25,25,25,25,24,22'),
    best('11-2', '最涼爽乾燥的時候', 'The coolest, driest months'),
    note('4', '最熱，常超過 35°C；中旬潑水節', 'Hottest month, often above 35°C; Songkran mid-month'),
    note('6-10', '雨季，9 月最濕', 'Rainy season, wettest in September')),
  'th/Phuket': season('222211110012', temps('32,33,33,33,32,31,31,31,30,30,31,31', '23,24,24,25,25,25,25,25,24,24,24,23'),
    best('12-4', '乾季，海況平穩', 'Dry season, calm seas'),
    avoid('9-10', '西南季風最強，常有大浪與紅旗', 'Peak southwest monsoon: big swells, red-flag beaches'),
    note('5-8', '季風季，海邊風浪大', 'Monsoon season, rough water on the west coast')),
  'th/Koh Phangan': season('122211111001', temps('29,30,31,33,33,32,32,32,32,31,29,29', '24,25,25,26,26,26,25,25,25,25,24,24'),
    best('2-4', '乾季，海水最清', 'Dry season, clearest water'),
    avoid('10-11', '東北季風帶來大雨', 'Northeast monsoon brings heavy rain'),
    note('1,12', '雨季尾聲，偶有大雨', 'Tail of the rains, some heavy days')),
  'vn/Da Nang': season('122222221001', temps('25,26,28,31,33,34,34,34,32,30,27,25', '19,20,21,23,25,26,26,25,24,23,22,20'),
    best('2-8', '乾季，適合海邊', 'Dry season, beach weather'),
    avoid('10-11', '颱風與豪雨，常淹水', 'Typhoons and heavy rain, frequent flooding'),
    note('9,12', '雨季開始／結束', 'Rains starting or easing off')),
  'vn/Hanoi': season('112211111222', temps('19,20,23,27,32,33,33,32,31,29,26,22', '14,15,18,22,25,26,26,26,25,22,19,15'),
    best('10-12', '秋天，涼爽乾燥', 'Autumn: cool and dry'),
    best('3-4', '春天，溫和', 'Spring: mild'),
    note('6-8', '濕熱，常超過 35°C，多雷雨', 'Hot and humid, often above 35°C, thunderstorms'),
    note('1-2', '濕冷、毛毛雨', 'Damp, chilly drizzle')),
  'vn/Ho Chi Minh City': season('222111111112', temps('32,33,34,35,34,33,32,32,32,31,31,31', '22,23,24,26,26,25,25,25,24,24,23,22'),
    best('12-3', '乾季', 'Dry season'),
    note('4', '雨季前最悶熱', 'Muggiest before the rains'),
    note('5-11', '雨季，多為午後短暫大雨', 'Rainy season, mostly short afternoon downpours')),
  'my/Kuala Lumpur': season('222122111111', temps('32,33,33,33,33,33,32,32,32,32,32,32', '23,24,24,24,25,24,24,24,24,24,24,23'),
    best('1-3,5-6', '相對乾燥', 'Relatively dry'),
    note('8-9', '部分年份有印尼燒林的煙霾', 'Some years bring haze from fires in Indonesia'),
    note('10-11', '最多雨', 'Wettest months')),
  'my/Penang': season('222211111112', temps('32,32,32,32,32,31,31,31,31,31,31,31', '24,24,25,25,25,25,24,24,24,24,24,24'),
    best('12-4', '較乾燥', 'Drier months'),
    note('9-11', '最多雨', 'Wettest months')),
  'id/Bali': season('111222222211', temps('31,31,31,32,31,30,30,30,31,32,32,31', '24,24,24,24,24,23,23,23,23,24,24,24'),
    best('4-10', '乾季，陽光充足', 'Dry season, plenty of sun'),
    note('7-8', '旺季，人多房價高', 'Peak season: crowded and pricey'),
    note('11-3', '雨季，濕熱', 'Rainy season, hot and humid'),
    note('3', '靜居日全島停擺一天（含機場）', 'Nyepi: the whole island shuts for a day, airport included')),
  'sg/Singapore': season('122211111111', temps('30,31,32,32,32,31,31,31,31,31,31,30', '23,24,24,25,25,25,25,25,25,24,24,24'),
    best('2-4', '最乾燥', 'Driest months'),
    note('11-1', '東北季風，雨多', 'Northeast monsoon, frequent rain')),
  'ph/Siargao': season('111222222111', temps('29,29,30,31,32,32,32,32,32,31,30,29', '23,23,23,24,25,25,25,25,25,24,24,23'),
    best('4-9', '較乾，9 月浪最好', 'Drier; best surf in September'),
    note('11-1', '雨多，偶有颱風', 'Wet, with the odd typhoon')),

  // East Asia
  'tw/Taipei': season('112211111222', temps('19,20,22,26,29,32,34,34,31,27,24,21', '13,14,15,19,22,25,26,26,24,21,18,15'),
    best('10-12', '秋天，涼爽', 'Autumn, cool'),
    best('3-4', '春天', 'Spring'),
    note('5-6', '梅雨', 'Plum rains'),
    note('7-9', '炎熱，颱風季', 'Hot, typhoon season')),
  'tw/Taichung': season('112211111222', temps('22,23,25,28,31,32,33,33,32,30,27,23', '13,14,16,20,23,25,26,25,25,22,18,14'),
    best('10-12', '秋冬晴朗乾燥，台灣天氣最穩定的地方之一', 'Clear, dry autumn and winter; some of the steadiest weather in Taiwan'),
    best('3-4', '春天', 'Spring'),
    note('5-6', '梅雨', 'Plum rains'),
    note('7-9', '炎熱，午後雷陣雨，颱風季', 'Hot, afternoon storms, typhoon season')),
  'tw/Tainan': season('222111111222', temps('23,24,27,29,31,32,32,32,32,30,27,24', '14,15,18,22,24,26,26,26,25,23,19,15'),
    best('10-3', '乾季，溫暖晴朗', 'Dry season, warm and sunny'),
    note('4', '開始變熱', 'Getting hot'),
    note('5-9', '雨季與颱風，濕熱', 'Rains and typhoons, hot and humid')),
  'tw/Kaohsiung': season('222111111222', temps('24,25,27,29,31,32,32,32,32,31,28,25', '16,17,20,23,25,26,26,26,26,24,21,17'),
    best('10-3', '乾季，冬天也溫暖', 'Dry season, warm even in winter'),
    note('4', '開始變熱', 'Getting hot'),
    note('5-9', '雨季與颱風，濕熱', 'Rains and typhoons, hot and humid')),
  'tw/Hualien': season('112221111221', temps('22,22,24,26,29,31,33,32,31,28,26,23', '16,16,18,21,23,25,26,26,25,22,20,17'),
    best('3-5', '春天，適合太魯閣與海岸', 'Spring, good for Taroko and the coast'),
    best('10-11', '秋天', 'Autumn'),
    note('7-9', '颱風季，東部首當其衝，山路可能封閉', 'Typhoon season; the east coast takes the brunt and mountain roads may close'),
    note('12-2', '東北季風，陰雨', 'Northeast monsoon, grey and wet')),
  'tw/Kenting': season('112221111111', temps('25,25,27,29,30,31,32,32,31,30,28,26', '19,19,21,23,25,26,26,26,25,24,22,20'),
    best('3-5', '春天，海邊最舒服', 'Spring, the best beach weather'),
    note('6-9', '暑假旺季、颱風季', 'Summer-holiday crowds, typhoon season'),
    note('10-2', '落山風，風很大', 'Strong downslope winds (luoshanfeng)')),
  'jp/Tokyo': season('112221111221', temps('10,10,14,19,23,26,30,31,27,22,17,12', '1,2,5,10,15,19,23,24,21,15,9,4'),
    best('3-5', '春天，3 月底到 4 月初賞櫻', 'Spring; cherry blossoms late March to early April'),
    best('10-11', '秋天，涼爽有紅葉', 'Autumn: crisp, with autumn leaves'),
    note('6', '梅雨', 'Rainy season'),
    note('7-8', '濕熱，常超過 35°C', 'Hot and humid, often above 35°C'),
    note('9', '颱風季', 'Typhoon season'),
    note('4-5', '黃金週前後人多', 'Golden Week crowds around the turn of the month')),
  'jp/Kyoto': season('112221101221', temps('9,10,14,20,25,28,32,34,29,23,17,11', '1,1,4,9,14,19,23,24,20,13,7,3'),
    best('3-5', '春天賞櫻', 'Spring, cherry blossoms'),
    best('10-11', '秋天紅葉', 'Autumn leaves'),
    avoid('8', '盆地悶熱，常近 38°C', 'Basin heat, often near 38°C'),
    note('6-7', '梅雨，7 月祇園祭', 'Rainy season; Gion Festival in July')),
  'jp/Fukuoka': season('112221111221', temps('10,12,15,20,24,27,31,32,28,23,18,13', '3,4,7,11,16,20,24,25,21,15,10,5'),
    best('3-5,10-11', '春秋最舒服', 'Spring and autumn are the most pleasant'),
    note('6-7', '梅雨', 'Rainy season'),
    note('8-9', '炎熱，颱風季', 'Hot, typhoon season')),
  'kr/Seoul': season('111221112221', temps('2,5,11,18,23,28,29,30,26,20,12,4', '-6,-4,1,7,13,18,22,23,18,11,4,-3'),
    best('4-5', '春天', 'Spring'),
    best('9-11', '秋天，晴朗', 'Autumn, clear skies'),
    note('7-8', '梅雨與悶熱', 'Monsoon rains and humidity'),
    note('12-2', '很冷，常在零下', 'Very cold, often below freezing'),
    note('3-4', '偶有沙塵與懸浮微粒', 'Occasional yellow dust and fine particles')),

  // South Asia & Middle East
  'in/Goa': season('222110000122', temps('32,32,32,33,33,30,29,29,30,32,33,33', '20,21,23,25,27,25,25,24,24,24,23,21'),
    best('11-3', '乾季，海灘旺季', 'Dry season, beach season'),
    avoid('6-9', '季風季，許多海灘店家歇業', 'Monsoon: many beach businesses close'),
    note('4-5', '悶熱', 'Hot and humid')),
  'ae/Dubai': season('222110000122', temps('24,26,29,34,38,40,42,42,39,35,30,26', '15,16,18,22,26,28,31,31,28,24,20,17'),
    best('11-3', '溫暖舒適', 'Warm and pleasant'),
    avoid('6-9', '酷熱，常超過 42°C', 'Extreme heat, often above 42°C'),
    note('4-5,10', '開始變熱', 'Getting hot')),
  'tr/Istanbul': season('111222112211', temps('9,10,12,17,22,27,29,29,26,21,15,11', '4,4,5,9,13,18,21,21,18,14,9,6'),
    best('4-6', '春天，鬱金香季', 'Spring, tulip season'),
    best('9-10', '秋天，人潮較少', 'Autumn, thinner crowds'),
    note('7-8', '炎熱、遊客多', 'Hot and busy'),
    note('12-2', '濕冷多雨', 'Cold and wet')),
  'ge/Tbilisi': season('111222112211', temps('7,9,14,19,24,29,32,32,27,20,13,8', '-1,0,4,8,13,17,20,20,16,10,4,0'),
    best('4-6', '春天', 'Spring'),
    best('9-10', '秋天，葡萄採收季', 'Autumn, grape harvest'),
    note('7-8', '炎熱，常超過 35°C', 'Hot, often above 35°C')),

  // Europe
  'pt/Lisbon': season('112222112211', temps('15,16,19,20,23,26,28,29,27,23,18,15', '8,9,10,12,14,17,18,19,18,15,11,9'),
    best('3-6', '春天，晴朗溫和', 'Spring, sunny and mild'),
    best('9-10', '秋天，海水還暖', 'Autumn, the sea is still warm'),
    note('7-8', '炎熱、遊客多、房價高', 'Hot, busy and pricey'),
    note('11-2', '多雨，室內沒有暖氣很冷', 'Rainy; homes without heating feel cold')),
  'pt/Porto': season('111222222111', temps('14,15,17,18,20,23,25,25,24,21,17,14', '5,6,8,10,12,14,16,16,15,12,9,7'),
    best('4-9', '溫和少雨', 'Mild and fairly dry'),
    note('11-2', '雨很多', 'Very rainy')),
  'pt/Madeira': season('222222222222', temps('20,20,20,21,22,24,25,26,26,25,23,21', '14,14,14,15,16,18,19,20,20,18,16,15'),
    best('1-12', '四季溫和，全年都適合', 'Mild all year; good any month')),
  'es/Las Palmas': season('222222222222', temps('21,21,22,22,23,24,25,26,26,26,24,22', '15,15,16,16,17,19,20,21,21,20,18,16'),
    best('1-12', '四季如春，冬天特別受歡迎', 'Spring-like all year; especially popular in winter')),
  'es/Tenerife': season('222222222222', temps('21,21,22,23,24,26,28,29,28,26,24,22', '15,15,16,16,17,19,21,22,21,20,18,16'),
    best('1-12', '全年溫和；南部較晴', 'Mild all year; the south is sunnier')),
  'es/Barcelona': season('111222112211', temps('14,15,17,19,22,26,29,29,26,22,17,14', '5,6,8,10,14,18,21,21,18,14,9,6'),
    best('4-6,9-10', '春秋最舒服', 'Spring and autumn are the most pleasant'),
    note('7-8', '炎熱、遊客最多', 'Hot, peak tourist crowds'),
    note('11-2', '溫和但偏冷', 'Mild but chilly')),
  'es/Madrid': season('111221112211', temps('10,12,16,18,22,28,32,31,26,19,13,10', '1,2,4,7,11,15,18,18,15,10,5,2'),
    best('4-5,9-10', '春秋', 'Spring and autumn'),
    note('7-8', '酷熱，常近 40°C；8 月不少店家休假', 'Scorching, often near 40°C; many places close in August')),
  'es/Valencia': season('222221112222', temps('16,17,19,21,24,27,30,30,28,25,20,17', '7,8,10,12,15,19,22,22,20,16,11,8'),
    best('9-5', '大半年溫和晴朗', 'Mild and sunny most of the year'),
    note('7-8', '濕熱', 'Hot and humid'),
    note('3', '中旬法雅節，熱鬧但房價高', 'Las Fallas mid-month: lively, but rooms are pricey')),
  'es/Seville': season('112221001211', temps('16,18,22,24,28,33,36,36,32,26,20,17', '6,7,9,11,14,18,20,20,18,14,10,7'),
    best('3-5', '春天，4 月有春會', 'Spring; April Fair'),
    best('10', '秋天', 'Autumn'),
    avoid('7-8', '歐洲最熱之一，常超過 40°C', 'One of the hottest places in Europe, often above 40°C')),
  'es/Málaga': season('222221112222', temps('17,18,20,21,24,28,30,31,28,24,20,18', '8,9,10,12,15,18,21,21,19,15,11,9'),
    best('9-5', '溫和晴朗', 'Mild and sunny'),
    note('7-8', '炎熱、海灘人多', 'Hot, crowded beaches')),
  'it/Rome': season('112221112211', temps('12,13,16,19,24,28,31,32,27,22,16,13', '3,4,6,8,13,16,19,19,16,12,7,4'),
    best('3-5', '春天', 'Spring'),
    best('9-10', '秋天', 'Autumn'),
    note('7-8', '炎熱；8 月中許多店家休假', 'Hot; many places close mid-August'),
    note('11-12', '最多雨', 'Rainiest months')),
  'gr/Athens': season('111222112211', temps('13,14,17,20,25,30,33,33,29,24,19,15', '7,7,9,12,16,21,23,23,20,16,12,9'),
    best('4-6,9-10', '春秋最舒服', 'Spring and autumn are the most pleasant'),
    note('7-8', '熱浪頻繁，可能超過 40°C', 'Frequent heatwaves, can pass 40°C')),
  'hr/Split': season('111122112111', temps('11,12,15,18,23,27,31,30,26,21,16,12', '5,5,8,11,15,19,22,22,18,14,10,6'),
    best('5-6,9', '溫暖，人比盛夏少', 'Warm, fewer people than midsummer'),
    note('7-8', '遊客最多、房價最高', 'Peak crowds and prices'),
    note('11-3', '淡季，不少店家歇業', 'Off-season; many places close')),
  'fr/Paris': season('111222222111', temps('7,9,13,16,20,23,25,25,21,16,11,8', '3,3,5,7,11,14,16,16,13,10,6,4'),
    best('4-9', '溫和，白天長', 'Mild, long days'),
    note('8', '不少在地店家放假', 'Many local shops close for holidays'),
    note('11-2', '陰冷、天黑得早', 'Grey, cold, early sunsets')),
  'de/Berlin': season('111122222111', temps('3,5,9,15,19,23,25,24,20,14,8,4', '-2,-2,1,5,9,13,15,14,11,7,3,0'),
    best('5-9', '溫暖，戶外活動多', 'Warm, lots going on outdoors'),
    note('11-2', '陰冷、白天很短', 'Grey and cold, very short days')),
  'de/Munich': season('111122222111', temps('3,5,10,14,19,22,24,24,19,14,8,4', '-4,-3,0,4,8,12,13,13,9,5,1,-2'),
    best('5-9', '溫暖，啤酒花園與阿爾卑斯山健行季', 'Warm: beer gardens and hikes in the Alps'),
    note('9-10', '啤酒節（9 月下旬到 10 月初），房價暴漲', 'Oktoberfest (late September to early October); rooms get very expensive'),
    note('11-3', '寒冷，常下雪', 'Cold, often snowy'),
    note('12', '聖誕市集', 'Christmas markets')),
  'de/Hamburg': season('111122222111', temps('3,4,8,13,18,20,23,22,19,14,8,5', '-2,-2,0,3,7,10,13,12,10,6,3,0'),
    best('5-9', '溫和，白天長', 'Mild, long days'),
    note('10-3', '陰冷多雨、風大', 'Grey, wet and windy')),
  'de/Frankfurt': season('111122222111', temps('4,6,11,16,20,23,26,25,21,15,9,5', '-1,-1,2,5,9,12,14,14,11,7,3,0'),
    best('5-9', '溫暖，萊茵河谷與葡萄酒季', 'Warm; Rhine valley and wine season'),
    note('11-2', '陰冷', 'Grey and cold'),
    note('12', '聖誕市集', 'Christmas markets')),
  'de/Cologne': season('111122222111', temps('5,7,11,15,19,22,24,24,20,15,10,6', '0,0,3,5,9,12,14,14,11,8,4,1'),
    best('5-9', '溫和', 'Mild'),
    note('2', '狂歡節，全城熱鬧但房價高', 'Carnival: the whole city parties and rooms are pricey'),
    note('11-2', '陰冷多雨', 'Grey, cold and wet')),
  'ch/Zurich': season('111122222111', temps('3,5,10,14,19,22,24,24,19,14,8,4', '-2,-2,1,4,8,12,14,13,10,6,2,-1'),
    best('5-9', '溫暖，湖邊與健行季', 'Warm: lakeside days and hiking season'),
    note('11-2', '陰冷，常有霧', 'Grey and cold, often foggy'),
    note('12', '聖誕市集', 'Christmas markets')),
  'ch/Geneva': season('111122222111', temps('5,7,12,16,20,24,27,26,22,16,9,5', '-1,0,2,5,9,13,15,15,11,8,3,0'),
    best('5-9', '溫暖晴朗，湖邊最舒服', 'Warm and sunny, best by the lake'),
    note('11-2', '陰冷，偶有強烈北風', 'Grey and cold, with the occasional bise wind')),
  'ch/Lucerne': season('111112222111', temps('3,5,10,14,19,22,24,23,19,14,8,4', '-3,-2,1,4,8,11,13,13,10,6,1,-2'),
    best('6-9', '健行與湖上活動最好的季節', 'The best season for hiking and the lakes'),
    note('12-3', '附近山區滑雪季', 'Ski season in the mountains nearby'),
    note('4-5,10-11', '淡季，部分山上纜車維修停駛', 'Shoulder season; some mountain lifts close for maintenance')),
  'at/Vienna': season('111222112111', temps('3,6,11,16,21,24,27,26,21,15,8,4', '-2,-1,2,6,11,14,16,16,12,7,3,0'),
    best('4-6,9', '溫和，咖啡館與公園最舒服', 'Mild: the best of the cafés and parks'),
    note('7-8', '炎熱', 'Hot'),
    note('12', '聖誕市集', 'Christmas markets'),
    note('1-2', '寒冷', 'Cold')),
  'nl/Amsterdam': season('111222222111', temps('6,7,10,14,18,20,22,22,19,15,10,7', '1,1,3,5,9,11,13,13,11,8,4,2'),
    best('4-9', '4 月鬱金香、夏天白天長', 'Tulips in April, long summer days'),
    note('11-2', '陰冷多雨', 'Grey, cold and wet')),
  'gb/London': season('111122222111', temps('8,9,12,15,18,21,24,23,20,16,11,9', '3,3,4,6,9,12,14,14,12,9,6,3'),
    best('5-9', '最溫暖的時候', 'The warmest months'),
    note('11-2', '陰冷，天黑得早', 'Grey and cold, early dark')),
  'cz/Prague': season('111222112111', temps('1,3,8,14,19,22,24,24,19,13,6,2', '-4,-3,0,4,8,11,13,13,9,5,1,-2'),
    best('4-6,9', '溫和，人較少', 'Mild, fewer crowds'),
    note('7-8', '遊客最多', 'Peak crowds'),
    note('12', '聖誕市集', 'Christmas markets')),
  'hu/Budapest': season('111222112111', temps('3,6,11,17,22,25,28,27,22,16,9,4', '-3,-2,2,6,11,14,16,16,12,7,3,-1'),
    best('4-6,9', '溫和', 'Mild'),
    note('7-8', '炎熱', 'Hot'),
    note('12-2', '寒冷，但溫泉正好', 'Cold, but perfect for the baths')),
  'ee/Tallinn': season('111122221111', temps('-1,-1,3,10,16,20,22,21,16,10,4,1', '-6,-7,-4,1,6,10,13,13,8,4,0,-4'),
    best('5-8', '白天很長，6 月幾乎不天黑', 'Very long days; barely dark in June'),
    note('11-2', '白天只有 6–7 小時，很冷', 'Only 6–7 hours of daylight, cold')),
  'bg/Bansko': season('222112221111', temps('3,5,9,14,19,23,26,26,21,16,9,4', '-7,-6,-2,2,6,9,11,11,7,3,-1,-5'),
    best('1-3', '滑雪季', 'Ski season'),
    best('6-8', '夏季健行，6 月有遊牧者大會', 'Summer hiking; nomad fest in June'),
    note('4-5,10-11', '淡季，不少店家歇業', 'Shoulder season; many places close')),

  // Americas
  'mx/Mexico City': season('222221111222', temps('22,24,26,27,27,25,24,24,23,23,23,22', '6,8,10,12,13,13,13,13,13,11,9,7'),
    best('10-5', '乾季，晴朗', 'Dry season, sunny'),
    note('6-9', '雨季，午後雷雨', 'Rainy season, afternoon storms'),
    note('2-4', '空氣品質較差的時候', 'When air quality is at its worst')),
  'mx/Playa del Carmen': season('222211110012', temps('28,29,30,31,32,32,33,33,32,31,30,28', '20,20,21,23,24,25,25,25,24,23,22,21'),
    best('12-4', '乾季，氣候最好', 'Dry season, best weather'),
    avoid('9-10', '颶風季高峰', 'Peak hurricane season'),
    note('5-8', '馬尾藻（海草）常堆滿海灘', 'Sargassum seaweed often piles up on beaches')),
  'mx/Oaxaca': season('222221111222', temps('27,29,31,32,31,28,27,27,26,26,26,26', '9,10,12,15,16,16,15,15,15,13,11,9'),
    best('10-5', '乾季；11/1–2 亡靈節', 'Dry season; Day of the Dead Nov 1–2'),
    note('6-9', '雨季', 'Rainy season')),
  'co/Medellín': season('222112221112', temps('27,28,28,27,27,28,28,28,28,27,26,26', '17,17,17,17,17,17,17,17,17,17,17,17'),
    best('12-3,6-8', '「永恆之春」，相對乾', '"City of eternal spring", drier spells'),
    note('4-5,10-11', '雨較多', 'Rainier months'),
    note('8', '花節', 'Flower Festival')),
  'ar/Buenos Aires': season('112221112221', temps('30,29,26,23,19,16,15,17,19,22,26,29', '20,20,18,14,11,8,8,9,10,13,16,19'),
    best('3-5', '秋天', 'Autumn'),
    best('9-11', '春天，紫花楹盛開', 'Spring, jacarandas in bloom'),
    note('1-2', '濕熱', 'Hot and humid'),
    note('6-8', '冬天，陰冷', 'Winter, cold and grey')),
  'br/Rio de Janeiro': season('111222222221', temps('31,32,31,29,27,26,26,27,27,28,29,30', '24,24,23,22,20,19,18,19,19,20,21,23'),
    best('4-11', '較涼爽乾燥', 'Cooler and drier'),
    note('12-3', '酷熱多雨', 'Hot and rainy'),
    note('2', '嘉年華，人潮多、房價高', 'Carnival: crowds and peak prices')),
  'br/Florianópolis': season('221111111112', temps('29,29,28,26,23,21,20,21,21,23,25,28', '21,22,21,19,16,14,13,14,15,17,18,20'),
    best('12-2', '夏天海灘季', 'Summer beach season'),
    note('6-8', '冬天，海水冷', 'Winter, cold sea')),
  'pe/Lima': season('222211111112', temps('26,27,27,25,22,20,19,19,19,20,22,24', '19,20,20,18,17,16,15,15,15,16,17,18'),
    best('12-4', '夏天，晴朗', 'Summer, sunny'),
    note('6-10', '冬天，天天陰灰霧濛', 'Winter, grey overcast almost every day')),
  'us/New York': season('111222112221', temps('4,6,10,17,22,27,29,28,24,18,12,6', '-3,-2,2,7,12,18,21,20,16,10,5,0'),
    best('4-6,9-11', '春秋最舒服', 'Spring and autumn are the most pleasant'),
    note('7-8', '濕熱', 'Hot and humid'),
    note('12-2', '寒冷，可能下雪', 'Cold, possible snow')),
  'us/Austin': season('112221001221', temps('17,19,23,27,31,34,36,36,33,28,22,17', '5,7,11,14,19,22,23,23,20,15,10,6'),
    best('3-5,10-11', '溫和', 'Mild'),
    avoid('7-8', '酷熱，常超過 38°C', 'Scorching, often above 38°C'),
    note('3', 'SXSW 期間房價暴漲', 'Prices spike during SXSW')),
  'ca/Vancouver': season('111122222111', temps('7,8,10,13,17,19,22,22,19,14,9,6', '1,1,3,5,8,11,13,13,11,7,4,1'),
    best('5-9', '乾燥晴朗', 'Dry and sunny'),
    note('11-2', '幾乎天天下雨', 'Rain almost every day')),

  // Africa & Oceania
  'za/Cape Town': season('222211111122', temps('27,27,26,24,21,19,18,19,20,22,24,26', '16,16,15,12,10,8,7,8,9,11,13,15'),
    best('11-4', '夏天，晴朗；風大', 'Summer, sunny; windy'),
    note('6-8', '冬天，多雨陰冷', 'Winter, rainy and cool')),
  'ma/Marrakech': season('112221001221', temps('19,21,23,26,29,33,38,37,33,28,23,20', '6,8,10,12,15,18,21,21,19,15,11,7'),
    best('3-5,10-11', '溫和', 'Mild'),
    avoid('7-8', '酷熱，常超過 40°C', 'Scorching, often above 40°C'),
    note('12-1', '白天溫和、夜裡很冷', 'Mild days, cold nights')),
  'au/Sydney': season('112221112222', temps('26,26,25,23,20,18,17,18,20,22,24,25', '19,19,18,15,12,9,8,9,11,14,16,18'),
    best('3-5', '秋天', 'Autumn'),
    best('9-12', '春天到初夏', 'Spring into early summer'),
    note('1-2', '炎熱，可能有熱浪', 'Hot, with possible heatwaves'),
    note('6-8', '冬天，溫和偏冷', 'Winter, mild but cool')),
  'au/Melbourne': season('222211111122', temps('26,26,24,20,17,14,14,15,17,20,22,24', '14,15,13,11,9,7,6,7,8,9,11,13'),
    best('11-4', '夏天到初秋', 'Summer into early autumn'),
    note('6-8', '冬天，陰冷', 'Winter, grey and cold'),
    note('1-3', '一天四季，天氣多變', 'Four seasons in a day')),
  'nz/Auckland': season('222211111122', temps('24,24,23,21,18,16,15,15,17,18,20,22', '16,17,16,13,11,9,8,8,10,11,13,15'),
    best('11-4', '夏天', 'Summer'),
    note('6-8', '冬天，多雨', 'Winter, rainy')),
};

// Places that share weather with a listed one.
const ALIASES: Record<string, string> = {
  'id/Ubud': 'id/Bali',
  'id/Canggu': 'id/Bali',
  'vn/Hoi An': 'vn/Da Nang',
  'mx/Tulum': 'mx/Playa del Carmen',
  'mx/Cancún': 'mx/Playa del Carmen',
  'th/Koh Samui': 'th/Koh Phangan',
  'th/Koh Tao': 'th/Koh Phangan',
  'th/Krabi': 'th/Phuket',
  'th/Koh Lanta': 'th/Phuket',
  'th/Pai': 'th/Chiang Mai',
  'th/Chiang Rai': 'th/Chiang Mai',
  'tw/New Taipei': 'tw/Taipei',
  'tw/Keelung': 'tw/Taipei',
  'tw/Taoyuan': 'tw/Taipei',
  'tw/Hsinchu': 'tw/Taipei',
  'tw/Chiayi': 'tw/Tainan',
  'tw/Pingtung': 'tw/Kaohsiung',
  'tw/Taitung': 'tw/Hualien',
  'de/Stuttgart': 'de/Frankfurt',
  'de/Heidelberg': 'de/Frankfurt',
  'de/Düsseldorf': 'de/Cologne',
  'de/Leipzig': 'de/Berlin',
  'de/Dresden': 'de/Berlin',
  'ch/Bern': 'ch/Zurich',
  'ch/Basel': 'ch/Zurich',
  'ch/Lausanne': 'ch/Geneva',
  'ch/Interlaken': 'ch/Lucerne',
  'at/Graz': 'at/Vienna',
};

// A stay with a country but no city borrows the city that most stays there are in. Only for countries where
// one base is a fair stand-in; elsewhere (Thailand, Japan, the US…) the weather varies too much to guess.
const COUNTRY_DEFAULTS: Record<string, string> = {
  tw: 'tw/Taipei',
  sg: 'sg/Singapore',
  ae: 'ae/Dubai',
  ge: 'ge/Tbilisi',
  ee: 'ee/Tallinn',
  hu: 'hu/Budapest',
  cz: 'cz/Prague',
  de: 'de/Berlin',
  ch: 'ch/Zurich',
  at: 'at/Vienna',
};

// The entry a place uses: its own, a neighbour's, or (with no city) the country's usual base.
function seasonKey(place: Pick<Stay, 'country' | 'city'>): string {
  const key = `${place.country}/${place.city}`;
  if (!place.city.trim()) return COUNTRY_DEFAULTS[place.country] ?? key;
  return ALIASES[key] ?? key;
}

export function seasonOf(place: Pick<Stay, 'country' | 'city'>): Season | undefined {
  return SEASONS[seasonKey(place)];
}

// The English name of the city a country-only stay borrows its season from, or null when the place has its own.
export function seasonBasis(place: Pick<Stay, 'country' | 'city'>): string | null {
  return place.city.trim() ? null : (COUNTRY_DEFAULTS[place.country]?.split('/')[1] ?? null);
}

export const noteText = (n: SeasonNote) => (getLocale() === 'en' ? n.en : n.zh);

// The coolest night to the warmest day across some months, e.g. { lo: '19', hi: '36' }. Below zero gets a real
// minus sign, which reads better than a hyphen next to the range mark.
export function tempRange(season: Season, months: number[]): { lo: string; hi: string } {
  const deg = (n: number) => (n < 0 ? `−${-n}` : String(n));
  return { lo: deg(Math.min(...months.map((m) => season.lows[m]))), hi: deg(Math.max(...months.map((m) => season.highs[m]))) };
}

// Days of a range in each calendar month (0–11), whatever the year.
export function daysPerMonth(r: DayRange): number[] {
  const days = new Array<number>(12).fill(0);
  for (let d = r.startDay; d <= r.endDay; d++) days[dateOfDay(d).getMonth()]++;
  return days;
}

// The avoid-months a stay runs into, if it spends a meaningful part of itself there: a week, or all of it
// when shorter. A day or two clipping an edge doesn't count.
export function seasonWarning(stay: Pick<Stay, 'country' | 'city'> & DayRange): { months: number[]; notes: SeasonNote[] } | null {
  const season = seasonOf(stay);
  if (!season) return null;
  const days = daysPerMonth(stay);
  const bad = days.flatMap((n, m) => (n > 0 && season.ratings[m] === 0 ? [m] : []));
  const badDays = bad.reduce((n, m) => n + days[m], 0);
  const length = stay.endDay - stay.startDay + 1;
  if (badDays < Math.min(7, length)) return null;
  return { months: bad, notes: season.notes.filter((n) => n.kind === 'avoid' && n.months.some((m) => bad.includes(m))) };
}
