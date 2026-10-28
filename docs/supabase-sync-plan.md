# 雲端同步計畫：Google 登入 + 與 Wordrobe 共用 Supabase

2026-10-27。狀態：2026-10-28 實作完成（階段 1–4；階段 5 刪帳號未做）。實作與這份計畫不同的地方見 §13。

## 0. 一句話

在 Wordrobe 的 Supabase project（`qdjungqzeovpdnrijyls`，ap-southeast-2，Postgres 15）裡開一個獨立的 `nomad` schema，放 planner 的全部使用者資料；Google 登入沿用該 project 已經設好的 provider；planner 端新增 `lib/cloud.ts`，登入後把 localStorage 的內容推上去、跨裝置拉下來。未登入者一切照舊。

---

## 1. 現況盤點：planner 現在存在瀏覽器裡的東西

| key | 內容 | 同步？ | 理由 |
|---|---|---|---|
| `dnp-plan-<year>` | 單年 plan，`serialize()` 的形狀 `{ year, stays[] }` | **是** | 主資料 |
| `dnp-profile` | `Profile`：nickname、home、passport、taxResidence、tempUnit、backupDays、avatar | **是** | 手機要顯示頭像、算 183 天都靠它 |
| `dnp-backup`, `dnp-backup-<year>` | 備份提醒的指紋與時間 | 否 | 登入後雲端就是備份，見 §5.6 |
| `dnp-year` | 目前看哪一年 | 否 | 裝置狀態 |
| `dnp-view`, `dnp-zoom`, `dnp-holidays` | 檢視模式、縮放、假日開關 | 否 | 裝置偏好，手機與電腦本來就不同 |
| `dnp-lang` | 介面語言 | 否 | 裝置偏好 |
| `dnp-geocode` | Nominatim 快取 | 否 | 快取，可重建 |
| `dnp-ga-*` | GA 啟用旗標 | 否 | 分析，與資料無關 |

結論：只同步兩樣東西，**plans** 與 **settings**。其餘維持現狀。

## 2. Wordrobe project 現況（已查）

- 14 張表全在 `public`，25 個 profiles，RLS 全開。`public` 已經混了不相關的 `leave_requests` / `annual_leave_balances`，再丟進去只會更亂，所以 nomad 用自己的 schema。
- Auth provider：google 21 人、email 5 人。**Google 已經設好，planner 不用再申請 OAuth client。**
- `handle_new_user()` trigger（`AFTER INSERT ON auth.users`）會為每個新帳號建 `public.profiles` 一列 + `vocab_libraries` 一個 "Default"。planner 的使用者第一次登入也會觸發。見 §7 決定 D3。
- Exposed schemas 目前是 `public, graphql_public`（dashboard 設定，不在 repo 裡）。要加 `nomad`。
- 方案是免費還是 Pro 沒查到，dashboard → Billing 看一眼。免費 project 七天沒流量會暫停，共用後只要 Wordrobe 有人用就不會。

## 3. Schema 設計

### 3.1 原則

1. **一個 schema，兩張表，整包 jsonb。** 不拆 stay 成列。planner 的不變量（不重疊、travel day、鎖定、跨年 spill）全在 `lib/storage.ts` 的純函式裡，拆表等於要在 SQL 重做一次，沒有查詢需求就不值得。
2. **資料形狀 = 現有的匯出格式。** `plans.data` 就是 `serialize()` 的單年物件，`settings.data` 就是 `Profile`。上傳前走 `serialize`，下載後走 `sanitize` / `getProfile` 同一套清洗，雲端壞資料和壞檔案一樣進不來。
3. **`updated_at` 是唯一的衝突依據。** 單人多裝置，last-write-wins。
4. **沒有 `public` 的外鍵。** 不 reference `public.profiles`，只 reference `auth.users`。這樣 `pg_dump -n nomad` 搬家時沒有跨 schema 依賴。

### 3.2 Migration

檔名：`supabase/migrations/20261027000000_nomad_schema.sql`，放在 **wordrobe repo**（見 D1）。

