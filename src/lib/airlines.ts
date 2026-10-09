// A hand-picked list of airlines nomads commonly fly, for the airline picker in the flight details. Like the city
// list it is a typing aid: the field still takes anything. Each entry is [IATA code, Traditional Chinese (Taiwan
// usage), English, home country ISO code]. There are no Japanese names; `ja` shows the English one.
import { getLocale } from './i18n';

const AIRLINES: [string, string, string, string][] = [
  // Taiwan
  ['BR', '長榮航空', 'EVA Air', 'tw'],
  ['CI', '中華航空', 'China Airlines', 'tw'],
  ['JX', '星宇航空', 'STARLUX Airlines', 'tw'],
  ['IT', '台灣虎航', 'Tigerair Taiwan', 'tw'],
  ['AE', '華信航空', 'Mandarin Airlines', 'tw'],
  ['B7', '立榮航空', 'UNI Air', 'tw'],
  // Japan and Korea
  ['JL', '日本航空', 'Japan Airlines', 'jp'],
  ['NH', '全日空', 'All Nippon Airways', 'jp'],
  ['MM', '樂桃航空', 'Peach Aviation', 'jp'],
  ['GK', '捷星日本', 'Jetstar Japan', 'jp'],
  ['ZG', 'ZIPAIR', 'ZIPAIR Tokyo', 'jp'],
  ['KE', '大韓航空', 'Korean Air', 'kr'],
  ['OZ', '韓亞航空', 'Asiana Airlines', 'kr'],
  ['7C', '濟州航空', 'Jeju Air', 'kr'],
  ['TW', '德威航空', "T'way Air", 'kr'],
  ['LJ', '真航空', 'Jin Air', 'kr'],
  // Hong Kong, Macau and China
  ['CX', '國泰航空', 'Cathay Pacific', 'hk'],
  ['UO', '香港快運', 'HK Express', 'hk'],
  ['HX', '香港航空', 'Hong Kong Airlines', 'hk'],
  ['NX', '澳門航空', 'Air Macau', 'mo'],
  ['CA', '中國國際航空', 'Air China', 'cn'],
  ['MU', '中國東方航空', 'China Eastern Airlines', 'cn'],
  ['CZ', '中國南方航空', 'China Southern Airlines', 'cn'],
  // Southeast and South Asia
  ['SQ', '新加坡航空', 'Singapore Airlines', 'sg'],
  ['TR', '酷航', 'Scoot', 'sg'],
  ['TG', '泰國航空', 'Thai Airways', 'th'],
  ['FD', '泰國亞洲航空', 'Thai AirAsia', 'th'],
  ['VZ', '泰國越捷航空', 'Thai Vietjet', 'th'],
  ['PG', '曼谷航空', 'Bangkok Airways', 'th'],
  ['VN', '越南航空', 'Vietnam Airlines', 'vn'],
  ['VJ', '越捷航空', 'Vietjet Air', 'vn'],
  ['MH', '馬來西亞航空', 'Malaysia Airlines', 'my'],
  ['AK', '亞洲航空', 'AirAsia', 'my'],
  ['D7', '全亞洲航空', 'AirAsia X', 'my'],
  ['PR', '菲律賓航空', 'Philippine Airlines', 'ph'],
  ['5J', '宿霧太平洋航空', 'Cebu Pacific', 'ph'],
  ['GA', '印尼鷹航', 'Garuda Indonesia', 'id'],
  ['JT', '獅子航空', 'Lion Air', 'id'],
  ['AI', '印度航空', 'Air India', 'in'],
  // Middle East and Africa
  ['EK', '阿聯酋航空', 'Emirates', 'ae'],
  ['EY', '阿提哈德航空', 'Etihad Airways', 'ae'],
  ['QR', '卡達航空', 'Qatar Airways', 'qa'],
  ['TK', '土耳其航空', 'Turkish Airlines', 'tr'],
  ['ET', '衣索比亞航空', 'Ethiopian Airlines', 'et'],
  // Europe
  ['BA', '英國航空', 'British Airways', 'gb'],
  ['LH', '德國漢莎航空', 'Lufthansa', 'de'],
  ['AF', '法國航空', 'Air France', 'fr'],
  ['KL', '荷蘭皇家航空', 'KLM', 'nl'],
  ['LX', '瑞士國際航空', 'Swiss', 'ch'],
  ['OS', '奧地利航空', 'Austrian Airlines', 'at'],
  ['IB', '伊比利亞航空', 'Iberia', 'es'],
  ['VY', '伏林航空', 'Vueling', 'es'],
  ['TP', '葡萄牙航空', 'TAP Air Portugal', 'pt'],
  ['AY', '芬蘭航空', 'Finnair', 'fi'],
  ['SK', '北歐航空', 'SAS', 'se'],
  ['AZ', '義大利航空', 'ITA Airways', 'it'],
  ['LO', '波蘭航空', 'LOT Polish Airlines', 'pl'],
  ['FR', '瑞安航空', 'Ryanair', 'ie'],
  ['U2', '易捷航空', 'easyJet', 'gb'],
  ['W6', '威茲航空', 'Wizz Air', 'hu'],
  // Americas
  ['UA', '聯合航空', 'United Airlines', 'us'],
  ['AA', '美國航空', 'American Airlines', 'us'],
  ['DL', '達美航空', 'Delta Air Lines', 'us'],
  ['AS', '阿拉斯加航空', 'Alaska Airlines', 'us'],
  ['B6', '捷藍航空', 'JetBlue', 'us'],
  ['WN', '西南航空', 'Southwest Airlines', 'us'],
  ['AC', '加拿大航空', 'Air Canada', 'ca'],
  ['AM', '墨西哥國際航空', 'Aeroméxico', 'mx'],
  ['LA', '南美航空', 'LATAM Airlines', 'cl'],
  ['AV', '哥倫比亞航空', 'Avianca', 'co'],
  ['CM', '巴拿馬航空', 'Copa Airlines', 'pa'],
  // Oceania
  ['QF', '澳洲航空', 'Qantas', 'au'],
  ['JQ', '捷星航空', 'Jetstar', 'au'],
  ['VA', '維珍澳洲航空', 'Virgin Australia', 'au'],
  ['NZ', '紐西蘭航空', 'Air New Zealand', 'nz'],
];

