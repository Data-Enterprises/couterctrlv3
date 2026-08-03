# CounterCtrl Cloud — Public Portal

Static reference build of the public landing page, member sign-in and Field Notes blog.

## Open it

Open `index.html` in any browser. No server, no build step, no dependencies.

## Read these first

| File | What's in it |
|---|---|
| `HANDOFF.md` | **Start here.** Blocking issues, design tokens, JS architecture, accessibility state |
| `IMPLEMENTATION.md` | Routes, form endpoints, data loading, image handling |

## Structure

```
index.html              Portal — sign-in, carousel, 4 slide-over panels
assets/                 Logo (lockup + C mark)
content/posts.json      All 17 articles as structured data
blog/
  index.html            Field Notes landing
  2026-*.html           17 article pages
  assets/               27 images
```

## Status

Front end is complete. **Nothing is wired to a backend.**

The walkthrough form, support form and sign-in all validate and show confirmations
but send nothing. Do not deploy without wiring them — see `HANDOFF.md` §2.

One article (`2026-04-30-upc-list-insights`) is an AI-written draft that has not
been reviewed. See `HANDOFF.md` §4.
