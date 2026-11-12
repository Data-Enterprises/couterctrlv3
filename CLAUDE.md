# CounterCtrl: rules for working in this repo

These rules are **mandatory** for every change in this repo, by Claude or by a person.
They are the result of the November 2026 dev refactor, which brought every dev page into this
shape. New code is written this way from the first commit; it is never split up later.

The full rule book, with the reasoning, is `Documents/doc-templates/repo-health-guideline.md`.
Where this file and a habit disagree, this file wins.

**Why:** anyone has to be able to open any file and fix it by hand, follow a change as it
happens, and hand a page to another developer. That means small files, folders that say what
they are, and state that lives in one obvious place.

---

## 1. The two trees

- Every released page has `src/pages/<page>/prod` (what customers see) and
  `src/pages/<page>/dev` (dev mode, level 7+). **Edit the dev tree.** Prod catches up by
  promotion, never by hand edits.
- Coming Soon pages (e.g. Tickets) have a dev tree only and call the dev API through `useDevApi`.
- The shared library is split the same way. Components are in `src/components` (prod) and
  `src/components-dev` (dev). Redux slices are in `src/features` and `src/features/dev`. The
  prod library never imports the dev library.
- `src/utils`, `src/hooks`, `src/interfaces` and `src/api` have **one copy, used by both trees**.
  Find every caller before changing one.
- The mobile screens are a separate tree (`mobile/`) by design. Never make the desktop
  responsive to cover a phone.

## 2. Components: the main component lists its sections

- **Every component file has exactly this shape, in this order:**
  1. the imports, labelled (§6)
  2. the component's props interface (`<Component>Props`), if it takes props
  3. the component, with its doc comment above it
  4. `export default <Component>;` as the last line

  Nothing else goes in the file. The file is named after its component (PascalCase).
  - **A helper component** (a row, a cell, a badge) gets its own file in `components/`.
  - **Any other type** goes in `interfaces/index.ts`.
  - **Constants and plain functions** go in `utils/index.ts` (§3).

  **Why:** every file reads the same way, so it is easy to read and safe to edit by hand.
- **Every file stays well under ~900 lines.** Past that, split it.
- **The main component reads like a table of contents.** It holds the state and handlers and
  lays out its sections:
  ```tsx
  <DetailNavHeader … />
  {!selected ? <NoReceiver /> : null}
  <DetailKpiStrip />
  <DetailTable />
  ```
  Each section (a header, a KPI strip, a table, a row, a modal, a tab) is its own file in that
  folder's `components/`. Split along what the user sees: if a block of JSX has its own heading
  on screen, it gets its own file. Name files for what they are (`ItemsTable.tsx`), never
  `Part2.tsx` or `Helpers.tsx`.
- **Repeated markup becomes one component with a parameter.** Don't keep two copies. For example,
  Groups' `StoreColumn` takes `kind`, and its label, button, colour and click all follow from it.
- **Data in hooks, drawing in components.** Fetching and reshaping go in `hooks/` and `utils/`;
  components draw and handle clicks.

## 3. Where a file lives

Put a file in the **lowest folder that contains everything that uses it**.

| Used by | Goes in |
|---|---|
| one part (tab, panel, modal, export) of one page | that part's own folder |
| several parts of one page | the page's own `components/` `hooks/` `utils/` `interfaces/` |
| more than one page | the shared library (`src/components-dev`, `src/utils`, `src/hooks`, …) |

- **Never import another page's folder.** If two pages need something, move it to the shared
  library. When a shared file ends up with one user, move it down into that user.
- **A whole screen shared by pages** lives in the library as its own folder with the page layout
  inside it: the phone Item Perf and Event Perf screens are `src/components-dev/itemPerf` and
  `src/components-dev/eventPerf` (8c4b4b35). `src/pages/shared/*/prod` are their prod copies, left
  for promotion; don't add dev code under `pages/shared`.
