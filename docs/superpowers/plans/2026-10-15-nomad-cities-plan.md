# 十大數位遊牧城市頁 — 實作計畫

Spec：[2026-10-15-nomad-cities-design.md](../specs/2026-10-15-nomad-cities-design.md)
日期：2026-10-15

## 前提（已查過）

- 十個城市 `seasons.ts` 全有資料：`th/Chiang Mai`、`th/Bangkok`、`id/Canggu`（alias → `id/Bali`）、`vn/Da Nang`、`my/Kuala Lumpur`、`tw/Taipei`、`jp/Tokyo`、`pt/Lisbon`、`ge/Tbilisi`、`mx/Mexico City`。**不用補 `seasons.ts`。**
- 十個城市 `cities.ts` 全有列名，`city` 欄位用上面的英文名。
- 頁面樣板：`changelog/index.html` + `src/changelog/`（`PillNav`、語言鈕、`landing.cta.open`、`landing.footer`）。
- `lib/links.ts` 放跨頁連結常數；`Footer.tsx` 是 planner 頁尾；landing 的 footer 在 `Landing.tsx` 第 180 行附近。
- Stop hook `.claude/hooks/docs-check.sh` 的頁面入口正則沒有 `cities/index.html`，要加。
- `sw.js` 規則不變，`CACHE` 不動。

每一步做完跑 `npx tsc --noEmit`。

---

## Task 1：資料檔骨架 + 兩城試寫（審稿閘門）

**檔案**：`src/lib/nomadCities.ts`（新）

1. 依 spec 寫 `Text`、`NomadCity` 型別與 `export const NOMAD_CITIES: NomadCity[]`。檔頭註解：資料手工整理、來源在每筆 `sources`、不爬、簽證以台灣護照為準、查證 2026-10。
2. 寫 **清邁** 與 **里斯本** 兩筆完整內容（數字、`visa`、`pros`×3、`cons`×2、`article` 三語 300–500 字、`sources`）。
3. 其餘八城先以 `// TODO Task 5` 註解佔位，**不要**放空字串假資料（tsc 會過但內容會上線）。暫時用 `NOMAD_CITIES` 只含兩筆。
4. 加 `export function nomadCityById(id: string)`：Phase 2 與錨點用。

**驗證**：tsc 過。把兩城內容貼給使用者審語氣與數字，**過了才做 Task 5**；Task 2–4 可先並行。

---

## Task 2：i18n 字串

**檔案**：`src/lib/i18n.tsx`（zh / en / ja 三本字典都加）

鍵：
- `cities.title`：十大數位遊牧城市 / Ten cities for digital nomads / デジタルノマド向け都市 10 選
- `cities.lead`：副標一句
- `cities.note`：「數字為概略，來源列在各城文末」
- `cities.rent`、`cities.monthly`、`cities.wifi`：卡片三個數字的標籤（月租／月花費／網速）
- `cities.usd`：`US$ {n}`；`cities.mbps`：`{n} Mbps`
- `cities.visa`、`cities.pros`、`cities.cons`、`cities.sources`、`cities.bestMonths`
- `cities.rank`：`#{n}`
- `cities.tagline.<id>` ×10：每城一句定位（三語）
- `footer.cities` 不另加，連結文字直接用 `cities.title`

**驗證**：tsc 過（`t()` 的鍵是型別檢查的話會抓漏；不是的話三本字典 grep 數量一致）。

---

## Task 3：頁面

**檔案**：
- `cities/index.html`（新，從 `changelog/index.html` 複製）：三語 `<title>`（十大數位遊牧城市 — 今天不在家工作 · Not WFH · 今日は在宅じゃない）、三語 meta description、`og:title` / `og:url`（`https://simonlin7972.github.io/digital-nomad-planner/cities/`）/ `og:image` 同其他頁；`<script src="/src/cities/main.tsx">`。
- `vite.config.ts`：`input` 加 `cities: 'cities/index.html'`，註解改「五個頁面」。
- `src/lib/links.ts`：加 `CITIES_URL = '../cities/'`。
- `src/cities/main.tsx`（新）：同 `changelog/main.tsx`，掛 `<Cities />`。
- `src/cities/Cities.tsx` + `Cities.css`（新）：
  - `PillNav className="cities-nav"`：品牌（`PixelNomad` + `app.title`）回 `HOME_URL`、語言鈕、`APP_URL` 的 CTA（`trackLink(e, 'cta_click', { location: 'cities' })`——先確認 `Events` 型別的 `location` 允許新值，不允許就加進型別並在 ANALYTICS.md 勾一項）。
  - `document.title` / `lang` 同 changelog 做法。
  - `<main>`：`h1 cities.title`、`p.lead`、`p.note`、`<ol class="city-grid">` 十張 `CityCard`、`<div class="city-articles">` 十個 `CityArticle`。
  - 頁尾：直接用 `components/Footer`（planner 的；確認其連結在 `/cities/` 下相對路徑正確——`HOME_URL = '../'` 從 `/cities/` 回根沒問題）。
  - CSS：容器 `max-width: 960px`，nav 與 footer 樣式比照 `Changelog.css`；`.city-grid` 2 欄 `grid-template-columns: repeat(2, 1fr)`，`@media (max-width: 720px)` 1 欄、padding 16px。
