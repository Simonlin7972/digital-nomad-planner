// Ways to stay longer than a visitor's visa-free days: digital nomad visas, remote-worker permits and the like,
// for popular destinations. Hand-written from the official pages in each entry's `sources` and dated by
// LONG_STAY_UPDATED; amounts and rules change, so the editor says so and links to the official page. A program's
// `name` is its own official name and isn't translated.
import { getLocale } from './i18n';
import { getProfile } from './profile';
import { visaFor } from './visa';

type Text = { zh: string; en: string; ja: string };

export type LongStay = {
  country: string; // ISO code, as a stay stores it
  name: string;
  length: Text; // how long it lets you stay, and renewals
  needs: Text; // the main thresholds and what it costs
  only?: Text; // who can apply, when that is limited
  passports?: string[]; // when only these passports can apply: hidden for any other
  url: string; // the official page
  sources: string[]; // where the figures came from, at least the official page
};

export const LONG_STAY_UPDATED = '2026-10';

export const LONG_STAYS: LongStay[] = [
  {
    country: 'th',
    name: "Destination Thailand Visa (DTV)",
    length: { zh: "五年多次入境，每次最長 180 天，可在泰國延長一次 180 天", en: "Five-year multiple-entry visa, up to 180 days per entry, extendable once by 180 days in Thailand", ja: "5 年マルチ、1 回の入国で最長 180 日、タイ国内で 1 回 180 日延長可" },
    needs: { zh: "存款至少 50 萬泰銖，遠距工作（外國雇主或客戶）或泰拳、料理等「軟實力」活動；規費 1 萬泰銖起，依使館而異", en: "At least THB 500,000 in funds, plus remote work for foreign employers or clients, or a 'soft power' activity such as Muay Thai or cooking; from THB 10,000, varying by embassy", ja: "資金 50 万バーツ以上、海外の雇用主・顧客とのリモートワーク、またはムエタイや料理などの「ソフトパワー」活動。手数料 1 万バーツ〜（大使館による）" },
    url: "https://www.thaievisa.go.th/",
    sources: ["https://www.thaievisa.go.th/", "https://budapest.thaiembassy.org/en/publicservice/destination-thailand-visa-dtv"],
  },
  {
    country: 'my',
    name: "DE Rantau Nomad Pass",
    length: { zh: "3–12 個月，可續一次 12 個月（最長 24 個月）", en: "3–12 months, renewable once for 12 months (24 months at most)", ja: "3〜12 か月、1 回 12 か月更新可（最長 24 か月）" },
    needs: { zh: "科技或數位相關工作年收入 2.4 萬美元，其他工作 6 萬美元；外國雇主或 3 個月以上的接案合約；保險；MDEC 手續費 1,080 令吉", en: "Income of US$24,000 a year for tech and digital roles, US$60,000 for others; a foreign employer or freelance contracts over 3 months; insurance; MDEC fee RM1,080", ja: "IT・デジタル職は年収 2 万 4 千ドル、その他は 6 万ドル。海外の雇用主または 3 か月超の業務委託契約、保険。MDEC 手数料 1,080 リンギット" },
    url: "https://mdec.my/derantau",
    sources: ["https://mdec.my/derantau", "https://www.mdec.my/api/media/file/DE-Rantau_Pass_FAQ_v10.pdf"],
  },
  {
    country: 'id',
    name: "Remote Worker Visa (E33G)",
    length: { zh: "最長 1 年", en: "Up to 1 year", ja: "最長 1 年" },
    needs: { zh: "印尼境外公司的年收入 6 萬美元、約 2,000 美元存款、雇用合約、保險；不可有印尼客戶，待超過 183 天可能成為稅務居民", en: "US$60,000 a year from a company outside Indonesia, about US$2,000 in funds, an employment contract and insurance; no Indonesian clients, and over 183 days can make you tax resident", ja: "インドネシア国外の会社からの年収 6 万ドル、資金約 2 千ドル、雇用契約、保険。国内の顧客は不可、183 日超で税務上の居住者になる場合あり" },
    url: "https://evisa.imigrasi.go.id/",
    sources: ["https://evisa.imigrasi.go.id/", "https://vialtopartners.com/regional-alerts/indonesia-immigration-digital-nomad-visa-introduced"],
  },
  {
    country: 'jp',
    name: "Designated Activities (Digital Nomad)",
    length: { zh: "最長 6 個月，不可延長，再申請須間隔 6 個月", en: "Up to 6 months, not extendable; 6 months before applying again", ja: "最長 6 か月、延長不可、再申請まで 6 か月空ける" },
    needs: { zh: "年收入 1,000 萬日圓以上、保額 1,000 萬日圓以上的醫療保險，為外國雇主或日本境外客戶工作", en: "Income of JPY 10 million a year or more, medical insurance covering JPY 10 million, work for a foreign employer or clients outside Japan", ja: "年収 1,000 万円以上、補償 1,000 万円以上の医療保険、海外の雇用主または国外の顧客向けの仕事" },
    only: { zh: "限免簽且與日本有租稅協定的 49 個國家與地區（含台灣、美國、韓國）", en: "Nationals of the 49 visa-exempt economies with a tax treaty with Japan (including Taiwan, the US and Korea)", ja: "ビザ免除かつ日本と租税条約のある 49 の国・地域（台湾、米国、韓国など）" },
    url: "https://www.moj.go.jp/isa/applications/status/designatedactivities53_00001.html",
    sources: ["https://www.moj.go.jp/isa/applications/status/designatedactivities53_00001.html"],
  },
  {
    country: 'kr',
    name: "Workation Visa (F-1-D)",
    length: { zh: "1 年多次入境，可延長（2026 年起改為常設）", en: "One-year multiple-entry visa, extendable (made permanent in 2026)", ja: "1 年マルチ、延長可（2026 年に恒久化）" },
    needs: { zh: "收入依年齡與地區為韓國人均 GNI（2025 年 5,241 萬韓圓）的 1–2 倍；同產業 1 年以上經歷；保額 1 億韓圓以上的保險", en: "Income of 1 to 2 times Korea's GNI per capita (KRW 52.41 million for 2025), depending on age and region; 1+ year in the same field; insurance covering KRW 100 million", ja: "年齢と地域により韓国の 1 人あたり GNI（2025 年は 5,241 万ウォン）の 1〜2 倍の収入、同業種 1 年以上の経験、補償 1 億ウォン以上の保険" },
    url: "https://www.mofa.go.kr/ph-en/brd/m_3277/view.do?seq=738705",
    sources: ["https://www.mofa.go.kr/ph-en/brd/m_3277/view.do?seq=738705"],
  },
  {
    country: 'tw',
    name: "Employment Gold Card",
    length: { zh: "有效 1–3 年（申請時選），可續；工作許可、居留簽證、居留證合一", en: "Valid 1 to 3 years (chosen when applying), renewable; work permit, resident visa and residence card in one", ja: "有効 1〜3 年（申請時に選択）、更新可。就労許可・居留ビザ・居留証が一体" },
    needs: { zh: "符合 10 個領域之一的資格（例如月薪 16 萬台幣以上）；規費約 3,700–5,700 台幣", en: "Qualify in one of 10 fields (one route is a monthly salary of NT$160,000+); fee about NT$3,700–5,700", ja: "10 分野いずれかの資格（例：月給 16 万台湾ドル以上）。手数料約 3,700〜5,700 台湾ドル" },
    url: "https://goldcard.nat.gov.tw/en/",
    sources: ["https://goldcard.nat.gov.tw/en/"],
  },
  {
    country: 'tw',
    name: "Digital Nomad Visitor Visa",
    length: { zh: "先給 6 個月（2025 年 1 月開辦）", en: "6 months to start (launched January 2025)", ja: "まず 6 か月（2025 年 1 月開始）" },
    needs: { zh: "過去兩年之一的年收入：20–29 歲 2 萬美元、30 歲以上 4 萬美元（或持有他國數位遊牧簽證）；6 個月平均存款 1 萬美元；保險", en: "Income in one of the past 2 years of US$20,000 (age 20–29) or US$40,000 (30+), or another country's nomad visa; US$10,000 average balance over 6 months; insurance", ja: "過去 2 年いずれかの年収が 20〜29 歳は 2 万ドル、30 歳以上は 4 万ドル（または他国のノマドビザ）、6 か月平均残高 1 万ドル、保険" },
    only: { zh: "限可免簽入境台灣的國籍", en: "Nationals of countries visa-exempt for Taiwan", ja: "台湾にビザなしで入国できる国籍のみ" },
    url: "https://www.boca.gov.tw/",
    sources: ["https://www.boca.gov.tw/", "https://www.taipeitimes.com/News/front/archives/2025/01/07/2003829771"],
  },
  {
    country: 'lk',
    name: "Digital Nomad Visa",
    length: { zh: "1 年，可續", en: "1 year, renewable", ja: "1 年、更新可" },
    needs: { zh: "每月匯入斯里蘭卡至少 2,000 美元、外國雇主或境外公司、保險；第一年規費約 500 美元（2026 年 2 月開辦）", en: "Remit at least US$2,000 a month to Sri Lanka, a foreign employer or own foreign company, insurance; about US$500 for the first year (launched February 2026)", ja: "毎月 2 千ドル以上をスリランカへ送金、海外の雇用主または国外の会社、保険。初年度約 500 ドル（2026 年 2 月開始）" },
    url: "https://www.immigration.gov.lk/",
    sources: ["https://www.immigration.gov.lk/", "https://www.fragomen.com/insights/new-visa-options-for-digital-nomads-and-tourists-launched.html"],
  },
  {
    country: 'ae',
    name: "Virtual Work Residence Visa",
    length: { zh: "1 年居留，可續，可為家人申請", en: "One-year residence, renewable, can sponsor family", ja: "1 年の居住、更新可、家族の呼び寄せ可" },
    needs: { zh: "月收入至少 3,500 美元、為阿聯境外公司工作、阿聯醫療保險與體檢；杜拜 GDRFA 規費約 200 迪拉姆起", en: "At least US$3,500 a month, work for a company outside the UAE, UAE health insurance and a medical test; Dubai GDRFA fee from about AED 200", ja: "月収 3,500 ドル以上、UAE 国外の会社での勤務、UAE の医療保険と健康診断。ドバイ GDRFA の手数料は約 200 ディルハム〜" },
    url: "https://www.gdrfad.gov.ae/en/node/13964",
    sources: ["https://www.gdrfad.gov.ae/en/node/13964"],
  },
  {
    country: 'pt',
    name: "D8 Visa for Remote Work (Digital Nomad)",
    length: { zh: "短期版最長 1 年；居留版先 4 個月簽證，再換 2 年居留、可續 3 年", en: "Temporary-stay version up to 1 year; residence version is a 4-month visa, then a 2-year residence permit renewable for 3", ja: "短期版は最長 1 年。居住版は 4 か月のビザの後 2 年の居住許可、3 年更新可" },
    needs: { zh: "近 3 個月平均月收入為最低工資 4 倍（2026 年約 3,680 歐元）、海外雇用或服務合約、保險、良民證", en: "Average income over the last 3 months of 4× the minimum wage (about €3,680 a month in 2026), a contract with a foreign party, insurance, criminal record", ja: "直近 3 か月の平均月収が最低賃金の 4 倍（2026 年は約 3,680 ユーロ）、海外との契約、保険、無犯罪証明" },
    url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/temporary-stay",
    sources: ["https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/temporary-stay", "https://remoteworkeurope.eu/news/2026/portugal-d8-income-threshold-2026"],
  },
  {
    country: 'es',
    name: "International Telework Visa (Digital Nomad)",
    length: { zh: "簽證 1 年；在西班牙境內申請的居留最長 3 年，可續 2 年", en: "Visa for 1 year; a residence permit applied for in Spain runs up to 3 years, renewable for 2", ja: "ビザは 1 年。スペイン国内で申請する居住許可は最長 3 年、2 年更新可" },
    needs: { zh: "年收入為最低工資 2 倍（2026 年約 34,188 歐元）、學位或 3 年經歷、受雇於非西班牙公司 3 個月以上；西班牙客戶不超過 20%", en: "Income of twice the minimum wage (about €34,188 a year in 2026), a degree or 3 years' experience, 3+ months with a non-Spanish employer; Spanish clients at most 20%", ja: "年収が最低賃金の 2 倍（2026 年は約 34,188 ユーロ）、学位または 3 年の経験、スペイン国外の雇用主のもとで 3 か月以上。スペインの顧客は 20% まで" },
    url: "https://www.exteriores.gob.es/Consulados/houston/en/ServiciosConsulares/Paginas/Consular/TELEWORK-Visa-(Digital-Nomad-Visa)-.aspx",
    sources: ["https://www.exteriores.gob.es/Consulados/houston/en/ServiciosConsulares/Paginas/Consular/TELEWORK-Visa-(Digital-Nomad-Visa)-.aspx"],
  },
  {
    country: 'it',
    name: "Digital Nomad / Remote Worker Visa",
    length: { zh: "1 年，可逐年續", en: "1 year, renewable each year", ja: "1 年、毎年更新可" },
    needs: { zh: "年收入約 2.8 萬歐元、須為高技能工作且有 6 個月以上經歷、保險、住處；各領事館要求可能不同", en: "Income of about €28,000 a year, highly qualified work with 6+ months' experience, insurance, accommodation; consulates may differ", ja: "年収約 2 万 8 千ユーロ、高度専門職で 6 か月以上の経験、保険、住居。領事館により異なる場合あり" },
    url: "https://vistoperitalia.esteri.it",
    sources: ["https://vistoperitalia.esteri.it", "https://www.thelocal.it/20260218/how-does-italys-digital-nomad-visa-income-requirement-compare-to-others"],
  },
  {
    country: 'gr',
    name: "Digital Nomad Visa",
    length: { zh: "國家簽證最長 12 個月，或 2 年居留可續 2 年", en: "A national visa of up to 12 months, or a 2-year residence permit renewable for 2", ja: "国のビザで最長 12 か月、または 2 年の居住許可（2 年更新可）" },
    needs: { zh: "每月淨收入 3,500 歐元（配偶加 20%、每名子女加 15%）、只為外國雇主或客戶工作、保險", en: "€3,500 a month net (+20% for a spouse, +15% per child), work only for foreign employers or clients, insurance", ja: "月の手取り 3,500 ユーロ（配偶者 +20%、子 1 人 +15%）、海外の雇用主・顧客のみ、保険" },
    url: "https://migration.gov.gr/en/",
    sources: ["https://migration.gov.gr/en/", "https://www.ey.com/en_gr/technical/tax/tax-alerts/greece-introduces-digital-nomad-visa"],
  },
  {
    country: 'hr',
    name: "Temporary Stay of Digital Nomads",
    length: { zh: "最長 18 個月，到期 6 個月後可再申請", en: "Up to 18 months; a new application 6 months after it ends", ja: "最長 18 か月、終了 6 か月後に再申請可" },
    needs: { zh: "每月 3,622.50 歐元（2026 年），或存款 43,470 歐元（12 個月）／65,205 歐元（18 個月）；外國雇主或自己的外國公司、保險", en: "€3,622.50 a month (2026), or savings of €43,470 for 12 months / €65,205 for 18; a foreign employer or own foreign company, insurance", ja: "月 3,622.50 ユーロ（2026 年）、または預金 43,470 ユーロ（12 か月）／65,205 ユーロ（18 か月）。海外の雇用主または自社、保険" },
    url: "https://mup.gov.hr/aliens-281621/stay-and-work/temporary-stay-of-digital-nomads/286833",
    sources: ["https://mup.gov.hr/aliens-281621/stay-and-work/temporary-stay-of-digital-nomads/286833"],
  },
  {
    country: 'ee',
    name: "Digital Nomad Visa",
    length: { zh: "D 簽最長 365 天（不是居留許可）", en: "D-visa for up to 365 days (not a residence permit)", ja: "D ビザで最長 365 日（居住許可ではない）" },
    needs: { zh: "申請前 6 個月每月稅前 4,500 歐元、外國雇主或客戶、保險；規費 120 歐元", en: "€4,500 a month gross for each of the 6 months before applying, foreign employer or clients, insurance; fee €120", ja: "申請前 6 か月の月収（税引前）4,500 ユーロ、海外の雇用主・顧客、保険。手数料 120 ユーロ" },
    url: "https://www.e-resident.gov.ee/start-a-company/digital-nomad-visa/",
    sources: ["https://www.e-resident.gov.ee/start-a-company/digital-nomad-visa/"],
  },
  {
    country: 'hu',
    name: "White Card",
    length: { zh: "1 年，可續一次 1 年", en: "1 year, renewable once for 1 year", ja: "1 年、1 回 1 年更新可" },
    needs: { zh: "入境前 6 個月每月淨收入 3,000 歐元以上（2025 年 7 月起）、外國雇主或自己的外國公司、住處、保險；家人不能同行申請", en: "At least €3,000 a month net for the 6 months before entry (since July 2025), a foreign employer or own foreign company, accommodation, insurance; no family reunification", ja: "入国前 6 か月の月の手取り 3,000 ユーロ以上（2025 年 7 月から）、海外の雇用主または自社、住居、保険。家族の帯同不可" },
    url: "https://enterhungary.gov.hu",
    sources: ["https://enterhungary.gov.hu", "https://global.ecovis.com/?p=8121"],
  },
  {
    country: 'mt',
    name: "Nomad Residence Permit",
    length: { zh: "1 年，可續", en: "1 year, renewable", ja: "1 年、更新可" },
    needs: { zh: "年收入稅前 4.2 萬歐元、整段期間的租約或房產、保險、外國雇主；申請費約 300 歐元", en: "€42,000 a year gross, a rental or purchase covering the whole stay, insurance, a foreign employer; about €300 to apply", ja: "年収（税引前）4 万 2 千ユーロ、滞在期間全体の賃貸または購入、保険、海外の雇用主。申請料約 300 ユーロ" },
    url: "https://nomad.residencymalta.gov.mt/",
    sources: ["https://nomad.residencymalta.gov.mt/"],
  },
  {
    country: 'cy',
    name: "Digital Nomad Visa",
    length: { zh: "1 年，可再續最多 2 年", en: "1 year, renewable for up to 2 more", ja: "1 年、さらに最長 2 年更新可" },
    needs: { zh: "每月淨收入 3,500 歐元（配偶加 20%、每名子女加 15%）、外國雇主或客戶、保險、住處；有名額限制", en: "€3,500 a month net (+20% for a spouse, +15% per child), foreign employer or clients, insurance, accommodation; places are limited", ja: "月の手取り 3,500 ユーロ（配偶者 +20%、子 1 人 +15%）、海外の雇用主・顧客、保険、住居。枠に上限あり" },
    url: "https://www.moi.gov.cy/moi/crmd/crmd.nsf",
    sources: ["https://www.moi.gov.cy/moi/crmd/crmd.nsf", "https://www.kyprianou.com/?p=18450"],
  },
  {
    country: 'de',
    name: "Residence Permit for Freelancers / Self-Employment",
    length: { zh: "最長 3 年；不是數位遊牧簽證，適合在德國當地接案或開業", en: "Up to 3 years; not a nomad visa, but for freelancing or running a business based in Germany", ja: "最長 3 年。ノマドビザではなく、ドイツを拠点にしたフリーランス・自営向け" },
    needs: { zh: "可行的營運計畫、資金、客戶或意向書、保險；45 歲以上需有退休保障；各地外事局要求不同", en: "A viable business plan, funding, clients or letters of intent, insurance; a pension plan if 45 or older; local offices differ", ja: "実現可能な事業計画、資金、顧客または意向書、保険。45 歳以上は年金の備えが必要。各地の外国人局で異なる" },
    url: "https://www.make-it-in-germany.com/en/working-in-germany/setting-up-business/visa/freelance",
    sources: ["https://www.make-it-in-germany.com/en/working-in-germany/setting-up-business/visa/freelance"],
  },
  {
    country: 'tr',
    name: "Digital Nomad Visa",
    length: { zh: "先申請數位遊牧證明，再辦簽證或短期居留", en: "A digital nomad certificate first, then a visa or short-term residence", ja: "まずデジタルノマド証明を取得し、ビザまたは短期居住を申請" },
    needs: { zh: "月收入 3,000 美元或年收入 3.6 萬美元、大學學歷、21–55 歲、為土耳其以外的雇主或客戶工作", en: "US$3,000 a month or US$36,000 a year, a university degree, age 21–55, work for employers or clients outside Türkiye", ja: "月収 3,000 ドルまたは年収 3 万 6 千ドル、大卒、21〜55 歳、トルコ国外の雇用主・顧客向けの仕事" },
    only: { zh: "限歐盟、歐洲經濟區、英國、瑞士、美國、加拿大、俄羅斯、烏克蘭、白俄羅斯國籍", en: "Citizens of the EU, EEA, UK, Switzerland, US, Canada, Russia, Ukraine and Belarus only", ja: "EU、EEA、英国、スイス、米国、カナダ、ロシア、ウクライナ、ベラルーシの国籍のみ" },
    passports: ["at", "be", "bg", "hr", "cy", "cz", "dk", "ee", "fi", "fr", "de", "gr", "hu", "ie", "it", "lv", "lt", "lu", "mt", "nl", "pl", "pt", "ro", "sk", "si", "es", "se", "is", "li", "no", "ch", "gb", "us", "ca", "ru", "ua", "by"],
    url: "https://goturkiye.com/digitalnomads/application-requirements-for-digital-nomad-visa-and-short-term-residence",
    sources: ["https://goturkiye.com/digitalnomads/application-requirements-for-digital-nomad-visa-and-short-term-residence"],
  },
  {
    country: 'mx',
    name: "Temporary Resident Visa (economic solvency)",
    length: { zh: "在領事館辦簽證，入境後換 1 年居留卡，可續到最多 4 年", en: "A visa from a consulate, then a 1-year resident card after entry, renewable up to 4 years in all", ja: "領事館でビザ取得後、入国して 1 年の在留カード、合計最長 4 年まで更新可" },
    needs: { zh: "依領事館而異，例如聖地牙哥 2026 年：近 6 個月月收入 4,049 美元，或近 12 個月平均存款 68,241 美元", en: "Varies by consulate; San Diego in 2026 asks US$4,049 a month over 6 months, or a US$68,241 average balance over 12 months", ja: "領事館により異なる。例：サンディエゴ（2026 年）は直近 6 か月の月収 4,049 ドル、または直近 12 か月の平均残高 68,241 ドル" },
    url: "https://consulmex.sre.gob.mx/sandiego/images/visas/ingles/5a_Temporary_Resident_Visa_-_Economic_Solvency.pdf",
    sources: ["https://consulmex.sre.gob.mx/sandiego/images/visas/ingles/5a_Temporary_Resident_Visa_-_Economic_Solvency.pdf"],
  },
  {
    country: 'co',
    name: "Visitor (V) Visa for Digital Nomads",
    length: { zh: "最長 2 年；超過 3 個月要登記外僑證", en: "Up to 2 years; stays over 3 months must be registered for a foreigner ID", ja: "最長 2 年。3 か月超は外国人登録が必要" },
    needs: { zh: "月收入為最低工資 3 倍（2026 年約 525 萬披索，約 1,400 美元）、在哥倫比亞有效的保險、只為外國雇主或客戶工作", en: "Income of 3× the minimum wage (about COP 5.25 million, about US$1,400, a month in 2026), insurance valid in Colombia, foreign employers or clients only", ja: "月収が最低賃金の 3 倍（2026 年は約 525 万ペソ、約 1,400 ドル）、コロンビアで有効な保険、海外の雇用主・顧客のみ" },
    url: "https://www.cancilleria.gov.co/tramites_servicios/visa",
    sources: ["https://www.cancilleria.gov.co/tramites_servicios/visa"],
  },
  {
    country: 'br',
    name: "Temporary Visa for Digital Nomads (VITEM XIV)",
    length: { zh: "1 年，可續一次 1 年", en: "1 year, renewable once for 1 year", ja: "1 年、1 回 1 年更新可" },
    needs: { zh: "月收入 1,500 美元或存款 1.8 萬美元、外國雇主或客戶合約、保險、良民證", en: "US$1,500 a month or US$18,000 in funds, a contract with a foreign employer or client, insurance, criminal record", ja: "月収 1,500 ドルまたは資金 1 万 8 千ドル、海外の雇用主・顧客との契約、保険、無犯罪証明" },
    url: "https://www.gov.br/mre/pt-br/consulado-londres/visa-section/types-of-visa/temporary-visa-vitem/digital-nomads-vitem-xiv-2013-rn-45-2021",
    sources: ["https://www.gov.br/mre/pt-br/consulado-londres/visa-section/types-of-visa/temporary-visa-vitem/digital-nomads-vitem-xiv-2013-rn-45-2021"],
  },
  {
    country: 'ar',
    name: "Transitory Residence for Digital Nomads",
    length: { zh: "180 天，可延長一次 180 天", en: "180 days, extendable once by 180", ja: "180 日、1 回 180 日延長可" },
    needs: { zh: "沒有公布收入門檻；遠距工作證明、履歷、良民證；入境後親自申請", en: "No published income threshold; proof of remote work, a CV, a criminal record; apply in person after arriving", ja: "収入基準の公表なし。リモートワークの証明、履歴書、無犯罪証明。入国後に本人が申請" },
    only: { zh: "限不需觀光簽證就能入境阿根廷的國籍", en: "Nationals who need no tourist visa for Argentina", ja: "観光ビザなしでアルゼンチンに入国できる国籍のみ" },
    url: "https://www.argentina.gob.ar/servicio/obtener-una-residencia-transitoria-como-nomada-digital",
    sources: ["https://www.argentina.gob.ar/servicio/obtener-una-residencia-transitoria-como-nomada-digital"],
  },
  {
    country: 'cr',
    name: "Remote Worker Stay (Law 10.008)",
    length: { zh: "1 年，可延長一次 1 年", en: "1 year, extendable once for 1 year", ja: "1 年、1 回 1 年延長可" },
    needs: { zh: "海外月收入 3,000 美元（帶家人 4,000 美元）、整段期間的保險、不在哥斯大黎加當地工作；海外收入免當地所得稅", en: "US$3,000 a month from abroad (US$4,000 with family), insurance for the whole stay, no local work; foreign income isn't taxed there", ja: "海外からの月収 3,000 ドル（家族同伴 4,000 ドル）、滞在全期間の保険、現地就労不可。海外所得は現地で非課税" },
    url: "https://www.migracion.go.cr",
    sources: ["https://www.migracion.go.cr", "https://kpmg.com/cr/es/home/tendencias/2022/07/newsflash-julio-13.html"],
  },
  {
    country: 'pa',
    name: "Short Stay Visa as Remote Worker",
    length: { zh: "9 個月，可延長一次 9 個月", en: "9 months, extendable once for 9", ja: "9 か月、1 回 9 か月延長可" },
    needs: { zh: "海外年收入 3.6 萬美元、外國公司合約或自雇證明、保險；規費約 250 巴波亞", en: "US$36,000 a year in foreign income, a contract with a foreign company or proof of self-employment, insurance; about B/.250", ja: "海外からの年収 3 万 6 千ドル、外国企業との契約または自営の証明、保険。手数料約 250 バルボア" },
    url: "https://www.migracion.gob.pa",
    sources: ["https://www.migracion.gob.pa", "https://chambers.com/articles/visa-de-corta-estancia-como-trabajador-remoto"],
  },
  {
    country: 'uy',
    name: "Provisional Identity Document for Digital Nomads",
    length: { zh: "180 天，可續一次 180 天", en: "180 days, renewable once for 180", ja: "180 日、1 回 180 日更新可" },
    needs: { zh: "沒有收入門檻；入境後以觀光身分申請，附宣誓書；規費約 55.71 UI", en: "No income threshold; apply after entering as a tourist, with a sworn statement; fee 55.71 UI", ja: "収入基準なし。観光で入国後に宣誓書を添えて申請。手数料 55.71 UI" },
    url: "https://www.gub.uy/tramites/hoja-identidad-provisoria",
    sources: ["https://www.gub.uy/tramites/hoja-identidad-provisoria"],
  },
  {
    country: 'ec',
    name: "Temporary Residence Visa for Remote Work",
    length: { zh: "2 年，可續一次", en: "2 years, renewable once", ja: "2 年、1 回更新可" },
    needs: { zh: "海外月收入為基本工資 3 倍（2026 年約 1,446 美元）、在厄瓜多有效的保險、良民證", en: "Foreign income of 3× the basic wage (about US$1,446 a month in 2026), insurance valid in Ecuador, criminal record", ja: "海外からの月収が基本給の 3 倍（2026 年は約 1,446 ドル）、エクアドルで有効な保険、無犯罪証明" },
    url: "https://www.gob.ec/sites/default/files/sign/procedure-14306-2025030306066-18150847-signed.pdf",
    sources: ["https://www.gob.ec/sites/default/files/sign/procedure-14306-2025030306066-18150847-signed.pdf"],
  },
];

export const text = (t: Text) => t[getLocale()];

// The programs for a destination, for someone on the profile's passport. None without a passport (like the visa
// line), and none where that passport already moves freely (an EU passport in the EU), since there is nothing to
// apply for.
export function longStaysFor(country: string): LongStay[] {
  const visa = visaFor(country);
  if (!visa || visa.kind === 'free') return [];
  const passport = getProfile().passport;
  return LONG_STAYS.filter((p) => p.country === country && (!p.passports || p.passports.includes(passport)));
}
