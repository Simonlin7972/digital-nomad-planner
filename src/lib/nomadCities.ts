// The ten cities on the /cities/ page: hand-written, not scraped. Numbers are rough monthly figures in US dollars
// and typical fixed-line speeds, rounded, checked against the pages listed in each entry's `sources` in October
// 2026; they drift, so the page says so. Visa lines are written for a Taiwan passport. The text is written in all
// three languages, not translated by machine, and this file never reads the plan, the profile or the network.
//
// `country` / `city` are stored the way a stay stores its place (ISO code, listed English name), so an entry can
// become a stay as it is, and `seasons.ts` finds its months by the same key.

export type Text = { zh: string; en: string; ja: string };

export type NomadCity = {
  id: string; // 'chiang-mai': the section anchor and the i18n key suffix (cities.tagline.<id>)
  country: string; // ISO code, as Stay.country
  city: string; // listed English name, as Stay.city; keys seasons.ts
  rent: number; // typical one-bedroom monthly rent, USD, rounded
  monthly: number; // typical all-in monthly cost for one person, USD, rounded
  wifi: number; // typical fixed broadband download, Mbps
  timezone: string; // IANA zone
  visa: Text; // one line, Taiwan passport
  pros: Text[]; // three short lines
  cons: Text[]; // two short lines
  article: Text; // 300–500 characters, paragraphs separated by a blank line
  sources: string[]; // where the numbers came from, at least one
};

