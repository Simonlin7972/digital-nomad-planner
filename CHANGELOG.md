# 更新日誌 · Changelog

<!--
  This file is the source of the /changelog/ page: it is read at build time, so pushing an update here publishes it.
  Add an entry for every release (every push to main), newest day first. One "## YYYY-MM-DD" heading per day; under
  it, each change is a "- " line in Traditional Chinese followed by an indented "EN:" line in English. Write for
  people using the planner, not for developers: what they can now do or what changed for them.
-->

## 2026-10-10

- 帽子、背包、圍巾這些配件現在各有自己合適的預設顏色，選了再改也可以，不會全部跟著上一個選的顏色跑
  EN: Hats, bags, scarves and other extras now each start in a colour that suits them; you can still change it, and it no longer follows whatever colour you picked last
- 角色選項的縮圖只畫那個部位：髮型、帽子、眼鏡襯著頭型剪影，衣服和隨身物則單獨放大，挑的時候一眼就能比較
  EN: Character option tiles now show just that part: hairstyles, hats and glasses on a head silhouette, clothes and things to carry on their own and zoomed in, so they are easier to compare at a glance
- 在個人檔案與設定頁點左上角的名稱，現在會回到規劃頁，而不是首頁
  EN: On Profile & settings, the name at the top left now takes you back to the planner instead of the landing page
- 個人檔案與設定頁的「關於」不再放 GitHub 連結
  EN: The About section of Profile & settings no longer links to GitHub
- 「問題回報」改名「問題回報與建議」，想要什麼功能也可以直接寫給我們；工具列的人像按鈕也改叫「個人檔案與設定」
  EN: "Report a problem" is now "Report a problem or suggest", so you can send ideas too; the toolbar's person button is now called Profile & settings
- 設定頁改名為「個人檔案與設定」，拿掉頁首和各項下方的說明文字，畫面更乾淨
  EN: The settings page is now called Profile & settings, without the explanations under the title and each option
- 修正設定頁「護照」「稅務居住地」的國家清單被撐成整個視窗寬
  EN: Fixed the country lists for Passport and Tax residence on the settings page stretching across the whole window
- 英文與日文介面有了自己的名字：Not WFH、今日は在宅じゃない；切換語言時頁面標題與分頁標題跟著換
  EN: The English and Japanese interfaces now have their own names, Not WFH and 今日は在宅じゃない; the page and tab titles follow the language
- 標題下方的打字副標有了中文與日文版本，各用自己的像素字體
  EN: The typing tagline under the title now has Chinese and Japanese versions, each in its own pixel typeface
- 設定頁新增「我的角色」：挑一個像你的像素數位遊牧，有 10 個預設角色，也能自己搭配髮型、衣服、鞋子，加上帽子、眼鏡、鬍子、圍巾這類配件（頭上、眼部、臉下半、頸部可以同時戴），背包、吉他、滑板、手上的珍珠奶茶或雨傘，旁邊再放行李箱、衝浪板、帳篷或貓狗兔；膚色和髮型各有 10 種（也有綠色、藍色這種怪顏色）；角色會眨眼、上下呼吸，旁邊的貓狗也會動；滑鼠指著就先預覽，按「儲存角色」才存。存好之後，工具列的設定按鈕會變成你的角色，分享圖上也會出現
  EN: New "My character" on the settings page: pick a pixel nomad who looks like you from 10 ready-made ones, or dress one up with hair, clothes and shoes, accessories for the head, eyes, mouth and neck that can all be worn at once, a bag, guitar or skateboard, bubble tea or an umbrella in hand, and a suitcase, surfboard, tent, cat, dog or rabbit alongside; 10 skin tones (a few unlikely ones too) and 10 hairstyles; it blinks and bobs, and the cat or dog beside it fidgets; point at a choice to preview it, and press Save character to keep it. Once saved, your character shows on the toolbar's settings button and on the shared image
- 頁面上不再放 GitHub 連結；更新日誌頁變寬、項目符號更清楚
  EN: The GitHub links are gone from the pages; the changelog page is wider and its bullets easier to see
