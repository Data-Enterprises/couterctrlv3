/** The page sizes the item view offers: one store's week ran to 4,668 items. */
export const PAGE_SIZES = [100, 250, 500];

/**
 * The page to show, kept in range: a page past the end of a list that has
 * since shrunk shows its last page rather than nothing.
 */
export const clampPage = (page: number, total: number, pageSize: number) =>
  Math.min(Math.max(0, page), Math.max(0, Math.ceil(total / pageSize) - 1));
