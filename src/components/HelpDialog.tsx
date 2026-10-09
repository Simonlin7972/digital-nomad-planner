import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { Calendar } from '@phosphor-icons/react/dist/csr/Calendar';
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown';
import { Database } from '@phosphor-icons/react/dist/csr/Database';
import { FloppyDisk } from '@phosphor-icons/react/dist/csr/FloppyDisk';
import { DeviceMobile } from '@phosphor-icons/react/dist/csr/DeviceMobile';
import { HandGrabbing } from '@phosphor-icons/react/dist/csr/HandGrabbing';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { useNarrow } from '../hooks/useNarrow';
import { useScrollLock } from '../hooks/useScrollLock';
import { t, useLocale, type Locale } from '../lib/i18n';
import './Dialog.css';
import './HelpDialog.css';

// only: shown on a computer or on a phone alone; the rest show on both.
type Section = { icon: ReactNode; title: string; items: ReactNode[]; only?: 'desktop' | 'phone' };
type Keys = { alt: string; undo: string; redo: string };

const icons = {
  plan: <HandGrabbing size={18} weight="bold" />,
  views: <Calendar size={18} weight="bold" />,
  data: <Database size={18} weight="bold" />,
  backup: <FloppyDisk size={18} weight="bold" />,
  undo: <ArrowCounterClockwise size={18} weight="bold" />,
  phone: <DeviceMobile size={18} weight="bold" />,
};

