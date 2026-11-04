# Since the last publish

Every edit made after a publish goes here as it happens, in the words the
release notes will want. When we reach a stopping point this is what the dated
HTML in `Documents\ccc-release-notes` gets written from, so nobody has to walk
back through the log to work out what changed.

Wipe this file at the next publish and start again.

**Last publish:** 2026-11-04 &middot; `master_publish` at `f251f251` ("ready to
publish to dev", 3 Nov) merged to master as PR #58 (`691c3afb`). The log of
everything in that publish is this file as it stood at `691c3afb`.

---

## Tickets

dev mode only

### A ticket names the store the page was about

Filing a ticket from a page with its own store picker (Item Actions, Item
Lookup, Categories, Vendors, Sub Dept Margins, both Price Optimization pages
and Receivers) showed whichever store was last searched on Sales in the box at
the top of the form, ticked that store in the store list, and sent it with the
ticket. Found in testing: a ticket from Item Actions read "002 - IGA IRVINGTON
KY 2" because that store was open on Sales. The form now reads the store the
page itself picked, and where the page ran a date range, that range goes with
the ticket too. With nothing picked on the page, the box names no store rather
than a wrong one. `d84664cd`.

## Item Actions

dev mode only

### Build actions sits at the bottom of the card

The UPC box and its Add / Upload CSV buttons now come before the navy Build
actions button instead of under it, so the card reads top to bottom: store,
date, UPCs, then build. The button used to say "Add a UPC list" above the box
it was asking for. `6d32d341`.

## Sales: Top 200

dev mode only

Single-store Top 200 with a day picked: the vs Last Week and vs Last Year headers now show that one day's date (e.g. 10/22/2026), as Top 200 Sales does, instead of the date written as a range to itself. `301e9d3d`.
