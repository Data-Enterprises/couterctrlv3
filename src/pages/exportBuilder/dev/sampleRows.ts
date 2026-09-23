import type { ExportRow } from "../../../api/salesExport";

/**
 * The sample rows the file would hold, given the row filters.
 *
 * The preview returns its ten rows before any row filter is applied — it
 * describes the window, not the export — so the same filters the export will
 * apply have to be applied here. Without it, unticking Tender leaves tender
 * lines sitting in a preview of a file that will not have them.
 */
export const filterSampleRows = (
  rows: ExportRow[],
  selectedSaleTypes: string[],
  excludeVoids: boolean,
) => {
  // Case-insensitively, the way the endpoint matches saleTypes.
  const picked = new Set(selectedSaleTypes.map((s) => s.toLowerCase()));
  return rows.filter((row) => {
    const type = String(row["sale_type"] ?? "").toLowerCase();
    // A row whose type the response never offered is left alone rather than
    // silently dropped: the filter can only speak for types it was given.
    if (type && !picked.has(type)) return false;
    // COALESCE(void_flag, 0) = 0, as the export writes it.
    if (excludeVoids && Number(row["void_flag"] ?? 0) !== 0) return false;
    return true;
  });
};
