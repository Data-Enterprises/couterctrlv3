import type { ExportRow } from "../../../api/salesExport";

export interface RowFilters {
  saleTypes: string[];
  ringTypes: string[];
  subDepartments: string[];
  vendors: string[];
  excludeVoids: boolean;
}

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
 * The preview returns its fifty rows before any row filter is applied — it
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

  return rows.filter((row) => {
    if (!keeps(sale, row["sale_type"], lower)) return false;
    if (!keeps(ring, row["item_ring_type"])) return false;
    if (!keeps(sub, row["sub_department"])) return false;
    if (!keeps(vendor, row["vendor_id"])) return false;
    // COALESCE(void_flag, 0) = 0, as the export writes it.
    if (filters.excludeVoids && Number(row["void_flag"] ?? 0) !== 0) {
      return false;
    }
    return true;
  });
};