export type AirlineOption = { value: string; name: string; sub: string; code: string; country: string };

// Logos are downloaded once by scripts/fetch-airline-logos.mjs into public/airlines/<CODE>.png and deployed with the
// site, so nothing is fetched from a third party. The planner lives at /app/, so the site root is one level up.
export const airlineLogo = (code: string) => `../airlines/${code}.png`;

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
// The name a picked airline is saved as: the one for the current language (English for `ja`).
const nameOf = (a: (typeof AIRLINES)[number]) => (getLocale() === 'zh' ? a[1] : a[2]);

function option(a: (typeof AIRLINES)[number]): AirlineOption {
  const name = nameOf(a);
  return { value: name, name, sub: `${a[0]}${getLocale() === 'zh' ? ` ${a[2]}` : ''}`, code: a[0], country: a[3] };
}

// The airline a typed or saved name stands for, matched on its code or either name.
function find(text: string) {
  const q = fold(text);
  if (!q) return undefined;
  return AIRLINES.find((a) => fold(a[0]) === q || fold(a[1]) === q || fold(a[2]) === q);
}

// Two-letter code for whatever the airline field holds ("長榮航空", "EVA Air" or "BR"), or null.
export const airlineCode = (text: string): string | null => find(text)?.[0] ?? null;

// Airlines for the picker: the ones already used in the plan first, then the list; filtered by code or name.
export function searchAirlines(query: string, recent: string[]): AirlineOption[] {
  const q = fold(query);
  const matches = (a: (typeof AIRLINES)[number]) => !q || a.slice(0, 3).some((s) => fold(s).includes(q));
  const used = recent.map(find).filter((a): a is (typeof AIRLINES)[number] => Boolean(a));
  const ordered = [...new Set([...used, ...AIRLINES])].filter(matches);
  if (!q) return ordered.map(option);
  // While typing: an exact code first, then names that start with the text, then the rest.
  const rank = (a: (typeof AIRLINES)[number]) => (fold(a[0]) === q ? 0 : fold(a[1]).startsWith(q) || fold(a[2]).startsWith(q) ? 1 : 2);
  return ordered.sort((x, y) => rank(x) - rank(y)).map(option);
}
