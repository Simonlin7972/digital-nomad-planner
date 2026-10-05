# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

A single-page planner for a year of digital nomading (2027). Vite + React 19 + TypeScript, no backend; all data lives in the browser's `localStorage`. The UI is in Traditional Chinese.

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
- **The PNG export is drawn separately** in `src/lib/exportPng.ts` on a canvas. New visual elements do not appear there unless added.
- **Countries are stored as display names, not codes.** `src/lib/flags.ts` builds the option list from `Intl.DisplayNames` (Taiwan usage) plus a few regions and aliases; `flagCode` maps a name back to a flag. The pickers (`src/components/Combobox.tsx`) still accept free text, so never assume a stay's country or city is on a list.
- **The city list is a typing aid.** `src/lib/cities.ts` holds a hand-written `[Chinese, English]` list per ISO code. It is deliberately incomplete and carries no coordinates; unlisted cities are normal and get no warning.
- **Coordinates** come from Nominatim via `src/lib/geocode.ts` (rate-limited, cached) and are shared through the `useCoords` hook.

## Conventions

- No UI framework, state library or drag-and-drop library. Interactions use native pointer events.
- Styles are plain CSS using the custom properties on `:root`. A component's rules go in the `.css` file beside it, imported by that component; only tokens and things several components share go in `src/styles/base.css`. `main.tsx` imports base before `App` so component rules win ties.
- The dialog shell class is `.editor` (in `components/Dialog.css`), shared by the stay editor and the help dialog.
- Typeface is 975HazyGo with two weights only: 400 and 600. Do not introduce 500 or 700.
- Icons are Phosphor at `weight="bold"`, imported per icon from `@phosphor-icons/react/dist/csr/<Name>`. Flags use `flag-icons` via `src/components/Flag.tsx`.
- UI strings are Traditional Chinese (Taiwan usage). Code, comments and commit messages are English.
- Anything new that talks to the network must be listed under "資料與隱私" in the README.
- `src/components/HelpDialog.tsx` is the in-app guide. When a control, shortcut, or how data is stored or exported changes, update its text too.
- Dialogs call `useScrollLock()` so the page behind them doesn't scroll.

## Verifying changes

- Use the preview (`.claude/launch.json`, name `dev`) and check behaviour in the browser, not just types.
- The preview shares one `localStorage` with whoever is using that browser. Before seeding test data, check `dnp-plan-2027` is empty, and remove what you added afterwards. Never clear existing plan data.
- Pointer interactions can be exercised with synthetic `PointerEvent`s; stub `Element.prototype.setPointerCapture` first, since capture fails for synthetic pointer ids.
- Say plainly what was verified by simulation and what was not tried with a real mouse, trackpad or touch screen.

## Deployment

Pushing to `main` publishes the site to GitHub Pages through `.github/workflows/deploy.yml` (https://simonlin7972.github.io/digital-nomad-planner/). A push is therefore a release: make sure `npm run build` passes first. The build uses `base: './'`, so keep asset references relative.

## Git

- Commit and push only when asked.
- Work happens on `main`.
