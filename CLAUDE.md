# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

A single-page planner for a year of digital nomading (2025 to 2028; 2027 by default). Vite + React 19 + TypeScript, no backend; all data lives in the browser's `localStorage`. The UI is in Traditional Chinese, English and Japanese.

- Product behaviour and decisions: [MVP.md](MVP.md)
- Setup, data format, structure, design notes: [README.md](README.md)

## Commands

```bash
npm run dev      # dev server: landing page on http://localhost:5173/, the app on /app/, the design system on /design/ (strict port)
npm run build    # tsc --noEmit, then vite build
npx tsc --noEmit # type-check only
```

There are no tests and no linter. `tsc --noEmit` is the only automated check, so run it after every change.

## Keep the docs in sync

Whenever a change adds, removes or alters behaviour, update in the same piece of work:

- **README.md** — features, controls, data format, project structure, known limits, third-party resources
- **README.en.md** — the English translation of README.md; mirror every README.md change there, section for section
- **MVP.md** — the spec for the affected area, the decision table if a decision changed, and one line in the changelog
- **CLAUDE.md** — only when a convention, invariant or workflow described here changes
- **CHANGELOG.md** — one user-facing line for what changed, in Traditional Chinese with an indented `EN:` line below it, under today's `## YYYY-MM-DD` heading (add the heading if it isn't there; newest day first). It is the source of the public /changelog/ page and is published with every push, so write for people using the planner, not about code. Skip it only for changes nobody using the site would notice, and say so

A Stop hook (`.claude/hooks/docs-check.sh`) blocks once when code under `src/` or a page entry (`index.html`, `app/index.html`, `changelog/index.html`) has changed without all four files being touched. If a file genuinely needs no change, say so explicitly rather than editing it for the sake of it.

## Architecture you need to know