- **Helpers are grouped by kind, one file per kind per folder:**
  - `utils/index.ts` holds plain functions and constants;
  - `hooks/index.ts` holds hooks;
  - `interfaces/index.ts` holds types. The folder is called `interfaces/`, **never `types/`**.
  If one gets long, split it by topic in the same folder (`utils/csv.ts`).
- No component goes in a helper file, and no helper is exported from a component file. No barrel
  files that only re-export.
- **A component file holds its component and nothing else** (the shape in §2). Constants (class
  strings, column widths, option lists) and plain functions go to the `utils/index.ts` of the
  lowest folder that uses them, even when only one file uses them. For example, Forecasting's
  `COLS`, `HEAD` and `PILL` and its `parseUpcs` are in `utils/` (26a7b7f5). New code is written
  this way.
  - Since 9 Nov 2026 every in-scope dev component file has this shape (5dc7b8bd). The exceptions
    are Upc List's Movement files, which wait for the `item_movement` merge, and the level-9-only
    pages. Bring those in line in move commits of their own, never inside a logic change.
  - A doc comment stays above the thing it describes: the component's comment stays with the
    component, and each moved constant gets one line of its own.
- Don't create empty folders.

### Page layout

```
<page>/dev/
  <Page>.tsx                       the page
  components/                      shared across the page
  hooks/index.ts  utils/index.ts  interfaces/index.ts
  <module>/                        one folder per tab, panel, modal or export
    <Module>.tsx
    components/  hooks/  utils/  interfaces/     (as needed, same layout one level down)
  mobile/                          the phone screens
```

**`src/pages/groups/dev` is the reference page.** When in doubt, do what it does.

## 4. State

| State | Goes in |
|---|---|
| Anything that must persist: shared across parts, or kept across a tab switch, a remount or leaving the page (the day, the store, cached reads, saved filters) | **Redux** |
| Temporary state nothing else needs: a menu or modal open, a search box, a name being typed, an export pop-up flag | **local `useState`** |
| What a small component is handed to draw: a mapped row, a card's figures | **props** |

- **Never prop-drill.** If a value would pass through a component that doesn't use it, it belongs
  in Redux and the component that needs it reads it there.
- **Read Redux through the page's context hook** (`useGroupCtx`, `useSalesCtx`, …) in the page's
  `hooks/index.ts`, not through `useAppSelector` scattered across components.
- **Props stay simple:** values, a setter, an `onX` handler. Don't pass whole context objects down.
- **Pop-up flags are temporary.** A modal's open flag goes in `useState`, so it doesn't reopen when
  someone comes back to the page.
- **Every new piece of Redux state is cleared on sign-out** (only the username survives) and
  covered by the `signOutReset` and `moduleState` tests.

## 5. React rules the refactor taught us

These are the mistakes a split actually made. Check every one when you move or split code:

1. **The `key` goes on the outermost element the `.map` returns.** When a mapped block becomes a
   component, write `<Row key={item.line_number} item={item} />`. A key placed inside the new
   component does nothing. Keep the same key value as before; don't switch to the index.
2. **A function is called, never tested.** If `canSubmit` becomes `canSubmit(form)`, every
   `disabled={!canSubmit}` must change too. A function is always truthy, so the button never
   disables.
3. **Carry every guard across.** Conditions like `&& !state.isFetchingDetails` and
   `&& !alreadyExists` are easy to drop when an expression is pulled into a helper or a child.
4. **Copy text exactly, including template literals.** A multi-line template (`\n\n—\n`) is data
   that gets sent to the server. Collapsing it to one line changes what is saved.
5. **Copy class strings exactly.** Take a moved element's `className` from the original, not from
   a similar element nearby.