```sql
/*
  # nomad schema: cloud copy of the digital nomad planner's browser data

  The planner (github.io/digital-nomad-planner) shares this Supabase project with
  Wordrobe but keeps everything in its own schema so it can be moved out later
  with `pg_dump -n nomad`. Nothing here references public.*.

  1. Tables
    - `nomad.plans`    one row per (user, year): the single-year export object
    - `nomad.settings` one row per user: the "about me" profile incl. the avatar

  2. Security
    - RLS on both; authenticated users read and write only their own rows.
    - anon gets schema USAGE only (PostgREST introspection), no table rights.
*/

CREATE SCHEMA IF NOT EXISTS nomad;

GRANT USAGE ON SCHEMA nomad TO anon, authenticated, service_role;

-- updated_at is set by the database, never trusted from the client
CREATE OR REPLACE FUNCTION nomad.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS nomad.plans (
  user_id    uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  year       smallint NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, year),
  CHECK (jsonb_typeof(data) = 'object'),
  CHECK ((data->>'year')::int = year),
  CHECK (pg_column_size(data) < 512 * 1024)
);

CREATE TRIGGER plans_touch_updated_at
  BEFORE UPDATE ON nomad.plans
  FOR EACH ROW EXECUTE FUNCTION nomad.touch_updated_at();

ALTER TABLE nomad.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans"
  ON nomad.plans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create own plans"
  ON nomad.plans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans"
  ON nomad.plans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans"
  ON nomad.plans FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS nomad.settings (
  user_id    uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(data) = 'object'),
  CHECK (pg_column_size(data) < 64 * 1024)
);

CREATE TRIGGER settings_touch_updated_at
  BEFORE UPDATE ON nomad.settings
  FOR EACH ROW EXECUTE FUNCTION nomad.touch_updated_at();

ALTER TABLE nomad.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON nomad.settings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create own settings"
  ON nomad.settings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings"
  ON nomad.settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings"
  ON nomad.settings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA nomad TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA nomad
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;
```

第二階段（即時同步）再加：

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE nomad.plans, nomad.settings;
```

### 3.3 Migration 之外的 dashboard 設定

- Settings → API → **Exposed schemas** 加 `nomad`。沒加，client 會拿到 `PGRST106`。
- Authentication → URL Configuration → **Additional Redirect URLs** 加
  `https://simonlin7972.github.io/digital-nomad-planner/app/` 與 `http://localhost:5173/app/`。
  Site URL 維持 Wordrobe 的，不動。
- 以上兩項不在任何 repo 裡，寫進 wordrobe 的 README 或 migration 檔頭註解，免得之後忘記為什麼。

### 3.4 大小估算

一年 plan 幾十個 stay，含 ticket 與 note 約 5–30 KB；四年 ≈ 100 KB／人。avatar 物件 < 2 KB。一千人也不到 100 MB。不需要任何 index，主鍵就夠。

---

## 4. Auth

- `supabase-js` 的 `signInWithOAuth({ provider: 'google', options: { redirectTo: <app URL> } })`，PKCE flow（預設）。GitHub Pages 是純靜態，callback 回到 `/app/?code=…`，`detectSessionInUrl` 會自動換 token。
- **`?code=` 不能進 GA。** `main.tsx` 目前是 `takeTransferHash()` → `initAnalytics()`；要在 `initAnalytics` 之前把 `code` 從網址拿掉（`history.replaceState`），和 `#plan=` 同一個理由。順序：`takeTransferHash()` → `takeAuthCode()` → `initAnalytics()`。
- Session 存在 localStorage `sb-qdjungqzeovpdnrijyls-auth-token`。Wordrobe 在 netlify.app、planner 在 github.io，不同 origin，不會互相看到。
- 同一個 Google 帳號在兩個產品是**同一個 uuid**。這是共用 auth 的本質，不是 bug；§8 搬家時要一起搬。
- planner 只開 Google。不做 email、不做匿名。

---

## 5. Planner 端設計

### 5.1 新檔案