- **Layout.** `src/App.tsx` owns the plan and page-level state and wires things together. `src/components/` holds the UI (each with its `.css` beside it), `src/hooks/` the stateful helpers, `src/lib/` everything that isn't UI. Views own their own drag state and report results through callbacks; they never hold the plan.
- **Dates are day indexes.** Day 0 is the Monday of the week containing 1 Jan of `YEAR` (2026-12-28 for 2027), so `day % 7` is the weekday. `YEAR` and the date model built from it (`WEEKS`, `DAY0`, `TOTAL_DAYS`, `SLOTS`, `MONTHS`) are live `let` exports of `lib/weeks.ts`; `setYear` rebuilds them, saves `dnp-year` and notifies, and `App` remounts the page keyed by year. So never copy them into module-level constants (compute per call, as `storage.ts` does with `planKey()`), and never reload the page to change year. Never hard-code a year: use `YEAR`, `DAY0`, `monthRange`. Each year has its own plan (`dnp-plan-<year>`). Holiday data exists for 2026 and 2027; `holidaySets` returns none for other years, and clips holidays to the timeline so the borrowed days at either end show their neighbours' holidays. A stay is `{ startDay, endDay }` inclusive in memory and ISO strings on disk. Helpers are in `src/lib/weeks.ts`.
- **The year view is approximate, the data is exact.** The timeline has two half-week slots per week; each end of a stay snaps to the nearest slot boundary for drawing only (`slotsOf`). At 300% zoom and above `YearView` switches its grid to one column per day (see `gridOf`): everything positional there goes through the current `Grid` (`cols`, `boundary`, `n`, `perWeek`), never `SLOTS` or `slotsOf` directly, and a drag keeps the unit it started with. Never round the stored dates to fit the display.
- **Stays never overlap.** Every path that changes stays must keep this true.
- **All plan changes go through `setStays` in `App.tsx`** (from `useHistory`). It pushes onto the undo stack. Do not write to `localStorage` or mutate stays any other way. The one exception is import, which writes the years not on screen with `saveYearPlan`.
- **Export and import cover every year.** The file is `{ version: 2, years: { <year>: <single-year plan> } }` (`serializeAll` / `sanitizeAll` in `lib/storage.ts`); a single-year file still imports, into the year it names. Other years are read and checked with `inYear(year, fn)` from `lib/weeks.ts`, which runs `fn` with that year's date model and puts the current one back.
- **Position logic is pure and lives in `src/lib/storage.ts`.** `reorderStays` (dragging a whole stay: list-style reorder), `pushStays` (stretching an edge: shove neighbours), `insertStay` (alt-drag: insert a copy, never moving anything before it, shifting what follows later) and `splitStay` (hold B and click: cut one stay in two; the second part gets a new id and no ticket). During a drag they are recomputed from the original stays on every pointer move, so no drag state accumulates.
- **Every import goes through `applyImport` in `App.tsx`**: the JSON file (menu or dropped on the page) and the "send to another device" link (`lib/transfer.ts`, the plan compressed after `#plan=`). `takeTransferHash()` runs in `main.tsx` before `initAnalytics()` so the plan never reaches the page address GA records; keep it first. A link import is not a backup (no `markBackedUp`).
- **Offline is a hand-written service worker** (`public/sw.js`, registered by `lib/offline.ts` in production only). It keeps same-origin files and the two font hosts, nothing else. Bump `CACHE` in it if its caching rules change. Testing it needs `npm run build` and the `preview` launch config; a production build loads GA, so open it with `?internal=1`.
- **Imports are sanitised.** `sanitize` drops malformed or overlapping entries and accepts two legacy formats. New fields on `Stay` need handling in `serialize`, `sanitize`, the editor, and the README data-format section.
- **The PNG export is drawn separately** in `src/lib/exportPng.ts` on a canvas, in two layouts (`renderPng` landscape, `renderPortraitPng` 9:16). New visual elements do not appear there unless added. It is opened from the Share dialog (`components/ShareDialog.tsx`), which previews the image before download. Flags are drawn from the URLs the flag-icons stylesheet resolved; keep flight details and booking references out of the image.
- **Phones are read-only.** Below 720px, or on a touch screen under 500px tall (a phone on its side), `App.tsx` swaps the timeline, calendar and list for `components/MobileItinerary.tsx` and never opens the editor. Anything new that edits the plan belongs in the desktop branch only. The query is `NARROW_QUERY` in `hooks/useNarrow.ts`; phone CSS uses the same media query, not a bare `max-width: 720px`. `MobileItinerary`'s now / next card reads every year's plan; the phone's switch to the current year happens in `App.tsx` before the first render, never from an effect, since switching while a plan is mounted would save it under the new year.
- **Places are stored language-neutrally.** A stay's `country` is an ISO code or region id and its `city` the listed city's English name; unlisted values are kept as typed. Show them with `countryOf` / `cityOf` / `placeName` / `placeFull` from `lib/storage.ts`, never the raw field. `normalizeCountry` / `normalizeCity` convert typed or legacy names on save and on load.
- **Country names come from the browser.** `src/lib/flags.ts` builds the list from `Intl.DisplayNames` plus a few regions and aliases. The pickers (`src/components/Combobox.tsx`) still accept free text, so never assume a stay's country or city is on a list.
- **The city list is a typing aid.** `src/lib/cities.ts` holds a hand-written `[Chinese, English]` list per ISO code. It is deliberately incomplete and carries no coordinates; unlisted cities are normal and get no warning.
- **Stay rules are derived, never stored.** `src/lib/stayRules.ts` computes gaps, the Schengen 90/180 count and Taiwan's 183 days from the stays on every render. The Schengen list is ISO codes, so it only sees countries picked from the list.
- **The backup reminder is not plan data.** `src/lib/backup.ts` keeps its own record per year (`dnp-backup` for 2027, `dnp-backup-<year>` otherwise) (fingerprint of the last export or import). Call `markBackedUp` from any new path that writes the plan to a file the user keeps.
- **Season data is fixed and hand-written** in `src/lib/seasons.ts`, keyed by stored `country/city`. Keep it consistent: twelve ratings and twelve highs and lows per city (highs above lows), every month rated 0 covered by an `avoid` note and every month rated 2 by a `best` note. No weather API.
- **Analytics never carries plan data.** `src/lib/analytics.ts` loads GA4 in the production build only (`import.meta.env.PROD`); under `npm run dev`, `track()` logs `[analytics]` to the console instead. Every event goes through `track()`, whose names and parameters are fixed in its `Events` type: interface choices, `bucket()`ed counts and flags only, never places, dates, flights, notes or typed text. Fire events from callbacks (`App.tsx`, dialogs), not from views' drag logic. [ANALYTICS.md](ANALYTICS.md) holds the event plan and a checklist: **tick or add its items in the same piece of work whenever tracking code or the GA setup changes**, and keep the README privacy table in step with what is sent.
- **Coordinates** come from Nominatim via `src/lib/geocode.ts` (rate-limited, cached) and are shared through the `useCoords` hook.

## Conventions

