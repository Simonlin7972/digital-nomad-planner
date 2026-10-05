import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { Calendar } from '@phosphor-icons/react/dist/csr/Calendar';
import { Database } from '@phosphor-icons/react/dist/csr/Database';
import { FloppyDisk } from '@phosphor-icons/react/dist/csr/FloppyDisk';
import { HandGrabbing } from '@phosphor-icons/react/dist/csr/HandGrabbing';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { useScrollLock } from '../hooks/useScrollLock';
import { t, useLocale, type Locale } from '../lib/i18n';
import './Dialog.css';
import './HelpDialog.css';

type Section = { icon: ReactNode; title: string; items: ReactNode[] };
type Keys = { alt: string; undo: string; redo: string };

const icons = {
  plan: <HandGrabbing size={18} weight="bold" />,
  views: <Calendar size={18} weight="bold" />,
  data: <Database size={18} weight="bold" />,
  backup: <FloppyDisk size={18} weight="bold" />,
  undo: <ArrowCounterClockwise size={18} weight="bold" />,
};

// The guide is prose with inline emphasis, so each language is written out whole rather than assembled from
// dictionary strings. Keep the two in step: same sections, same points.
const GUIDE: Record<Locale, (k: Keys) => Section[]> = {
  zh: ({ alt, undo, redo }) => [
    {
      icon: icons.plan,
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
          <b>點一下</b>行程可以編輯：日期、顏色、跟誰去、機票、備註，或刪除。
        </>,
        <>
          下方行程列表會列出還沒排的<b>空檔</b>，按右邊的 <b>+</b> 直接排一段。
        </>,
        <>
          摘要會算<b>申根 90/180 天</b>與<b>台灣 183 天</b>；申根超過上限的行程，列表上會出現警示圖示。只算排進時間軸的日子，實際規定以官方為準。
        </>,
      ],
    },
    {
      icon: icons.views,
      title: '年與月',
      items: [
        <>
          <b>年</b>檢視看整年大方向，以半週為單位；<b>月</b>檢視是月曆，可以精準到每一天。
        </>,
        <>點時間軸上的月份，直接跳到那個月。</>,
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
          只有兩種資訊會送出去：你填的<b>地名</b>（用來在地圖上找位置），以及載入地圖與字體時的一般連線。
        </>,
      ],
    },
    {
      icon: icons.backup,
      title: '備份與搬移',
      items: [
        <>
          <b>匯出</b>：把全部行程存成一個 JSON 檔。建議排到一個段落就匯出一次當備份。
        </>,
        <>行程改過之後超過一週沒有匯出，頁首會出現備份提醒；按「稍後提醒」三天內不再出現。</>,
        <>
          <b>匯入</b>：讀回匯出的檔案。會<b>取代</b>目前的行程，匯入前會先問你。
        </>,
        <>
          <b>保存 PNG</b>：把整年時間軸和行程清單存成一張圖，方便分享。
        </>,
        <>匯出檔含機票的訂位代號等內容，傳給別人前請留意。</>,
      ],
    },
    {
      icon: icons.undo,
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
      icon: icons.plan,
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
          <b>Click</b> a stay to edit its dates, color, companions, flight and note, or to delete it.
        </>,
        <>
          The itinerary below lists the <b>free stretches</b> between stays; press the <b>+</b> beside one to plan a stay there.
        </>,
        <>
          The summary counts <b>Schengen days (90 in 180)</b> and <b>days in Taiwan (183)</b>; stays that break the Schengen limit get a
          warning in the itinerary. Only planned days are counted, and official rules always take precedence.
        </>,
      ],
    },
    {
      icon: icons.views,
      title: 'Year and month',
      items: [
        <>
          The <b>Year</b> view shows the whole year in half-week steps; the <b>Month</b> view is a calendar, precise to the day.
        </>,
        <>Click a month on the timeline to jump straight to it.</>,
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
          the map and the font.
        </>,
      ],
    },
    {
      icon: icons.backup,
      title: 'Backup and transfer',
      items: [
        <>
          <b>Export</b> saves the whole plan as a JSON file. Export whenever you reach a good stopping point.
        </>,
        <>If the plan has changed and gone a week without an export, a reminder appears under the header. “Remind me later” hides it for three days.</>,
        <>
          <b>Import</b> loads an exported file. It <b>replaces</b> the current plan, and asks first.
        </>,
        <>
          <b>Save PNG</b> saves the year timeline and itinerary as an image, handy for sharing.
        </>,
        <>Exported files include flight booking references, so take care who you send them to.</>,
      ],
    },
    {
      icon: icons.undo,
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

  const mac = mod === '⌘';
  const sections = GUIDE[locale]({ alt: mac ? '⌥' : 'Alt', undo: `${mod}Z`, redo: mac ? '⌘⇧Z' : 'Ctrl+Shift+Z' });

  return (
    <div className="backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="editor help" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <h2 id="help-title">
          {t('help.title')}
          <button className="close" onClick={onClose} aria-label={t('help.close')} autoFocus>
            <X size={16} weight="bold" />
          </button>
        </h2>
        {sections.map((section) => (
          <section key={section.title}>
            <h3>
              {section.icon}
              {section.title}
            </h3>
            <ul>
              {section.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
