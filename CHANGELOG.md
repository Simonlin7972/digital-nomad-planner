# 更新日誌 · Changelog

<!--
  This file is the source of the /changelog/ page: it is read at build time, so pushing an update here publishes it.
  Add an entry for every release (every push to main), newest day first. One "## YYYY-MM-DD" heading per day; under
  it, each change is a "- " line in Traditional Chinese followed by an indented "EN:" line in English. Write for
  people using the planner, not for developers: what they can now do or what changed for them.
-->

## 2026-10-08

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
