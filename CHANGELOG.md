# 更新日誌 · Changelog

<!--
  This file is the source of the /changelog/ page: it is read at build time, so pushing an update here publishes it.
  Add an entry for every release (every push to main), newest day first. One "## YYYY-MM-DD" heading per day; under
  it, each change is a "- " line in Traditional Chinese followed by an indented "EN:" line in English. Write for
  people using the planner, not for developers: what they can now do or what changed for them.
-->

## 2026-10-29

- 行程列表的季度篩選：滑鼠移到已選的那顆（例如 Q1）時字不會再消失，改成更深的黑底
  EN: The quarter filter in the stay list: hovering the selected chip (say Q1) no longer hides its label; it turns a deeper black instead
- 分頁切換（年／月、分享圖的橫式／直式、設定頁角色的分頁）：滑鼠移到沒選的那一頁時會出現淺灰底，比較看得出可以點
  EN: Tab switches (Year / Month, the share image's landscape / portrait, the character tabs in Settings) now show a light grey background on the tab you hover, so it's clearer they can be clicked
- 摘要卡有了最大寬度：簽證那行很長時改成換行，行程列表不會再被擠到下面
  EN: The summary card has a maximum width, so a long visa line wraps instead of pushing the itinerary below it

## 2026-10-28

- 在設定頁填了護照，就能看到每個目的地的簽證條件：免簽可以待幾天、落地簽或要先申請簽證；同一國連續待超過免簽天數會出現警示，摘要也會列出要事先辦簽證的國家
  EN: Set your passport in settings to see each destination's entry rules: how long you can stay visa-free, visa on arrival, or a visa to arrange first; a run of stays that outlasts the visa-free days gets a warning, and the summary lists the countries needing a visa beforehand
- 還沒有任何改動時，工具列不再顯示復原、重做按鈕；改了行程才會出現
  EN: Undo and redo stay out of the toolbar until you have changed something
- 國定假日選單會自動列出行程裡每個國家的假日，例如泰國、越南、日本，打開開關就疊在時間軸和月曆上；任何年份都有
  EN: The Holidays menu now lists the public holidays of every country in your plan, such as Thailand, Vietnam or Japan; switch one on to see them on the timeline and calendar, in any year
- 國定假日的兩個開關收成一個「國定假日」按鈕，點開後在選單裡切換台灣、澳洲假日；按鈕上的小圓點顯示開了哪幾組
  EN: The two holiday switches are now one "Holidays" button that opens a menu with a switch for Taiwan and Australia; dots on the button show which are on
- 可以用 Google 登入了：登入後行程和設定會多存一份在雲端，手機和電腦看到同一份；不登入一切照舊，資料只在你的瀏覽器。入口在 ⋯ 選單、備份提醒條、手機的空白頁，以及個人檔案與設定頁新的「帳號」區
  EN: You can now sign in with Google: signed in, your plan and settings are also kept in the cloud so your phone and computer see the same one; signed out, nothing changes and your data stays in your browser. Find it in the ⋯ menu, on the backup reminder, on the phone's empty page, and in the new "Account" section of Profile & settings
- 登入後，設定頁右上角頭像多一個小點顯示同步狀態：綠色已同步、琥珀色同步中、灰色離線或暫停、紅色失敗
  EN: Signed in, the settings link in the header carries a small dot for the sync's state: green in step, amber syncing, grey offline or paused, red failed
- 第一次在某台裝置登入時，若雲端和這台都有行程而且不同，會請你選一份留下；選雲端的會先把這台的匯出成 JSON 檔
  EN: The first sign-in on a device that finds a different plan on each side asks which to keep; choosing the cloud's first exports this device's plan as a JSON file
- 設定頁可以登出（只登出這台，資料留著）或刪除雲端資料（刪掉雲端的一切，並把所有裝置登出）
  EN: The settings page can sign out (this device only; its data stays) or delete the cloud data (everything in the cloud goes, and every device is signed out)

## 2026-10-24

- 全站換字型：中文改用未來熒黑，英文改用 IBM Plex Sans
  EN: New typefaces across the site: Glow Sans TC for Chinese and IBM Plex Sans for Latin
- 還沒選國家時打開城市清單，熱門的遊牧城市（清邁、曼谷、里斯本、倉古⋯⋯）排在最前面
  EN: With no country chosen, the city list now opens with the popular nomad bases (Chiang Mai, Bangkok, Lisbon, Canggu…) at the top
- 國家和城市的搜尋清單分段了：沒打字時先看到「熱門」（用過的和常用的），再來「全部」，國家最後還有「區域」
  EN: The country and city lists now come in sections: "Popular" (used here and common ones) first, then "All", and "Regions" at the end of the country list
- 搜尋時符合的字會加粗；打錯一個字母也找得到，例如 tailand 或 bankok
  EN: The letters you typed are bold in the results, and a one-letter typo still finds the name, such as tailand or bankok
- 找不到符合的時候，清單只剩一列「使用「你打的字」」，點它或按 Enter 就照打的存，跟選清單上的一樣順
  EN: When nothing matches, the list shows one row, "Use ‘what you typed’"; click it or press Enter and it is saved as typed, the same way as picking a name
- 滾輪捲清單時，游標底下經過的選項不會再被打亮；只有真的移動滑鼠才會
  EN: Scrolling a list no longer highlights whatever passes under a resting pointer; only moving the mouse does
- 區域選項（亞洲、東南亞⋯⋯）在旗子的位置畫上地球，不再空著
  EN: Region options (Asia, Southeast Asia…) now show a globe where a flag would be, instead of an empty slot
- 國家欄打了清單外的名字時，欄位下方不再多一行「不在國家清單內」的提示
  EN: Typing a country that isn't on the list no longer adds a note under the field
- 在很長的國家、城市清單上移動滑鼠更順，不會一卡一卡
  EN: Moving the pointer over the long country and city lists is smoother, without stutter
- 指著清單兩端的小箭頭自動捲動時，速度在各種螢幕上都一樣，高更新率的螢幕不會捲得特別快
  EN: The lists roll at the same speed on every screen when you rest on the arrow at either end; high refresh-rate screens no longer roll faster

## 2026-10-23

- 搜尋清單只有幾個結果、不用捲動時，底部不再蓋一層淡出
  EN: A search list short enough to fit no longer has a fade over its last rows
- 首頁改版：外觀跟規劃頁一樣，示範換成真的時間軸、月曆、編輯視窗、摘要、地圖、手機版和分享圖，用一份範例行程直接玩，改了也不會動到你自己的行程；另外介紹了移動日、機票鎖定、像素角色和十大城市，並有常見問題，三種語言都有
  EN: The home page is redone: it looks like the planner, and its demos are now the real timeline, calendar, editor, summary, map, phone view and share image, running on a sample plan you can play with without touching your own; it also covers travel days, locked bookings, the pixel character and the ten cities, with an FAQ, in all three languages
- 國家、城市、航空公司清單的捲軸平常隱藏，捲動時才出現細細的一條
  EN: The scrollbar in the country, city and airline lists stays hidden and appears as a thin bar only while you scroll
- 編輯視窗的「適合的季節」展開後比較好讀：你排的月份改成黑底白字，原因排成月份、原因、溫度三欄對齊的表；像「4–6 月」和「9–11 月」這種分開的時段各自一列，溫度也各算各的；圖例移到按鈕右邊；按鈕前面多了一個雲和太陽的小圖示
  EN: The "When to go" block in the editor is easier to read when open: your stay's months are filled dark, the reasons line up in three columns (months, reason, temperatures), separate spells such as Apr–Jun and Sep–Nov get a row each with their own temperatures, and the legend sits beside the button; the button now starts with a small cloud-and-sun icon

## 2026-10-22

- 修正國家、城市清單有時跑到欄位下方很遠的地方、寬度也變窄
  EN: Fixed the country and city lists sometimes opening far below their fields and too narrow
- 國家、城市、航空公司、航班編號欄位點進去有內容時，右邊多一個 ×，一按就清空重選
  EN: The country, city, airline and flight number fields now show an × while you're in them, to clear and pick again
- 時間軸上的移動日不再畫小飛機，兩段直接相接；月曆上照樣有
  EN: The timeline no longer draws a plane on travel days; the two stays just meet. The calendar still shows it
- 日期選擇器的區間色帶在每一列頭尾變成圓角，接到選中的日期時不再有方角缺口；滑鼠移上去的框也改成圓形
  EN: In the date picker, the band across a stay's dates now has rounded ends on every row and meets the chosen day without a square gap, and the hover ring is round
- 選好國家後，城市選單裡的城市改用城市圖示，不再每一列重複同一面國旗
  EN: Once a country is picked, the city list shows a city icon on each row instead of repeating the same flag
- 國家和城市選單展開時，欄位左邊的圖示會縮放切換成放大鏡，收起後再換回國旗或城市圖示
  EN: While the country or city list is open, the field's icon scales over to a search icon, and back to the flag or city icon once it closes
- 換了國家之後，如果原本填的城市屬於別的國家，城市欄會自動清空，不會存成錯的組合
  EN: Changing the country now clears the city if it belongs to another country, so a stay can't be saved with a mismatched pair
- 滑鼠移到按鈕、欄位與選單按鈕上時，外框統一變成跟展開時一樣的粗框，並帶一點淡入
  EN: Hovering a button, field or menu button now fades in the same thicker outline it has when open
- 修正正式網站上對話框背後和捲動後的頁首沒有模糊效果
  EN: Fixed the blur behind dialogs and under the scrolled header, which was missing on the live site
- 拖曳行程放開後，整條時間軸不會再閃一下
  EN: Letting go of a dragged stay no longer makes the whole timeline flash
- 國家、城市、航空公司、航班編號的搜尋清單：還有選項在下面時最後幾列漸漸淡出，往下捲過之後最上面幾列也淡出，提示兩邊還有東西，不再硬生生切掉；到底或回到頂就恢復。滑鼠移到淡出的地方會浮出一個小箭頭，指著它清單就自己往那邊捲，按一下跳一頁
  EN: The country, city, airline and flight-number lists now fade out their last rows while there are more options below, and their first rows once you have scrolled down, as a hint that the list goes on, instead of a hard cut; the fade goes at either end. Moving the pointer over a fade shows a small arrow: resting on it rolls the list that way, and a click jumps a page
- 在國家欄打字時，旁邊的城市不會再一下子變成英文；清單上的城市一律用目前語言顯示，就算國家欄還沒選好
  EN: Typing in the country field no longer flips the city beside it to English; a listed city is always shown in the current language, even before the country is settled

## 2026-10-21

- 支援移動日：離開一地、抵達下一地的那天可以同時排在前後兩段。後一段的開始日選前一段的結束日，或把行程一端拉到隔壁行程的第一天就行；月曆上這天各畫半格、中間有小飛機，列表和編輯視窗會標出「移動日」，總天數不會重複算
  EN: Travel days: the day you leave one place and arrive in the next can now belong to both stays. Start the next stay on the day the last one ends, or drag a stay's end onto its neighbour's first day; the calendar splits that day with a small plane, the list and editor mark it as a travel day, and totals count it once
- 畫面動起來更順：視窗、選單、彈出層關閉時會淡出；剛改過的行程會閃一圈框，復原、切開、匯入時色塊和列表會滑到新位置；摘要的數字會滾到新值；季節區塊展開有動畫
  EN: Smoother motion: dialogs, menus and popovers fade out when closed; a stay you just changed flashes a ring, and after undo, cut or import the blocks and rows slide into place; the summary's figures roll to their new values; the season panel folds open
- 按住 B 或 Alt 時，畫面角落會提示這時點或拖會做什麼；點行程列表的某一列，就捲到時間軸上那段行程
  EN: Holding B or Alt shows a small hint of what a click or drag will do; clicking a row in the itinerary scrolls to that stay on the timeline
- 選單、日曆和搜尋清單打開時從它掛著的那個角放大出來，關閉時縮回去
  EN: Menus, the calendar and the search lists grow out of the corner they hang from, and shrink back when closed
- 編輯視窗的城市欄位圖示從地標針改成城市天際線
  EN: The city field's icon in the editor is now a city skyline instead of a map pin
- 系統設定「減少動態」時，這些動畫一律不播
  EN: With the system's reduced-motion setting on, none of these animations play

## 2026-10-15

- 新增「十大數位遊牧城市」頁：清邁、里斯本、曼谷、倉古、峴港、吉隆坡、台北、東京、提比里斯、墨西哥城，每城有月租、月花費、網速、適合月份、簽證（台灣護照）、亮點與缺點，和一篇介紹；從首頁和規劃頁底部連過去
  EN: New "Ten cities for digital nomads" page: Chiang Mai, Lisbon, Bangkok, Canggu, Da Nang, Kuala Lumpur, Taipei, Tokyo, Tbilisi and Mexico City, each with rent, monthly cost, broadband, best months, the visa (Taiwan passport), upsides and downsides, and an article; linked from the landing page and the planner's footer
- 對話框的標題和底部按鈕固定不動，內容多時只捲動中間，「儲存」「送出」一直看得到
  EN: Dialogs keep their title and buttons in place and scroll only the content between, so Save and Send stay in view

## 2026-10-14

- 所有對話框最高佔畫面的八成，內容多時在視窗裡捲動，不會貼到畫面上下緣
  EN: Dialogs now take up at most 80% of the screen height and scroll inside when there is more to show
- 已買機票的行程會鎖定：時間軸和月曆上不能拖、不能拉長縮短、不能切開，隔壁的行程也推不動它（卡片上有小鎖頭）；要改日期請打開編輯視窗
  EN: Stays with a flight booked are now locked: they can't be dragged, stretched or cut on the timeline or calendar, and neighbours can't push them (they show a small padlock); change their dates in the editor
- 機票可以填回程了：回程航班編號與起飛時間；回程起飛日跟行程結束日不同時會提醒，一鍵對齊
  EN: Tickets can now hold the return leg: its flight number and departure; when the return date and the stay's end differ, the editor points it out and can line them up in one click
- 行程可以跨年了：在編輯視窗把結束日選到明年，時間軸尾端會標出下一年（例如「2028 →」），下一年的時間軸開頭也會顯示這段，點一下就回到原本那年
  EN: Stays can now cross into the next year: pick an end date next year in the editor, the timeline marks the year it continues into (such as "2028 →"), and next year's timeline shows the stay at its start, one click away from the year it belongs to
- 申根 90/180 會把上一年排在申根的日子一起算進去
  EN: The Schengen 90/180 count now includes the days planned in Schengen at the end of the previous year
- 每一頁的頁首往下捲時都會收成浮在中間的圓角膠囊，帶一點毛玻璃模糊；規劃頁（電腦版）收起時復原、重做、⋯ 選單和設定都還在裡面；捲回頂端就攤開
  EN: Every page's header now folds into a floating frosted pill as you scroll down; the planner's (on a computer) keeps undo, redo, the ⋯ menu and settings within reach; they open back up at the top
- 機票的起飛日跟行程開始日不一樣時，編輯視窗會提醒，按一下就能把行程改成從起飛日開始；滑鼠停在行程上也會看到起飛時間
  EN: When a flight leaves on a different day from the stay's first day, the editor points it out and can move the stay to start on the departure date in one click; a stay's hover card now shows the departure time too

## 2026-10-11

- 角色的衣服、帽子、背包等顏色可以自訂了：色票列最後的「＋」點開 35 格色盤，或直接打色碼
  EN: Clothes, hats, bags and the rest can now take a custom colour: the + at the end of the swatches opens a 35-colour palette, or type a hex code
- 角色的上衣、下身、鞋子各有 10 種了：多了毛衣、襯衫、牛仔外套、長裙、百褶裙、泳褲、夾腳拖、登山鞋、雨鞋等
  EN: Tops, bottoms and shoes now come in 10 each: sweater, shirt, denim jacket, long and pleated skirts, swim trunks, flip-flops, hiking boots, rain boots and more

## 2026-10-10

- 角色髮色從 5 種增加到 11 種，多了赤褐、栗色、白金，還有藍、薄荷綠、薰衣草紫三種染髮色
  EN: Hair colours go from 5 to 11: auburn, chestnut and platinum, plus blue, mint and lavender dyes
- 角色可以轉身了：設定頁大圖右下角的按鈕按一下看背面，背包、吉他、披風從後面看最清楚
  EN: Your character can turn around: the button at the bottom right of the large figure on the settings page shows its back, where bags, guitars and capes look best
- 角色的「取消」「儲存角色」按鈕改成有改動時才出現，沒改就不佔位；存好的角色滑鼠移上去就能下載成透明背景的 PNG
  EN: The character's Cancel and Save buttons now appear only once something has changed; hover the saved character to download it as a transparent PNG
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
