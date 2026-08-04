/** Paged-endpoint helper.
 *
 *  Several endpoints cap a response at `page_size` rows and report
 *  `total_pages`, so a caller that only reads page 1 silently truncates. The
 *  same loop had grown four separate copies — Cashiers, Cashiers legacy,
 *  LP desktop and CashierSales — three of them sequential. This is the one
 *  version: page 1 is already in hand, the rest go out together.
 *
 *  Deliberately knows nothing about any particular endpoint. Give it the first
 *  response, the rows it produced, and a way to ask for page N.
 */

/** Any paged response. `total_pages` is optional so a caller can pass a
 *  response from an endpoint that hasn't been paginated yet without a cast. */
export interface PagedResponse {
  total_pages?: number;
  page_label?: string;
}

/**
 * Fetch every remaining page and return the complete row set.
 *
 * Pages 2..N are requested in parallel, so the cost is one round trip rather
 * than N. A page that fails should resolve to `[]` inside `fetchPage` rather
 * than reject — one bad page shouldn't lose the pages that did arrive.
 */
export const fetchAllPages = async <T>(
  firstPage: PagedResponse,
  firstRows: T[],
  fetchPage: (page: number) => Promise<T[]>,
): Promise<T[]> => {
  const total = firstPage.total_pages ?? 1;
  if (total <= 1) return firstRows;

  const rest = await Promise.all(
    Array.from({ length: total - 1 }, (_, i) => fetchPage(i + 2)),
  );
  return [...firstRows, ...rest.flat()];
};

/** How many requests `fetchAllPages` will make in total, page 1 included.
 *  Useful for loading copy — "Loading 4 of 4" beats an unqualified spinner
 *  when a store's category list runs to several thousand rows. */
export const pageCount = (firstPage: PagedResponse) =>
  Math.max(firstPage.total_pages ?? 1, 1);