- `src/lib/cloud.ts`：client（`createClient(URL, ANON_KEY, { db: { schema: 'nomad' } })`）、`signIn` / `signOut` / `onAuth`、`pullPlans` / `pushPlan` / `pullSettings` / `pushSettings`。URL 與 anon key 直接寫在檔案裡，和 `report.ts` 的收件地址一樣：anon key 本來就是公開的，RLS 才是防線；也省掉 GitHub Actions 的 secret。
- `src/hooks/useCloudSync.ts`：接 `App` 的 `stays`、debounce、online/offline、pull-on-focus。
- `src/lib/sync.ts`：純函式，決定「推、拉、問」三選一（§5.3），可以不開瀏覽器就推敲。
- `src/components/AccountMenu.tsx` + `.css`：⋯ 選單裡的登入／登出、同步狀態、「刪除雲端資料」。
- `src/components/SyncConflictDialog.tsx`：第一次登入兩邊都有資料時問人。
- 新 dependency：`@supabase/supabase-js`。

### 5.2 本機多一筆同步記錄 `dnp-sync`

```ts
type SyncState = {
  plans: Record<number, { hash: string; updatedAt: string }>; // 上次與雲端一致時的指紋
  settings: { hash: string; updatedAt: string } | null;
};
```

`hash` 用 `backup.ts` 的 `planHash`。有了它才分得出「本機改了」「雲端改了」「兩邊都改了」。

### 5.3 同步規則（`lib/sync.ts`）

對每一年獨立判斷：

| 本機 vs 上次同步 | 雲端 vs 上次同步 | 動作 |
|---|---|---|
| 沒變 | 沒變 | 無 |
| 變了 | 沒變 | push |
| 沒變 | 變了 | pull |
| 變了 | 變了 | 雲端 `updated_at` 較新 → pull；否則 push（last-write-wins） |
| 第一次登入，本機有、雲端沒有 | | push 全部 |
| 第一次登入，本機沒有、雲端有 | | pull 全部 |
| 第一次登入，兩邊都有且不同 | | **問**：用雲端 / 用這台 / 先匯出 |

兩邊同時改在單人情境下幾乎不會發生，先不做 merge。

### 5.4 觸發時機

- **push**：`stays` 變動後 debounce 1.5 s；profile 頁按儲存後立刻。`navigator.onLine === false` 就只記 dirty，等 `online` 事件再推。
- **pull**：登入成功、頁面載入、`visibilitychange` 回到前景。只拉 `updated_at > 上次`。
- 第二階段 Realtime 訂閱後，pull-on-focus 可以留著當保險。

### 5.5 走既有的路，不開新路

- 雲端拉下來的 plan 走 **`applyImport`**（目前年份走 `setStays`，可以 undo；其他年份 `saveYearPlan`）。不新增任何直接寫 localStorage 的地方。CLAUDE.md 的「所有 plan 變動走 `setStays`」不變，import 的例外多一個來源。
- push 用 `serializeAll` 的單年部分，pull 用 `sanitizeAll`。
- settings 走 `getProfile` / `saveProfile`；profile 頁是另一個 document，planner 下次載入才看到，現在就是這樣。
- 手機唯讀：`MobileItinerary` 只 pull，永遠不 push。`App.tsx` 在首次 render 前切到今年的邏輯不變，pull 完再 re-render。

### 5.6 備份提醒

登入者每次 push 成功就 `markBackedUp`。這樣 `shouldRemind` 自然安靜，不用加分支；登出者維持原本的提醒。

### 5.7 登出與刪除

- 登出：session 清掉，**localStorage 的資料留著**，變回未登入的 planner。HelpDialog 要寫清楚。
- 「刪除雲端資料」：`delete from nomad.plans / settings where user_id = auth.uid()`，RLS 允許，client 直接做。
- 刪帳號（`auth.users`）需要 service role，要一支 edge function；第五階段，先用 dashboard 手動處理。

### 5.8 Analytics

新事件，只有旗標：`sign_in`、`sign_out`、`sync_conflict { choice: 'cloud' | 'local' | 'export' }`、`cloud_delete`。`Events` 型別加、ANALYTICS.md 勾、README 隱私表加一列。

### 5.9 Offline SW

`public/sw.js` 只快取同源與字型，Supabase 請求不會被攔。不用改。

---

## 6. 文件要跟著動的地方