export const NOMAD_CITIES: NomadCity[] = [
  {
    id: 'chiang-mai',
    country: 'th',
    city: 'Chiang Mai',
    rent: 450,
    monthly: 1300,
    wifi: 280,
    timezone: 'Asia/Bangkok',
    visa: {
      zh: '台灣護照免簽 30 天（2026 年 9 月 15 日起，原為 60 天）；長住可申請 DTV 五年簽，每次入境 180 天，需 50 萬泰銖存款證明。',
      en: 'Taiwan passport: 30 days visa-free (cut from 60 on 15 Sep 2026). For longer, the five-year DTV allows 180 days per entry and needs THB 500,000 in savings.',
      ja: '台湾パスポートはビザなし 30 日（2026 年 9 月 15 日から、以前は 60 日）。長期なら 5 年有効の DTV で 1 回 180 日、預金 50 万バーツの証明が必要。',
    },
    pros: [
      { zh: '物價低，一個人月花費約 1,000–1,500 美元就過得舒服', en: 'Cheap: a comfortable month runs about US$1,000–1,500 all in', ja: '物価が安く、月 1,000〜1,500 ドルで快適に暮らせる' },
      { zh: '遊牧社群成熟，Nimman 一帶咖啡廳與 coworking 密度全亞洲數一數二', en: 'A mature nomad scene: Nimman has one of Asia’s densest clusters of cafés and coworking', ja: 'ノマドのコミュニティが成熟し、ニマン周辺はカフェとコワーキングの密度がアジア屈指' },
      { zh: '節奏慢、安全、機車就能走遍全城，周末有山有寺', en: 'Slow, safe and small enough to cover by scooter, with mountains and temples for the weekend', ja: 'のんびり安全、バイクで市内を回れて、週末は山と寺院へ' },
    ],
    cons: [
      { zh: '2–4 月燒山季空汙嚴重，多數人直接離開', en: 'Burning season from February to April: the smoke is bad enough that most people leave', ja: '2〜4 月の野焼きシーズンは大気汚染がひどく、多くの人が街を離れる' },
      { zh: '免簽縮到 30 天後，待久要辦簽證或頻繁出入境', en: 'With visa-free entry down to 30 days, a long stay means a visa or frequent border runs', ja: 'ビザなし滞在が 30 日に短縮され、長居にはビザか頻繁な出入国が必要' },
    ],
    article: {
      zh: '清邁是數位遊牧這個詞還沒流行之前就有人住下來的地方。城小、便宜、安全，一台機車十五分鐘從舊城騎到 Nimman，路上經過的咖啡廳比便利商店多。多數人落腳在 Nimman 一帶：新一點的 condo 帶泳池和健身房，月租大約一萬二到一萬八泰銖，走路就到 coworking；想省錢往舊城或 Santitham 走，同樣的錢可以租到大一倍的地方。\n\n工作環境是它的強項。Punspace、Yellow 這類 coworking 開了十年以上，固網速度在泰國各城中排前段，咖啡廳插座和冷氣也都給得大方。晚上有夜市和山上的餐廳，周末往素帖山或拜縣跑，生活成本一個月一千多美元就過得很舒服。\n\n要避開的只有一段：二到四月的燒山季。山區農地放火，整個盆地的空氣品質常常超標好幾倍，連本地人都往海邊躲。最好的季節是十一月到隔年一月，涼、乾、天空乾淨，剛好接上水燈節。\n\n簽證是 2026 年起的新變數：台灣護照免簽從六十天縮到三十天，待一個月以上就得辦 DTV 或用其他簽證，計畫時要先算好出入境的時間。',
      en: 'People were settling in Chiang Mai long before anyone called it digital nomading. It is small, cheap and safe; a scooter gets you from the Old City to Nimman in fifteen minutes, passing more cafés than convenience stores. Most people land around Nimman, where a newer condo with a pool and gym rents for roughly THB 12,000–18,000 a month and coworking is a short walk away. Head for the Old City or Santitham and the same money rents something twice the size.\n\nThe work side is where it shines. Coworking spaces such as Punspace and Yellow have been running for over a decade, fixed-line speeds are among the best in Thailand, and cafés are generous with power sockets and air conditioning. Evenings mean night markets and restaurants up the mountain; weekends mean Doi Suthep or Pai. A comfortable month costs a little over a thousand dollars.\n\nThere is one stretch to avoid: burning season, February to April, when fields in the hills are set alight and air quality in the valley runs several times over the limit. Even locals head for the coast. The best months are November to January, cool, dry and clear, with the lantern festival at the start.\n\nThe visa is the new variable from 2026: visa-free entry for a Taiwan passport dropped from sixty days to thirty, so anything longer than a month means a DTV or another visa. Plan the entries and exits before you book.',
      ja: 'チェンマイは「デジタルノマド」という言葉が広まる前から人が住み着いていた街だ。小さく、安く、安全で、バイクなら旧市街からニマンまで 15 分、途中で通り過ぎるカフェはコンビニより多い。多くの人はニマン周辺に落ち着く。プールとジム付きの新しめのコンドが月 1 万 2 千〜1 万 8 千バーツほどで、コワーキングまで歩いて行ける。節約するなら旧市街やサンティタムへ。同じ家賃で倍の広さが借りられる。\n\n強みは仕事環境だ。Punspace や Yellow のようなコワーキングは 10 年以上続き、固定回線の速さはタイの都市でも上位、カフェはコンセントと冷房を惜しまない。夜はナイトマーケットか山の上のレストラン、週末はドイステープやパーイへ。月 1,000 ドル少々で快適に暮らせる。\n\n避けるべき時期はひとつだけ。2〜4 月の野焼きシーズンで、山間の農地に火が入り、盆地の空気は基準値の何倍にもなる。地元の人さえ海へ逃げる。ベストは 11 月から 1 月。涼しく乾いて空が澄み、ロイクラトン（灯籠祭り）にも重なる。\n\nビザは 2026 年からの新しい変数だ。台湾パスポートのビザなし滞在が 60 日から 30 日に短縮され、1 か月以上なら DTV か別のビザが要る。出入国の日程を先に組んでおきたい。',
    },
    sources: [
      'https://wise.com/us/cost-of-living/thailand/chiang-mai',
      'https://www.worldcostofliving.com/city/chiang-mai-thailand',
      'https://www.mappr.co/?p=21873',
      'https://focustaiwan.tw/politics/202609010025',
      'https://budapest.thaiembassy.org/en/publicservice/destination-thailand-visa-dtv',
    ],
  },
  {
    id: 'lisbon',
    country: 'pt',
    city: 'Lisbon',
    rent: 1500,
    monthly: 2600,
    wifi: 250,
    timezone: 'Europe/Lisbon',
    visa: {
      zh: '台灣護照申根免簽，任 180 天內最多 90 天；長住要申請 D8 數位遊牧簽證，2026 年門檻為每月約 3,680 歐元的海外收入。',
      en: 'Taiwan passport: Schengen visa-free, 90 days in any 180. Staying longer takes the D8 digital nomad visa, which in 2026 asks for about EUR 3,680 a month in foreign income.',
      ja: '台湾パスポートはシェンゲン圏ビザなし、任意の 180 日のうち最大 90 日。長期滞在は D8 デジタルノマドビザが必要で、2026 年の基準は海外からの月収約 3,680 ユーロ。',
    },
    pros: [
      { zh: '西歐最便宜的首都之一，陽光多、氣候溫和，全年都能待', en: 'One of Western Europe’s cheaper capitals, sunny and mild enough to stay year-round', ja: '西欧の首都では安いほうで、日照が多く気候も穏やか、一年中滞在できる' },
      { zh: '時區適合同時對歐洲與美東客戶，英語普及', en: 'A time zone that works for both European and US East Coast clients, and English is everywhere', ja: 'ヨーロッパと米国東海岸の両方に対応しやすい時差で、英語も通じる' },
      { zh: 'coworking 與遊牧社群是歐洲最大的之一，活動多', en: 'One of Europe’s biggest coworking and nomad communities, with something on most nights', ja: 'コワーキングとノマドのコミュニティはヨーロッパ最大級で、イベントも多い' },
    ],
    cons: [
      { zh: '房租十年漲了一倍多，市中心一房動輒 1,300 歐元以上，好房子幾天就沒', en: 'Rents have more than doubled in a decade: a central one-bedroom is EUR 1,300 and up, and good flats go in days', ja: '家賃は 10 年で倍以上になり、中心部のワンベッドは 1,300 ユーロ以上、良い物件は数日で埋まる' },
      { zh: '申根 90 天時鐘跟整個歐洲共用，想久留只能辦 D8', en: 'The Schengen 90-day clock is shared with the rest of Europe; staying longer means the D8', ja: 'シェンゲンの 90 日はヨーロッパ全体で共有。長くいるなら D8 しかない' },
    ],
    article: {
      zh: '里斯本是歐洲數位遊牧的首都，這個稱號它已經拿了快十年。原因很直接：西歐首都裡它還算便宜，一年三百天有太陽，冬天不冷，時區剛好能同時接歐洲的早上和美東的下午，而且幾乎所有人都講英語。\n\n住的地方分幾種人：想走路上班、晚上有酒吧的住 Príncipe Real、Santos 或 Cais do Sodré；想要安靜一點又不想太遠的往 Campo de Ourique、Alvalade 走；預算緊的去 Benfica、Olivais，地鐵二十分鐘進城。市中心一房現在要一千三到一千五百歐元，含家具再貴兩成，好房子在 Idealista 上貼出來幾天就沒了，用 Airbnb 長住是最貴的做法。\n\n工作方面，Second Home、Outsite 這類 coworking 一家接一家，固網速度在歐洲排中上，咖啡廳也習慣有人開著筆電坐一下午。週末可以搭火車去 Cascais 或 Sintra，或南下 Comporta 的海灘。\n\n要注意的是簽證和房租。台灣護照申根免簽九十天，但這九十天跟整個歐洲共用，從里斯本飛巴塞隆納也在算。想待超過三個月只能辦 D8，門檻是每月約三千六百八十歐元的海外收入，而且還要先有住處證明。房租則是本地人最大的痛，遊牧客推高了價格，這點在社區裡會感覺得到。',
      en: 'Lisbon has been Europe’s nomad capital for close to a decade, and the reasons are plain: it is still one of the cheaper capitals in Western Europe, the sun is out some three hundred days a year, winters are mild, the time zone catches both a European morning and an American afternoon, and nearly everyone speaks English.\n\nWhere you live depends on what you want. Príncipe Real, Santos and Cais do Sodré for walking to work and bars at night; Campo de Ourique or Alvalade for something quieter but still close; Benfica or Olivais if the budget is tight, twenty minutes into town by metro. A central one-bedroom now runs EUR 1,300–1,500, furnished places about a fifth more, and good flats on Idealista are gone within days. A long Airbnb stay is the most expensive way to do it.\n\nFor work, coworking spaces such as Second Home and Outsite keep opening, fixed-line speeds are upper-mid for Europe, and cafés are used to laptops staying all afternoon. Weekends mean the train to Cascais or Sintra, or the beaches south at Comporta.\n\nWatch two things: the visa and the rent. A Taiwan passport gets ninety visa-free days in Schengen, but that clock is shared with the whole of Europe, so a flight to Barcelona counts too. Anything over three months means the D8, with its bar of roughly EUR 3,680 a month in foreign income and proof of a place to live. Rent is the sorest point for locals, and nomads have pushed it up; you will feel that in the neighbourhoods.',
      ja: 'リスボンはこの 10 年近く「ヨーロッパのノマドの首都」と呼ばれてきた。理由は単純だ。西欧の首都の中ではまだ安く、年に 300 日ほど晴れ、冬は温暖、時差はヨーロッパの午前とアメリカ東海岸の午後の両方に重なり、ほぼ誰もが英語を話す。\n\n住む場所は好みで分かれる。歩いて仕事に行き、夜はバーに出たいなら Príncipe Real、Santos、Cais do Sodré。静かで中心にも近い場所なら Campo de Ourique や Alvalade。予算が厳しければ Benfica や Olivais、地下鉄で 20 分の距離だ。中心部のワンベッドは今や 1,300〜1,500 ユーロ、家具付きはさらに 2 割高く、Idealista の良い物件は数日で消える。Airbnb の長期滞在が一番高くつく。\n\n仕事面では Second Home や Outsite のようなコワーキングが次々に開き、固定回線はヨーロッパで中の上、カフェもノート PC で午後いっぱい座る客に慣れている。週末は列車で Cascais や Sintra、あるいは南の Comporta の海へ。\n\n気をつけるのはビザと家賃だ。台湾パスポートはシェンゲン圏でビザなし 90 日だが、この 90 日はヨーロッパ全体で共有され、リスボンからバルセロナへ飛んでも数えられる。3 か月を超えるなら D8 で、基準は海外からの月収約 3,680 ユーロと住居の証明。家賃は地元の人にとって最大の痛みで、ノマドが押し上げた面もある。その空気は街で感じるだろう。',
    },
    sources: [
      'https://www.euronews.com/business/2026/09/22/renting-a-one-bedroom-flat-in-portugal-costs-200-more-than-the-minimum-wage',
      'https://www.globalcitizensolutions.com/cost-of-living-in-lisbon',
      'https://www.ispreview.co.uk/?p=47241',
      'https://remoteworkeurope.eu/news/2026/portugal-d8-income-threshold-2026',
      'https://eeas.europa.eu/taiwan/travel-study_en',
    ],
  },
  {
    id: 'bangkok',
    country: 'th',
    city: 'Bangkok',
    rent: 650,
    monthly: 1500,
    wifi: 280,
    timezone: 'Asia/Bangkok',
    visa: {
      zh: '台灣護照免簽 30 天（2026 年 9 月 15 日起，原為 60 天）；長住可申請 DTV 五年簽，每次入境 180 天，需 50 萬泰銖存款證明。',
      en: 'Taiwan passport: 30 days visa-free (cut from 60 on 15 Sep 2026). For longer, the five-year DTV allows 180 days per entry and needs THB 500,000 in savings.',
      ja: '台湾パスポートはビザなし 30 日（2026 年 9 月 15 日から、以前は 60 日）。長期なら 5 年有効の DTV で 1 回 180 日、預金 50 万バーツの証明が必要。',
    },
    pros: [
      { zh: '什麼都有：醫院、健身房、百貨、深夜的食物，全在捷運沿線', en: 'Everything: hospitals, gyms, malls and food at 2 a.m., all along the metro', ja: '病院もジムもモールも深夜の食事も、すべて鉄道沿線にそろう' },
      { zh: '航點多，往東南亞任何地方都是兩三小時的廉航', en: 'Flights everywhere: the rest of Southeast Asia is a two- or three-hour budget hop', ja: '便が多く、東南アジアのどこへも LCC で 2〜3 時間' },
      { zh: '新 condo 帶泳池健身房，月租一萬五到三萬泰銖就有', en: 'New condos with a pool and gym from THB 15,000–30,000 a month', ja: 'プールとジム付きの新築コンドが月 1 万 5 千〜3 万バーツ' },
    ],
    cons: [
      { zh: '熱、塞、吵；三到五月的高溫連本地人都受不了', en: 'Hot, jammed and loud; March to May is too much even for locals', ja: '暑く、渋滞し、うるさい。3〜5 月の暑さは地元の人でも参る' },
      { zh: '免簽縮到 30 天後，待久要辦簽證或頻繁出入境', en: 'With visa-free entry down to 30 days, a long stay means a visa or frequent border runs', ja: 'ビザなし滞在が 30 日に短縮され、長居にはビザか頻繁な出入国が必要' },
    ],
    article: {
      zh: '曼谷是東南亞的樞紐，也是住起來最像大城市的一個：捷運、醫院、健身房、百貨、半夜兩點還有熱的東西吃。對已經習慣台北的人來說，它是最不需要適應的異地。\n\n多數遊牧客住在 Sukhumvit 沿線，Phrom Phong 到 On Nut 這段尤其多：新 condo 帶泳池、健身房、保全，月租一萬五到三萬泰銖，走幾分鐘有捷運和咖啡廳。想省錢往 Ari 或 Ratchada 走，老房子多但更有生活感。一個人一個月一千五百美元能過得很體面。\n\n工作上，固網速度在泰國各城都很快，coworking 從連鎖到獨立的都有；最大的好處其實是機場：往清邁、峴港、吉隆坡、峇里島都是兩三小時的廉航，把曼谷當基地、每個月換一個地方住，是很多人的做法。\n\n缺點就是城市本身：熱、塞車、噪音，三到五月的高溫連本地人都往外跑；雨季的午後暴雨會讓整條街變成河。十一月到二月最舒服。\n\n簽證跟清邁一樣，2026 年 9 月起台灣護照免簽只剩 30 天，待久要辦 DTV，或規劃好每個月出境一次。',
      en: 'Bangkok is the hub of Southeast Asia and the one place on this list that lives like a proper big city: metro, hospitals, gyms, malls and something hot to eat at two in the morning. For anyone used to Taipei it takes the least adjusting of anywhere abroad.\n\nMost nomads live along Sukhumvit, especially between Phrom Phong and On Nut: new condos with a pool, gym and security for THB 15,000–30,000 a month, a few minutes from the train and a café. Ari and Ratchada are cheaper and older but feel more lived-in. One person lives well on about US$1,500 a month.\n\nFor work, fixed lines are fast anywhere in the city and coworking runs from chains to one-room independents. The real asset is the airport: Chiang Mai, Da Nang, Kuala Lumpur and Bali are all two- or three-hour budget flights, and plenty of people use Bangkok as a base and move somewhere else each month.\n\nThe downsides are the city itself: heat, traffic and noise. March to May is hot enough that locals leave, and a rainy-season downpour turns streets into rivers for an hour. November to February is the comfortable stretch.\n\nThe visa is the same as Chiang Mai: from September 2026 a Taiwan passport gets only thirty days visa-free, so a long stay means a DTV or a planned exit every month.',
      ja: 'バンコクは東南アジアのハブで、このリストの中で最も「ちゃんとした大都市」として暮らせる街だ。鉄道、病院、ジム、モール、そして深夜 2 時でも温かい食事がある。台北に慣れた人なら、海外で最も順応に手間がかからない場所だろう。\n\nノマドの多くはスクンビット沿い、特にプロンポンからオンヌットの間に住む。プール・ジム・警備付きの新築コンドが月 1 万 5 千〜3 万バーツで、駅とカフェまで数分。アーリーやラチャダーは古いが安く、生活感がある。ひとり月 1,500 ドルほどで十分に暮らせる。\n\n仕事面では固定回線が市内どこでも速く、コワーキングはチェーンから独立系まで揃う。本当の強みは空港だ。チェンマイ、ダナン、クアラルンプール、バリはどこも LCC で 2〜3 時間。バンコクを拠点に毎月別の街へ移る人も多い。\n\n弱点は街そのもの。暑さ、渋滞、騒音。3〜5 月は地元の人でも逃げ出す暑さで、雨季の夕立は 1 時間で通りを川に変える。快適なのは 11 月から 2 月。\n\nビザはチェンマイと同じ。2026 年 9 月から台湾パスポートのビザなし滞在は 30 日だけになり、長くいるなら DTV か、毎月一度の出国を計画に組み込む必要がある。',
    },
    sources: [
      'https://wise.com/us/cost-of-living/thailand/bangkok',
      'https://nomada.tools/tools/cost-of-living/bangkok',
      'https://www.mappr.co/?p=21873',
      'https://focustaiwan.tw/politics/202609010025',
      'https://budapest.thaiembassy.org/en/publicservice/destination-thailand-visa-dtv',
    ],
  },
  {
    id: 'canggu',
    country: 'id',
    city: 'Canggu',
    rent: 800,
    monthly: 1700,
    wifi: 50,
    timezone: 'Asia/Makassar',
    visa: {
      zh: '台灣護照落地簽 30 天（約 50 萬印尼盾），可延長一次共 60 天；長住有一年的 E33G 遠距工作簽，需證明海外年收入約 6 萬美元。',
      en: 'Taiwan passport: visa on arrival for 30 days (about IDR 500,000), extendable once to 60. For longer, the one-year E33G remote-worker permit needs about US$60,000 a year in foreign income.',
      ja: '台湾パスポートは到着ビザ 30 日（約 50 万ルピア）、1 回延長して計 60 日。長期なら 1 年の E33G リモートワーカー許可で、海外からの年収約 6 万ドルの証明が必要。',
    },
    pros: [
      { zh: '全世界最密的遊牧社群，coworking、活動、認識人都最容易', en: 'The densest nomad community anywhere: coworking, events and meeting people are effortless', ja: '世界一密なノマドのコミュニティ。コワーキングもイベントも人との出会いも簡単' },
      { zh: '早上衝浪、下午工作、傍晚看海落日，生活節奏很好', en: 'Surf in the morning, work in the afternoon, sunset on the beach: the rhythm is the point', ja: '朝はサーフィン、午後は仕事、夕方は海に沈む夕日。この生活リズムが本体' },
      { zh: '一房的 villa 帶小泳池，五百到一千兩百美元就有', en: 'A one-bedroom villa with a small pool from US$500–1,200 a month', ja: '小さなプール付きのワンベッドルームヴィラが月 500〜1,200 ドル' },
    ],
    cons: [
      { zh: '網路是這份名單裡最差的，租房前先測速；路小車多，塞得很', en: 'The worst internet on this list, so test the line before signing; the roads are small and jammed', ja: 'このリストで最も遅いネット。契約前に回線を測ること。道は狭く渋滞がひどい' },
      { zh: '租金近年漲很快，熱門區的 villa 要簽長約、付大額押金', en: 'Rents have climbed fast; villas in the popular pockets want long leases and big deposits', ja: '家賃の上昇が速く、人気エリアのヴィラは長期契約と高額な保証金を求める' },
    ],
    article: {
      zh: '倉古是峇里島西南海岸的一段，十年前是稻田和衝浪客的小村，現在是地球上數位遊牧密度最高的地方。咖啡廳一家接一家，Dojo、Outpost、Tribal 這些 coworking 每個月都有新面孔，想認識人只要在那裡坐一個禮拜。\n\n住的選擇是 villa：一房帶小泳池的，依離海遠近五百到一千兩百美元；Berawa 靠海最貴，往內陸的 Pererenan、Tumbak Bayuh 便宜一截也安靜。租金近年漲得快，好的 villa 要簽半年以上、押兩個月。一個人全部算進去一千五到兩千美元。\n\n工作最要注意的是網路。印尼的固網中位數只有幾十 Mbps，倉古不少 villa 靠無線或 4G 分享，租之前一定要實測，或挑有光纖的 coworking 當主要工作地。下雨季（十二月到二月）潮濕、停電也比較常見。\n\n生活的好處不用多說：早上衝浪、下午工作、傍晚看落日，週末往烏布或龍目島跑。缺點是路：小路擠滿機車和貨車，從倉古到機場 20 公里可以塞一個半小時。\n\n簽證是落地簽 30 天、可延一次到 60 天；想住更久有一年的遠距工作簽，門檻不低。觀光簽證遠距工作是灰色地帶，2026 年查得比以前嚴。',
      en: 'Canggu is a stretch of Bali’s south-west coast that was rice fields and a surf village ten years ago and is now the densest concentration of digital nomads on the planet. Cafés run back to back, and coworking spaces such as Dojo, Outpost and Tribal turn over new faces every month; sit in one for a week and you will know people.\n\nHousing means a villa: one bedroom with a small pool for US$500–1,200 depending on how close to the sea. Berawa by the beach is the dearest; inland Pererenan and Tumbak Bayuh are cheaper and quieter. Rents have risen quickly, and a good villa wants a six-month lease and two months’ deposit. All in, one person spends US$1,500–2,000.\n\nThe thing to check is the internet. Indonesia’s fixed-line median is a few dozen megabits, and many Canggu villas run on wireless or shared 4G, so test the line before you sign, or make a fibre-connected coworking space your main desk. The wet season, December to February, is humid, and power cuts are more common.\n\nThe life needs no selling: surf in the morning, work in the afternoon, sunset on the beach, Ubud or Lombok at the weekend. The downside is the roads, narrow lanes packed with scooters and trucks; the twenty kilometres to the airport can take ninety minutes.\n\nThe visa is thirty days on arrival, extendable once to sixty. Longer means the one-year remote-worker permit, with a high income bar. Remote work on a tourist visa is a grey zone, and in 2026 immigration has been checking more than it used to.',
      ja: 'チャングーはバリ島南西海岸の一帯で、10 年前は田んぼとサーファーの村だったが、今は地球上で最もデジタルノマドの密度が高い場所だ。カフェは隙間なく並び、Dojo、Outpost、Tribal といったコワーキングには毎月新しい顔が入れ替わる。1 週間座っていれば知り合いができる。\n\n住まいはヴィラ。小さなプール付きのワンベッドルームが、海からの距離に応じて 500〜1,200 ドル。海沿いのブラワが最も高く、内陸のプレレナンやトゥンバック・バユは安くて静かだ。家賃の上昇は速く、良いヴィラは半年以上の契約と 2 か月分の保証金を求める。ひとり全部込みで 1,500〜2,000 ドル。\n\n確認すべきはネットだ。インドネシアの固定回線の中央値は数十 Mbps で、チャングーのヴィラは無線や 4G のシェアに頼るところも多い。契約前に必ず実測するか、光回線のあるコワーキングを主な仕事場にしたい。雨季（12〜2 月）は湿気が強く、停電も増える。\n\n暮らしの良さは説明不要だろう。朝はサーフィン、午後は仕事、夕方はビーチで夕日、週末はウブドやロンボク島へ。弱点は道。狭い路地にバイクとトラックがひしめき、空港まで 20 km が 1 時間半かかることもある。\n\nビザは到着ビザ 30 日、1 回延長して 60 日。それ以上は 1 年のリモートワーカー許可だが、収入の基準は高い。観光ビザでのリモートワークはグレーゾーンで、2026 年は以前より取り締まりが厳しい。',
    },
    sources: [
      'https://nomada.tools/tools/cost-of-living/bali-canggu',
      'https://getwherenext.com/blog/digital-nomad-guide-bali-indonesia',
      'https://domain.id/en/blog/ranked-118th-in-the-world-an-honest-look-at-indonesias-internet-in-2026',
      'https://www.peninsulavisa.com/visa-requirements/taiwan-to-indonesia',
      'https://www.letsmoveindonesia.com/remote-work-visa-kitas-e33g/',
    ],
  },
  {
    id: 'da-nang',
    country: 'vn',
    city: 'Da Nang',
    rent: 400,
    monthly: 1000,
    wifi: 290,
    timezone: 'Asia/Ho_Chi_Minh',
    visa: {
      zh: '台灣護照需先上網辦電子簽證（e-visa），單次或多次入境，最長 90 天，約 25–50 美元。',
      en: 'Taiwan passport: apply online for an e-visa before travelling, single or multiple entry, up to 90 days, about US$25–50.',
      ja: '台湾パスポートは出発前にオンラインで電子ビザ（e-visa）を申請。シングルまたはマルチ入国、最長 90 日、約 25〜50 ドル。',
    },
    pros: [
      { zh: '海灘就在市區旁，房租是名單裡最便宜的之一', en: 'A city beach, and some of the cheapest rent on this list', ja: '市街のすぐ隣にビーチがあり、家賃はこのリストで最安クラス' },
      { zh: '越南固網是全世界最快的幾個，咖啡廳網路也穩', en: 'Vietnam’s fixed lines are among the fastest in the world, and café wifi holds up', ja: 'ベトナムの固定回線は世界最速クラス、カフェの Wi-Fi も安定' },
      { zh: '台北直飛三小時，會安、順化都在一小時車程', en: 'Three hours direct from Taipei, with Hoi An and Hue an hour away', ja: '台北から直行 3 時間、ホイアンもフエも車で 1 時間' },
    ],
    cons: [
      { zh: '九到十二月是雨季和颱風季，海邊住處要有心理準備', en: 'September to December is rainy and typhoon season; a beachside flat will feel it', ja: '9〜12 月は雨季と台風シーズン。海辺の住まいは覚悟が要る' },
      { zh: '用英文租房會被收兩倍，找本地仲介或朋友幫忙', en: 'Renting in English costs about double; use a local agent or a friend', ja: '英語で部屋を借りると倍の家賃。地元の仲介か友人に頼むこと' },
    ],
    article: {
      zh: '峴港是越南中部的海港城市，這幾年從清邁和峇里島分走了不少人。理由很具體：美溪海灘就在市區旁邊，房租是名單裡最便宜的一級，網路卻是全世界最快的一級，而且從台北直飛三小時。\n\n多數人住在海灘這一側的 An Thuong 或 Son Tra 一帶：一房帶家具的公寓直接跟房東簽，兩百五到五百美元；用英文網站或 Airbnb 長租，同一間會貴五成到一倍。一個人一個月八百到一千兩百美元就很舒服，吃得好的話再多兩百。\n\n網路是越南的強項，固網中位數在全球排前十，咖啡廳也都穩；coworking 不像清邁那麼密，但夠用。週末往會安（半小時）、順化（一個半小時）或巴拿山跑，再遠一點搭火車上下越南。\n\n要避開的季節很明確：九到十二月是雨季和颱風季，海邊的房子會漏、會停電，整個城市灰灰的；二到八月是好日子，五到八月最熱但天天可以下水。\n\n簽證是台灣護照要先上網辦 e-visa，單次或多次入境最長 90 天，幾天就核發，出發前辦好即可。',
      en: 'Da Nang is the port city of central Vietnam, and in the last few years it has drawn a fair share of people away from Chiang Mai and Bali. The reasons are concrete: My Khe beach sits beside the city, rent is among the cheapest on this list while the internet is among the fastest in the world, and Taipei is a three-hour direct flight.\n\nMost people live on the beach side, around An Thuong or towards Son Tra: a furnished one-bedroom leased straight from the landlord runs US$250–500. The same flat through an English-language site or a long Airbnb costs half as much again or double. One person is comfortable on US$800–1,200 a month, a couple of hundred more if you eat well.\n\nThe internet is Vietnam’s strength, with a fixed-line median in the global top ten and reliable café wifi. Coworking is thinner than Chiang Mai but enough. Weekends mean Hoi An (half an hour), Hue (an hour and a half) or Ba Na Hills, and the railway runs the length of the country.\n\nThe season to avoid is clear: September to December is rain and typhoons, when beachside flats leak and lose power and the whole city turns grey. February to August is good; May to August is hottest but you can swim every day.\n\nA Taiwan passport needs an e-visa applied for online before travel, single or multiple entry for up to ninety days, issued within a few days.',
      ja: 'ダナンはベトナム中部の港町で、ここ数年チェンマイやバリから少なからぬ人を引き寄せている。理由は具体的だ。ミーケビーチが市街のすぐ隣にあり、家賃はこのリストで最も安い部類なのにネットは世界最速の部類、しかも台北から直行 3 時間。\n\n多くの人はビーチ側のアントゥオンやソンチャー方面に住む。家具付きのワンベッドルームを大家と直接契約すれば 250〜500 ドル。英語のサイトや Airbnb の長期契約だと同じ部屋が 5 割増しから倍になる。ひとり月 800〜1,200 ドルで快適、よく食べるならもう 200 ドル。\n\nネットはベトナムの強みで、固定回線の中央値は世界トップ 10、カフェの Wi-Fi も安定している。コワーキングはチェンマイほど密ではないが足りる。週末はホイアン（30 分）、フエ（1 時間半）、バーナーヒルズへ。鉄道は国土を縦断している。\n\n避けるべき季節ははっきりしている。9〜12 月は雨と台風で、海辺の部屋は雨漏りや停電があり、街全体が灰色になる。2〜8 月は良い時期で、5〜8 月が最も暑いが毎日泳げる。\n\n台湾パスポートは出発前にオンラインで e-visa を申請する。シングルまたはマルチ入国で最長 90 日、数日で発給される。',
    },
    sources: [
      'https://www.worldcostofliving.com/city/da-nang-vietnam',
      'https://www.nomadotravel.app/en/guides/da-nang-digital-nomad-guide',
      'https://vietnamnews.vn/economy/1798899/viet-nam-enters-global-top-10-for-mobile-and-fixed-broadband-speeds.html',
      'https://tanvanlang.com/en/vietnam-visa-for-taiwanese-citizens/',
    ],
  },
  {
    id: 'kuala-lumpur',
    country: 'my',
    city: 'Kuala Lumpur',
    rent: 650,
    monthly: 1300,
    wifi: 150,
    timezone: 'Asia/Kuala_Lumpur',
    visa: {
      zh: '台灣護照免簽 30 天；長住可申請 DE Rantau 數位遊牧簽，12 個月可再延 12 個月，需年收入 2.4 萬美元以上。',
      en: 'Taiwan passport: 30 days visa-free. For longer, the DE Rantau nomad pass gives 12 months, renewable once, and needs at least US$24,000 a year in income.',
      ja: '台湾パスポートはビザなし 30 日。長期なら DE Rantau ノマドパスで 12 か月（1 回延長可）、年収 2 万 4 千ドル以上が必要。',
    },
    pros: [
      { zh: '英語全城通行，看病、辦事、租房都不用翻譯', en: 'English works everywhere: doctors, paperwork and leases need no translator', ja: '英語が街中で通じ、病院も手続きも賃貸も通訳いらず' },
      { zh: '高樓公寓附泳池健身房，六百到九百美元就租得到', en: 'High-rise condos with a pool and gym for US$600–900', ja: 'プールとジム付きの高層コンドが 600〜900 ドル' },
      { zh: '華語、馬來、印度菜都有，吃得比名單上任何城市都雜', en: 'Chinese, Malay and Indian food side by side: the most varied eating on this list', ja: '中華、マレー、インド料理が隣り合い、このリストで最も多彩な食' },
    ],
    cons: [
      { zh: '全年濕熱，幾乎每天下午一場雨，戶外生活少', en: 'Hot and humid all year, with rain most afternoons; not much outdoor life', ja: '一年中蒸し暑く、ほぼ毎日午後に雨。屋外で過ごす時間は少ない' },
      { zh: '沒有車就被困在公寓和商場之間，大眾運輸還在補', en: 'Without a car you are stuck between the condo and the mall; transit still has gaps', ja: '車がないとコンドとモールの往復に閉じ込められる。公共交通はまだ穴が多い' },
    ],
    article: {
      zh: '吉隆坡是這份名單裡最被低估的城市。它不浪漫，但非常好住：英語全城通行、醫療水準高、華語也通，高樓公寓附泳池健身房六百到九百美元就租得到，一個人一個月一千二到一千五百美元過得相當好。\n\n住的地方分幾個圈：Bangsar、Mont Kiara 是外派與遊牧客最多的區，咖啡廳和 coworking 都在走路範圍；KLCC 周邊最貴也最方便；想省錢往 Cheras、Petaling Jaya 走，捷運一樣到得了。房東通常要兩個月押金加半個月水電押金。\n\n工作上，固網速度中上、價格便宜，coworking 連鎖多；時區跟台灣一樣，對台灣或亞洲客戶最省事。吃是最大的加分：華人、馬來、印度三套菜系並排，深夜的 mamak 檔是生活的一部分。\n\n缺點是天氣和交通：全年濕熱、幾乎每天下午一場大雨，戶外活動少；沒有車的話，生活會被侷限在公寓、商場和 Grab 之間。週末有檳城、蘭卡威、新加坡可以跑。\n\n簽證對台灣護照很友善：免簽 30 天；想長住有 DE Rantau 遊牧簽，一年可延一年，年收入門檻 2.4 萬美元。',
      en: 'Kuala Lumpur is the most underrated city on this list. It is not romantic, but it is very easy to live in: English works everywhere, healthcare is good, Mandarin gets you far, a high-rise condo with a pool and gym rents for US$600–900, and one person lives well on US$1,200–1,500 a month.\n\nThe neighbourhoods come in rings. Bangsar and Mont Kiara have the most expats and nomads, with cafés and coworking in walking distance; around KLCC is the dearest and most convenient; Cheras and Petaling Jaya are cheaper and still on the train. Landlords usually want two months’ deposit plus half a month for utilities.\n\nFor work, fixed lines are upper-mid and cheap, coworking chains are everywhere, and the time zone is Taiwan’s, which makes Taiwanese and Asian clients painless. Food is the big bonus: Chinese, Malay and Indian kitchens side by side, and the late-night mamak stall is part of life.\n\nThe downsides are weather and transport: hot and humid all year, with a downpour most afternoons, so there is little outdoor life. Without a car, days narrow to the condo, the mall and Grab. Penang, Langkawi and Singapore are weekend trips.\n\nThe visa is friendly to a Taiwan passport: thirty days visa-free, and for longer the DE Rantau nomad pass, a year renewable once, with an income bar of US$24,000.',
      ja: 'クアラルンプールはこのリストで最も過小評価されている街だ。ロマンはないが、とても住みやすい。英語が街中で通じ、医療水準は高く、中国語もかなり通じる。プールとジム付きの高層コンドが 600〜900 ドルで借りられ、ひとり月 1,200〜1,500 ドルでかなり良い暮らしができる。\n\n住む場所はいくつかの輪に分かれる。バンサーとモントキアラは駐在員とノマドが最も多く、カフェとコワーキングが徒歩圏。KLCC 周辺は最も高くて便利。節約ならチェラスやペタリンジャヤ、鉄道で行ける。大家は通常 2 か月分の保証金と半月分の光熱費保証金を求める。\n\n仕事面では固定回線は中の上で安く、コワーキングのチェーンが多い。時差は台湾と同じで、台湾やアジアの顧客相手には最も楽だ。食は最大の加点。中華、マレー、インドの三つの料理が並び、深夜のママック屋台は生活の一部。\n\n弱点は天気と交通。一年中蒸し暑く、ほぼ毎日午後に豪雨で、屋外の活動は少ない。車がなければ生活はコンドとモールと Grab の間に閉じる。週末はペナン、ランカウイ、シンガポールへ。\n\nビザは台湾パスポートに優しい。ビザなし 30 日、長期なら DE Rantau ノマドパスで 1 年、1 回延長可、年収の基準は 2 万 4 千ドル。',
    },
    sources: [
      'https://nomada.tools/tools/cost-of-living/kuala-lumpur',
      'https://getwherenext.com/blog/complete-guide-to-moving-to-malaysia',
      'https://fastestfibre.co.za/insights/fastest-fibre-countries-world-2026/',
      'https://www.peninsulavisa.com/visa-requirements/taiwan-to-malaysia',
      'https://nomadtaxguide.com/blog/malaysia-de-rantau-pass',
    ],
  },
  {
    id: 'taipei',
    country: 'tw',
    city: 'Taipei',
    rent: 800,
    monthly: 1700,
    wifi: 280,
    timezone: 'Asia/Taipei',
    visa: {
      zh: '台灣護照：這裡是家，沒有簽證問題；一年待滿 183 天就是稅務居民。外國人有 6 個月的數位遊牧簽證，需年收入 4 萬美元以上。',
      en: 'Taiwan passport: this is home, no visa needed; 183 days in a year makes you a tax resident. Foreigners can take the six-month digital nomad visitor visa, which needs US$40,000 a year in income.',
      ja: '台湾パスポートならここが家でビザは不要。年 183 日いれば税務上の居住者。外国人には 6 か月のデジタルノマド訪問ビザがあり、年収 4 万ドル以上が必要。',
    },
    pros: [
      { zh: '安全、便利、健保，深夜一個人走路回家不用想', en: 'Safe, convenient, with national health insurance; walking home alone at night is not a thought', ja: '安全で便利、健康保険もある。深夜にひとりで歩いて帰るのも気にならない' },
      { zh: '咖啡廳文化深，插座、網路、坐一下午都正常', en: 'A deep café culture: sockets, wifi and sitting all afternoon are normal', ja: 'カフェ文化が深く、コンセントも Wi-Fi も午後いっぱい座るのも普通' },
      { zh: '捷運半小時到山、到海、到溫泉', en: 'Mountains, sea and hot springs half an hour away by metro', ja: '地下鉄で 30 分、山も海も温泉も' },
    ],
    cons: [
      { zh: '租金這幾年漲得快，市中心一房八百到一千美元', en: 'Rents have risen fast: a central one-bedroom is US$800–1,000', ja: '家賃の上昇が速く、中心部のワンベッドは 800〜1,000 ドル' },
      { zh: '六到九月濕熱加颱風，冬天陰雨連綿', en: 'June to September is humid heat and typhoons; winter is weeks of grey drizzle', ja: '6〜9 月は蒸し暑さと台風、冬は何週間も灰色の霧雨' },
    ],
    article: {
      zh: '把台北放進這份名單，是因為對多數用這個工具的人來說，它就是基地：出去幾個月、回來幾個月，中間要有一個安全、便利、什麼都有的地方。而以國際標準看，台北本身也是個很好的遊牧城市，近年外國遊牧客明顯變多。\n\n住的話，大安、中山、松山是外來者最常落腳的區，一房八百到一千美元，套房五百到六百五；捷運沿線往文山、北投走便宜不少。房東通常收兩個月押金。一個人一個月一千五到兩千美元過得很好，自己煮、不租 coworking 可以更低。\n\n工作環境是強項：固網速度全球前段，咖啡廳給插座和網路給得理所當然，coworking 在市中心每站都有。捷運半小時到山、到海、到溫泉，週末不用計畫就有地方去。\n\n天氣是最大的扣分：六到九月濕熱加颱風，冬天連著幾週陰雨；最舒服的是十到十二月和三到四月。\n\n台灣護照在這裡沒有簽證問題，要注意的反而是稅：一年待滿 183 天就是稅務居民，出去久的人要算。外國人則有 2025 年起的數位遊牧簽證，6 個月，年收入門檻 4 萬美元。',
      en: 'Taipei is on this list because, for most people using this planner, it is the base: a few months away, a few months back, and in between a place that is safe, convenient and has everything. By international standards it also stands up as a nomad city in its own right, and the number of foreign nomads has grown noticeably.\n\nDa’an, Zhongshan and Songshan are where newcomers usually land: a one-bedroom for US$800–1,000, a studio for US$500–650; out along the metro to Wenshan or Beitou is a good deal cheaper. Landlords usually take two months’ deposit. One person lives well on US$1,500–2,000 a month, less if you cook and skip the coworking desk.\n\nThe work side is strong: fixed lines are among the fastest in the world, cafés treat sockets and wifi as a given, and coworking sits at every central metro stop. The metro also puts mountains, sea and hot springs half an hour away, so weekends need no planning.\n\nThe weather is the big minus: June to September is humid heat and typhoons, and winter brings weeks of grey drizzle. October to December and March to April are the good months.\n\nA Taiwan passport has no visa question here; the thing to watch is tax, since 183 days in a year makes you resident, which matters if you are away a lot. Foreigners have had a six-month digital nomad visitor visa since 2025, with an income bar of US$40,000.',
      ja: '台北をこのリストに入れたのは、このプランナーを使う多くの人にとってここが拠点だからだ。数か月出て、数か月戻る。その間に、安全で便利で何でもある場所が要る。国際的な基準で見ても台北はノマド都市として十分通用し、ここ数年は外国人ノマドが目に見えて増えた。\n\n住まいは大安、中山、松山に新しく来た人が落ち着くことが多い。ワンベッドが 800〜1,000 ドル、スタジオが 500〜650 ドル。地下鉄沿いに文山や北投まで出ればかなり安い。大家は通常 2 か月分の保証金を取る。ひとり月 1,500〜2,000 ドルで良い暮らし、自炊してコワーキングを借りなければもっと下がる。\n\n仕事環境は強い。固定回線は世界トップクラス、カフェはコンセントと Wi-Fi を当然のように出し、コワーキングは中心部の駅ごとにある。地下鉄で 30 分も行けば山も海も温泉もあり、週末は計画なしでも行き先に困らない。\n\n最大の減点は天気。6〜9 月は蒸し暑さと台風、冬は何週間も灰色の霧雨が続く。快適なのは 10〜12 月と 3〜4 月。\n\n台湾パスポートならビザの問題はない。気をつけるのはむしろ税で、年 183 日いれば税務上の居住者になる。長く外に出る人は数えておきたい。外国人には 2025 年からの 6 か月のデジタルノマド訪問ビザがあり、年収の基準は 4 万ドル。',
    },
    sources: [
      'https://affordwhere.com/blog/cost-of-living-taipei-2026',
      'https://www.worldcostofliving.com/city/taipei-taiwan',
      'https://www.mappr.co/?p=21873',
      'https://www.boca.gov.tw/cp-158-7718-c0382-2.html',
    ],
  },
  {
    id: 'tokyo',
    country: 'jp',
    city: 'Tokyo',
    rent: 1200,
    monthly: 2500,
    wifi: 230,
    timezone: 'Asia/Tokyo',
    visa: {
      zh: '台灣護照免簽 90 天；另有 6 個月的數位遊牧簽證，需年收入 1,000 萬日圓以上與私人醫療保險，期滿不能延長。',
      en: 'Taiwan passport: 90 days visa-free. There is also a six-month digital nomad visa, which needs JPY 10 million a year in income and private health insurance, and cannot be extended.',
      ja: '台湾パスポートはビザなし 90 日。6 か月のデジタルノマドビザもあり、年収 1,000 万円以上と民間医療保険が必要で、延長はできない。',
    },
    pros: [
      { zh: '安全、乾淨、準時，城市的每個細節都運作得理所當然', en: 'Safe, clean and punctual; every detail of the city just works', ja: '安全で清潔で時間に正確。街のあらゆる細部が当たり前に動く' },
      { zh: '每一區都是一座小城，一年也走不完', en: 'Every ward is a small city of its own; a year is not enough', ja: 'どの区もひとつの小都市で、1 年では回りきれない' },
      { zh: '台灣免簽 90 天，直飛三小時，日圓弱的時候比想像便宜', en: 'Ninety days visa-free, three hours direct, and cheaper than you think when the yen is weak', ja: 'ビザなし 90 日、直行 3 時間、円安のときは思ったより安い' },
    ],
    cons: [
      { zh: '短租很貴：附家具的月租公寓要十八到二十四萬日圓', en: 'Short lets are expensive: a furnished monthly flat runs JPY 180,000–240,000', ja: '短期賃貸は高く、家具付きのマンスリーマンションは 18〜24 万円' },
      { zh: '長租要保證人、禮金、押金，外國人租房門檻高', en: 'A long lease wants a guarantor, key money and a deposit; renting as a foreigner is hard', ja: '長期契約には保証人、礼金、敷金が要り、外国人の賃貸はハードルが高い' },
    ],
    article: {
      zh: '東京是這份名單裡最貴的城市，也是最多人說「住過一次就懂」的城市。安全、乾淨、準時，每個細節都運作得理所當然；每一區都是一座小城，中目黑、下北澤、藏前、清澄白河，一年也走不完。\n\n貴主要貴在住：長租要保證人、禮金、押金，外國人門檻高；多數遊牧客用附家具的月租公寓（monthly mansion），市中心一間小套房十八到二十四萬日圓，共居的 share house 便宜一半但空間小。一個人一個月兩千到兩千五百美元起跳，日圓弱的時候會輕鬆不少。\n\n工作方面，固網快而穩，coworking 從 WeWork 到小型獨立的都有，月費三到五萬日圓；咖啡廳工作文化不如台北那麼寬容，很多店不歡迎開筆電，找「電源可用」的店或去圖書館。\n\n季節上，三到五月和十到十一月最好；六月梅雨、七八月濕熱、九月颱風。冬天乾冷但晴天多，其實很適合工作。\n\n台灣護照免簽 90 天，大多數人就這樣住一季；想待半年有 2024 年起的數位遊牧簽證，年收入門檻 1,000 萬日圓、要私人醫療保險，期滿不能延長，離開半年才能再申請。',
      en: 'Tokyo is the dearest city on this list and the one most people describe as "you get it once you have lived here". Safe, clean and punctual, with every detail of the city simply working; each ward is a small city of its own, Nakameguro, Shimokitazawa, Kuramae, Kiyosumi-Shirakawa, and a year is not enough to walk them all.\n\nThe cost is mostly housing. A long lease wants a guarantor, key money and a deposit, and the bar for foreigners is high, so most nomads take a furnished monthly flat: a small central studio runs JPY 180,000–240,000, and a share house is half that with half the space. Budget from US$2,000–2,500 a month for one person, noticeably less when the yen is weak.\n\nFor work, fixed lines are fast and steady and coworking runs from WeWork to small independents at JPY 30,000–50,000 a month. Café working is less tolerated than in Taipei, and many places would rather you did not open a laptop, so look for shops that advertise power sockets, or use a library.\n\nMarch to May and October to November are the good months; June is the rainy season, July and August are humid, September brings typhoons. Winter is dry, cold and often sunny, which suits working.\n\nA Taiwan passport gets ninety days visa-free, and most people simply stay a season. For six months there is the digital nomad visa from 2024, with an income bar of JPY 10 million and private health insurance; it cannot be extended, and you must leave for six months before applying again.',
      ja: '東京はこのリストで最も高い街であり、「一度住めばわかる」と最も多くの人が言う街でもある。安全で清潔で時間に正確、街のあらゆる細部が当たり前に動く。どの区もひとつの小都市で、中目黒、下北沢、蔵前、清澄白河と、1 年では回りきれない。\n\n高いのは主に住まいだ。長期契約には保証人、礼金、敷金が要り、外国人のハードルは高い。そのため多くのノマドは家具付きのマンスリーマンションを使う。都心の小さなワンルームで 18〜24 万円、シェアハウスなら半額だが広さも半分。ひとり月 2,000〜2,500 ドルからで、円安のときはかなり楽になる。\n\n仕事面では固定回線が速く安定し、コワーキングは WeWork から小さな独立系まで月 3〜5 万円。カフェでの作業は台北ほど寛容ではなく、ノート PC を歓迎しない店も多い。「電源あり」をうたう店を探すか、図書館を使う。\n\n季節は 3〜5 月と 10〜11 月が良い。6 月は梅雨、7〜8 月は蒸し暑く、9 月は台風。冬は乾いて寒いが晴れの日が多く、仕事には向いている。\n\n台湾パスポートはビザなし 90 日で、多くの人はそのまま 1 シーズン暮らす。半年なら 2024 年からのデジタルノマドビザがあり、年収 1,000 万円と民間医療保険が条件。延長はできず、再申請には半年の出国が必要。',
    },
    sources: [
      'https://nomada.tools/tools/cost-of-living/tokyo',
      'https://jasumo.com/?p=44299',
      'https://www.ispreview.co.uk/?p=47241',
      'https://japan-visa.com/guides/visa-free',
      'https://tokyointernationalmeetup.com/japan-digital-nomad-visa-2026-guide/',
    ],
  },
  {
    id: 'tbilisi',
    country: 'ge',
    city: 'Tbilisi',
    rent: 550,
    monthly: 1300,
    wifi: 160,
    timezone: 'Asia/Tbilisi',
    visa: {
      zh: '台灣護照不在免簽或電子簽名單上，需向喬治亞使領館申請；持有效的美、英、歐盟、日、韓等簽證或居留證者可免簽 90 天（180 天內）。另外外交部目前對喬治亞列橙色警示。',
      en: 'A Taiwan passport is not on the visa-free or e-visa lists, so a visa comes from a Georgian mission; with a valid US, UK, EU, Japanese or Korean visa or residence permit you can enter visa-free for 90 days in 180. Taiwan’s foreign ministry currently has Georgia on an orange travel alert.',
      ja: '台湾パスポートはビザ免除にも電子ビザにも該当せず、ジョージアの在外公館でビザを取る。米・英・EU・日・韓などの有効なビザか滞在許可があれば 180 日のうち 90 日までビザなし。台湾外交部は現在ジョージアにオレンジの渡航警戒を出している。',
    },
    pros: [
      { zh: '名單裡最便宜的歐洲：市中心一房四到七百美元', en: 'The cheapest Europe on this list: a central one-bedroom for US$400–700', ja: 'このリストで最も安いヨーロッパ。中心部のワンベッドが 400〜700 ドル' },
      { zh: '酒、山、溫泉、八千年的葡萄酒文化，週末永遠有地方去', en: 'Wine, mountains, sulphur baths and eight thousand years of winemaking; weekends never run out', ja: 'ワイン、山、硫黄温泉、8 千年のワイン文化。週末の行き先が尽きない' },
      { zh: '網路快、物價低，遠距工作者的稅制也友善', en: 'Fast internet, low prices and a tax regime kind to remote workers', ja: 'ネットは速く物価は安く、リモートワーカーに優しい税制' },
    ],
    cons: [
      { zh: '台灣護照拿簽證不容易，沒有第三國簽證的話門檻很高', en: 'A visa is hard to get on a Taiwan passport unless you hold a third-country visa', ja: '台湾パスポートでのビザ取得は難しく、第三国のビザがないとハードルが高い' },
      { zh: '政治局勢不穩，外交部列橙色警示；冬天冷、空氣差', en: 'Politics are unsettled and Taiwan has it on orange alert; winters are cold with bad air', ja: '政情が不安定で台湾外交部はオレンジ警戒。冬は寒く空気も悪い' },
    ],
    article: {
      zh: '提比里斯是這份名單裡最便宜的歐洲城市，也是最需要先確認簽證的一個。先講好處：市中心 Vera、Vake 的翻新一房四到七百美元，一個人一個月一千到一千五百美元過得很好；網路快、物價低、咖啡廳和 coworking 這幾年長得很快；酒、山、硫磺溫泉和八千年的葡萄酒文化，週末往卡赫季或卡茲別吉跑永遠有地方去。\n\n城市本身有趣：老城區的木陽台和蘇聯公寓並排，舊城到 Vake 走路就到，Fabrika 一帶是遊牧客聚集的地方。語言方面英語在年輕人之間通，俄語更通。\n\n但對台灣護照來說有兩個硬門檻。第一是簽證：台灣不在喬治亞的免簽名單上，也不能用 e-visa，一般要向使領館申請，核發看個案；持有效的美國、英國、歐盟、日本、韓國等簽證或居留證的人，可以免簽入境 90 天（180 天內）。第二是安全：喬治亞近年政治局勢不穩，台灣外交部目前列為橙色警示（第三級，避免非必要旅行），出發前要再確認。\n\n季節上，五到六月和九到十月最好；七八月熱、冬天冷且空氣差。這是一座「條件齊了就非常划算」的城市，條件沒齊的話，先去別的地方。',
      en: 'Tbilisi is the cheapest European city on this list, and the one whose visa you must check first. The good part: a renovated one-bedroom in central Vera or Vake runs US$400–700, one person lives well on US$1,000–1,500 a month, the internet is fast, prices are low, cafés and coworking have multiplied in the last few years, and wine, mountains, sulphur baths and eight thousand years of winemaking mean Kakheti or Kazbegi are always there for the weekend.\n\nThe city itself is a pleasure: wooden balconies and Soviet blocks side by side, the old town within walking distance of Vake, and the Fabrika area where the nomads gather. English works among the young; Russian works more widely.\n\nFor a Taiwan passport there are two hard conditions. First, the visa: Taiwan is not on Georgia’s visa-free list and cannot use the e-visa, so a visa comes from a Georgian mission and is granted case by case. Holders of a valid US, UK, EU, Japanese or Korean visa or residence permit can enter visa-free for ninety days in any 180. Second, safety: Georgia’s politics have been unsettled for a few years, and Taiwan’s foreign ministry currently has it on an orange alert (level three, avoid non-essential travel), so check again before you go.\n\nMay to June and September to October are the best months; July and August are hot, winter is cold with poor air. It is a city that is a very good deal once the conditions line up. Until they do, go somewhere else first.',
      ja: 'トビリシはこのリストで最も安いヨーロッパの街であり、最初にビザを確認すべき街でもある。まず良い面から。中心部のヴェラやヴァケの改装済みワンベッドが 400〜700 ドル、ひとり月 1,000〜1,500 ドルで良い暮らしができる。ネットは速く物価は安く、カフェとコワーキングはここ数年で急増した。ワイン、山、硫黄温泉、8 千年のワイン文化。週末はカヘティやカズベギへ、行き先が尽きない。\n\n街そのものも面白い。木製バルコニーの家とソ連時代の団地が並び、旧市街からヴァケまで歩いて行け、ファブリカ周辺にノマドが集まる。英語は若い人には通じ、ロシア語のほうがもっと通じる。\n\nただし台湾パスポートには二つの硬い条件がある。一つはビザ。台湾はジョージアのビザ免除リストになく、電子ビザも使えないため、在外公館で申請して個別審査になる。米国、英国、EU、日本、韓国などの有効なビザか滞在許可を持っていれば、180 日のうち 90 日までビザなしで入国できる。もう一つは安全。ジョージアの政情はここ数年不安定で、台湾外交部は現在オレンジ警戒（第 3 級、不要不急の渡航を避ける）を出している。出発前に再確認を。\n\n季節は 5〜6 月と 9〜10 月が最良。7〜8 月は暑く、冬は寒くて空気が悪い。条件がそろえば非常に割の良い街だが、そろわないうちは別の場所を先に。',
    },
    sources: [
      'https://wise.com/us/cost-of-living/georgia/tbilisi',
      'https://www.worldcostofliving.com/city/tbilisi-georgia',
      'https://fastestfibre.co.za/insights/fastest-fibre-countries-world-2026/',
      'https://caravanistan.com/visa/georgia/',
      'https://www.boca.gov.tw/sp-trwa-list-1.html',
    ],
  },
  {
    id: 'mexico-city',
    country: 'mx',
    city: 'Mexico City',
    rent: 1000,
    monthly: 1900,
    wifi: 120,
    timezone: 'America/Mexico_City',
    visa: {
      zh: '台灣護照原則上要先申請墨西哥簽證；持有效的美、加、日、英或申根「實體」簽證（ESTA 不算）或居留證者可免簽，觀光最長 180 天，天數由入境官決定。',
      en: 'A Taiwan passport normally needs a Mexican visa in advance; with a valid physical US, Canadian, Japanese, UK or Schengen visa (ESTA does not count) or residence card you enter visa-free as a tourist for up to 180 days, the exact number set at the border.',
      ja: '台湾パスポートは原則として事前にメキシコのビザが必要。米・加・日・英・シェンゲンの有効な「物理的な」ビザ（ESTA は不可）か滞在許可があればビザなしで観光最長 180 日、日数は入国審査官が決める。',
    },
    pros: [
      { zh: '美洲最大的文化首都：博物館、市場、音樂、吃的，永遠逛不完', en: 'The biggest cultural capital in the Americas: museums, markets, music and food without end', ja: '南北アメリカ最大の文化首都。美術館、市場、音楽、食が尽きない' },
      { zh: '海拔 2,200 公尺，全年春天般的氣候', en: 'At 2,200 metres the weather is spring all year', ja: '標高 2,200 m で一年中春のような気候' },
      { zh: '時區對美國客戶剛好，Roma、Condesa 的咖啡廳與 coworking 密度高', en: 'The time zone suits US clients, and Roma and Condesa are thick with cafés and coworking', ja: '米国の顧客に合う時差で、ローマやコンデサはカフェとコワーキングが密集' },
    ],
    cons: [
      { zh: '台灣護照沒有美簽或其他第三國簽證的話，要先辦墨西哥簽證', en: 'Without a US or other third-country visa, a Taiwan passport needs a Mexican visa first', ja: '米国などの第三国ビザがなければ、台湾パスポートは先にメキシコのビザが要る' },
      { zh: 'Roma、Condesa 房租五年翻倍，本地人對遊牧客有怨言；治安要看區', en: 'Rents in Roma and Condesa have doubled in five years and locals resent it; safety depends on the block', ja: 'ローマとコンデサの家賃は 5 年で倍になり、地元の反発もある。治安は地区次第' },
    ],
    article: {
      zh: '墨西哥城是美洲遊牧客的首都，也是這份名單裡唯一的美洲城市。海拔兩千兩百公尺，全年春天般的氣候；博物館、市場、音樂、街頭食物，是那種住一年也逛不完的地方，而且時區對美國客戶剛好。\n\n遊牧客幾乎都住 Roma Norte 和 Condesa：樹蔭街道、咖啡廳和 coworking 走路就到，一房八百五到一千兩百美元，比五年前翻了一倍，本地人對此有怨言，在社區裡會感覺得到。想便宜又有生活感，往 Juárez、Coyoacán 或 Narvarte 走，七到一千美元。長租比 Airbnb 便宜得多。一個人一個月一千六到兩千兩百美元。\n\n網路是中等：墨西哥固網中位數一百多 Mbps，Roma、Condesa 的公寓多半有光纖，但要問清楚。治安以區為單位差很多，晚上搭 Uber、不要走偏的街，這是本地人也遵守的規則。\n\n季節上，十一月到四月乾季最好；五到九月是雨季，每天下午一場大雨但不長；三到五月最熱也有空汙。\n\n簽證是台灣護照最大的關卡：原則上要先申請墨西哥簽證；持有效的美國、加拿大、日本、英國或申根實體簽證（ESTA 不算）或居留證者可免簽入境，觀光最長 180 天，實際天數由入境官寫在表上。有美簽的人很好用，沒有的話要先辦。',
      en: 'Mexico City is the nomad capital of the Americas and the only city from that side of the world on this list. At 2,200 metres the weather is spring all year; museums, markets, music and street food make it the kind of place a year does not exhaust, and the time zone suits US clients.\n\nNomads almost all live in Roma Norte and Condesa: tree-lined streets, cafés and coworking on foot, and a one-bedroom for US$850–1,200, double what it was five years ago. Locals resent that, and you feel it in the neighbourhood. For cheaper and more lived-in, try Juárez, Coyoacán or Narvarte at US$700–1,000. A long lease is far cheaper than Airbnb. One person spends US$1,600–2,200 a month.\n\nThe internet is middling: Mexico’s fixed-line median is a little over a hundred megabits, and most Roma and Condesa flats have fibre, but ask. Safety varies sharply by block: take an Uber at night and stay off empty streets, which is the rule locals keep too.\n\nThe dry season, November to April, is the best time; May to September is rainy, with a hard but short downpour most afternoons; March to May is the hottest and the smoggiest.\n\nThe visa is the main hurdle for a Taiwan passport: in principle you need a Mexican visa in advance. With a valid physical US, Canadian, Japanese, UK or Schengen visa (ESTA does not count) or a residence card you enter visa-free as a tourist for up to 180 days, with the actual number written on your form at the border. A US visa makes it easy; without one, apply first.',
      ja: 'メキシコシティは南北アメリカのノマドの首都で、このリストで唯一のアメリカ大陸の街だ。標高 2,200 m で一年中春のような気候。美術館、市場、音楽、屋台の食べ物と、1 年いても尽きない場所で、時差は米国の顧客に合う。\n\nノマドのほとんどはローマ・ノルテとコンデサに住む。並木道、カフェ、コワーキングが徒歩圏で、ワンベッドが 850〜1,200 ドル。5 年前の倍で、地元の人には不満があり、街でそれを感じる。安くて生活感のある場所ならフアレス、コヨアカン、ナルバルテで 700〜1,000 ドル。長期契約は Airbnb よりずっと安い。ひとり月 1,600〜2,200 ドル。\n\nネットは中くらい。メキシコの固定回線の中央値は 100 Mbps 強で、ローマやコンデサの部屋はたいてい光回線だが、確認は必要。治安は地区によって大きく違う。夜は Uber、人気のない通りは歩かない。これは地元の人も守るルールだ。\n\n季節は 11〜4 月の乾季が最良。5〜9 月は雨季で、毎日午後に短く強い雨。3〜5 月は最も暑く、スモッグも出る。\n\nビザは台湾パスポートにとって最大の関門。原則として事前にメキシコのビザが要る。米国、カナダ、日本、英国、シェンゲンの有効な物理的ビザ（ESTA は不可）か滞在許可があればビザなしで観光最長 180 日、実際の日数は入国時に書類に記される。米国ビザがあれば楽、なければ先に申請を。',
    },
    sources: [
      'https://1minutenomad.substack.com/p/cost-of-living-in-mexico-city-for',
      'https://nomada.tools/tools/cost-of-living/mexico-city',
      'https://www.ispreview.co.uk/?p=47241',
      'https://www.boca.gov.tw/sp-foof-countrycp-03-98-dc6ec-02-1.html',
    ],
  },
];

export const nomadCityById = (id: string): NomadCity | undefined => NOMAD_CITIES.find((c) => c.id === id);
