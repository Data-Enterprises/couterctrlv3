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

Status is against this branch as it stands, tested 2026-10-05.

| Work | Size | Applies | Waiting on |
| --- | --- | --- | --- |
| AWG Invoices — cards that open, editable rows | 3 commits | clean | approval |
| Mobile store seeding — the three item pages | 1 commit | clean | approval |
| `prod_help_export_entry` — the "?" explains Export | 1 commit | clean merge | approval |
| `scanner_exp` — camera confirm + scan gun | 1 commit | clean merge | **a device test on the MC2200** |
| Tickets — the Client Help Desk | 36 commits | clean | **not ready** (Steve, 2026-10-05) |
| Coming Soon "?" | 3 commits | clean **after** Tickets + AWG Invoices | Tickets |
| `orders_polish` | 8 commits | **conflicts** (3 files) | rebase, then approval |
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

**The two conflicting branches** predate the navy sweep and touch files it
retokenised. None of the conflicts look structural — they are the same lines in
a different spelling — but each needs a rebase before it can be judged.

**`dev_item_lookup_ui_fix` is done and can be deleted.** Its one commit is
already in master by another route — `git cherry master dev_item_lookup_ui_fix`
reports it upstream, and every file it adds is on master. What looked like a
conflict was it trying to re-apply work that is already there in a newer form.

**Twelve files still carry `#1e2a4a`**, all under `pages/tickets/dev/` — the
apiKeys, configs, docs, history and templates tabs. That is master's old Tickets
mock, which the sweep never saw because `tickets_help_desk` replaces those files
outright. They go when Tickets lands; tokenising them first is work on code that
is about to be deleted.