- 新增設定頁（工具列最右邊的人像圖示）：可以填暱稱、家、護照、稅務居住地，設定語言、假日、溫度單位（°C／°F）與備份提醒間隔
  EN: New settings page (the person icon at the right of the toolbar): add a nickname, home, passport and tax residence, and choose the language, holidays, temperature unit (°C / °F) and backup reminder interval
- 填了家之後，飛行估算會加上從家出發與回家；歐盟、歐洲經濟區、瑞士護照不再顯示申根 90/180；183 天可以改算其他國家
  EN: With a home set, the flight estimate counts the trips from and back home; EU, EEA and Swiss passports no longer see the Schengen 90/180 count; the 183-day count can follow another country
- 語言改在設定頁選擇，工具列不再有語言按鈕
  EN: The language is now chosen on the settings page; the toolbar no longer has a language button
- ⋯ 選單新增「問題回報」：寫下標題和遇到的問題，可附最多 3 張截圖，留 Email 的話會回覆你；行程內容不會送出
  EN: New "Report a problem" in the ⋯ menu: describe what went wrong, attach up to 3 screenshots, and leave an email if you'd like a reply; nothing from your plan is sent

## 2026-10-09

- 機票的航空公司改成搜尋選單：約 75 家常見航空，中文、英文或代號（例如 BR）都搜得到；航班編號會帶出航空公司代號和你用過的航班
  EN: The ticket's airline is now a searchable list of about 75 common airlines, by Chinese or English name or code (such as BR); the flight number offers the airline's code and flights you have used before
- 航空公司選單每一家都顯示 logo，選好後欄位也會換成那家的 logo
  EN: Every airline in the picker shows its logo, and the field shows it once you pick one

## 2026-10-08

- 新增「傳到其他裝置」：⋯ 選單產生一個連結和 QR code，在另一台電腦或手機打開就能匯入所有年份的行程，不用再傳檔案；行程只放在連結裡，不經過伺服器，也可以選擇不含訂位代號與票價
  EN: New "Send to another device": the ⋯ menu makes a link and a QR code that import every year of your plan on another computer or phone, no file needed; the plan travels only inside the link, never through a server, and booking refs and fares can be left out
- 在電腦上可以直接把匯出的 JSON 檔拖進頁面匯入
  EN: On a computer you can now drop an exported JSON file onto the page to import it
- 分享圖多了直式（9:16）版面，適合 IG 限動；手機上預設直式
  EN: Share images now come in a portrait (9:16) layout for stories too, the default on phones
- 手機卡片上可以一鍵複製航班號、訂位代號，把起飛時間加入行事曆，或用 Google 地圖打開地點
  EN: Phone cards can copy the flight number or booking reference, add the departure to your calendar, or open the place in Google Maps
- 手機上的選單與視窗改從底部升起；說明改成手機用的內容；可以加入主畫面，沒有網路也打得開（地圖除外）
  EN: On phones, menus and dialogs now rise from the bottom, the guide covers what applies on a phone, and the planner can be added to your home screen and opens offline (the map aside)
- 手機版改版：頁首縮成一列，打開就看得到「現在／下一站」；現在這一站多了日期與進度條，下一站直接列出機票；已結束的行程收成一行；打開時自動切到今年
  EN: Phone layout refresh: a one-row header so "now / next" shows straight away; the current stay shows its dates and a progress bar, the next one shows its flight; past stays fold into one line; it opens on the current year
- 手機版修正：⋯ 選單不再跑出畫面；橫拿手機不會變成編輯版；按鈕都加大到好按的大小；摘要的說明可以點 ⓘ 展開；介紹頁在手機上也能切換語言
  EN: Phone fixes: the ⋯ menu no longer opens off screen; turning a phone sideways no longer switches to the editing layout; buttons are finger-sized; summary explanations open from an ⓘ; the landing page's language switch now shows on phones
- 地圖捲到附近才載入，頁面開得更快；摘要裡只有一個城市的國家不再重複列一行
  EN: The map loads when you scroll near it, so the page opens faster; countries with a single city no longer repeat it on a line of its own in the summary
- 匿名統計多了幾個操作事件（進入規劃工具、新增行程、匯出、匯入、分享），只記次數與分組數量，行程內容一樣不會送出
  EN: Anonymous statistics now count a few actions (opening the planner, adding a stay, exporting, importing, sharing) as counts and ranges only; nothing from your plan is ever sent
