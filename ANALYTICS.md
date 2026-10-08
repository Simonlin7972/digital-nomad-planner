# 流量與事件追蹤計劃

用 Google Analytics 4（資源 `digital-nomad-planner`，評估 ID `G-9RWHNKHMK9`）了解大家怎麼用這個網站。程式在 `src/lib/analytics.ts`。

**每次改動追蹤相關的程式或 GA 設定，都要更新本檔最下方的 [Checklist](#checklist)。**

---

## 原則：行程內容一律不送

README 寫著「不會送出任何行程內容」。事件參數只能是：

- ✅ 介面選擇（年／月檢視、哪顆按鈕、哪種拖曳）
- ✅ 分組後的數量（`1`／`2-5`／`6-15`／`16+`，見 `bucket()`）
- ✅ 狀態旗標（成功與否、開關）
- ❌ 國家、城市、日期、機票、備註、同行者、任何使用者輸入的文字

所有事件都經過 `track()`，名稱與參數型別寫死在 `Events` 型別裡，新增事件先改型別。

## 想回答的問題

| 問題 | 靠哪些事件 |
| --- | --- |
| landing page 有多少人點進 app？ | `cta_click` |
| 進了 app，多少人真的開始排（啟用）？ | `stay_create`、`plan_activated` |
| 排多深？ | `stay_create` 的 `stay_count` |
| 哪些功能有人用？ | 第 2 階段事件 |
| 有沒有帶走成果？ | `export_json`、`share_open`、`share_download` |
| 哪裡卡住？ | `import_result` 失敗、第 3 階段事件 |
| 手機版比例、會不會回來？ | GA 內建裝置與回訪報表、`mobile_view` |

## 事件清單

### 第 1 階段：轉換漏斗（已實作）

| 事件 | 參數 | 觸發 | 位置 |
| --- | --- | --- | --- |
| `cta_click` | `location`: `nav`／`hero`／`final`／`changelog` | 點「開始規劃」連到 app | `landing/Landing.tsx`、`changelog/Changelog.tsx` |
| `stay_create` | `view`: `year`／`month`；`stay_count`: 分組（含這段） | 編輯視窗儲存一段新行程 | `App.tsx` `saveEditing` |
| `plan_activated` | — | 這個瀏覽器第一次建立行程，只送一次（`dnp-ga-activated`） | `analytics.ts` `trackActivation` |
| `export_json` | `years`: 檔案含幾個年份；`source`: `menu`／`reminder` | 匯出 JSON | `App.tsx` `exportJson` |
| `import_result` | `ok`: true／false；`years`: 幾個年份 | 匯入成功、檔案無內容或解析失敗（使用者在確認視窗取消不送） | `App.tsx` `importJson` |
| `share_open` | — | 開啟分享預覽 | `App.tsx` |
| `share_download` | `method`: `download`／`native_share` | 下載 PNG，或系統分享完成（取消不送） | `components/ShareDialog.tsx` |

### 第 2 階段：功能使用率（未實作）

| 事件 | 參數 | 觸發 |
| --- | --- | --- |
| `stay_edit` | `fields`: 改了哪些欄位名稱，例如 `dates,color,ticket` | 編輯既有行程後儲存 |
| `stay_delete` | — | 刪除行程 |
| `stay_drag` | `kind`: `reorder`／`resize`／`duplicate`；`view`；`unit`: `slot`／`day` | 拖曳**放開時**，拖曳中不送 |
| `stay_split` | `view` | 按住 B 切開 |
| `view_change` | `mode`: `year`／`month`／`month_all` | 切換檢視 |
| `zoom_change` | `level`: `100`／`200`／`300+` | 縮放結束後 debounce 1 秒 |
| `year_change` | `year`；`via`: `select`／`edge_drag` | 換年份 |
| `holiday_toggle` | `set`: `tw`／`au`；`on` | 假日開關 |
| `language_change` | `to`: `zh`／`en` | 切換語言 |
| `map_interact` | — | 每次載入後第一次拖或縮放地圖 |

### 第 3 階段：卡點與內容（未實作）

| 事件 | 參數 | 觸發 |
| --- | --- | --- |
| `help_open` | — | 打開「如何使用」 |
| `help_section` | `section`: 段落 id | 展開說明段落 |
| `undo` / `redo` | `via`: `button`／`shortcut` | 復原、重做 |
| `backup_reminder` | `action`: `shown`／`export`／`snooze` | 備份提醒 |
| `demo_view` | `demo`: 示範名稱 | landing 示範區塊第一次進入畫面 |
| `mobile_view` | `has_plan` | 手機唯讀版面載入時 |

## 實作細節

- **只在正式版載入。** `npm run dev` 不載入 gtag；`track()` 改成在 console 印 `[analytics] 事件名 參數`，方便本機確認觸發點。
- **`?ga_debug=1`**：正式網址加上它，事件會出現在 GA 的 DebugView。
- **`?internal=1`**：把這個瀏覽器標成自己（`dnp-ga-internal`），之後事件帶 `traffic_type=internal`，在 GA 用內部流量篩選排除；`?internal=0` 取消。
- **觸發點放在回呼裡**（`App.tsx`、對話框），不放在 view 的拖曳邏輯裡，跟「view 不持有計劃」一致。
- **會換頁的連結用 `trackLink()`**：換頁時才送的事件常會遺失（上線實測 `cta_click` 就掉了），所以先攔下換頁，等 gtag 回呼（最多約 1 秒）再前往；新分頁或按著修飾鍵的點擊交給瀏覽器，只照常送事件。

## GA 後台設定

1. 資料保留改為 14 個月（管理 → 資料收集與修改 → 資料保留）
2. 自訂維度（事件範圍），名稱同參數：`location`、`view`、`stay_count`、`source`、`ok`、`method`（第 2、3 階段再加 `kind`、`unit`、`mode`、`set` 等）
3. 關鍵事件：`cta_click`、`plan_activated`、`export_json`、`share_download`
4. 內部流量規則：`traffic_type` 等於 `internal`；資料篩選器先設「測試」，確認後改「有效」

## 怎麼看

- **漏斗**（探索 → 程序探索）：landing `page_view` → `cta_click` → app `page_view` → `plan_activated` → `stay_create`（`stay_count` ≥ `6-15`）→ `export_json` 或 `share_download`
- **功能使用率**：自由形式探索，各事件的使用者數 ÷ app 活躍使用者
- **路徑探索**：從 `plan_activated` 往後看
- **同類群組**：以 `plan_activated` 為起點看週回訪
- 一般報表延遲 24–48 小時，即時只看得到最近 30 分鐘

## 風險

- 廣告阻擋器會擋掉 GA，數字偏低。
- 歐盟訪客：目前沒有同意橫幅。歐洲流量變多時，補 Consent Mode 或改用免 cookie 的服務。

---

## Checklist

### 基礎
- [x] 建立 GA4 資源與網站串流
- [x] 正式版載入 gtag（`initAnalytics`），本機不送
- [x] `track()`、`bucket()`、事件型別
- [x] `?ga_debug=1` DebugView、`?internal=1` 內部流量標記

### 第 1 階段：轉換漏斗
- [x] `cta_click`（landing nav／hero／final、changelog）
- [x] `stay_create`
- [x] `plan_activated`
- [x] `export_json`
- [x] `import_result`
- [x] `share_open`
- [x] `share_download`
- [x] DebugView 確認 `share_open`（2026-10-08）
- [x] `cta_click` 換頁時遺失 → 改用 `trackLink()`
- [ ] DebugView 確認 `cta_click`
- [ ] DebugView 確認 `stay_create`、`plan_activated`、`export_json`、`import_result`、`share_download`（會動到真實行程或下載檔案，請自己操作時順便看）

### GA 後台
- [ ] 資料保留改 14 個月
- [ ] 註冊第 1 階段自訂維度
- [ ] 設定關鍵事件
- [ ] 內部流量規則與篩選器（測試 → 有效）
- [ ] 建立漏斗探索

### 第 2 階段：功能使用率
- [ ] `stay_edit`
- [ ] `stay_delete`
- [ ] `stay_drag`
- [ ] `stay_split`
- [ ] `view_change`
- [ ] `zoom_change`
- [ ] `year_change`
- [ ] `holiday_toggle`
- [ ] `language_change`
- [ ] `map_interact`

### 第 3 階段：卡點與內容
- [ ] `help_open`、`help_section`
- [ ] `undo`／`redo`
- [ ] `backup_reminder`
- [ ] `demo_view`
- [ ] `mobile_view`

### 之後
- [ ] 評估是否需要 Consent Mode／同意橫幅