- README / README.en：功能、「資料與隱私」加 Supabase 一列（送什麼、存哪、不送什麼）、已知限制（單人、last-write-wins）。
- MVP.md：同步規格、決策表（本來「資料只在瀏覽器」要改成「預設只在瀏覽器，登入後多一份在雲端」）、changelog。
- CHANGELOG.md：一行。
- CLAUDE.md：新 invariant（雲端資料形狀 = 匯出格式；pull 走 `applyImport`；`nomad` schema 的 migration 住在 wordrobe repo；`takeAuthCode` 在 `initAnalytics` 之前）。
- HelpDialog 三語。

---

## 7. 待決定（我的預設）

| # | 決定 | 預設 | 理由 |
|---|---|---|---|
| D1 | migration 檔住哪 | **wordrobe repo** `supabase/migrations/` | 一個 project 只能有一個 `supabase_migrations` 的擁有者，兩個 repo 各自 `db push` 會互相把對方的版本當成缺檔。planner repo 放一份唯讀副本 `docs/nomad-schema.sql` 供對照。 |
| D2 | 整包 jsonb vs 拆表 | **整包** | §3.1 |
| D3 | `handle_new_user` 會替 planner 使用者建 wordrobe profile + Default library | **接受** | OAuth 流程帶不了「我是哪個 app」的 metadata，trigger 分不出來。代價是 wordrobe 多幾個空 profile。替代方案是把 wordrobe 的 Default library 改成第一次用時才建，那是 wordrobe 的事。 |
| D4 | 衝突處理 | **last-write-wins + 首次登入問一次** | 單人產品 |
| D5 | settings 要不要同步 | **要** | 手機要頭像與 183 天的國家 |
| D6 | 登出後本機資料 | **留著** | 和現在一樣，最不意外 |
| D7 | anon key 放哪 | **寫在 `cloud.ts`** | 公開金鑰，省 CI secret |
| D8 | 刪帳號 | **第五階段再做** | 需要 edge function |

---

## 8. 之後搬家的路

1. 新 project 跑同一支 migration。
2. `pg_dump -n nomad --data-only` → restore。
3. auth：`select * from auth.users where id in (select user_id from nomad.plans union select user_id from nomad.settings)` 連同 `auth.identities` 匯出匯入，uuid 保住，`user_id` 才對得上。Google identity 以 provider id 綁定，使用者重新登入一次即可。
4. planner 的 `cloud.ts` 換 URL 與 key，redirect URL 在新 project 設一次。
5. 舊 project `drop schema nomad cascade`。

最麻煩的是第 3 步，但只搬有 nomad 資料的人，不碰 wordrobe 的使用者。

---

## 9. 階段與驗收

### 階段 1：資料庫（半天）
- [ ] wordrobe repo 加 migration，`supabase db push`
- [x] dashboard：Exposed schemas 加 `nomad`；Redirect URLs 加四個（2026-10-28 設好）
- [ ] 用 SQL editor 以某個測試帳號 `set role authenticated; set request.jwt.claims` 驗 RLS：讀不到別人的列
- 驗收：`curl` 帶另一人的 JWT 查 `/rest/v1/plans` 回空陣列

### 階段 2：登入 + plans 同步（兩到三天）
- [ ] `cloud.ts`、`sync.ts`、`useCloudSync`、`AccountMenu`、`SyncConflictDialog`
- [ ] `main.tsx` 的 `takeAuthCode()`
- [ ] 文件（§6）、analytics（§5.8）
- 驗收：A 瀏覽器拖一個 stay，B 瀏覽器切回前景 2 秒內看到；B 是手機尺寸時只讀；斷網改、回網推；首次登入三種情境各走一次；GA console 看不到 `code=`

### 階段 3：settings 同步（半天）
- [ ] profile 頁儲存後 push；planner 載入 pull
- 驗收：電腦換頭像，手機重新整理看到

### 階段 4：Realtime（半天）
- [ ] migration 加 publication；`useCloudSync` 訂閱 `postgres_changes`
- 驗收：兩個視窗並排，不用切前景就同步

### 階段 5：刪帳號 edge function（半天，可延後）

---

## 10. 風險

- Wordrobe 一次失敗的 migration 或暫停會連帶影響 planner；反過來 planner 的流量也算在 Wordrobe 的配額裡。目前兩邊都小，可接受；量起來就走 §8。
- `handle_new_user` 之後若再加東西（例如寄歡迎信），planner 的使用者也會收到。wordrobe 改 trigger 時要記得。
- GitHub Pages 的 OAuth redirect 走 query string，planner 任何新的「讀網址」邏輯都要在 `takeAuthCode` 之後。