6. **Typed callbacks.** A component that dispatches takes `dispatch: AppDispatch`, and its props
   use the real types (`SetStateAction`, the slice's types), never `any`.
7. **Moving state into a child changes when it resets.** If the child can unmount (an early
   return for an empty day, a receipt view replacing a list, a tab), its `useState` goes back to its
   initial value when it comes back. State that must survive that stays in the parent, above the
   early return, and reaches the child as a value and its setter. The second sweep found this in
   Sales' Sub depts and Hourly, and in Loss Prevention's filter drafts (6d6b8d3d, 70459386).
8. **Moving an effect into a child changes when it runs.** A `useEffect` or `useLayoutEffect`
   in a child that remounts also runs on every mount, not only when its dependencies change. An
   effect meant to run on a change stays in the always-mounted component, and the child reads the
   refs. Event Perf's list scroll restore had this problem (c39403da). The same goes for hooks with
   mount effects, such as `useScanGun`'s focus.
9. **Splitting can break DOM that was shared.** Two branches of one component that returned the
   same element tree shared real DOM nodes (a scroller kept its offset). As separate components
   they mount fresh. If that sharing was something users relied on, carry it explicitly, as Item
   Perf's `useScrollCarry` does (c4c0e088).
10. **Memoising a value changes how often effects run.** Arrays rebuilt on every render re-ran
    effects that list them as dependencies. Wrapping them in `useMemo` stops that. Check what the
    effect did on each run before memoising.

## 6. Imports

Every file groups its imports under these labels, in this order, leaving out any it doesn't need:

```ts
// Hooks        react, app hooks, the page's own hooks
// Redux        slice actions from features/
// API          calls from api/
// Utils        helpers and constants
// Interfaces   types (import type …)
// Components   components and icons
```

- **One import line per source file.** An import goes under the label for what it is, not where
  it lives.
- **Code under `src` uses relative paths, never `@/`.** Tests import through `@/`.

## 7. Comments

- Short paraphrases: one or two lines on what the code does and why, where the code doesn't
  already say it. No essays and no history ("this used to …"); that belongs in the commit message.
- Keep the comments that stop a real mistake: a non-obvious business rule, a number that looks
  wrong but is right, a workaround.
- **Delete code, don't comment it out.** Remove dead functions, unused imports and old components
  in their own commit.

## 8. Tests

- Dev tests live in `tests/dev`, mirroring the source path without the `dev` segment:
  - `src/pages/<page>/dev/<rest>` → `tests/dev/pages/<page>/<rest>`
  - `src/components-dev/<rest>` → `tests/dev/components/<rest>`
  - `src/features/dev/<rest>` → `tests/dev/features/<rest>`
- When a source file moves, its test moves in the same commit.
- Test what a person would notice: a figure, a label, what a click does.
- Prod-tree and shared-code tests (`src/utils`, `src/store`, `src/api`, …) still sit beside their
  source for now.

## 9. Commits

- **One concern per commit**, with a message that says what is true now.
- **Moves and logic changes never share a commit.** A move commit must change no code.
- **Stage explicit paths only**, never `git add src` or a whole folder: others edit the tree live.
  Commit with a pathspec (`git commit -m "…" -- src/pages/<page>`).
- Files are CRLF; keep them that way. `sed -i` strips the CRs.
- `docs/` is gitignored and never committed. Repo working docs (change log, theme reference,
  checklists) live there.
- **The pre-commit hook must pass; never `--no-verify`.** It runs eslint, `check:rules` and
  `audit:theme` on what is staged. `npm install` turns it on (`core.hooksPath .githooks`).
- **Baselines** (`scripts/baselines/`) record the rule and theme breaks that were already there.
  Only a new break fails. A move commit carries its files' entries to their new paths
  (`npm run check:rules -- --update-baseline`, and the same for `audit:theme`); a fix lowers the
  baseline the same way. A logic commit never raises it: fix the code instead.

## 10. Verification, after every step

```bash
npx tsc -b
npx eslint <files or folders touched>
npx vitest run --coverage.enabled=false
npm run check:tests
npm run check:rules          # must end 0 new hit(s)
node scripts/check-split.mjs <page>
npm run audit:theme          # must end TOTAL: 0 hit(s)
npm run build
```

`tsc --noEmit` proves nothing here, because the root tsconfig compiles nothing. **Don't start the
app or a dev server.** It is tested by hand.

**What the scripts can't check** stays with you and review: Redux or `useState`, prop drilling,
splitting along what the user sees, moves kept apart from logic, and whether a comment is worth
keeping. ESLint bans the global `location` (use `useLocation()`) and `@/` imports under `src`.

## 11. Theme

Every dev screen, desktop and phone, follows these rules. `npm run audit:theme` checks them across
`src/pages` and `src/components-dev` and must end with `TOTAL: 0 hit(s)` (it exits 1 otherwise).
Fix the code; add an audit exception only for a colour no token can stand for, and give the reason
in the rule's `skip`.

**Where colours come from.** A colour is a token: defined once in `src/index.css` (`:root`, an RGB
triplet such as `--color-brand-navy: 30 42 74;`), named in `tailwind.config.js`, used as a class
(`bg-brand_navy`, `text-brand_navy/85`). Where a class can't be used (an inline `style`, a computed
width), write `rgb(var(--color-brand-navy) / 0.12)`. Never a raw hex, never `bg-white` /
`text-white` (use `custom-white`), never a Tailwind grey for text, and in the dev tree never a
Tailwind grey for a line or fill either (use the neutral tokens below).

