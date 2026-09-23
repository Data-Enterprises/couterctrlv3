import type { ExportRow } from "../../../api/salesExport";

export interface RowFilters {
  saleTypes: string[];
  ringTypes: string[];
  subDepartments: string[];
  vendors: string[];
  excludeVoids: boolean;
}

/** Case-insensitively, the way the endpoint matches saleTypes. */
const keeps = (chosen: Set<string>, value: unknown) => {
  const v = String(value ?? "").toLowerCase();
  // A row whose value the response never offered is left alone rather than
  // silently dropped: a filter can only speak for what it was given.
  return v === "" || chosen.has(v);
};

/**
 * The sample rows the file would hold, given the row filters.
 *
 * The preview returns its fifty rows before any row filter is applied — it
 * describes the window, not the export — so the same filters have to be
 * applied here. Without it, unticking Tender leaves tender lines sitting in a
 * preview of a file that will not have them.
 *
 * Only `saleTypes` and `excludeVoids` reach `/sales/export`. Ring type, sub
 * department and vendor narrow this sample alone until the endpoint takes
 * them, which is why the page says so beside those three.
 */
export const filterSampleRows = (rows: ExportRow[], filters: RowFilters) => {
  const sale = new Set(filters.saleTypes.map((s) => s.toLowerCase()));
  const ring = new Set(filters.ringTypes.map((s) => s.toLowerCase()));
  const sub = new Set(filters.subDepartments.map((s) => s.toLowerCase()));
  const vendor = new Set(filters.vendors.map((s) => s.toLowerCase()));

  return rows.filter((row) => {
    if (!keeps(sale, row["sale_type"])) return false;
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