---

## 11. Planner 端 UI：登入、登出、同步狀態（只做 Google）

2026-10-27 補。原則：**登入是加法。** 沒登入的人看到的畫面一個像素都不變，只多一個入口；登入後畫面也只多一顆狀態點。沒有登入牆、沒有歡迎頁、沒有 onboarding。

### 11.1 入口在哪（四個，由主到次）

| # | 位置 | 未登入 | 已登入 | 為什麼放這 |
|---|---|---|---|---|
| 1 | **設定頁 /profile/，最上面新增「帳號」區** | 一段說明 + 「使用 Google 登入」 | email、上次同步時間、「登出」、「刪除雲端資料」 | 每個 app 的帳號都在設定裡；備份間隔也在這頁 |
| 2 | **⋯ 選單**，在「傳到其他裝置」下方 | 「登入以同步」（開啟 Google） | 不出現 | 「傳到其他裝置」是現在跨裝置的解法，登入是它的升級版，放一起 |
| 3 | **備份提醒條**（BackupReminder） | 多一句「或登入後自動備份到雲端」+ 按鈕 | 永遠不出現（push 成功 = 已備份） | 使用者在這一刻正在煩惱「資料只在這台」 |
| 4 | **手機空狀態**（`mobile.empty`） | 文案加「或用 Google 登入，看電腦上排好的行程」+ 按鈕 | 不出現 | 手機是做同步最大的理由；現有文案叫人掃 QR code，登入是更短的路 |

不新增 header 按鈕。header 已有復原、重做、⋯、頭像四樣，再加一顆就擠，而且登入是一輩子按一次的事。

### 11.2 登入流程

1. 按任一入口 → `signInWithOAuth({ provider: 'google', options: { redirectTo } })`，**整頁跳去 Google**。`redirectTo` 是按下去的那一頁（`/app/` 或 `/profile/`），回來才不會迷路。
2. 回來帶 `?code=`，`takeAuthCode()` 先把它拿掉，supabase-js 換 session。
3. 第一次登入：`lib/sync.ts` 判斷（§5.3）：
   - 雲端空 → 靜默 push，header 的狀態點變綠，不打擾。
   - 這台空 → 靜默 pull，行程直接出現（走 `applyImport`，可 undo）。
   - 兩邊都有且不同 → **`SyncConflictDialog`**（§11.4）。
4. 之後每次開頁：有 session 就靜默 pull，沒有就什麼都不做。

Google 同意畫面會顯示 **OAuth client 所屬 GCP project 的名稱**，也就是 Wordrobe 的。見 D9。

### 11.3 header 的狀態點

掛在既有的 `profile-link`（頭像／人形 icon）右下角，6px 圓點，只有登入後才出現：

| 狀態 | 顏色 | title / aria-label |
|---|---|---|
| 已同步 | 綠（`--green`，沿用色盤） | 已同步 |
| 推送中／有未推的變動 | 琥珀（`--orange`），`prefers-reduced-motion` 以外慢速呼吸 | 同步中 |
| 離線且有未推的變動 | 灰 | 離線，上線後會同步 |
| 失敗（4xx/5xx、RLS 拒絕） | 紅 | 同步失敗，稍後再試 |

點本身不可按（頭像連結本來就通到設定頁，設定頁有完整狀態）。手機也顯示，但手機只 pull，所以只會有綠、灰、紅。

不做 toast、不做「已儲存」文字。拖一下就寫一次，文字會閃個不停。

### 11.4 `SyncConflictDialog`

只在首次登入且兩邊不同時出現。用 `.editor` 殼、`useScrollLock`，標題「雲端和這台的行程不同」。

主體：兩欄卡片，左「雲端」右「這台」，每欄列出有差異的年份：

```
雲端                         這台
2027　12 段行程               2027　14 段行程
2028　3 段行程                2028　—
最後更新 3 天前               這台現在的內容
```

只列有差的年份，相同的不提。設定（頭像等）不列在這裡：雲端有就用雲端，沒有就 push 這台，不問。

