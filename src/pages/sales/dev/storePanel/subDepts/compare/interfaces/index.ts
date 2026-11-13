// Interfaces
import type { GradedItem, Side } from "../../interfaces";

/** How both lists are ranked: this week's figure, or the change against last
 *  week or last year, the biggest drop first. */
export type CompareSort = "ty" | "vsLW" | "vsLY";

/** One list handed to the panel: its name and its items. */
export type CompareInput = { label: string; items: GradedItem[] };

/** An item's figures, with its changes on the grading measure (null = no
 *  sale to compare against). */
export type CompareRowData = {
  key: string;
  upc: string;
  desc: string;
  hasTY: boolean;
  tyNet: number;
  tyQty: number;
  lwNet: number | null;
  lwQty: number | null;
  lyNet: number | null;
  lyQty: number | null;
  lwPct: number | null;
  lyPct: number | null;
};

/** A list's totals: its count, the three weeks and the changes. */
export type CompareTotals = {
  count: number;
  tyNet: number;
  tyQty: number;
  lwNet: number;
  lwQty: number;
  lyNet: number;
  lyQty: number;
  hasLW: boolean;
  hasLY: boolean;
  lwPct: number | null;
  lyPct: number | null;
};

/** One list's line in a week box: the week's figure, the one behind it, and
 *  the change to this week (none on the this-week box). */
export type WeekLine = { side: Side; value: string; other: string; pct: number | null };

/** One of the three boxes at the top. */
export type WeekBoxData = { label: string; dates: string; lines: WeekLine[]; gap: string };
