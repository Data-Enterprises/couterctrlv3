import type { SortState } from "../../../../utils/useTriStateSort";
import type { LpEvidenceSortCol } from "../../../../features/lpActionsSlice";
import type { EvidenceRow } from "./facetsModel";

/**
 * Sorting the evidence grid.
 *
 * `null` is the grid's own order — date, then time, then position on the
 * receipt — which is the order the events actually happened in. That is the
 * default worth being able to get back to, because a receipt read out of
 * sequence loses the one thing its ordering says.
 *
 * Type and Item are deliberately not sortable. Both are already facets on the
 * left, where picking one narrows the grid instead of shuffling it; a column
 * that sorts and a rail that filters doing the same job two ways is a choice
 * nobody needs to make.
 */

/** The transaction number out of the compound sale id, as a number when it
 *  is one — so 9 sorts before 10 rather than after it. */
const txnOf = (saleId: string) => {
  const part = saleId.split("-")[1] ?? "";
  const n = Number(part);
  return Number.isFinite(n) && part !== "" ? n : null;
};

const laneOf = (lane: string) => {
  const n = Number(lane);
  return Number.isFinite(n) && lane.trim() !== "" ? n : null;
};

const valueOf = (
  row: EvidenceRow,
  col: LpEvidenceSortCol,
): number | string | null => {
  if (col === "date") return row.date;
  // `hhmmss`, zero-padded so it compares the same as a clock reads.
  if (col === "time") return row.time.padStart(6, "0");
  if (col === "txn") return txnOf(row.saleId);
  if (col === "lane") return laneOf(row.lane);
  if (col === "qty") return row.qty;
  return row.amount;
};

export const sortEvidence = (
  rows: EvidenceRow[],
  sort: SortState<LpEvidenceSortCol>,
): EvidenceRow[] => {
  if (!sort) return rows;
  const dir = sort.dir === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const va = valueOf(a, sort.col);
    const vb = valueOf(b, sort.col);

    // Absent, not small — a lane that never came through sorts last whichever
    // way the column is pointing.
    if (va === null) return vb === null ? 0 : 1;
    if (vb === null) return -1;

    if (typeof va === "string" && typeof vb === "string") {
      return va.localeCompare(vb) * dir;
    }
    return ((va as number) - (vb as number)) * dir;
  });
};
