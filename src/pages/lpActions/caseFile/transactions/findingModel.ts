import { weekdayOf } from "../../../lossPrevention/gradingUtils";
import { blockLabel, type EvidenceRow } from "./facetsModel";

/**
 * The one sentence worth putting under a chart — or nothing at all.
 *
 * Scans weekday × time-block for the densest cluster and reports it only if it
 * clears a bar: at least a fifth of that type's occurrences inside a single
 * recurring window. Below that the "pattern" is arithmetic, and an LP screen
 * that cries wolf gets ignored, so the honest output is silence.
 *
 * Also the source of the "inside the flagged window" check on a receipt's
 * verdict — the two must agree, so they read the same finding rather than each
 * deciding for themselves what counts as a cluster.
 */

export interface CaseFinding {
  saleType: string;
  /** Occurrences inside the window. */
  count: number;
  /** Occurrences of that type across the whole period. */
  ofTotal: number;
  pct: number;
  weekday: string;
  block: string;
  windowLabel: string;
  /** The lane carrying the cluster, when one clearly does. */
  lane: string | null;
}

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** A fifth of a type's volume landing in one recurring window is a pattern.
 *  Less than that is where it happened to be busy. */
const MIN_SHARE = 0.2;

/** Below this there is nothing to have a pattern about. */
const MIN_COUNT = 4;

export const buildFinding = (rows: EvidenceRow[]): CaseFinding | null => {
  if (rows.length === 0) return null;

  const byType = new Map<string, EvidenceRow[]>();
  for (const r of rows) {
    const list = byType.get(r.saleType);
    if (list) list.push(r);
    else byType.set(r.saleType, [r]);
  }

  let best: CaseFinding | null = null;

  for (const [saleType, ofType] of byType) {
    if (ofType.length < MIN_COUNT) continue;

    const cells = new Map<string, EvidenceRow[]>();
    for (const r of ofType) {
      const key = `${weekdayOf(r.date)}|${blockOf(r)}`;
      const list = cells.get(key);
      if (list) list.push(r);
      else cells.set(key, [r]);
    }

    for (const [key, cell] of cells) {
      const share = cell.length / ofType.length;
      if (cell.length < MIN_COUNT || share < MIN_SHARE) continue;
      if (best && cell.length <= best.count) continue;

      const [wd, block] = key.split("|");
      const lanes = new Set(cell.map((r) => r.lane));
      best = {
        saleType,
        count: cell.length,
        ofTotal: ofType.length,
        pct: Math.round(share * 100),
        weekday: WEEKDAY[Number(wd)] ?? "—",
        block,
        windowLabel: `${WEEKDAY[Number(wd)] ?? "—"}s, ${blockLabel(block)}`,
        lane: lanes.size === 1 ? [...lanes][0] : null,
      };
    }
  }

  return best;
};

/** The block key a row falls in. Kept next to the scan that uses it so the two
 *  cannot drift apart. */
const blockOf = (row: EvidenceRow) => {
  if (row.hour < 11) return "morning";
  if (row.hour < 15) return "midday";
  if (row.hour < 18) return "afternoon";
  return "evening";
};

export const inFinding = (row: EvidenceRow, finding: CaseFinding | null) => {
  if (!finding) return false;
  return (
    WEEKDAY[weekdayOf(row.date)] === finding.weekday &&
    blockOf(row) === finding.block
  );
};

/** The lane carrying the most exceptions, when one clearly leads. Null when
 *  they are spread — "the hot lane" is not a claim worth making about a set
 *  that is evenly split. */
export const hotLaneOf = (rows: EvidenceRow[]): string | null => {
  if (rows.length === 0) return null;
  const tally = new Map<string, number>();
  for (const r of rows) tally.set(r.lane, (tally.get(r.lane) ?? 0) + 1);
  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length < 2) return ranked[0]?.[0] ?? null;
  return ranked[0][1] > ranked[1][1] * 1.5 ? ranked[0][0] : null;
};
