import { countryNameOf, flagCode } from './flags';

// A hand-picked list of cities people commonly base themselves in, keyed by ISO country code. It is a typing
// aid, not a gazetteer: the city field accepts anything, and places missing here just have to be typed out.
// Each entry is [Traditional Chinese (Taiwan usage), English].
const CITIES: Record<string, [string, string][]> = {
  tw: [['台北', 'Taipei'], ['新北', 'New Taipei'], ['桃園', 'Taoyuan'], ['新竹', 'Hsinchu'], ['台中', 'Taichung'], ['台南', 'Tainan'], ['高雄', 'Kaohsiung'], ['基隆', 'Keelung'], ['嘉義', 'Chiayi'], ['宜蘭', 'Yilan'], ['花蓮', 'Hualien'], ['台東', 'Taitung'], ['屏東', 'Pingtung'], ['墾丁', 'Kenting'], ['南投', 'Nantou'], ['澎湖', 'Penghu'], ['金門', 'Kinmen'], ['馬祖', 'Matsu']],
  jp: [['東京', 'Tokyo'], ['大阪', 'Osaka'], ['京都', 'Kyoto'], ['橫濱', 'Yokohama'], ['名古屋', 'Nagoya'], ['福岡', 'Fukuoka'], ['札幌', 'Sapporo'], ['神戶', 'Kobe'], ['奈良', 'Nara'], ['廣島', 'Hiroshima'], ['仙台', 'Sendai'], ['金澤', 'Kanazawa'], ['沖繩', 'Okinawa'], ['那霸', 'Naha'], ['北海道', 'Hokkaido'], ['函館', 'Hakodate'], ['鎌倉', 'Kamakura'], ['長野', 'Nagano'], ['熊本', 'Kumamoto'], ['鹿兒島', 'Kagoshima'], ['高松', 'Takamatsu'], ['松山', 'Matsuyama'], ['輕井澤', 'Karuizawa'], ['箱根', 'Hakone'], ['石垣島', 'Ishigaki']],
  kr: [['首爾', 'Seoul'], ['釜山', 'Busan'], ['濟州', 'Jeju'], ['仁川', 'Incheon'], ['大邱', 'Daegu'], ['大田', 'Daejeon'], ['光州', 'Gwangju'], ['慶州', 'Gyeongju'], ['江陵', 'Gangneung']],
  th: [['曼谷', 'Bangkok'], ['清邁', 'Chiang Mai'], ['清萊', 'Chiang Rai'], ['普吉島', 'Phuket'], ['芭達雅', 'Pattaya'], ['蘇美島', 'Koh Samui'], ['帕岸島', 'Koh Phangan'], ['喀比', 'Krabi'], ['華欣', 'Hua Hin'], ['拜縣', 'Pai'], ['蘭塔島', 'Koh Lanta'], ['龜島', 'Koh Tao'], ['大城', 'Ayutthaya']],
  vn: [['河內', 'Hanoi'], ['胡志明市', 'Ho Chi Minh City'], ['峴港', 'Da Nang'], ['會安', 'Hoi An'], ['芽莊', 'Nha Trang'], ['大叻', 'Da Lat'], ['順化', 'Hue'], ['富國島', 'Phu Quoc'], ['下龍灣', 'Ha Long'], ['沙壩', 'Sapa']],
  my: [['吉隆坡', 'Kuala Lumpur'], ['檳城', 'Penang'], ['蘭卡威', 'Langkawi'], ['新山', 'Johor Bahru'], ['馬六甲', 'Malacca'], ['怡保', 'Ipoh'], ['亞庇', 'Kota Kinabalu'], ['古晉', 'Kuching']],
  id: [['峇里島', 'Bali'], ['烏布', 'Ubud'], ['倉古', 'Canggu'], ['雅加達', 'Jakarta'], ['日惹', 'Yogyakarta'], ['泗水', 'Surabaya'], ['萬隆', 'Bandung'], ['龍目島', 'Lombok']],
  sg: [['新加坡', 'Singapore']],
  ph: [['馬尼拉', 'Manila'], ['宿霧', 'Cebu'], ['長灘島', 'Boracay'], ['巴拉望', 'Palawan'], ['薄荷島', 'Bohol'], ['錫亞高', 'Siargao'], ['達沃', 'Davao']],
  kh: [['金邊', 'Phnom Penh'], ['暹粒', 'Siem Reap'], ['西哈努克', 'Sihanoukville']],
  la: [['永珍', 'Vientiane'], ['龍坡邦', 'Luang Prabang']],
  mm: [['仰光', 'Yangon'], ['曼德勒', 'Mandalay']],
  cn: [['北京', 'Beijing'], ['上海', 'Shanghai'], ['廣州', 'Guangzhou'], ['深圳', 'Shenzhen'], ['成都', 'Chengdu'], ['杭州', 'Hangzhou'], ['重慶', 'Chongqing'], ['西安', "Xi'an"], ['南京', 'Nanjing'], ['蘇州', 'Suzhou'], ['廈門', 'Xiamen'], ['昆明', 'Kunming'], ['大理', 'Dali'], ['麗江', 'Lijiang'], ['青島', 'Qingdao'], ['武漢', 'Wuhan'], ['天津', 'Tianjin']],
  hk: [['香港', 'Hong Kong']],
  mo: [['澳門', 'Macau']],
  in: [['德里', 'Delhi'], ['孟買', 'Mumbai'], ['班加羅爾', 'Bengaluru'], ['果亞', 'Goa'], ['加爾各答', 'Kolkata'], ['清奈', 'Chennai'], ['齋浦爾', 'Jaipur'], ['海德拉巴', 'Hyderabad']],
  np: [['加德滿都', 'Kathmandu'], ['波卡拉', 'Pokhara']],
  lk: [['可倫坡', 'Colombo'], ['康提', 'Kandy']],
  ae: [['杜拜', 'Dubai'], ['阿布達比', 'Abu Dhabi']],
  tr: [['伊斯坦堡', 'Istanbul'], ['安塔利亞', 'Antalya'], ['伊茲密爾', 'Izmir'], ['安卡拉', 'Ankara'], ['卡帕多奇亞', 'Cappadocia']],
  ge: [['提比里斯', 'Tbilisi'], ['巴統', 'Batumi']],
  il: [['特拉維夫', 'Tel Aviv'], ['耶路撒冷', 'Jerusalem']],
  au: [['雪梨', 'Sydney'], ['墨爾本', 'Melbourne'], ['布里斯本', 'Brisbane'], ['伯斯', 'Perth'], ['阿德雷德', 'Adelaide'], ['黃金海岸', 'Gold Coast'], ['坎培拉', 'Canberra'], ['凱恩斯', 'Cairns'], ['荷巴特', 'Hobart'], ['達爾文', 'Darwin'], ['拜倫灣', 'Byron Bay']],
  nz: [['奧克蘭', 'Auckland'], ['威靈頓', 'Wellington'], ['基督城', 'Christchurch'], ['皇后鎮', 'Queenstown'], ['但尼丁', 'Dunedin'], ['羅托魯瓦', 'Rotorua']],
  us: [['紐約', 'New York'], ['洛杉磯', 'Los Angeles'], ['舊金山', 'San Francisco'], ['西雅圖', 'Seattle'], ['芝加哥', 'Chicago'], ['波士頓', 'Boston'], ['華盛頓', 'Washington D.C.'], ['邁阿密', 'Miami'], ['拉斯維加斯', 'Las Vegas'], ['聖地牙哥', 'San Diego'], ['奧斯汀', 'Austin'], ['丹佛', 'Denver'], ['波特蘭', 'Portland'], ['檀香山', 'Honolulu'], ['休士頓', 'Houston'], ['達拉斯', 'Dallas'], ['亞特蘭大', 'Atlanta'], ['費城', 'Philadelphia'], ['鳳凰城', 'Phoenix'], ['紐奧良', 'New Orleans'], ['納許維爾', 'Nashville'], ['聖荷西', 'San Jose']],
  ca: [['多倫多', 'Toronto'], ['溫哥華', 'Vancouver'], ['蒙特婁', 'Montreal'], ['卡加利', 'Calgary'], ['渥太華', 'Ottawa'], ['魁北克市', 'Quebec City'], ['維多利亞', 'Victoria']],
  mx: [['墨西哥城', 'Mexico City'], ['坎昆', 'Cancún'], ['普拉亞德爾卡曼', 'Playa del Carmen'], ['圖盧姆', 'Tulum'], ['瓜達拉哈拉', 'Guadalajara'], ['瓦哈卡', 'Oaxaca'], ['巴亞爾塔港', 'Puerto Vallarta'], ['梅里達', 'Mérida']],
  gb: [['倫敦', 'London'], ['愛丁堡', 'Edinburgh'], ['曼徹斯特', 'Manchester'], ['利物浦', 'Liverpool'], ['伯明罕', 'Birmingham'], ['格拉斯哥', 'Glasgow'], ['布里斯托', 'Bristol'], ['牛津', 'Oxford'], ['劍橋', 'Cambridge'], ['布萊頓', 'Brighton']],
  ie: [['都柏林', 'Dublin'], ['科克', 'Cork'], ['高威', 'Galway']],
  fr: [['巴黎', 'Paris'], ['里昂', 'Lyon'], ['馬賽', 'Marseille'], ['尼斯', 'Nice'], ['波爾多', 'Bordeaux'], ['史特拉斯堡', 'Strasbourg'], ['土魯斯', 'Toulouse'], ['南特', 'Nantes']],
  de: [['柏林', 'Berlin'], ['慕尼黑', 'Munich'], ['漢堡', 'Hamburg'], ['法蘭克福', 'Frankfurt'], ['科隆', 'Cologne'], ['斯圖加特', 'Stuttgart'], ['杜塞道夫', 'Düsseldorf'], ['萊比錫', 'Leipzig'], ['德勒斯登', 'Dresden'], ['海德堡', 'Heidelberg']],
  it: [['羅馬', 'Rome'], ['米蘭', 'Milan'], ['佛羅倫斯', 'Florence'], ['威尼斯', 'Venice'], ['拿坡里', 'Naples'], ['杜林', 'Turin'], ['波隆那', 'Bologna'], ['維洛納', 'Verona'], ['巴勒摩', 'Palermo'], ['熱那亞', 'Genoa']],
  es: [['巴塞隆納', 'Barcelona'], ['馬德里', 'Madrid'], ['瓦倫西亞', 'Valencia'], ['塞維亞', 'Seville'], ['馬拉加', 'Málaga'], ['格拉納達', 'Granada'], ['畢爾包', 'Bilbao'], ['帕爾馬', 'Palma'], ['特內里費', 'Tenerife'], ['拉斯帕爾馬斯', 'Las Palmas']],
  pt: [['里斯本', 'Lisbon'], ['波多', 'Porto'], ['法魯', 'Faro'], ['拉哥斯', 'Lagos'], ['埃里塞拉', 'Ericeira'], ['科英布拉', 'Coimbra'], ['馬德拉', 'Madeira']],
  nl: [['阿姆斯特丹', 'Amsterdam'], ['鹿特丹', 'Rotterdam'], ['海牙', 'The Hague'], ['烏特勒支', 'Utrecht']],
  be: [['布魯塞爾', 'Brussels'], ['安特衛普', 'Antwerp'], ['根特', 'Ghent'], ['布魯日', 'Bruges']],
  ch: [['蘇黎世', 'Zurich'], ['日內瓦', 'Geneva'], ['伯恩', 'Bern'], ['巴塞爾', 'Basel'], ['琉森', 'Lucerne'], ['洛桑', 'Lausanne'], ['因特拉肯', 'Interlaken']],
  at: [['維也納', 'Vienna'], ['薩爾斯堡', 'Salzburg'], ['因斯布魯克', 'Innsbruck'], ['格拉茲', 'Graz']],
  cz: [['布拉格', 'Prague'], ['布爾諾', 'Brno']],
  pl: [['華沙', 'Warsaw'], ['克拉科夫', 'Kraków'], ['格但斯克', 'Gdańsk'], ['弗羅茨瓦夫', 'Wrocław']],
  hu: [['布達佩斯', 'Budapest']],
  gr: [['雅典', 'Athens'], ['塞薩洛尼基', 'Thessaloniki'], ['聖托里尼', 'Santorini'], ['克里特島', 'Crete']],
  hr: [['札格雷布', 'Zagreb'], ['斯普利特', 'Split'], ['杜布羅夫尼克', 'Dubrovnik']],
  dk: [['哥本哈根', 'Copenhagen']],
  se: [['斯德哥爾摩', 'Stockholm'], ['哥德堡', 'Gothenburg']],
  no: [['奧斯陸', 'Oslo'], ['卑爾根', 'Bergen']],
  fi: [['赫爾辛基', 'Helsinki']],
  is: [['雷克雅維克', 'Reykjavik']],
  ee: [['塔林', 'Tallinn']],
  lv: [['里加', 'Riga']],
  lt: [['維爾紐斯', 'Vilnius']],
  ro: [['布加勒斯特', 'Bucharest']],
  bg: [['索菲亞', 'Sofia'], ['班斯科', 'Bansko']],
  rs: [['貝爾格勒', 'Belgrade']],
  me: [['科托', 'Kotor']],
  al: [['地拉那', 'Tirana']],
  mt: [['瓦萊塔', 'Valletta']],
  cy: [['拉納卡', 'Larnaca'], ['利馬索爾', 'Limassol']],
  br: [['聖保羅', 'São Paulo'], ['里約熱內盧', 'Rio de Janeiro'], ['弗洛里亞諾波利斯', 'Florianópolis']],
  ar: [['布宜諾斯艾利斯', 'Buenos Aires']],
  cl: [['聖地牙哥', 'Santiago']],
  co: [['麥德林', 'Medellín'], ['波哥大', 'Bogotá'], ['卡塔赫納', 'Cartagena']],
  pe: [['利馬', 'Lima'], ['庫斯科', 'Cusco']],
  cr: [['聖荷西', 'San José']],
  za: [['開普敦', 'Cape Town'], ['約翰尼斯堡', 'Johannesburg']],
  ma: [['馬拉喀什', 'Marrakech'], ['卡薩布蘭卡', 'Casablanca']],
  eg: [['開羅', 'Cairo']],
  ke: [['奈洛比', 'Nairobi']],
};

