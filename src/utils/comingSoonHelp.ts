/**
 * Which part of the Coming Soon overview each unreleased page opens at.
 *
 * The overview is one document — the same one handed to clients — with a
 * section per page. Rather than eight help files that would drift apart, the
 * "?" on a Coming Soon page opens that document at its own heading.
 *
 * Keys are routes, because the route is what the app knows at the moment the
 * button is pressed. Values are the `id` attributes in the document; they are
 * not derived from the route and must not be, since the document groups where
 * the menu separates — both Price Opt pages share one section, and Tickets is
 * written up under the name clients see it by.
 *
 * A route that is not here gets no "?" at all rather than the document's top,
 * which would answer a question nobody asked.
 */
export const COMING_SOON_HELP_SECTIONS: Readonly<Record<string, string>> = {
  "item-report": "item-actions",
  "sales-tracker": "sales-tracker",
  tickets: "help-desk",
  "sales-export": "sales-export",
  "inventory-sub-department": "price-opt",
  "inventory-vendor": "price-opt",
  invoices: "invoices",
  "lp-actions": "lp-actions",
  "upc-scanner": "upc-scanner",
};

/** The document's own section for a route, or null where it has none. */
export const comingSoonSection = (pathname: string): string | null =>
  COMING_SOON_HELP_SECTIONS[pathname.replace(/^\//, "")] ?? null;
