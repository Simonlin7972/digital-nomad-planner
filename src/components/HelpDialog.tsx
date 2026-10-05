import { useEffect } from 'react';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { Calendar } from '@phosphor-icons/react/dist/csr/Calendar';
import { Database } from '@phosphor-icons/react/dist/csr/Database';
import { FloppyDisk } from '@phosphor-icons/react/dist/csr/FloppyDisk';
import { HandGrabbing } from '@phosphor-icons/react/dist/csr/HandGrabbing';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { useScrollLock } from '../hooks/useScrollLock';
import './Dialog.css';
import './HelpDialog.css';

// A short guide to using the planner, and to where the data lives. `mod` is the platform's shortcut prefix.
export function HelpDialog({ mod, onClose }: { mod: string; onClose: () => void }) {
  useScrollLock();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const alt = mod === '⌘' ? '⌥' : 'Alt';

  return (
    <div className="backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="editor help" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <h2 id="help-title">
          如何使用
          <button className="close" onClick={onClose} aria-label="關閉" autoFocus>
            <X size={16} weight="bold" />
          </button>
        </h2>

        <section>
          <h3>
            <HandGrabbing size={18} weight="bold" />
            排行程
          </h3>
          <ul>
            <li>
              在時間軸的<b>空白處拖曳</b>，選好時段後填國家與城市，就多一段行程。
            </li>
            <li>
              <b>拖整塊</b>可以換順序：拖過隔壁的一半，兩段就對調。
            </li>
            <li>
              <b>拉兩端</b>可以延長或縮短；變長時會把隔壁推開。
            </li>
            <li>
              按住 <kbd>{alt}</kbd> 再拖，會<b>複製</b>一段出來。
            </li>
            <li>
              <b>點一下</b>行程可以編輯：日期、顏色、跟誰去、機票、備註，或刪除。
            </li>
          </ul>
        </section>

        <section>
          <h3>
            <Calendar size={18} weight="bold" />
            年與月
          </h3>
          <ul>
            <li>
              <b>年</b>檢視看整年大方向，以半週為單位；<b>月</b>檢視是月曆，可以精準到每一天。
            </li>
            <li>點時間軸上的月份，直接跳到那個月。</li>
            <li>
              年檢視可以放大：用上方滑桿、觸控板兩指開合，或按住 <kbd>{alt}</kbd> 滾動滾輪。放大後按住月份列可以左右拖。
            </li>
          </ul>
        </section>

        <section>
          <h3>
            <Database size={18} weight="bold" />
            資料存在哪裡
          </h3>
          <ul>
            <li>
              行程<b>只存在這個瀏覽器裡</b>，不會上傳，也不需要帳號。每次變動都自動儲存。
            </li>
            <li>
              所以換瀏覽器、換電腦、用無痕視窗，或清除瀏覽器資料，都會<b>看不到原本的行程</b>。
            </li>
            <li>
              只有兩種資訊會送出去：你填的<b>地名</b>（用來在地圖上找位置），以及載入地圖與字體時的一般連線。
            </li>
          </ul>
        </section>

        <section>
          <h3>
            <FloppyDisk size={18} weight="bold" />
            備份與搬移
          </h3>
          <ul>
            <li>
              <b>匯出</b>：把全部行程存成一個 JSON 檔。建議排到一個段落就匯出一次當備份。
            </li>
            <li>
              <b>匯入</b>：讀回匯出的檔案。會<b>取代</b>目前的行程，匯入前會先問你。
            </li>
            <li>
              <b>保存 PNG</b>：把整年時間軸和行程清單存成一張圖，方便分享。
            </li>
            <li>匯出檔含機票的訂位代號等內容，傳給別人前請留意。</li>
          </ul>
        </section>

        <section>
          <h3>
            <ArrowCounterClockwise size={18} weight="bold" />
            做錯了
          </h3>
          <ul>
            <li>
              <kbd>{mod}Z</kbd> 復原、<kbd>{mod === '⌘' ? '⌘⇧Z' : 'Ctrl+Shift+Z'}</kbd> 重做，最多 100 步。
            </li>
            <li>
              復原紀錄在重新整理頁面後就沒有了；<b>清空</b>之後若已重新整理，只能靠匯出的備份救回。
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
