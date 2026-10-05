# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

A single-page planner for a year of digital nomading (2027). Vite + React 19 + TypeScript, no backend; all data lives in the browser's `localStorage`. The UI is in Traditional Chinese and English.

- Product behaviour and decisions: [MVP.md](MVP.md)
- Setup, data format, structure, design notes: [README.md](README.md)

## Commands

```bash
npm run dev      # dev server on http://localhost:5173 (strict port)
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

A Stop hook (`.claude/hooks/docs-check.sh`) blocks once when code under `src/` or `index.html` has changed without all three files being touched. If a file genuinely needs no change, say so explicitly rather than editing it for the sake of it.

## Architecture you need to know

- **Layout.** `src/App.tsx` owns the plan and page-level state and wires things together. `src/components/` holds the UI (each with its `.css` beside it), `src/hooks/` the stateful helpers, `src/lib/` everything that isn't UI. Views own their own drag state and report results through callbacks; they never hold the plan.
- **Dates are day indexes.** Day 0 is 2026-12-28, the Monday of the week containing 1 Jan 2027, so `day % 7` is the weekday. A stay is `{ startDay, endDay }` inclusive in memory and ISO strings on disk. Helpers are in `src/lib/weeks.ts`.
- **The year view is approximate, the data is exact.** The timeline has two half-week slots per week; each end of a stay snaps to the nearest slot boundary for drawing only (`slotsOf`). Never round the stored dates to fit the display.
- **Stays never overlap.** Every path that changes stays must keep this true.
- **All plan changes go through `setStays` in `App.tsx`** (from `useHistory`). It pushes onto the undo stack. Do not write to `localStorage` or mutate stays any other way.
- **Position logic is pure and lives in `src/lib/storage.ts`.** `reorderStays` (dragging a whole stay: list-style reorder), `pushStays` (stretching an edge: shove neighbours) and `insertStay` (alt-drag: drop a copy and make room for it). During a drag they are recomputed from the original stays on every pointer move, so no drag state accumulates.
- **Imports are sanitised.** `sanitize` drops malformed or overlapping entries and accepts two legacy formats. New fields on `Stay` need handling in `serialize`, `sanitize`, the editor, and the README data-format section.
- **The PNG export is drawn separately** in `src/lib/exportPng.ts` on a canvas. New visual elements do not appear there unless added. It is opened from the Share dialog (`components/ShareDialog.tsx`), which previews the image before download. Flags are drawn from the URLs the flag-icons stylesheet resolved; keep flight details and booking references out of the image.
- **Phones are read-only.** Below 720px (`hooks/useNarrow.ts`) `App.tsx` swaps the timeline, calendar and list for `components/MobileItinerary.tsx` and never opens the editor. Anything new that edits the plan belongs in the desktop branch only.
- **Places are stored language-neutrally.** A stay's `country` is an ISO code or region id and its `city` the listed city's English name; unlisted values are kept as typed. Show them with `countryOf` / `cityOf` / `placeName` / `placeFull` from `lib/storage.ts`, never the raw field. `normalizeCountry` / `normalizeCity` convert typed or legacy names on save and on load.
- **Country names come from the browser.** `src/lib/flags.ts` builds the list from `Intl.DisplayNames` plus a few regions and aliases. The pickers (`src/components/Combobox.tsx`) still accept free text, so never assume a stay's country or city is on a list.
- **The city list is a typing aid.** `src/lib/cities.ts` holds a hand-written `[Chinese, English]` list per ISO code. It is deliberately incomplete and carries no coordinates; unlisted cities are normal and get no warning.
- **Stay rules are derived, never stored.** `src/lib/stayRules.ts` computes gaps, the Schengen 90/180 count and Taiwan's 183 days from the stays on every render. The Schengen list is ISO codes, so it only sees countries picked from the list.
- **The backup reminder is not plan data.** `src/lib/backup.ts` keeps its own `dnp-backup` record (fingerprint of the last export or import). Call `markBackedUp` from any new path that writes the plan to a file the user keeps.
- **Coordinates** come from Nominatim via `src/lib/geocode.ts` (rate-limited, cached) and are shared through the `useCoords` hook.

## Conventions

- No UI framework, state library or drag-and-drop library. Interactions use native pointer events.
- Styles are plain CSS using the custom properties on `:root`. A component's rules go in the `.css` file beside it, imported by that component; only tokens and things several components share go in `src/styles/base.css`. `main.tsx` imports base before `App` so component rules win ties.
- The dialog shell class is `.editor` (in `components/Dialog.css`), shared by the stay editor and the help dialog.
- Typeface is 975HazyGo with two weights only: 400 and 600. Do not introduce 500 or 700. The one exception is the English tagline under the title (`.tagline`), set in Pixelify Sans 400 from Google Fonts; do not use that face anywhere else.
- The product name is the same in both locales: `app.title` (今天不在家工作) and `app.tagline` (A Digital Nomad Planner, used for the document title and the PNG export). The line under the page title is `components/Tagline.tsx`, which types `app.tagline.1`–`.3` in turn once per page load and stops on the last. The year is not part of the name; neither the page header nor the PNG export shows it.
- The header mascot (`components/PixelNomad.tsx`) is pixel art written as rows of characters, one per pixel, rendered to SVG rects and animated by swapping two frames in CSS. Edit the frame strings, not SVG paths; keep it decorative (`aria-hidden`).
- Icons are Phosphor at `weight="bold"`, imported per icon from `@phosphor-icons/react/dist/csr/<Name>`. Flags use `flag-icons` via `src/components/Flag.tsx`.
- **Every UI string goes through `src/lib/i18n.tsx`.** Add the key to both the `zh` and `en` dictionaries and use `t(key, vars)` (or `tr()` when a placeholder is a React node). Never hard-code display text in a component. A component that shows text calls `useLocale()` once so it re-renders on a language switch. Date and length text comes from the helpers in `lib/weeks.ts` and `daysText()`, which already follow the locale.
- Chinese strings are Traditional Chinese (Taiwan usage). Code, comments and commit messages are English.
- `HelpDialog` holds its prose per language rather than in the dictionary; change both versions together.
- Anything new that talks to the network must be listed under "資料與隱私" in the README.
- `src/components/HelpDialog.tsx` is the in-app guide. When a control, shortcut, or how data is stored or exported changes, update its text too.
- Dialogs call `useScrollLock()` so the page behind them doesn't scroll.
- Dates are picked with `components/DatePicker.tsx` (ISO strings in and out), not `<input type="date">`.

## Verifying changes

- Use the preview (`.claude/launch.json`, name `dev`) and check behaviour in the browser, not just types.
- The preview shares one `localStorage` with whoever is using that browser. Before seeding test data, check `dnp-plan-2027` is empty, and remove what you added afterwards. Never clear existing plan data.
- Pointer interactions can be exercised with synthetic `PointerEvent`s; stub `Element.prototype.setPointerCapture` first, since capture fails for synthetic pointer ids.
- Say plainly what was verified by simulation and what was not tried with a real mouse, trackpad or touch screen.

## Deployment

Link-preview tags in `index.html` (`og:url`, `og:image`) hold the absolute GitHub Pages address; change them if the site moves. `public/og.png` is a hand-made static image, not generated by the build: redo it when the name, mascot or look changes.

Pushing to `main` publishes the site to GitHub Pages through `.github/workflows/deploy.yml` (https://simonlin7972.github.io/digital-nomad-planner/). A push is therefore a release: make sure `npm run build` passes first. The build uses `base: './'`, so keep asset references relative.

## Git

- Commit and push only when asked.
- Work happens on `main`.