| Job | Tokens |
|---|---|
| The app's navy (headers, buttons, rails, focus) | `brand_navy`, `brand_navy_hover` (the one hover for navy buttons; `portal_navy` is the public portal and login only) |
| Page ground / card / lighter fill | `bkg` / `custom-white` / `brand_paper` |
| Row selection (always the pair) | `cc-row-selected` (= `bg-row_selected` + `border-row_selected_border`) |
| "This filter is narrowing the list" | `filter_active` + `filter_active_border` |
| Zebra stripes, hairlines | `row_stripe`; `brand_line`, `brand_line_2` |
| Neutral lines | `line_hair` (dividers, row and bar rules), `line_field` (field, card and menu borders), `line_strong` (control edges), `line_faint` (table cell rules) |
| Neutral fills | `fill_soft` (header strips, row hover), `fill_muted` (wells, chips), `fill_track` / `fill_track_strong` (bar tracks); `ungraded` for the dot or ring of something not graded |
| Body text | `text-content` |
| Small mono labels, timestamps, fact keys | `text-brand_slate` (`brand_slate_2` one step lighter) |
| Placeholders | `placeholder:text-brand_placeholder` |

**Meaning colours: three families, three jobs, never interchangeable.**

| Meaning | Tokens |
|---|---|
| A grade against a threshold (crit / watch / ok) | `severity_critical_*`, `severity_watch_*`, `severity_healthy_*` (`_bg`, `_text`) |
| Direction of change (up / down, vs LW / LY) | `delta_positive_*`, `delta_negative_*` |
| Form errors, validation, failed or destructive actions | `brand_danger`, `brand_danger_bg`, `brand_danger_line` |
| A notice or "heads up" box | `bg-severity_watch_bg text-severity_watch_text border-severity_watch_text/20` |

Pick the token for what the colour **means**, not the nearest hue. Hand-written pale fills and dark
texts (`bg-red-100`, `text-amber-800`, `bg-emerald-50`) are brighter than the tokens and don't follow
a token change. Saturated 400–600 dots and bars (`bg-red-500`) are a separate, deliberate register and
are fine. Direction is not severity: Loss Prevention's "up" is bad, so it is `delta_negative`.

**Text is never below `/95` opacity**, desktop and phone (`text-content/95`, never `/85` or `/60`).
These screens are read standing in a shop. `disabled:`, `placeholder:`, `hover:`, `focus:` and
`active:` states may dim, and so may a lone separator glyph (`·`, `|`). Fills and borders may go as
light as they like (`border-brand_navy/15`, `bg-brand_navy/[0.06]`).

**Modals blur, they don't darken:** `cc-modal-backdrop` (`fixed inset-0 backdrop-blur-sm`), never
`bg-black/40`.

