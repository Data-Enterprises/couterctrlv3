import type { ExportRow } from "../../../api/salesExport";
import { normalizeProductCode } from "./productCodes";

export interface RowFilters {
  saleTypes: string[];
  ringTypes: string[];
  subDepartments: string[];
  vendors: string[];
  /** Numbers, unlike every other id here — cashier_number is a bigint. */
  cashiers: number[];
  /** Matched as stored; "" is the lines that have none, which is a choice
   *  rather than an absence. */
  priceTypes: string[];
  /** `YYYY-MM-DD`, compared against the day part of the timestamp. */
  saleDates: string[];
  /** Empty means every code, not none: this list is typed, not chosen. */
  productCodes: string[];
  /** Words to find in the description; empty means every product. */
  productDescriptions: string[];
  /** Null leaves the flag alone, 0 drops flagged rows, 1 keeps only them. */
  voidFlag: number | null;
  refundFlag: number | null;
}

/**
 * One flag column, read the way the endpoint reads it.
 *
 * COALESCE(flag, 0) against zero rather than an equality test: a third of
 * rows are null in both columns, and refund_flag carries 1, 2 and 9 — so
 * "only refunds" has to mean any marker rather than the literal 1.
 */
const keepsFlag = (want: number | null, value: unknown) => {
  if (want === null) return true;
  const flagged = Number(value ?? 0) !== 0;
  return want ? flagged : !flagged;
};

/**
 * Kept if the row's value is one of the chosen.
 *
 * A row whose value the response never offered is left alone rather than
 * silently dropped: a filter can only speak for what it was given.
 *
 * `fold` mirrors what the endpoint does to each column. Only `sale_type` is
 * lower-cased on both sides there; item_ring_type, sub_department and
 * vendor_id are matched as stored, because they come straight off the preview,
 * which read them from the same columns.
 */
const keeps = (
  chosen: Set<string>,
  value: unknown,
  fold: (s: string) => string = (s) => s,
) => {
  const v = fold(String(value ?? ""));
  return v === "" || chosen.has(v);
};

const lower = (s: string) => s.toLowerCase();

/**
 * The sample rows the file would hold, given the row filters.
 *
 * The preview returns its two hundred rows before any row filter is applied — it
 * describes the window, not the export — so the same filters have to be
 * applied here. Without it, unticking Tender leaves tender lines sitting in a
 * preview of a file that will not have them.
 *
 * Every one of these reaches `/sales/export` too, so what narrows the sample
 * narrows the file. They are matched the same way the endpoint matches them,
 * which is the point of doing it here at all.
 */
export const filterSampleRows = (rows: ExportRow[], filters: RowFilters) => {
  const sale = new Set(filters.saleTypes.map(lower));
  const ring = new Set(filters.ringTypes);
  const sub = new Set(filters.subDepartments.map(String));
  const vendor = new Set(filters.vendors.map(String));
  const codes = new Set(filters.productCodes.map(normalizeProductCode));
  const terms = filters.productDescriptions.map((t) => t.toLowerCase());
  const cashier = new Set(filters.cashiers.map(String));
  const price = new Set(filters.priceTypes);
  const days = new Set(filters.saleDates);

  return rows.filter((row) => {
    if (!keeps(sale, row["sale_type"], lower)) return false;
    if (!keeps(ring, row["item_ring_type"])) return false;
    if (!keeps(sub, row["sub_department"])) return false;
    if (!keeps(vendor, row["vendor_id"])) return false;
    if (!keeps(cashier, row["cashier_number"])) return false;
    // Not `keeps`: an empty price type is a value here, so a row holding
    // none is only kept when "" was picked.
    if (price.size) {
      const value = row["price_type"];
      if (!price.has(value === null || value === undefined ? "" : String(value))) {
        return false;
      }
    }
    // sale_date is a timestamp, and the endpoint casts it to a date to
    // compare — the first ten characters are that cast.
    if (days.size) {
      const day = String(row["sale_date"] ?? "").slice(0, 10);
      if (day !== "" && !days.has(day)) return false;
    }
    if (codes.size && !codes.has(normalizeProductCode(row["product_code"]))) {
      return false;
    }
    // A contains, without case: descriptions are written the way a till
    // writes them, so this is the only match anyone can actually use.
    if (terms.length) {
      const description = String(row["product_description"] ?? "").toLowerCase();
      if (!terms.some((t) => description.includes(t))) return false;
    }
    if (!keepsFlag(filters.voidFlag, row["void_flag"])) return false;
    if (!keepsFlag(filters.refundFlag, row["refund_flag"])) return false;
    return true;
  });
};
