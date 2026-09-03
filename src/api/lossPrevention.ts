import axios from "axios";
import { fetchAllPages } from "../utils/paging";

export const getSaleTypes = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  saleTypes: string[] = [""],
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "cashiers/preflight",
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
      saleTypes,
    },
  });
  return json;
};

export const getCashierDetails = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  saleTypes: string[],
  searchString: string = "",
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "cashiers/",
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
      saleTypes,
      searchString,
    },
  });
  return json;
};

export const getCashierTransaction = async (
  url: string,
  token: string,
  transactionDate: string,
  saleid: string,
  storeid: number,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "cashiers/transaction",
    data: {
      transactionDate,
      saleid,
      storeid,
    },
  });
  return json;
};

export const getCashierTable = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  saleTypes: string[],
  page: number = 1,
  searchString: string = "",
  /**
   * Output grain.
   *
   * `"product"` is one row per basket per product description — the shape every
   * existing caller receives, and the default so none of them change.
   *
   * `"cashier"` is the per-cashier-per-week rollup LP Actions builds in the
   * browser, built in SQL instead: same baskets, same filters, about three
   * orders of magnitude fewer rows. It is a mode on this endpoint rather than a
   * separate route so a rollup cannot drift from the rows it summarises — and a
   * drifting rollup surfaces as wrong GRADES, which is worse and less visible
   * than missing rows.
   */
  groupBy: "product" | "cashier" = "product",
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "cashiers/cashier_table",
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
      saleTypes,
      page,
      searchString,
      groupBy,
    },
  });
  return json;
};

/**
 * Basket ids for a window, without the rows behind them.
 *
 * `cashier_table` is a paged table: naming the receipts for a large group means
 * walking every page and throwing away all but `sale_id`, which is most of what
 * makes a group search expensive. This answers with the id list directly, so
 * the walk collapses to one request.
 *
 * `transaction_count` is the total distinct baskets in the window BEFORE
 * `limit` is applied, so the page can say "showing 400 of 13086" without a
 * second call. The old client-side cap could only know the overflow by first
 * fetching everything it was about to discard.
 *
 * Deliberately dev-only for now — see the call sites. The id ORDER is the same
 * sequence the paged walk produced, so a capped response holds the same ids the
 * client would have kept rather than a different slice of the same set.
 */
export const getTransactionIds = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  saleTypes: string[],
  limit?: number,
  searchString: string = "",
  /**
   * One cashier's baskets.
   *
   * Filters the EXCEPTION line, not the basket: a basket comes back when the
   * cashier who rang the exception matches, which is the question a case file
   * asks. With `saleTypes` narrowing the what, this narrows the who.
   *
   * Cashier numbers are issued per store, so this alone is not an identity —
   * callers scoping a group search must still narrow to their store.
   */
  cashierNumber?: number,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "cashiers/transaction_ids",
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
      saleTypes,
      searchString,
      ...(limit ? { limit } : {}),
      ...(cashierNumber !== undefined ? { cashierNumber } : {}),
    },
  });
  return json;
};

/**
 * Resolve a product — and the baskets holding it — in one call.
 *
 * The replacement for `cashier_table`'s description search as step one of the
 * register walk. Send `productCodes` when the UPC is already known and the
 * transaction ids come back on the same response, scoped on `qty <> 0`: every
 * basket containing the item, not only those carrying a discount row.
 *
 * `searchString` is the other half, for a description with no UPC behind it.
 * It answers with the product picker instead, and `transaction_ids` arrives
 * empty whenever the text spans more than one product — "Smithfield" routinely
 * matches two.
 *
 * Unpaged: the ids arrive in full, so there is no `fetchAllPages` here.
 */
export const getProductLookup = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  opts: { productCodes?: string[]; searchString?: string },
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "cashiers/product_lookup",
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
      ...(opts.productCodes ? { productCodes: opts.productCodes } : {}),
      ...(opts.searchString ? { searchString: opts.searchString } : {}),
    },
  });
  return json;
};

export const getTransactionList = async (
  url: string,
  token: string,
  transaction_ids: string[],
  page: number = 1,
  sale_type: string,
  search_string: string = "",
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "cashiers/transaction_list",
    data: {
      transaction_ids,
      sale_type,
      page,
      search_string,
    },
  });
  return json;
};

/**
 * Every page of transaction_list, merged.
 *
 * The endpoint caps a response at its page size and reports `total_pages`, so
 * reading page 1 only truncates silently — Loss Prevention's day strip stopped
 * at whatever date page 1 happened to reach while the header total came from
 * the unpaginated summary, and the two disagreed by the missing days.
 *
 * Returns the page-1 response with `transactions` replaced by the full set, so
 * callers keep whatever they were already doing with `resp.data`.
 */
export const getAllTransactionList = async (
  url: string,
  token: string,
  transaction_ids: string[],
  sale_type: string,
  search_string: string = "",
) => {
  const first = await getTransactionList(
    url,
    token,
    transaction_ids,
    1,
    sale_type,
    search_string,
  );
  const j = first.data;
  if (j.error !== 0) return first;

  const transactions = await fetchAllPages(
    j,
    [...(j.transactions ?? [])],
    async (page: number) => {
      try {
        const r = await getTransactionList(
          url,
          token,
          transaction_ids,
          page,
          sale_type,
          search_string,
        );
        return r.data.error === 0 ? r.data.transactions : [];
      } catch {
        return [];
      }
    },
  );

  return { ...first, data: { ...j, transactions } };
};

export const emailTransaction = async (
  url: string,
  token: string,
  transaction_id: string,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "cashiers/email_transaction",
    data: {
      transaction_id,
    },
  });
  return json;
};
