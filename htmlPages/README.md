# Help pages

The HTML behind the app's "?" — one page per app page, shown in `InfoModal` as
an iframe. They are complete documents: their own `<head>`, fonts, styles and a
small script. No API is involved; the browser GETs them straight from S3.

```
htmlPages/
  source/       hand-written Q&A pages — the only files you edit by hand
  glossaries.json   each page's "?" glossary, dumped from the dev *Info.ts files
  build.py      writes both folders below
  prod/         generated: source + the modal layout
  dev/          generated: source + dev wording + a "What the terms mean" section
```

**`prod/` and `dev/` are build output. Don't hand-edit them** — the next build
overwrites it, and dev and prod drift apart. Change `source/*.html` for wording
that belongs in both, or `build.py` for anything dev-only (see `EDITS` and
`USER_MGMT` in it).

## Build

```
python htmlPages/build.py
```

## Upload

The bucket is public-read on those two folders only; listing is denied, so a
name that doesn't exist answers **403, not 404**. `src/constants/helpPages.ts`
is what the app trusts for which pages exist — keep it in step when adding one.

```
aws s3 sync htmlPages/dev  s3://mto2-html-pages/dev  --exclude "*" --include "*.html"
aws s3 sync htmlPages/prod s3://mto2-html-pages/prod --exclude "*" --include "*.html"
```

Nothing to redeploy on either side — the app reads whatever is in the bucket.
`apiEnv` picks the folder, so dev mode shows `dev/` and prod mode shows `prod/`.

## Known gaps

- `glossaries.json` is a one-off dump. The dev `*Info.ts` files it came from are
  in `trash/`, because the app no longer imports them. The build should read
  those files directly — a TS port of this script — so a glossary change in code
  can't silently leave the help behind.
- Four surfaces have a "?" but no page yet: Item Actions and its detail rail, LP
  Actions, Invoices, Sales Tracker. They still use the old popover.
- The pages are public. Listing is blocked, but names are guessable, so no
  customer data, store numbers or internal URLs in them.