按鈕列（`.buttons`）：
- **「用雲端的」** primary：這台的被覆蓋。按下去之前，若這台有雲端沒有的內容，先自動 `exportJson('conflict')` 存一份檔案，再 pull。這樣「選錯了」有救。
- **「用這台的」**：push 全部覆蓋雲端。雲端的舊內容不另外備份（它本來就是從某台裝置推上去的）。
- **「稍後」**（含 Esc、點 backdrop）：保持登入但**同步暫停**，header 狀態點變灰，header 下方出現一條和備份提醒同款的條：「雲端和這台的行程不同，還沒選要用哪一份。」+ 按鈕「選擇」重開這個對話框。暫停期間不 push 不 pull，本機照常用。

兩邊同時改、合併、逐段挑選：不做。單人產品，第一版沒有這個需求。

### 11.5 設定頁的「帳號」區

放在「關於我」上面，是這頁第一個區塊。

未登入：
```
帳號
登入後，行程和設定會多存一份在雲端，手機和電腦看到同一份。不登入也能照常使用。
[ G  使用 Google 登入 ]
```
按鈕是一般 `button.primary` 加 Phosphor `GoogleLogo` 16 bold，不用 Google 官方按鈕素材（官方規範要求的白底多彩 G 跟整站黑白像素風不合；非正式產品可接受，之後若送 OAuth 驗證再換）。

已登入：
```
帳號
simon@gmail.com　　已同步 · 上次同步 剛剛
[ 登出 ]                                   刪除雲端資料
登出後這台的行程會留著。
```
- 「上次同步」用 `useTween` 以外的普通文字，不滾動。
- 「刪除雲端資料」是文字按鈕、紅字、靠右；按了開一個小確認對話框：「會刪掉雲端的所有行程與設定，這台瀏覽器的不受影響。」→「刪除」／「取消」。刪完維持登入狀態，狀態點回到綠（雲端空，下一次變動會再 push）。想要「刪完就不再同步」的人自己按登出。
- 刪帳號（`auth.users`）第一版不放按鈕，說明文字寫「要刪除帳號請用問題回報告訴我」，等第五階段的 edge function。

另外這頁的 `profile.aboutText`「免登入、沒有後端」要改成「不用登入也能用；登入後可以跨裝置同步」。

### 11.6 ⋯ 選單與提醒條的文案

- ⋯ 選單項：icon `CloudArrowUp`，文字「登入以同步」。按下直接跳 Google，不先開說明（說明在設定頁與 HelpDialog）。
- 備份提醒條：現有兩顆按鈕「匯出備份」「稍後提醒」後面加第三顆次要按鈕「登入同步」。
- 手機空狀態：現有一段話後面加一行「或用 Google 登入，看電腦上排好的行程。」和按鈕「使用 Google 登入」。

### 11.7 登出

設定頁按「登出」→ `signOut()`，session 清掉，`dnp-sync` 清掉，localStorage 的行程與設定**原樣留著**，狀態點消失。沒有確認對話框：登出不會弄丟任何東西。

再登入同一個帳號時又是「首次登入」判斷：兩邊通常一樣，靜默；若這台在登出期間改過，走 §11.4。

### 11.8 文案 key（三語都要，先列中文）

```
account.title            帳號
account.why              登入後，行程和設定會多存一份在雲端，手機和電腦看到同一份。不登入也能照常使用。
account.signIn           使用 Google 登入
account.signedInAs       {email}
account.signOut          登出
account.signOutNote      登出後這台的行程會留著。
account.deleteCloud      刪除雲端資料
account.deleteConfirm    會刪掉雲端的所有行程與設定，這台瀏覽器的不受影響。
account.deleteDo         刪除
account.deleteAccount    要刪除帳號，請用「問題回報與建議」告訉我。
sync.synced              已同步
sync.syncing             同步中
sync.offline             離線，上線後會同步
sync.error               同步失敗，稍後再試
sync.last                上次同步 {when}
sync.conflict.title      雲端和這台的行程不同
sync.conflict.cloud      雲端
sync.conflict.local      這台
sync.conflict.stays      {n} 段行程
sync.conflict.updated    最後更新 {when}
sync.conflict.now        這台現在的內容
sync.conflict.useCloud   用雲端的
sync.conflict.useLocal   用這台的
sync.conflict.later      稍後
sync.conflict.exported   已先把這台的匯出一份
sync.paused              雲端和這台的行程不同，還沒選要用哪一份。
sync.choose              選擇
toolbar.signIn           登入以同步
backup.signIn            登入同步
mobile.signIn            或用 Google 登入，看電腦上排好的行程。
```