export type CityOption = { name: string; en: string; country: string }; // country: Chinese name, '' if unknown

// Lower-case and strip accents, so "malaga" finds Málaga.
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

let all: CityOption[] | null = null;
const everyCity = () =>
  (all ??= Object.entries(CITIES).flatMap(([code, list]) => {
    const country = countryNameOf(code) ?? '';
    return list.map(([name, en]) => ({ name, en, country }));
  }));

// Options for the city picker. With a recognised country chosen, only that country's cities are offered;
// otherwise every city is, each tagged with its country. Cities already used in the plan come first.
export function searchCities(query: string, country: string, recent: { city: string; country: string }[]): CityOption[] {
  const code = flagCode(country);
  const scoped = Boolean(code && CITIES[code]);
  const pool = scoped ? everyCity().filter((c) => flagCode(c.country) === code) : everyCity();

  const used: CityOption[] = [];
  for (const r of recent) {
    if (!r.city || (scoped && flagCode(r.country) !== code)) continue;
    if (used.some((u) => u.name === r.city && u.country === r.country)) continue;
    const known = pool.find((c) => c.name === r.city && (!r.country || c.country === r.country));
    used.push(known ?? { name: r.city, en: '', country: r.country });
  }
  const options = [...used, ...pool.filter((c) => !used.includes(c))];

  const q = fold(query.trim());
  if (!q) return options;
  const rank = (c: CityOption) => {
    const terms = [fold(c.name), fold(c.en)];
    if (terms.some((t) => t === q)) return 0;
    if (terms.some((t) => t && t.startsWith(q))) return 1;
    if (terms.some((t) => t && t.includes(q))) return 2;
    return -1;
  };
  return options
    .map((c) => ({ c, r: rank(c) }))
    .filter((x) => x.r >= 0)
    .sort((x, y) => x.r - y.r)
    .map((x) => x.c);
}
