# CLAUDE.md — Dev handoff & working notes

Guidance for developers (and Claude Code) working in this repo. For the *why*
behind decisions see [`docs/decision-log.md`](docs/decision-log.md); for a
feature/status overview see [`README.md`](README.md).

## What this is

Local, **browser-side** invoice parsers. Each **source** (a vendor's file format,
or scanned-image extraction) builds to its **own standalone `.html`** that runs
by double-click — no server, offline, nothing uploaded. The codebase is a shared
**`core/`** plus one module per **`vendors/`**.

**Stack:** Vite + React + TypeScript (strict). Node 22 / npm 10. Money uses an
exact `bigint`-backed `Decimal` — **never floating point**.

## Commands

```bash
npm install
npm run dev        # Vite dev server: / (hub), /awg.html, /scanned.html
npm test           # Vitest — currently 59 tests, run before every commit
npm run typecheck  # tsc -b --noEmit
npm run build      # emits one standalone HTML per page into dist/
```

- **`npm run build` runs one Vite pass per page** (`scripts/build.mjs`) because
  `vite-plugin-singlefile` can only inline one entry at a time. Add a page →
  add its `<name>.html` entry and add `"<name>"` to `TARGETS` in that script.
- **Troubleshooting:** if `npm install`/`build` fails with "node is not
  recognized" from a lifecycle script, node isn't on the shell's PATH for
  spawned processes — run npm from a shell where `node -v` works (on the
  original dev machine that meant PowerShell, not Git-Bash).

## Architecture

```
src/
  core/                     ← vendor-agnostic; never import a vendor from here
    overpunch.ts            exact Decimal + signed-overpunch/implied-decimal decode
    fixedwidth.ts           field types + generic slice/decode
    reader.ts               parseFixedWidth(text, {schemas, recordLength})
    model.ts                view model (ParsedFile/DocumentView) + VendorModule<State>
    App.tsx, app.css        app shell: drop → overview → filter → cards; edit state
    ui/                     DropZone, DocumentCard, EditableField, ExportBar, format
    export/engine.ts        Template → CSV / .xlsx / JSON + downloader
  vendors/
    awg/                    structured AWG QBP539 fixed-width file
    scanned/                scanned-image invoices (DEMO — stubbed extraction)
<name>.html                 one page entry per source (script → src/vendors/<name>/main.tsx)
index.html                  hub linking the pages
scripts/build.mjs           per-page standalone build
samples/                    real AWG file used by tests
reference/python/           original Python engine — validated reference, not built
```

### The core/vendor contract (the key abstraction)

A vendor implements `VendorModule<State>` (`core/model.ts`):

- `parse(text) → State` — decode the file into an **editable** state object.
- `present(state) → ParsedFile` — **pure** projection into the view model +
  export datasets. Totals/reconciliation are derived here, so edits recompute
  for free.
- `applyEdit(state, edit) → State` — apply one field edit, return new state
  (return the *same* reference to reject an invalid edit).

The **core UI renders `ParsedFile` only** and knows nothing about any invoice
format — so adding a vendor never touches `core/`. All display values are
pre-formatted strings; export data lives separately in `ParsedFile.datasets`.

## Invariants — do not break these

1. **Money is exact.** Use `Decimal` (`core/overpunch.ts`) for all amounts; parse
   user input with `Decimal.parse`. No `number` arithmetic on money, no `toFixed`
   for storage.
2. **Reconciliation is the correctness gate.** Derived line sums are checked to
   the cent against each invoice's reported/printed total. Keep this working;
   it's how the tool earns trust and how OCR accuracy is judged.
3. **Files are read as ISO-8859-1** (`core/App.tsx`) so fixed-width columns never
   shift. Don't switch to UTF-8.
4. **Pages must stay standalone** — no runtime network calls, no external asset
   URLs (everything inlines into the single HTML). The one intended exception is
   the future scanned backend call (see below).
5. **`core/` imports nothing from `vendors/`.** Dependencies point one way.

## Adding a new structured-file vendor

1. `src/vendors/<name>/` — a schema (record layouts as config), a model
   (records → invoices + reconciliation), `templates.ts`, and a `present.ts`
   that maps into the core `ParsedFile`.
2. Export a `VendorModule` from `index.ts`; add `main.tsx` mounting
   `<App vendor={...} />`.
3. Copy `awg.html` → `<name>.html`, point its script at the new `main.tsx`.
4. Add `"<name>"` to `TARGETS` in `scripts/build.mjs` and a link in `index.html`.
5. Add tests mirroring `vendors/awg/*.test.ts` (spec tables + a real sample file).

Use `vendors/awg/` as the reference implementation.

## Scanned invoices — status & going live

`vendors/scanned/` is a **DEMO**: `parse()` ignores the dropped file and returns
fixed extraction data (two real invoices from a sample batch) so the full
review/edit/reconcile/export experience works with no backend. It does **not**
OCR a real scan yet.

**To productionize** (see decision log §9, §13):
- Make `parse()` **async** and call a small **backend** (AWS Lambda) that holds
  the credentials — a key/role can't live in the standalone HTML.
- Extract via **AWS Textract (AnalyzeExpense)** and/or **Bedrock + a vision LLM**
  (Claude `anthropic.claude-*`, or Amazon Nova); AWS keeps images in the
  customer's account/region (the privacy answer).
- Add **batch-PDF splitting** (one scanned PDF holds many invoices).
- Keep the extraction schema = `ExtractedInvoice` (`vendors/scanned/types.ts`);
  the reconciliation (line sum vs. printed total) is the extraction accuracy gate.
- `EXT = (Unit Price − Allowance) × Qty` is the line-recompute rule in
  `vendors/scanned/index.ts` — vendor-specific; revisit per new layout.

## Conventions

- **Tests are stdlib-free Vitest**; every parser/model change needs a test, and
  real-file fixtures are preferred over synthetic ones for decode/reconcile.
- **Schemas and templates are config**, not code paths — add an entry, don't
  branch the engine.
- `xlsx` (SheetJS) is used **only to write** workbooks; its npm audit advisories
  are in the parser we never call. Don't add its parsing paths.
- When verifying UI changes, prefer the temporary dev auto-loader pattern
  (`import.meta.env.DEV` guard) and **remove it before committing** — production
  is the drop-file flow.

## Open items

- **AWG store-name mapping** (`vendors/awg/stores.ts`) — `5401`, `5789` → names.
- **Scanned go-live** — AWS backend + provider choice (Textract vs Bedrock).
- **(Optional)** derive the scanned page's top Subtotal/Total from edits.
