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
  - Older component files still break the shape. On 9 Nov 2026, 169 of 552 dev component files
    held, between them, 372 constants or functions, 62 extra components and 47 extra types. Bring
    them in line in move commits of their own, never inside a logic change.
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

## 10. Verification, after every step

```bash
npx tsc -b
npx eslint <files or folders touched>
npx vitest run --coverage.enabled=false
npm run check:tests
node scripts/check-split.mjs <page>
npm run audit:theme
npm run build
```

`tsc --noEmit` proves nothing here, because the root tsconfig compiles nothing. **Don't start the
app or a dev server.** It is tested by hand.

## 11. Also

- **Theme:** use tokens only (no raw white or hex in classes), never text below `/95` opacity, and
  write Tailwind classes out literally. The rules are in `docs/theme-reference.md`.
- **Tooltips:** use `src/components-dev/tooltip` (`CursorTip`); a plain `title` works in dev code.
  Never hand-roll one.
- **UI copy:** no explanatory filler in cards; users know POS terms. Separators are ` | `.
- **Shared rules live in their util** (e.g. `src/utils/hashSubs` for fuel, lottery and cash sub
  departments), never re-implemented inline.
- **The backend** (`C:\backend\goliath-platform`) is read-only from this repo: review and report only.

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
- [ ] Comments are short; no commented-out code
- [ ] Moves and logic changes are in separate commits; only intended paths are staged
- [ ] Verification is green