`{when}` 走現有的相對時間 helper（備份提醒已有「{n} 天前」的寫法，補「剛剛」「{n} 分鐘前」「{n} 小時前」）。

### 11.9 新增與修改的檔案

新增：`components/AccountSection.tsx`（設定頁用）、`components/SyncConflictDialog.tsx` + `.css`、`components/SyncPaused.tsx`（提醒條同款，可直接把 BackupReminder 泛化成 `NoticeStrip`）、`hooks/useCloudSync.ts`、`lib/cloud.ts`、`lib/sync.ts`。

修改：`Toolbar.tsx`（選單項、狀態點）、`Toolbar.css`（狀態點）、`BackupReminder.tsx`（第三顆按鈕）、`MobileItinerary.tsx`（空狀態按鈕）、`profile/Profile.tsx`（帳號區）、`main.tsx` 與 `profile/main.tsx`（`takeAuthCode`）、`App.tsx`（接 hook、對話框、暫停條）、`i18n.tsx`、`HelpDialog.tsx`、`analytics.ts`。

設計系統頁 `DesignSystem.tsx` 加狀態點與衝突對話框的靜態範例。

### 11.10 連帶要改的對外說法

- 產品介紹頁的「0 個帳號」統計：改成「0 個必要帳號」或換一個數字（例如「3 種語言」已有；可換「1 次登入，所有裝置」）。決定時再定。
- MVP.md「不做的」清單裡的「登入、雲端同步」移到規格；「之後的方向 8. 選用的雲端同步」劃掉。
- README 開頭「沒有帳號、沒有後端」改成「不用帳號也能用；登入 Google 可跨裝置同步」。

### 11.11 新增待決定

| # | 決定 | 預設 | 理由 |
|---|---|---|---|
| D9 | Google 同意畫面顯示的名稱是 Wordrobe 的 GCP project 名 | **把 GCP OAuth consent screen 的名稱改成中性的（例如 "Simon Lin"），兩個產品共用** | 同意畫面的名稱是 GCP project 層級的，開第二個 client 也一樣；改名對 Wordrobe 既有使用者無害 |
| D10 | 「用雲端的」之前自動匯出這台 | **是** | 唯一會丟資料的按鈕，一個檔案換一份保險 |
| D11 | 狀態點 vs「已同步」文字 | **點** | 拖拉是高頻操作，文字會閃 |
| D12 | 登出要不要確認 | **不要** | 不丟資料 |

---

## 12. 既有使用者的本機資料怎麼上雲

2026-10-28 補。

### 12.1 沒有「搬遷日」

資料從來不在伺服器上，只在每個人的瀏覽器裡。能碰到它的只有那個瀏覽器，而且只有在那個人登入之後。所以：

- 資料庫建好、client 上線，什麼事都不會發生。沒登入的人一切照舊，永遠不會被要求登入。
- **第一次登入 = 轉移。** 就是 §5.3 的那一列「第一次登入，本機有、雲端沒有 → push 全部」。沒有另一支轉移程式。
- 每個人、每台瀏覽器各自轉移一次。`dnp-sync` 不存在就視為第一次。

### 12.2 第一次登入 push 的內容

1. 每個有行程的年份：`loadYearPlan(year)` → `serialize()` → `nomad.plans` 一列。`load()` 本來就過 `sanitize`，所以舊格式（週索引、`location` 欄位、中文國名）在這一步已經轉成現行格式，雲端永遠只有現行格式。
2. `getProfile()` → `nomad.settings` 一列（含頭像）。
3. push 成功 → `markBackedUp`，備份提醒安靜下來。
4. 本機資料**不動**。push 是複製，不是搬走。

空年份不推、也不建列；本機把某一年刪空時，push 端 `delete` 那一列而不是存空陣列，這樣「雲端有沒有這一年」的語意乾淨。

