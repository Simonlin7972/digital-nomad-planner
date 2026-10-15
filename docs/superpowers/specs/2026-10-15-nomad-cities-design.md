# 十大數位遊牧城市頁 — 設計

日期：2026-10-15
狀態：設計已確認，待寫實作計畫

## 一句話

新增一個靜態內容頁 `/cities/`，用卡片加短文介紹十個適合數位遊牧的城市，資料手工整理成 repo 內的 TypeScript 檔，三語，不爬任何網站；資料檔的鍵與行程的地點存法一致，之後 planner 的「探索」入口可直接沿用。

## 目標與範圍

- 給還沒用 planner 的人看（SEO、吸新人），也給已經在用的人當參考。
- 第一版只做內容頁與連結進來；planner 內的入口（Phase 2）另開 spec，本版只保證資料介面可接。
- 十個城市固定，標題就叫「十大」。名單：清邁、曼谷、峇里島（倉古）、峴港、吉隆坡、台北、東京、里斯本、第比利斯、墨西哥城。

## 決策

| 決定 | 選擇 | 理由 |
|---|---|---|
| 資料來源 | 手工查公開資料、用自己的話寫，每城附來源 URL | 主流站 ToS 多禁爬取，文章直接複製是版權問題 |
| 資料放哪 | 一個 TS 檔 `src/lib/nomadCities.ts` | 跟 `seasons.ts` / `airlines.ts` 同套做法；tsc 是專案唯一自動檢查，缺欄位 build 就紅；planner 之後直接 import |
| 內容深度 | 卡片欄位 + 300–500 字短文 | 兩者都要 |
| 頁面形式 | 一頁到底：卡片格在上、文章依序在下，卡片連到錨點 | 無 router，最簡單，單城可分享 |
| 三語 | zh / en / ja 都真寫，不回退 | 文章是主要內容，回退英文體驗差 |
| 最佳月份 | 不另存，讀 `seasons.ts` | 單一來源；缺的城市補進 `seasons.ts` |
| 簽證 | 以台灣護照為預設，一行，註明查證年月 | 頁面不讀 profile，保持純靜態 |
| Analytics | 只有 production 自動的 page_view | 城市 id 是地點，依規不進事件 |
| 擴充 | 長到數十城時拆一城一檔，型別與 export 不變 | 純搬動，不改機制 |

## 資料模型

`src/lib/nomadCities.ts`：

```ts
type Text = { zh: string; en: string; ja: string };

export type NomadCity = {
  id: string;        // 'chiang-mai'：錨點與 i18n 鍵尾碼
  country: string;   // ISO code，同 Stay.country
  city: string;      // 清單上的英文名，同 Stay.city，也是 seasons.ts 的鍵
  rent: number;      // 一房月租概略，USD，取整
  monthly: number;   // 全部月花費概略，USD，取整
  wifi: number;      // 固網常見下載速度 Mbps
  timezone: string;  // IANA，如 'Asia/Bangkok'
  visa: Text;        // 一行，台灣護照為準
  pros: Text[];      // 3 條
  cons: Text[];      // 2 條
  article: Text;     // 300–500 字，段落以空行分
  sources: string[]; // 數字的來源 URL，至少一個
};

export const NOMAD_CITIES: NomadCity[]; // 依排名 1–10
```

- 卡片上的短句（一句定位）與頁面 UI 字串進 i18n 字典，鍵 `cities.*`；`visa`、`pros`、`cons`、`article` 是資料，留在資料檔（同 `seasons.ts` notes 的慣例）。
- 旗與國名用 `Flag` + `countryOf`，城市名用 `cityOf`。
- 數字為概略、非即時；頁面明說。

## 頁面結構

新入口 `cities/index.html`（加進 `vite.config.ts` 的 `build.rollupOptions.input`），`src/cities/`：

- `main.tsx`：掛載，同 changelog。
- `Cities.tsx` + `Cities.css`：整頁。
- `CityCard.tsx` + `.css`、`CityArticle.tsx` + `.css`。

由上到下：

1. `PillNav`（`className="cities-nav"`）：品牌回 landing、語言鈕、「打開 planner」。
2. 標題區：`cities.title`、副標、一行「數字為概略、來源在頁尾」。
3. 卡片格：10 張 `CityCard`，桌機 2 欄、手機 1 欄。每張：旗 + 城市／國名、一句定位、三個數字（月租／月花費／網速）、12 格最佳月份色條（`seasons.ts` ratings，配色同 `SeasonStrip`）、簽證一行。整張是 `<a href="#<id>">`。
4. 文章區：10 個 `<section id="<id>">`：標題列（旗、名、`#n`）、亮點 3／缺點 2 兩欄、文章段落、該城 sources 小字。
5. `Footer`（既有）。

行為：

- 語言切換走 `useLocale` / `nextLocale`，全頁重繪。
- 帶 hash 載入由瀏覽器原生跳錨點，`scroll-margin-top` 留 nav 高度，不寫 JS 捲動。
- 不讀 plan、不讀 profile、不打網路。
- Service worker 規則不變（同源檔案本就全快取），`CACHE` 不動。
- 靜態 title / meta description / og 標籤三語，`og:url` 指 GitHub Pages 絕對位址。

連結進來：landing nav、landing footer、planner `Footer` 各加 `cities.title`。

## 內容製作

- 數字：查 Nomad List 公開頁、Numbeo、Speedtest 城市資料、各國移民署／外交部，手工填，記 `sources`。
- 文章：三語各自寫，非機翻。先交 2 城審語氣，過了再補 8 城。
- `seasons.ts` 缺的城市補齊，照既有規則（12 評分、12 高低溫、0 配 avoid 註、2 配 best 註）。
- 簽證查證年月：2026-10。

## 文件同步

- README.md / README.en.md：功能、專案結構（`/cities/`、`src/cities/`、`lib/nomadCities.ts`）、第三方資源（來源站）、已知限制（數字概略、非即時）。
- MVP.md：功能規格新段、決策表三條（手寫不爬、三語真寫、不讀 profile）、「之後的方向」第 1 條改為部分完成、變更紀錄一行。
- CHANGELOG.md：一行 zh + EN。
- CLAUDE.md：架構段加 `nomadCities.ts` 慣例；Deployment 段的頁面數改五個。
- HelpDialog 不動。

## 驗證

- `npx tsc --noEmit`、`npm run build`。
- preview 開 `/cities/`：三語切換、`#tbilisi` 直達、手機寬度單欄、連結進來三處。
- 不碰 localStorage。

## Phase 2 介面（本版不做）

- planner 工具列「探索」→ dialog 列 10 張卡 → 「加入行程」用 `insertStay` 放進第一個夠長的空檔。
- `NOMAD_CITIES[i].country` / `.city` 可直接當 `Stay` 的地點，不需轉換。

## 不做的

- 爬蟲、runtime 抓資料、即時數字。
- 搜尋、篩選、排序。
- 讀 profile 改簽證文字。
- 城市事件進 analytics。
