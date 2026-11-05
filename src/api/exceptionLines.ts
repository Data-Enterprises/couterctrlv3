import axios from "axios";

/**
 * One register line from `POST /cashiers/exceptions`: a line that was not an
 * ordinary sale. One line, not one event: a ten-line void is ten of these
 * sharing a `sale_id`.
 */
export interface ExceptionLine {
  storeid: number;
  store_name: string;
  store_number: string;
  /** Voided, Cancelled, No Sale, Refunded or Backup. */
  sale_type: string;
  sale_date: string;
  line_number: number;
  terminal: number | string;
  total_sales: number;
  net_sales: number;
  /** The receipt: storeid-sale_id-terminal-M-D-Y. */
  sale_id: string;
  product_code: string | null;
  product_description: string | null;
  price_type: string | null;
  qty: number;
  weight: number | null;
  is_discounted: boolean | null;
  is_coupon: boolean | null;
  total_rounded_tax: number | null;
  cashier_number: number | string | null;
  cashier_name: string | null;
  sale_start_time: string | null;
  sale_end_time: string | null;
}

export interface ExceptionLinesResp {
  error: number;
  success: boolean;
  msg?: string;
  store_count?: number;
  record_count?: number;
  total_pages?: number;
  page?: number;
  transactions?: ExceptionLine[];
}

/**
 * Every exception line for one store and a date range, one page of 500.
 *
 * Served from a pre-built table of non-sale lines, so the read is cheap on the
 * server; it is not aggregated, so every line comes back. A window with no
 * exceptions answers `error: 1` with "No records returned", which callers
 * should read as an empty week rather than a failure.
 */
export const getExceptionLines = async (
  url: string,
  token: string,
  storeId: number,
  startDate: string,
  endDate: string,
  page: number = 1,
) =>
  axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "cashiers/exceptions",
    data: {
      startDate,
      endDate,
      useGroups: 0,
      singleStore: 1,
      searchValue: storeId,
      page,
    },
  });