- 新增日文介面；語言鈕顯示目前語言，按一下依序切換 中文 → English → 日本語
  EN: The interface is now also in Japanese; the language button shows the current language and cycles 中文 → English → 日本語
- 分享連結時的預覽：說明改成中英日三語，預覽圖標出三種語言
  EN: Link previews now describe the planner in Chinese, English and Japanese, and the preview image names all three languages
- 新增產品介紹首頁；規劃工具搬到 /app/
  EN: A new landing page introduces the planner, which now lives at /app/
- 規劃工具底部加上 footer：資料存放提醒、授權、首頁與 GitHub 連結
  EN: The planner has a footer: where your data lives, the licence, and links home and to GitHub
- 「如何使用」收進 ⋯ 選單，並新增「產品介紹」，在新分頁打開首頁
  EN: "How to use" moved into the ⋯ menu, next to a new "About this app" link that opens the landing page in a new tab
- 新增這個更新日誌頁面
  EN: This changelog page

## 2026-10-07

- 按住 B 點行程，可以把一段行程切成兩段（年、月檢視都可以）
  EN: Hold B and click a stay to cut it in two, in both the year and month views
- Alt 拖曳複製改成「插入」：前面的行程（包括原本那段）不再被推動，只有後面的往後推
  EN: Alt-drag copying now inserts: nothing before the copy moves, including the original, and only what follows shifts later
- 加入 Google Analytics 頁面瀏覽統計；只記錄瀏覽，不含任何行程內容
  EN: Added Google Analytics page-view counts; only page views are recorded, never anything from your plan

## 2026-10-06

- 匯出改成一個檔案包含所有年份，匯入時各年份分別還原；舊的單年檔仍可匯入
  EN: Export now saves every year in one file, and import restores each year; older single-year files still work
- 年份加入 2025
  EN: 2025 can now be planned
- 年檢視放大到 300% 以上時，以「天」為單位拖曳與顯示
  EN: At 300% zoom and above the year view works by the day
- 月檢視新增「看全部」，1–12 月由上往下排，並有回到頂端按鈕
  EN: The month view's "All months" switch stacks January to December, with a back-to-top button
- 「如何使用」改成可展開收合的分段
  EN: The "How to use" guide opens and closes section by section
- 拖選新增的框改成黑色；季節資料補上德國、瑞士、奧地利
  EN: Drag-select boxes are now black; season data added for Germany, Switzerland and Austria

## 2026-10-05

- 可切換 2026、2027、2028 年，並可在時間軸拖過年頭年尾換年份；新增 2026 國定假日
  EN: Plan 2026, 2027 or 2028, switching from the picker or by dragging past either end of the timeline; 2026 public holidays added
- 季節資訊：熱門城市每個月的推薦、普通、避開與大約溫度，排到不適合的月份會示警
  EN: Season guide: best, fine and avoid months with typical temperatures for popular cities, with a warning when a stay lands in a poor month
- 分享：先預覽整年行程圖再下載 PNG；手機版改成唯讀檢視
  EN: Share: preview the year as an image, then download it as a PNG; phones get a read-only view
- 申根 90/180 天與台灣 183 天計算、行程空檔列表、備份提醒
  EN: Schengen 90/180 and Taiwan 183-day counts, free stretches in the itinerary, and a backup reminder
- 改名「今天不在家工作」，加上像素小人與打字標語；新增英文介面
  EN: Renamed 今天不在家工作, with a pixel mascot and a typing tagline; added an English interface
- 國家與城市改為可搜尋的選單，自製日期選擇器，新增說明視窗
  EN: Searchable country and city pickers, a custom date picker and a "How to use" guide
- Alt 拖曳複製行程；部署到 GitHub Pages
  EN: Alt-drag to duplicate a stay; the planner went live on GitHub Pages

## 2026-10-04

- 第一版：53 週時間軸，拖選新增、拖曳換順序、拉兩端伸縮，資料自動存在瀏覽器
  EN: First version: a 53-week timeline where you drag to add, reorder and resize stays, saved automatically in your browser
- 月檢視、地圖、國定假日、國旗與國家條、機票資訊、復原重做、PNG 匯出
  EN: Month view, map, public holidays, flags and country strips, flight details, undo and redo, and PNG export
