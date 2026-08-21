import { buildBranches, FACETS } from "./facetModel";
import type { FacetKey } from "./facetModel";
import { formatDateSimple } from "../../../utils";
import type { WeekWindow } from "../lpActionsMetrics";
import type {
  CashierTransaction,
  TransactionListItem,
} from "../../../interfaces";

/**
 * The drill, as rows.
 *
 * Long rather than wide: one row per branch, with the facet named in its own
 * column. Six facets have nothing in common — a lane and an hour are not the
 * same kind of value and cannot share a column header — so a wide sheet would
 * be six tables glued side by side, and the first thing anyone did with it
 * would be to split them apart again.
 *
 * The share column is the whole reason to export this. A branch's count means
 * nothing without the denominator, and a spreadsheet is exactly where someone
 * will sort by it.
 */
export interface FacetExportInput {
  rows: CashierTransaction[];
  lines: TransactionListItem[];
  windows: WeekWindow[];
  saleType: string;
  facets: FacetKey[];
  cashierName: string;
  cashierNumber: number;
  storeName: string;
}

export const FACET_HEADERS = [
  "Cashier",
  "Cashier number",
  "Store",
  "Exception",
  "Cut by",
  "Value",
  "Occurrences",
  "Receipts",
  "Amount",
  "Share of occurrences",
];

export const buildFacetRows = ({
  rows,
  lines,
  windows,
  saleType,
  facets,
  cashierName,
  cashierNumber,
  storeName,
}: FacetExportInput): (string | number)[][] => {
  const out: (string | number)[][] = [];

  for (const key of facets) {
    const spec = FACETS.find((f) => f.key === key);
    if (!spec) continue;
    const branches = buildBranches(rows, lines, windows, saleType, key);
    const total = branches.reduce((acc, b) => acc + b.count, 0);

    for (const b of branches) {
      out.push([
        cashierName,
        cashierNumber,
        storeName,
        saleType,
        spec.label,
        b.label,
        b.count,
        b.receipts,
        Number(b.value.toFixed(2)),
        total > 0 ? Number(((b.count / total) * 100).toFixed(1)) : 0,
      ]);
    }
  }

  return out;
};

/** `Voided_by_day-of-week_lane_08-20-2026`. Named from what was actually
 *  exported, so two files from two cuts never collide in a downloads folder. */
export const facetFileName = (
  saleType: string,
  facets: FacetKey[],
  windows: WeekWindow[],
) => {
  const cut = facets
    .map((k) => FACETS.find((f) => f.key === k)?.label ?? k)
    .join("_")
    .replace(/\s+/g, "-")
    .toLowerCase();
  const end = windows[windows.length - 1]?.end ?? "";
  const stamp = end ? formatDateSimple(end).replace(/\//g, "-") : "";
  return `${saleType}_by_${cut}${stamp ? `_${stamp}` : ""}`.replace(
    /[^\w.-]+/g,
    "_",
  );
};