### 12.3 第二台裝置登入時

常見情境：電腦排好 → 之前用「傳到其他裝置」QR 搬過一份到手機 → 現在兩台都有，手機那份比較舊。

決定是**整份一次做**，不是逐年問：
- 雙方都有的年份逐年比 hash；全部相同 → 靜默，不打擾。
- 只有一邊有的年份 → 直接補齊（本機有就 push，雲端有就 pull），這不算衝突。
- 至少一年不同 → 開 §11.4 的對話框一次，選擇套用到所有不同的年份。對話框把 `updated_at` 較新的一側標成建議（通常是雲端），因為手機那份幾乎一定比較舊。

手機是唯讀，但第一次登入時例外允許它 push：那是搬資料，不是編輯。之後手機只 pull。

### 12.4 上線順序

1. wordrobe repo 跑 migration（§3.2）、dashboard 設定（§3.3）。此時沒有任何 client 會打它，零風險。
2. planner 一次 push 到 `main`，GitHub Pages 發布登入功能。
3. CHANGELOG 一行 + 產品介紹頁與設定頁文案改掉「免登入」。
4. 備份提醒條與 ⋯ 選單裡的入口就是通知，不另外做公告橫幅。

沒有停機，沒有版本切換期。

### 12.5 之後雲端格式要改怎麼辦

跟現在的檔案匯入一樣：`sanitize` 接受所有舊格式，pull 下來就轉。寫入永遠是最新格式。所以不需要 `format` 欄位，也不需要在 SQL 裡改 jsonb。要是哪天真的得全表改寫，`nomad` schema 一句 `update nomad.plans set data = …` 的範圍也很清楚。


---

## 13. 實作時與計畫不同的地方（2026-10-28）

- **刪除雲端資料會把所有裝置都登出**（§11.5 原本說維持登入）。任何一台留著登入，下一次變動就會把行程又推上去，「刪除」變成沒刪。一般登出只登出這一台。
- **同步從不刪列。** §12.2 原本說清空的年份刪那一列；改成推一列空的，清空才會傳到別台。整列不見只會發生在別台刪了雲端資料，那時有記錄的年份把本機推回去，絕不清掉任何一台的行程。
- **migration 用 Supabase MCP 直接套用**，版本號 `20261027234255`，檔案同時放進 wordrobe repo 的 `supabase/migrations/` 與這裡的 `docs/nomad-schema.sql`。檔案寫成可重跑（DROP … IF EXISTS），wordrobe 之後 `db push` 不會撞。
- **Realtime 一開始就做了**（原本第四階段），migration 裡把兩張表加進 `supabase_realtime` publication，hook 訂閱 `postgres_changes`；自己推上去的回音在 3 秒內忽略。
- **`touch_updated_at` 加了 `SET search_path = ''`**，Supabase 的安全檢查會抓這個。
- **`detectSessionInUrl` 關掉**，由 `takeAuthCode()` 在載入 GA 之前把 `?code=` 從網址拿掉並暫存，再 `exchangeCodeForSession`；交給 supabase-js 自己讀網址會讓 code 先進到 GA 的頁面瀏覽。
- **兩邊都改的「後改的贏」**用本機第一次偏離記錄的時間（`dirtySince`）比雲端 `updated_at`；沒有本機時間時雲端贏。
- **設定從沒改過就不建列**（本機是預設值且雲端沒有列時不推）。
- **設定頁有自己的小 hook**（`useSettingsSync`），只碰 `dnp-sync` 的 settings 部分，寫回前重讀整份，免得蓋掉 planner 分頁的記錄。
- **衝突對話框永遠把「用雲端的」當主要按鈕**，不依 `updated_at` 判斷哪邊新（§12.3 原本說要標）。
- **刪除雲端資料用原生 `confirm()`**，與匯入取代的確認一致，不另做對話框。
- 已做（2026-10-28）：dashboard 的 Exposed schemas 已加 `nomad`，Redirect URLs 已加 GitHub Pages 與 localhost 的 `/app/`、`/profile/` 四個；真實 Google 登入、首次推送四年＋設定、Realtime 拉回、設定頁帳號區都在 Chrome 驗過。尚未做：D9 的 GCP consent screen 改名；刪帳號 edge function。