// The guide is prose with inline emphasis, so each language is written out whole rather than assembled from
// dictionary strings. Keep the three in step: same sections, same points.
const GUIDE: Record<Locale, (k: Keys) => Section[]> = {
  zh: ({ alt, undo, redo }) => [
    {
      icon: icons.phone,
      only: 'phone',
      title: '在手機上',
      items: [
        <>
          手機上是<b>唯讀</b>版面：最上方是現在在哪、下一站，底下每段行程一張卡片。要排行程或修改，請用電腦打開。
        </>,
        <>
          <b>把行程搬到手機</b>：在電腦的 <b>⋯</b> 選單選「傳到其他裝置」，用手機相機掃 QR code 或打開連結就會匯入。也可以傳 JSON 檔，再用 ⋯ 選單的<b>匯入</b>。
        </>,
        <>
          卡片上可以點按鈕<b>複製航班號或訂位代號</b>、把起飛時間<b>加入行事曆</b>，點地點旁的圖釘用 Google 地圖打開。
        </>,
        <>
          用瀏覽器的「<b>加入主畫面</b>」，之後沒有網路也打得開（地圖除外）。
        </>,
      ],
    },
    {
      icon: icons.plan,
      only: 'desktop',
      title: '排行程',
      items: [
        <>
          在時間軸的<b>空白處拖曳</b>，選好時段後填國家與城市，就多一段行程。
        </>,
        <>
          <b>拖整塊</b>可以換順序：拖過隔壁的一半，兩段就對調。
        </>,
        <>
          <b>拉兩端</b>可以延長或縮短；變長時會把隔壁推開。
        </>,
        <>
          按住 <kbd>{alt}</kbd> 再拖，會<b>複製</b>一段出來。
        </>,
        <>
          按住 <kbd>B</kbd> 再點行程，會從切線那裡<b>切成兩段</b>（年、月檢視都可以）。
        </>,
        <>
          <b>點一下</b>行程可以編輯：日期、顏色、跟誰去、機票、備註，或刪除。
        </>,
        <>
          下方行程列表會列出還沒排的<b>空檔</b>，按右邊的 <b>+</b> 直接排一段。
        </>,
        <>
          熱門城市在編輯視窗有<b>適合的季節</b>按鈕，點開看各月推薦／普通／避開；排到該避開的月份，色塊和列表會出現警示。
        </>,
        <>
          摘要會算<b>申根 90/180 天</b>與<b>台灣 183 天</b>；申根超過上限的行程，列表上會出現警示圖示。只算排進時間軸的日子，實際規定以官方為準。
        </>,
      ],
    },
    {
      icon: icons.views,
      only: 'desktop',
      title: '年與月',
      items: [
        <>
          <b>年</b>檢視看整年大方向，以半週為單位（放大到 300% 以上改成以天為單位）；<b>月</b>檢視是月曆，可以精準到每一天。
        </>,
        <>點時間軸上的月份，直接跳到那個月。</>,
        <>
          月檢視時打開右邊的<b>看全部</b>，1–12 月會由上往下排，可以一路往下捲。
        </>,
        <>
          分頁左邊可以切換<b>年份</b>（2025／2026／2027／2028），每年各存一份行程。按住月份列拖過 12 月再繼續拉，放開就到下一年（往 1 月拉則回上一年）。
        </>,
        <>
          年檢視可以放大：用上方滑桿、觸控板兩指開合，或按住 <kbd>{alt}</kbd> 滾動滾輪。放大後按住月份列可以左右拖。
        </>,
      ],
    },
    {
      icon: icons.data,
      title: '資料存在哪裡',
      items: [
        <>
          行程<b>只存在這個瀏覽器裡</b>，不會上傳，也不需要帳號。每次變動都自動儲存。
        </>,
        <>
          所以換瀏覽器、換電腦、用無痕視窗，或清除瀏覽器資料，都會<b>看不到原本的行程</b>。
        </>,
        <>
          只有兩種資訊會送出去：你填的<b>地名</b>（用來在地圖上找位置），以及載入地圖與字體時的一般連線。另外網站用 Google Analytics 統計匿名的瀏覽人次與操作次數（例如新增、匯出、分享），不含任何行程內容。在手機卡片上點地圖圖釘時，會用 Google 地圖查那個地名。
        </>,
      ],
    },
    {
      icon: icons.backup,
      title: '備份與搬移',
      items: [
        <>
          <b>匯出</b>、<b>匯入</b>、<b>分享</b> 都在工具列的 <b>⋯</b> 選單裡。<b>匯出</b>：把所有年份的行程存成一個 JSON 檔。建議排到一個段落就匯出一次當備份。
        </>,
        <>行程改過之後超過一週沒有匯出，頁首會出現備份提醒；按「稍後提醒」三天內不再出現。提醒的間隔可以在<b>設定</b>頁（工具列最右邊的人像圖示）調整。</>,
        <>遇到問題或有建議，用 <b>⋯</b> 選單的<b>問題回報</b>寫給開發者，可以附截圖；只會送出你填的內容和瀏覽器資訊，不含行程。</>,
        <>
          <b>匯入</b>：讀回匯出的檔案。檔案裡有的年份會<b>取代</b>該年的行程，取代前會先問你；其他年份不動。
        </>,
        <>
          <b>傳到其他裝置</b>：產生一個帶著所有年份行程的連結與 QR code，在另一台電腦或手機打開就會匯入（要取代那邊的行程前一樣會先問）。行程放在連結裡，不經過伺服器；可以選擇不含訂位代號與票價。
        </>,
        <>
          在電腦上也可以直接把匯出的 JSON 檔<b>拖進頁面</b>匯入。
        </>,
        <>
          <b>分享</b>：先預覽行程圖再下載成 PNG，有橫式（整年時間軸、國家、假日、行程清單）與直式（9:16，適合限動）兩種；手機上可直接用系統分享。圖裡不含機票細節。
        </>,
        <>匯出檔含機票的訂位代號等內容，傳給別人前請留意。</>,
      ],
    },
    {
      icon: icons.undo,
      only: 'desktop',
      title: '做錯了',
      items: [
        <>
          <kbd>{undo}</kbd> 復原、<kbd>{redo}</kbd> 重做，最多 100 步。
        </>,
        <>
          復原紀錄在重新整理頁面後就沒有了。<b>匯入</b>或大幅調整前先匯出一份，之後才救得回來。
        </>,
      ],
    },
  ],
  en: ({ alt, undo, redo }) => [
    {
      icon: icons.phone,
      only: 'phone',
      title: 'On a phone',
      items: [
        <>
          On a phone the plan is <b>view-only</b>: where you are and where you go next at the top, then one card per stay. Use a computer to plan or make changes.
        </>,
        <>
          <b>To get your plan onto the phone</b>, choose "Send to another device" in the <b>⋯</b> menu on your computer, then scan the QR code with the phone's camera or open the link. You can also send yourself the JSON file and use <b>Import</b> in the ⋯ menu.
        </>,
        <>
          On a card you can <b>copy the flight number or booking reference</b>, <b>add the departure to your calendar</b>, and open a place in Google Maps with the pin beside it.
        </>,
        <>
          Use your browser's <b>Add to Home Screen</b> and the planner opens even without a connection (the map aside).
        </>,
      ],
    },
    {
      icon: icons.plan,
      only: 'desktop',
      title: 'Planning',
      items: [
        <>
          <b>Drag across empty space</b> on the timeline, then fill in the country and city to add a stay.
        </>,
        <>
          <b>Drag a stay</b> to reorder: once it is halfway past its neighbor, the two swap places.
        </>,
        <>
          <b>Drag an edge</b> to lengthen or shorten a stay; growing pushes its neighbors along.
        </>,
        <>
          Hold <kbd>{alt}</kbd> while dragging to <b>duplicate</b> a stay.
        </>,
        <>
          Hold <kbd>B</kbd> and click a stay to <b>cut it in two</b> at the line (in both the year and month views).
        </>,
        <>
          <b>Click</b> a stay to edit its dates, color, companions, flight and note, or to delete it.
        </>,
        <>
          The itinerary below lists the <b>free stretches</b> between stays; press the <b>+</b> beside one to plan a stay there.
        </>,
        <>
          For popular cities the editor has a <b>When to go</b> button that opens each month's rating (best / fine / avoid); a stay in a month to avoid gets a warning on its block
          and in the itinerary.
        </>,
        <>
          The summary counts <b>Schengen days (90 in 180)</b> and <b>days in Taiwan (183)</b>; stays that break the Schengen limit get a
          warning in the itinerary. Only planned days are counted, and official rules always take precedence.
        </>,
      ],
    },
    {
      icon: icons.views,
      only: 'desktop',
      title: 'Year and month',
      items: [
        <>
          The <b>Year</b> view shows the whole year in half-week steps (by the day once zoomed to 300% or more); the <b>Month</b> view is a calendar, precise to the day.
        </>,
        <>Click a month on the timeline to jump straight to it.</>,
        <>
          In the month view, switch on <b>All months</b> to stack January to December and scroll down through them.
        </>,
        <>
          The drop-down beside the tabs switches the <b>year</b> (2025 / 2026 / 2027 / 2028); each year keeps its own plan. Drag the month row past
          December and keep pulling, then let go, to move to the next year (or past January for the previous one).
        </>,
        <>
          Zoom the year view with the slider, a trackpad pinch, or by holding <kbd>{alt}</kbd> and scrolling. When zoomed in, drag the
          month row to pan.
        </>,
      ],
    },
    {
      icon: icons.data,
      title: 'Where your data lives',
      items: [
        <>
          Your plan is stored <b>only in this browser</b>. Nothing is uploaded and there is no account. Every change saves
          automatically.
        </>,
        <>
          That means a different browser or computer, a private window, or clearing your browsing data will <b>not show this plan</b>.
        </>,
        <>
          Only two things leave your device: the <b>place names</b> you enter (to find them on the map), and ordinary requests to load
          the map and the font. The site also counts anonymous visits and actions (such as adding, exporting and sharing) with Google Analytics, which never sees your plan. Tapping the map pin on a phone card looks the place up in Google Maps.
        </>,
      ],
    },
    {
      icon: icons.backup,
      title: 'Backup and transfer',
      items: [
        <>
          <b>Export</b>, <b>Import</b> and <b>Share</b> are in the <b>⋯</b> menu on the toolbar. <b>Export</b> saves every year's plan in one JSON file. Export whenever you reach a good stopping point.
        </>,
        <>If the plan has changed and gone a week without an export, a reminder appears under the header. “Remind me later” hides it for three days. You can change how long it waits on the <b>Settings</b> page (the person icon at the right of the toolbar).</>,
        <>Found a problem or have an idea? Use <b>Report a problem</b> in the <b>⋯</b> menu to write to the developer, with screenshots if you like. Only what you write and a line about your browser is sent, never your plan.</>,
        <>
          <b>Import</b> loads an exported file. Each year in it <b>replaces</b> that year's plan, after asking; other years are left alone.
        </>,
        <>
          <b>Send to another device</b> makes a link and a QR code carrying every year's plan; opening it on another computer or phone imports it there (asking first before replacing anything). The plan travels inside the link and never passes through a server; you can leave out booking references and fares.
        </>,
        <>
          On a computer you can also <b>drop an exported JSON file onto the page</b> to import it.
        </>,
        <>
          <b>Share</b> previews your plan as an image, then downloads it as a PNG: landscape (the whole timeline, countries, holidays, itinerary) or portrait (9:16, for stories). On a phone it can go straight to the share sheet. Flight details are left out.
        </>,
        <>Exported files include flight booking references, so take care who you send them to.</>,
      ],
    },
    {
      icon: icons.undo,
      only: 'desktop',
      title: 'Mistakes',
      items: [
        <>
          <kbd>{undo}</kbd> to undo, <kbd>{redo}</kbd> to redo, up to 100 steps.
        </>,
        <>
          Undo history is lost when the page reloads. Export a copy before an <b>Import</b> or a big rearrangement, so there is
          something to go back to.
        </>,
      ],
    },
  ],
  ja: ({ alt, undo, redo }) => [
    {
      icon: icons.phone,
      only: 'phone',
      title: 'スマホでは',
      items: [
        <>
          スマホでは<b>閲覧のみ</b>です。いちばん上に今いる場所と次の目的地、その下に滞在ごとのカードが並びます。計画や変更は PC で開いてください。
        </>,
        <>
          <b>計画をスマホに移すには</b>、PC の <b>⋯</b> メニューで「別の端末に送る」を選び、スマホのカメラで QR コードを読み取るかリンクを開きます。JSON ファイルを送って ⋯ メニューの<b>読み込み</b>を使うこともできます。
        </>,
        <>
          カードでは<b>便名や予約番号をコピー</b>したり、出発時刻を<b>カレンダーに追加</b>したり、地名の横のピンから Google マップで開いたりできます。
        </>,
        <>
          ブラウザの「<b>ホーム画面に追加</b>」を使うと、オフラインでも開けます（地図を除く）。
        </>,
      ],
    },
    {
      icon: icons.plan,
      only: 'desktop',
      title: '計画する',
      items: [
        <>
          タイムラインの<b>空いているところをドラッグ</b>し、国と都市を入れると滞在がひとつ増えます。
        </>,
        <>
          <b>ブロックごとドラッグ</b>すると順番が変わります。隣の半分を越えたところで入れ替わります。
        </>,
        <>
          <b>両端を引っ張る</b>と長さを変えられます。伸ばすと隣が押されます。
        </>,
        <>
          <kbd>{alt}</kbd> を押しながらドラッグすると、滞在を<b>コピー</b>できます。
        </>,
        <>
          <kbd>B</kbd> を押しながら滞在をクリックすると、その線で<b>2 つに分割</b>されます（年・月どちらの表示でも）。
        </>,
        <>
          滞在を<b>クリック</b>すると編集できます：日付、色、同行者、航空券、メモ、または削除。
        </>,
        <>
          下の滞在リストにはまだ予定のない<b>空き</b>も並びます。右の <b>+</b> でそこに滞在を追加できます。
        </>,
        <>
          人気の都市は編集画面に<b>おすすめの時期</b>ボタンがあり、月ごとのおすすめ／ふつう／避けるを見られます。避けるべき月に予定を入れると、ブロックとリストに注意が出ます。
        </>,
        <>
          まとめでは<b>シェンゲン 90/180 日</b>と<b>台湾 183 日</b>を数えます。シェンゲンの上限を超える滞在にはリストに注意アイコンが付きます。数えるのはタイムラインに入れた日だけで、正式な規則は各国の公式情報が優先です。
        </>,
      ],
    },
    {
      icon: icons.views,
      only: 'desktop',
      title: '年と月',
      items: [
        <>
          <b>年</b>表示は 1 年の大枠を半週単位で見るもの（300% 以上に拡大すると日単位）、<b>月</b>表示はカレンダーで、日単位で正確に扱えます。
        </>,
        <>タイムラインの月をクリックすると、その月にジャンプします。</>,
        <>
          月表示で右の<b>全月表示</b>をオンにすると、1〜12 月が縦に並び、下にスクロールして見られます。
        </>,
        <>
          タブの左で<b>年</b>を切り替えられます（2025／2026／2027／2028）。年ごとに別の計画が保存されます。月の列を 12 月より先までドラッグして離すと翌年へ（1 月より手前へ引くと前年へ）。
        </>,
        <>
          年表示は拡大できます：上のスライダー、トラックパッドのピンチ、または <kbd>{alt}</kbd> を押しながらスクロール。拡大後は月の列をドラッグして左右に動かせます。
        </>,
      ],
    },
    {
      icon: icons.data,
      title: 'データの保存場所',
      items: [
        <>
          計画は<b>このブラウザの中にだけ</b>保存されます。アップロードされず、アカウントも不要です。変更は自動で保存されます。
        </>,
        <>
          そのため、別のブラウザや別のパソコン、プライベートウィンドウ、閲覧データの消去では<b>この計画は表示されません</b>。
        </>,
        <>
          外に送られるのは 2 つだけ：入力した<b>地名</b>（地図上の位置を探すため）と、地図やフォントを読み込む通常の通信です。サイトでは Google Analytics で匿名の訪問数と操作回数（追加・書き出し・共有など）を集計しますが、計画の内容は含みません。スマホのカードで地図のピンをタップすると、その地名を Google マップで検索します。
        </>,
      ],
    },
    {
      icon: icons.backup,
      title: 'バックアップと移行',
      items: [
        <>
          <b>書き出し</b>、<b>読み込み</b>、<b>共有</b>はツールバーの <b>⋯</b> メニューにあります。<b>書き出し</b>は全年の計画を 1 つの JSON ファイルに保存します。区切りのいいところで書き出しておくのがおすすめです。
        </>,
        <>計画を変えてから 1 週間書き出していないと、ヘッダーの下にバックアップの案内が出ます。「あとで」を押すと 3 日間は出ません。間隔は<b>設定</b>ページ（ツールバー右端の人のアイコン）で変えられます。</>,
        <>不具合や要望は <b>⋯</b> メニューの<b>問題を報告</b>から開発者に送れます。スクリーンショットも添付できます。送られるのは入力した内容とブラウザの情報だけで、計画は含まれません。</>,
        <>
          <b>読み込み</b>は書き出したファイルを読み戻します。ファイルにある年はその年の計画を<b>置き換え</b>（置き換える前に確認します）、ほかの年はそのままです。
        </>,
        <>
          <b>別の端末に送る</b>は、全年の計画を入れたリンクと QR コードを作ります。別の PC やスマホで開くとそこに読み込まれます（置き換える前に確認します）。計画はリンクの中にあり、サーバーを通りません。予約番号と運賃は外すこともできます。
        </>,
        <>
          PC では書き出した JSON ファイルを<b>ページにドロップ</b>しても読み込めます。
        </>,
        <>
          <b>共有</b>は計画を画像でプレビューしてから PNG として保存します。横長（1 年のタイムライン、国、祝日、滞在リスト）と縦長（9:16、ストーリーズ向け）の 2 種類です。スマホでは共有シートにそのまま送れます。航空券の詳細は入りません。
        </>,
        <>書き出したファイルには航空券の予約番号などが含まれます。人に渡すときは注意してください。</>,
      ],
    },
    {
      icon: icons.undo,
      only: 'desktop',
      title: '間違えたら',
      items: [
        <>
          <kbd>{undo}</kbd> で元に戻す、<kbd>{redo}</kbd> でやり直し。最大 100 回。
        </>,
        <>
          元に戻す履歴はページを再読み込みすると消えます。<b>読み込み</b>や大きな並べ替えの前に一度書き出しておくと、あとで戻せます。
        </>,
      ],
    },
  ],
};

