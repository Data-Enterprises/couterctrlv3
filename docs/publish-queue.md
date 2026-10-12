# Publish queue — `current_10_5_2026`

The branch is a staging area off master for work that has been greenlit to
publish. Work lands here only once it is approved; everything else waits on its
own branch.

When this one publishes, start the next dated branch off master and carry the
same list forward.

## In

| Work | How it came in |
| --- | --- |
| Coming Soon last route, env switch, `undefinedpx` icon | merged `route_default_fix` |
| Theme tokenisation — whites, the navy sweep, `docs/theme-reference.md` | cherry-picked from `tickets_help_desk` |
| One header on the exported UPC list | cherry-picked from `tickets_help_desk` |
| A margin delta needs sales on both sides | merged `vendor_margin_no_lw_sales` |
| Sales Export polish — 6 commits | cherry-picked from `tickets_help_desk` |
| Help pages + release notes — 7 commits, plus the route gated to dev | cherry-picked from `tickets_help_desk` |
| Mobile Performance — bars by direction, the money difference, the DEV MODE pill | built on this branch |
| **`formatDate` prints a bare date on its own day** — **client-facing** | built on this branch |

**This branch is no longer dev-only.** The `formatDate` fix lands in a shared
util, so it corrects Receivers, Coupons and Coupon Sales in the prod tree as
well — dates a client reads today are a day early. The publish needs a prod
release note and the sign-in "last updated" date, which it did not before.

## Awaiting green light

Status is against this branch as it stands, tested 2026-10-05;
`orders_polish` re-checked 2026-10-06.

| Work | Size | Applies | Waiting on |
| --- | --- | --- | --- |
| AWG Invoices — cards that open, editable rows | 3 commits | clean | approval |
| Mobile store seeding — the three item pages | 1 commit | clean | approval |
| `prod_help_export_entry` — the "?" explains Export | 1 commit | clean merge | approval |
| `scanner_exp` — camera confirm + scan gun | 1 commit | clean merge | **a device test on the MC2200** |
| Tickets — the Client Help Desk | 36 commits | clean | **not ready** (Steve, 2026-10-05) |
| Coming Soon "?" | 3 commits | clean **after** Tickets + AWG Invoices | Tickets |
| `orders_polish` — the new Orders page | 8 commits | **conflicts** (3 files, mechanical) | being demoed; approval |
| `lp_case_file` — LP Actions rebuild | 4 commits | **conflicts** (19 files) | `/lp` mounted on dev, then a rebase |

## Notes

**Take groups, not the whole branch.** The theme, UPC header and vendor margin
commits already in this branch also exist inside `tickets_help_desk`. Merging
that branch wholesale would bring them through a second time, so take what is
left from it as cherry-picked groups.

**One commit does not separate.** `1d6c788e` "One clear row per dropdown, not
two" is counted with Sales Export but also edits `NewTicketModal`,
`TicketDetail` and the shared `SelectFilter`. It ships with Tickets, which is
why the Sales Export group above is six and not seven.

**`orders_polish`'s three conflicts resolve to "take theirs".** Re-checked
2026-10-06. On this branch's side, exactly one commit ever touched those files:
`e93183a8`, the navy sweep, and every line of it is `#1e2a4a` -> `brand_navy`
or `rgba(30,42,74,..)` -> `rgb(var(--color-brand-navy) / ..)`. Nothing else.

The hunks look alarming — one is 220 lines against 16 — because `orders_polish`
rewrote whole blocks that the sweep had edited colour literals inside, so git
widens the conflict to the entire rewritten block. The size is the rewrite, not
disagreement.

And `orders_polish` has already done the sweep's job on two of the three:
`OrderReportPanel` and `OrdersExportModal` carry zero navy literals and use the
token (5 and 3 times). Take that branch's version of all three files, then
retokenise the 8 literals left in `MultiSelectFilter` (lines 140-245), and
`npm run audit:theme` confirms it.

**Orders changes a shared dev component.** `MultiSelectFilter` gains the
in-dropdown search (+112/−28), and three other dev pages import the same file:
Item Report, Sub Dept Margins perf and Vendors, each in its export modal. Their
prod twins import `components/filters/` and are untouched. Exercise those three
export modals after resolving — this file is one of the three conflicts, so
whatever lands there lands on all four pages.

**`lp_case_file` has not had the same look.** It predates the navy sweep too
and conflicts across 19 files, but nobody has checked whether those are the
same mechanical swap Orders turned out to be, or something structural. Assume
nothing until it is read the way Orders was — and it is blocked on `/lp` being
mounted on dev regardless.

**`dev_item_lookup_ui_fix` is done and can be deleted.** Its one commit is
already in master by another route — `git cherry master dev_item_lookup_ui_fix`
reports it upstream, and every file it adds is on master. What looked like a
conflict was it trying to re-apply work that is already there in a newer form.

**Twelve files still carry `#1e2a4a`**, all under `pages/tickets/dev/` — the
apiKeys, configs, docs, history and templates tabs. That is master's old Tickets
mock, which the sweep never saw because `tickets_help_desk` replaces those files
outright. They go when Tickets lands; tokenising them first is work on code that
is about to be deleted.
