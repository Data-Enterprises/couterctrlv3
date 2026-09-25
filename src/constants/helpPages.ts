/**
 * The help pages that exist in S3, and which of them have a phone version.
 *
 * A key that isn't there answers **403, not 404** — the bucket grants
 * `s3:GetObject` but not listing, so S3 won't say whether a name exists — and a
 * cross-origin `<iframe>` can't read the status either way. It would simply
 * render S3's error XML inside the modal. So the app never probes: the "?" is
 * only offered for a name in this list, and `HelpPage` makes a wrong one a
 * compile error rather than something a user finds.
 *
 * Hand-written for now. It becomes generated output once the page source and
 * its build move into `tools/help/` — see the help-pages plan.
 */
// `release-notes` is not a page's help: it is what the avatar menu's Release
// Notes row opens. It rides here because it lives in the same bucket and is
// shown by the same modal, and because this list is what makes a name that
// isn't in S3 a compile error rather than error XML in the frame.
export const HELP_PAGES = [
  "admin",
  "cashiers",
  "categories",
  "coupon-sales",
  "coupons",
  "forecasting",
  "item-lookup",
  "loss-prevention",
  "orders",
  "receivers",
  "release-notes",
  "sales",
  "sales-export",
  "store-groups",
  "sub-dept-margins",
  "upc-list",
  "user-management",
  "vendors",
] as const;

export type HelpPage = (typeof HELP_PAGES)[number];

/**
 * Pages with a `<name>-mobile.html` beside the desktop one.
 *
 * The four that don't — Admin, Forecast, UPC List and User Management — have no
 * phone version of the page itself, so on a phone they'd never be reached; the
 * desktop file is the fallback rather than a request for a key that 403s.
 */
export const HAS_MOBILE: ReadonlySet<HelpPage> = new Set<HelpPage>([
  "cashiers",
  "categories",
  "coupon-sales",
  "coupons",
  "item-lookup",
  "loss-prevention",
  "orders",
  "receivers",
  "sales",
  "store-groups",
  "sub-dept-margins",
  "vendors",
]);