- No UI framework, state library or drag-and-drop library. Interactions use native pointer events.
- Styles are plain CSS using the custom properties on `:root`. A component's rules go in the `.css` file beside it, imported by that component; only tokens and things several components share go in `src/styles/base.css`. `main.tsx` imports base before `App` so component rules win ties.
- The dialog shell class is `.editor` (in `components/Dialog.css`), shared by the stay editor and the help dialog.
- Typeface is 975HazyGo with two weights only: 400 and 600. Do not introduce 500 or 700. The one exception is the English tagline under the title (`.tagline`), set in Pixelify Sans 400 from Google Fonts; do not use that face anywhere else.
- The product name is the same in both locales: `app.title` (今天不在家工作) and `app.tagline` (A Digital Nomad Planner, used for the document title and the PNG export). The line under the page title is `components/Tagline.tsx`, which types `app.tagline.1`–`.3` in turn once per page load and stops on the last. The year is not part of the name; neither the page header nor the PNG export shows it.
- The header mascot (`components/PixelNomad.tsx`) is pixel art written as rows of characters, one per pixel, rendered to SVG rects and animated by swapping two frames in CSS. Edit the frame strings, not SVG paths; keep it decorative (`aria-hidden`).
- Icons are Phosphor at `weight="bold"`, imported per icon from `@phosphor-icons/react/dist/csr/<Name>`. Flags use `flag-icons` via `src/components/Flag.tsx`.
- **Every UI string goes through `src/lib/i18n.tsx`.** Add the key to the `zh`, `en` and `ja` dictionaries and use `t(key, vars)` (or `tr()` when a placeholder is a React node). Never hard-code display text in a component. A component that shows text calls `useLocale()` once so it re-renders on a language switch. Date and length text comes from the helpers in `lib/weeks.ts` and `daysText()`, which already follow the locale.
- Chinese strings are Traditional Chinese (Taiwan usage). Code, comments and commit messages are English.
- `HelpDialog` holds its prose per language rather than in the dictionary; change all three versions together.
- Locales are listed in `LOCALES` in `src/lib/i18n.tsx`; the language button calls `nextLocale()` to cycle through them, and `lang` attributes come from `langTag()`. Cities (`lib/cities.ts`), season notes (`lib/seasons.ts`) and changelog entries have no Japanese text and show English for `ja`; holidays (`lib/holidays.ts`) and country names (`lib/flags.ts`, via `Intl.DisplayNames('ja')`) do have it. Any new per-locale data must handle `ja`, by translation or by an explicit English fallback.
- Anything new that talks to the network must be listed under "資料與隱私" in the README.
- `src/components/HelpDialog.tsx` is the in-app guide. When a control, shortcut, or how data is stored or exported changes, update its text too.
- Dialogs call `useScrollLock()` so the page behind them doesn't scroll. On a phone the dialog shell and the ⋯ / year menus become bottom sheets (CSS only, under `NARROW_QUERY`); a menu renders a `.menu-scrim` sibling so a tap outside closes it without reaching the page.
- Hover styles that change a background go inside `@media (hover: hover)`, so they don't stick after a tap on touch screens.
- Dates are picked with `components/DatePicker.tsx` (ISO strings in and out), not `<input type="date">`.
- **The design system page** (`design/index.html`, `src/design/`) is dev-only: it is not a build input, so it is served by `npm run dev` and never published. It imports the real `base.css` and component stylesheets, so restyling a component shows there with no change; a new token, base component or state goes into `DesignSystem.tsx` by hand, and so do changes to the hard-coded sizes it lists. `forceStates.ts` copies every `:hover` / `:focus` / `:active` rule onto `.is-hover` / `.is-focus` / `.is-active` so states show at rest. Its text is Chinese only and skips the i18n dictionaries, the one exception to that rule.

## Verifying changes

- Use the preview (`.claude/launch.json`, name `dev`) and check behaviour in the browser, not just types.
- The preview shares one `localStorage` with whoever is using that browser. Before seeding test data, check `dnp-plan-<year>` (and `dnp-year`) are as you found them, and remove what you added afterwards. Never clear existing plan data.
- Pointer interactions can be exercised with synthetic `PointerEvent`s; stub `Element.prototype.setPointerCapture` first, since capture fails for synthetic pointer ids.
- Say plainly what was verified by simulation and what was not tried with a real mouse, trackpad or touch screen.

## Deployment

The site has three entries: `index.html` is the landing page (`src/landing/`) at the root, `app/index.html` is the planner at `/app/`, and `changelog/index.html` is the changelog page (`src/changelog/`) at `/changelog/`, rendered from `CHANGELOG.md` by `lib/changelog.ts` at build time. The landing demos are scripted redraws that never read the plan. Link-preview tags in both (`og:url`, `og:image`) hold absolute GitHub Pages addresses; change them if the site moves. `public/og.png` is a hand-made static image, not generated by the build: redo it when the name, mascot or look changes. The meta description is one trilingual string (Chinese, English, Japanese) because crawlers read the static HTML and never see the interface language; keep all three in step.

Pushing to `main` publishes the site to GitHub Pages through `.github/workflows/deploy.yml` (https://simonlin7972.github.io/digital-nomad-planner/). A push is therefore a release: make sure `npm run build` passes first. The build uses `base: './'`, so keep asset references relative.

## Git

- Commit and push only when asked.
- Work happens on `main`.
