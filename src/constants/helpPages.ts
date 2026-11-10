/**
 * Every screen with a "?", by the name its help is filed under.
 *
 * The help itself is data in `components-dev/help` — `content` for desktop,
 * `phone` for the screens that have a phone version. `HELP_CONTENT` is a
 * `Record` over this list, so a name added here without desktop help is a
 * compile error, and `HelpPage` makes a "?" for a name that isn't here one
 * too.
 *
 * These were once file names in an S3 bucket, which is why they are
 * kebab-case.
 */
export const HELP_PAGES = [
  "admin",
  "cashiers",
  "categories",
  "coupon-sales",
  "coupons",
  "data-export",
  "forecasting",
  "help-desk",
  "item-actions",
  "item-lookup",
  "loss-prevention",
  "markdowns",
  "orders",
  "price-opt-sub-dept",
  "price-opt-vendor",
  "receivers",
  "sales",
  "sales-investigate",
  "sales-tracker",
  "store-groups",
  "sub-dept-margins",
  "upc-list",
  "user-management",
  "vendors",
] as const;

export type HelpPage = (typeof HELP_PAGES)[number];