- `src/cities/CityCard.tsx` + `CityCard.css`（新）：
  - props `{ city: NomadCity; rank: number }`。
  - 整張 `<a href={`#${city.id}`}>`：`Flag` + `cityOf` / `countryOf`、`cities.rank`、`cities.tagline.<id>`、三個數字（`<dl>`）、12 格月份條（`seasonOf({ country, city }).ratings`，class `best/fine/avoid`，顏色值抄 `SeasonStrip.css` 的三色到本檔，不 import 它的 css）、`visa[locale]` 一行。
  - hover 用 `@media (hover: hover)`。
- `src/cities/CityArticle.tsx` + `CityArticle.css`（新）：
  - props 同上。`<section id={city.id}>`，`scroll-margin-top: 96px`（PillNav 高度，實測後調）。
  - 標題列：`Flag`、`h2` 城市名 + `small` 國名、`cities.rank`。
  - 兩欄 `ul.pros` / `ul.cons`（`cities.pros` / `cities.cons` 標題）。
  - 文章：`article[locale].split(/\n\s*\n/)` 每段一個 `<p>`。
  - `cities.sources`：`<ul>` 列 URL，`rel="noopener"`、`target="_blank"`，字小、`--muted`。
- 所有文字走 `t()`；元件各呼叫一次 `useLocale()`。

**驗證**：tsc；`npm run dev` 開 `http://localhost:5173/cities/`，兩城先顯示；切語言三種都換；`#lisbon` 直達；寬 375 單欄。

---

## Task 4：連結進來

**檔案**：
- `src/landing/Landing.tsx`：nav 加 `<a href="cities/">{t('cities.title')}</a>`（landing 在根，相對 `cities/`）；`l-footer` 加同一連結。確認 `Landing.css` 的 nav 在手機寬度能容納第三個連結，不行就只保留 footer 的。
- `src/components/Footer.tsx`：nav 加 `CITIES_URL` 連結，icon 用 Phosphor `MapPin`（`@phosphor-icons/react/dist/csr/MapPin`，`weight="bold"`）。
- `src/changelog/Changelog.tsx`：**不加**（spec 未列）。

**驗證**：三處連結點得到、回得來。

---

## Task 5：其餘八城內容（審稿過後）

**檔案**：`src/lib/nomadCities.ts`

依序補：曼谷、倉古、峴港、吉隆坡、台北、東京、第比利斯、墨西哥城。每筆同 Task 1 標準。`city` 用 `cities.ts` 列名：`Bangkok`、`Canggu`、`Da Nang`、`Kuala Lumpur`、`Taipei`、`Tokyo`、`Tbilisi`、`Mexico City`；`country` 小寫 ISO。拿掉 TODO。

**驗證**：tsc；頁面十張卡、十篇文；每城 `seasonOf` 有值（寫個一次性 console 檢查後移除，或肉眼看十條月份條都有色）。

---

## Task 6：文件與 hook

- `README.md`：「功能／其他」加城市頁一段；「專案結構」加 `cities/index.html`、`src/cities/`、`src/lib/nomadCities.ts`；「資料與隱私」說明此頁不打網路；「已知限制」加「城市數字為概略、2026-10 查證、非即時」；「第三方資源」列數字來源站。
- `README.en.md`：逐段鏡射。
- `MVP.md`：「功能規格」加〈城市介紹頁〉；決策表加三條（手寫不爬、三語真寫、不讀 profile）；「不做的」第 1 條改寫（仍無座標／時區以外的完整資料庫，但有十城介紹）；「之後的方向」第 1 條標「部分完成，planner 入口待做」；「變更紀錄」一行。
- `CHANGELOG.md`：今天 `## 2026-10-15` 下一行 zh + `EN:`。
- `CLAUDE.md`：
  - 「Architecture」加一條：`lib/nomadCities.ts` 手寫、鍵同 stay 地點、三語必填、`sources` 必填、頁面不讀 profile／plan／網路、數字不進 analytics。
  - 「Deployment」改五個入口，加 `/cities/`。
  - 「Keep the docs in sync」的入口清單加 `cities/index.html`。
- `.claude/hooks/docs-check.sh`：兩處正則加 `cities/index\.html$`。
- `ANALYTICS.md`：若 Task 3 新增了 `location: 'cities'`，勾一項。
- `HelpDialog`：不動，回覆時明說。

---

## Task 7：最終驗證

1. `npx tsc --noEmit`、`npm run build`。
2. `preview` launch config（port 4173）開 `/cities/?internal=1`：
   - 三語切換，文章、簽證、亮點都換。
   - `/cities/#tbilisi` 直達，標題不被 nav 蓋住。
   - 375px 寬：單欄、無橫向捲動。
   - landing、planner footer 連結到此頁並回得去。
   - console 無錯；network 只有同源與字型。
3. 不碰 `localStorage`（頁面本來不讀寫，確認 devtools Application 無新 key）。
4. 回報：模擬驗證了什麼、沒用真滑鼠／觸控試什麼。

---

## 順序與閘門

```
Task 1 (兩城) ──► 使用者審稿 ──► Task 5 (八城)
Task 2, 3, 4 可與審稿並行
Task 6 在程式碼定型後
Task 7 最後
```

不 commit、不 push，除非使用者說。
