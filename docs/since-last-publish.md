# Since the last publish

Every edit made after a publish goes here as it happens, in the words the
release notes will want. When we reach a stopping point this is what the dated
HTML in `Documents\ccc-release-notes` gets written from, so nobody has to walk
back through the log to work out what changed.

Wipe this file at the next publish and start again.

**Last publish:** 2026-10-12 &middot; `current_10_12_2026` merged to master as
PR #50, published from master.

---

## Sales investigation

### The items grid goes back to one click

`0eebeac4` &middot; `sales_investigate_v2`

Clicking a row opens that item's evidence again, and clicking it a second time
closes it. Double-click is gone.

Row selection and copying are out entirely — the shift and ctrl selecting, the
ctrl-C and ctrl-A keys, the "copy selected rows" menu item, and the hint in the
strip under the grid that advertised them.

The evidence panel now opens with its cause strip **closed**. The strip lays
over the sections beneath it, so opening with it down covered the first thing
the panel had to show, and anybody who just clicked an item already knows which
item they clicked. "View details" brings it back.