**Tailwind classes are literal.** Tailwind reads the source, so a class built at runtime
(`` `bg-severity_${sev}_bg` ``) is never emitted. Write each one out:
`sev === "critical" ? "bg-severity_critical_bg" : "bg-severity_healthy_bg"`.

**Use the shared parts, don't hand-roll them:**
- the `?` button: `src/components-dev/InfoButton.tsx` (`variant="light"` or navy), or
  `PageInfoButton` in a page header;
- severity helpers: `pillClass`, `severityDotClass`, `chipClass`, `formatPct` in `src/utils/severity.ts`;
- tooltips: `src/components-dev/tooltip` (see §12);
- an icon button in a navy header: `HeaderIconButton`;
- a repeated look: its `cc-*` class (below).

**Shared looks: the `cc-*` classes.** `src/styles/components-dev.css` defines one class per look
the dev tree repeats, so changing a look is one edit there. A class holds the look only (colour,
weight, border, fill, radius, shadow, inner spacing); text size and position stay inline where it is
used (`cc-caps text-[11px] mb-2`). Classes sit in the components layer, so a utility beside one
wins. Use the class rather than spelling it out: `check:rules`' `catalogued-look` flags a dev-tree
`className` that holds a whole definition. The catalogue:
- type: `cc-caps`, `cc-caps-strong`, `cc-caps-mono`, `cc-row-title`, `cc-navy-title` (never on a
  button or a filled element), `cc-navy-link`, `cc-muted-link`;
- controls: `cc-btn-primary` (its hover built in), `cc-btn-outline`, `cc-chip-btn`,
  `cc-segment-navy`, `cc-checkbox`, `cc-field-sm`, `cc-tag`, `cc-spinner`;
- surfaces: `cc-panel`, `cc-card-phone`, `cc-navy-panel-header`, `cc-navy-header-row`,
  `cc-phone-header`, `cc-bar-header`, `cc-bar-footer`, `cc-notice`, `cc-dropdown`,
  `cc-modal-backdrop`, `cc-scroll`;
- tables and rows: `cc-thead`, `cc-th`, `cc-td`, `cc-num`, `cc-row-selected`.
A new repeated look gets a class there (tokens only), not another hand-spelled copy. `audit:theme`
checks the stylesheet with the other colour rules, and its `unknown-colour` rule fails a colour
class that names no colour (Tailwind drops it and the element renders uncoloured). Plan and
history: `docs/tailwind-refactor-plan.md`.

**To revisit (Steve, 11 Nov 2026):** the neutral tokens (`line_*`, `fill_*`, `ungraded`) start at
exactly the Tailwind greys they replaced. Retuning one (for example `line_hair` toward the bluer
`brand_line`) is a one-line change in `src/index.css`; held for now.

**Desktop panels.** A navy left-panel header is `cc-navy-panel-header` (`bg-brand_navy rounded-t-xl`
with `px-4 pt-1 pb-2.5`; list panels of two rows use `px-3 pt-1 pb-2.5`). A two-row navy header
separates its rows with `cc-navy-header-row` (exactly `pt-1.5 mt-1 border-t border-custom-white/[0.08]`).

**Phone screens** (the `mobile/` folders):
- Font floor `text-[10px]`; `text-[9.5px]` only for mono uppercase captions. Never italic.
- Mobile Performance pages show no severity chips, dots or pills.
- Content sits in `<section>` cards: `cc-card-phone` (`rounded-2xl border border-line_field
  bg-custom-white shadow-md`), stacked with `gap-3` inside `p-3`. A filter goes inside the card it filters; navigation goes in a bar
  under the header.