// A short guide to using the planner, and to where the data lives. `mod` is the platform's shortcut prefix.
export function HelpDialog({ mod, onClose }: { mod: string; onClose: () => void }) {
  const locale = useLocale();
  useScrollLock();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // An accordion: each section's heading opens or closes it. The first starts open; any number can be open.
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });
  const idBase = useId();

  const mac = mod === '⌘';
  // A phone gets its own section first and none of the editing ones, since nothing can be edited there.
  const narrow = useNarrow();
  const sections = GUIDE[locale]({ alt: mac ? '⌥' : 'Alt', undo: `${mod}Z`, redo: mac ? '⌘⇧Z' : 'Ctrl+Shift+Z' }).filter(
    (section) => section.only !== (narrow ? 'desktop' : 'phone'),
  );

  return (
    <div className="backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="editor help" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <h2 id="help-title">
          {t('help.title')}
          <button className="close" onClick={onClose} aria-label={t('help.close')} autoFocus>
            <X size={16} weight="bold" />
          </button>
        </h2>
        <div className="help-sections">
          {sections.map((section, s) => (
            <section key={section.title} className={open.has(s) ? 'open' : undefined}>
              <h3>
                <button type="button" aria-expanded={open.has(s)} aria-controls={`${idBase}-${s}`} onClick={() => toggle(s)}>
                  {section.icon}
                  {section.title}
                  <CaretDown size={16} weight="bold" className="caret" />
                </button>
              </h3>
              {open.has(s) && (
                <ul id={`${idBase}-${s}`}>
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
        {/* Same line in every language. */}
        <p className="credit">Designed by Simon Lin with 🧡</p>
      </div>
    </div>
  );
}
