import axios from "axios";

/**
 * `financials` — the daily per-bin figures behind the financial reports.
 *
 * One row per store per day per bin, straight from the POS records. Customers
 * ask for this as a file, so it is never aggregated or rounded on the way
 * through: whatever the table holds is what lands in the CSV.
 *
 * Scoped the same way every other store-shaped endpoint is — a store or a
 * group — so the export follows whatever the Sales page has searched.
 */

export interface FinancialsRow {
  storeid: number;
  /** A timestamp column, but every row sits at midnight. */
  sale_date: string;
  qty: number;
  sales: number;
  /** Null on anything not sold by weight. */
  weight: number | null;
  description: string;
  bin: number;
  store_name: string | null;
  store_number: string;
}

export interface FinancialsResponse {
  error: number;
  success: boolean;
  msg?: string;
  record_count: number;
  /** True when the row cap bit and the answer is short. Never ignore it — a
   *  truncated CSV looks exactly like a complete one. */
  truncated: boolean;
  maxRows: number;
  storeids: number[];
  data: FinancialsRow[];
}

/**
 * The cap this export asks for.
 *
 * The endpoint defaults to 50,000, which is sized for something a browser has
 * to render. This is a file, so a larger number is reasonable — the endpoint's
 * own note says raising it is a decision rather than a default, and writing a
 * download is the case it had in mind.
 *
 * Not unbounded, though. September across 227 stores was 708,233 rows, and a
 * CSV of that is tens of megabytes built as one string in the tab. 200,000 is
 * about a fortnight of a large group: big enough that a normal week of any
 * group sails under it, small enough that hitting it means the range really
 * was too wide, and `truncated` then says so out loud.
 */
export const FINANCIALS_EXPORT_MAX_ROWS = 200000;

/**
 * Daily per-bin financials for one store, or for a group.
 *
 * `singleStore` and `useGroups` are exclusive — the backend rejects both set
 * and neither — so `searchValue` is read as a storeid or a groupid depending
 * on which flag is on.
 */
export const getFinancials = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  searchValue: number,
  useGroups: 0 | 1,
  maxRows: number = FINANCIALS_EXPORT_MAX_ROWS,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "financials/export",
    data: {
      startDate,
      endDate,
      searchValue,
      useGroups,
      singleStore: useGroups === 1 ? 0 : 1,
      maxRows,
    },
  });
  return json;
};