- **Back** (phone and desktop) comes in exactly three kinds; never a fourth, and never a magnifying
  glass as the way back (a client's IT lead: nobody reads the icon as "back"):
  - **From a page's results to its search:** `BackButton` ("‹ Back"; `tone="navy"` in a navy
    panel header, `tone="light"` on a white phone card). It also steps back up a phone drill
    (`MobilePerfHeader`'s `onBack`).
  - **Back a level to a named screen:** `MobileBackLink` ("‹ Back to stores", top-left of a white
    header; `MobilePerfDetail` draws it from `backLabel`).
  - **Closing a re-search:** the search card's own `onBack` / `backLabel`, which draws
    `SearchBackButton` ("← Back to results").
  A magnifying glass is only ever a search box's icon or a filter's Apply.
- Building blocks, in `src/components-dev/mobile`: `MobilePerfCard` (a row that opens in place;
  expanding is not navigation), `MobilePerfDetail` (a breakdown as its own screen), `PerfCardHeader`,
  `MobileSortChips`, `PairedBars`, `PerfDayChart`. `KpiTileGrid` is desktop only.

**Audit exceptions** (each carries its reason in `scripts/theme-audit.mjs`): `src/pages/home` (the
public portal and login shell, one copy shared with prod, with the portal palette), Upc List's heat
ramp (`heatColor.ts`), the hourly chart's series colours, LP Actions' caution strip, and `InfoButton`
itself. Legacy and `prod/` trees are not audited: prod changes by promotion.

**The shared library** (`src/components`: the title bar, toasts and other parts both modes draw) is
audited as a ratchet. Its known hits are in `scripts/baselines/theme-shared.json` and are fixed with a
promotion, because clients see them; a new hit fails the audit.

## 12. Also

- **Tooltips:** use `src/components-dev/tooltip` (`CursorTip`); a plain `title` works in dev code.
  Never hand-roll one.
- **UI copy:** no explanatory filler in cards; users know POS terms. Separators are ` | `.
- **Shared rules live in their util** (e.g. `src/utils/hashSubs` for fuel, lottery and cash sub
  departments), never re-implemented inline.
- **The backend** (`C:\backend\goliath-platform`) is read-only from this repo: review and report only.

## 13. Promoting dev to prod

Prod changes only by **promotion**: a script copies a signed-off dev tree over its prod twin.
Nobody edits a prod tree by hand, before, during or after a move.

**Why:** the dev tree is what was tested and signed off. A scripted copy, proven by `check:split`'s
MIRROR check, is the only way to know prod behaves exactly like it.

**What moves, and how:**

| Forked (moves by promotion) | Dev → prod |
|---|---|
| Page trees | `src/pages/<page>/dev` → `prod` (`npm run promote:page`, or `greenlight:page` for a Coming Soon page) |
| Component library | `src/components-dev` → `src/components` (`npm run promote:lib`) |
| Redux slices | `src/features/dev/dev<X>Slice.ts` → `src/features/<x>Slice.ts` (written back by the promote) |
| Tests | `tests/dev/pages/<page>` → `tests/prod/pages/<page>` (copied by the promote) |

`src/utils`, `src/hooks`, `src/interfaces`, `src/api`, `src/content`, `src/index.css` and
`src/styles` have one copy and are already live in prod: nothing to move. So does a `src/components`
file with no dev twin (the title bar, the avatar menu): it is edited in place. Dev-only behaviour in
shared code is a runtime gate (`apiEnv === "dev"`), switched by hand, one commit per gate.

**A move, in order.** `scripts/release/manifest.json` names the pages, the library files kept on
purpose and the gates to switch; it matches the Production Update Guide's scope.

1. **Backend first.** Steve moves goliath-platform dev → prod. `npm run release:plan` must show no
   endpoint missing on the prod branch before any frontend file moves.
2. **Prep on master_publish, ahead of the day.** Each is a normal logic commit, invisible in prod:
   create and register any missing prod slice (cleared on sign-out, with its tests); replace
   `useDevApi` inside Coming Soon trees with `context.url` / `context.token`; drop the
   `useCanSeeComingSoon` gates on links to pages that ship; move a library file only one page uses
   into that page.
3. **Its own publish.** Publish what is on master_publish first. Then branch
   `prod_move_<date>` off it, and freeze the moving pages' dev trees until the move is published.
4. **`npm run release:plan` ends `0 open item(s)`.** It is read-only and lists every missing slice,
   leftover `useDevApi`, Coming Soon gate, one-page library file, cross-page import, flag that
   differs between the trees, and non-moving prod page the library change reaches.
5. **The library, whole, first: `npm run promote:lib`.** One commit. Every page stops on the same
   changed library files, so they are decided once here, not page by page. Its blast radius is the
   prod pages that don't move: they get the platform changes too, and the update guide says so.
6. **Case A pages, smallest first** (`promote:page -- <page>`; the library already matches).
   **Case B pages** with `greenlight:page`, then their nav entry and levels. `npx tsc -b` and
   `check:split <page>` after each. One commit per page, script output only:
   `Promote <page>: prod matches dev at <sha>`.
7. **Gates and flags**, one commit each, as the manifest lists them. Per-tree flags
   (`ADMIN_MIN_LEVEL`, Upc List's `fixes`) are product calls Steve makes, never inherited silently.
   The release notes go in with their date (`docs/tools/release-notes.next.json` →
   `src/content/releaseNotes.json`).
8. **Verify the whole move:** the §10 suite, `check:split` for **every** page, `release:plan` clean,
   then Steve's side-by-side click-through, dev against prod, watching that every request goes to
   the prod API.
9. **Merge into master_publish**; Steve publishes (master_rollback first, as for every publish).

**Rules while promoting:**
- A promote commit is a move commit. If the promoted page is wrong, fix the **dev** tree and promote
  again. Never touch the prod copy.
- A failing page is pulled from the move, not patched in prod.
- No prod tree may call `useDevApi` or read `devToken` / `DEV_API_URL` (`check:split` PROD-API).
- A promoted prod tree follows these rules, so it joins `check:rules` and `audit:theme`. A promote
  commit carries its baseline entries (`--update-baseline`); the counts only go down.
- Every step goes in `docs/since-last-publish.md`.

**After a move.** The trees match. Dev drifts again; promote page by page as Steve signs work off,
and promote the library with the first page that needs a changed library file. Never let the library
drift for months again: by the first move it had 133 new and 54 changed files.

**Before the first move (Nov 2026).** The tools above are partly to build: the manifest,
`release:plan`, `promote:lib`, promote-page creating missing prod slices and copying tests, and
check-split's PROD-API check. The measured numbers, page order, gate list and the decisions Steve
still owes are in `docs/prod-move-plan-2026-11-11.md`. The background (what each case involves, the
traps) is `Documents/doc-templates/dev-to-prod-release.md`.

## Before every commit

- [ ] Each component file is imports, props interface, component, `export default`, and nothing
      else; none near ~900 lines
- [ ] Helpers are in the `utils/` `hooks/` `interfaces/` of the lowest folder holding all their users
- [ ] No import into another page's folder; no prod-library import of the dev library
- [ ] Persisting state is in Redux and read through the page context hook; `useState` is only for
      temporary state; props are simple; no drilling
- [ ] New Redux state is cleared on sign-out and tested
- [ ] Imports are labelled in order; one line per source; relative paths in `src`
- [ ] Mapped components carry their `key` on the tag; helpers that became functions are called;
      guards, text and classes are carried over exactly
- [ ] State and effects moved into a child still reset and run when they did before (check unmounts,
      early returns and mount effects)
- [ ] Colours are tokens for what they mean; text at `/95` or more; classes literal; shared parts
      (InfoButton, BackButton, MobileBackLink, SearchBackButton, tooltip, the `cc-*` looks) rather
      than hand-rolled
- [ ] Comments are short; no commented-out code
- [ ] Moves and logic changes are in separate commits; only intended paths are staged
- [ ] No hand edit in a `prod/` tree, and none in a `src/components` file that has a
      `src/components-dev` twin: those change by promotion (§13)
- [ ] The pre-commit hook passes; a baseline only went down, or moved with a move commit
- [ ] Verification is green
