// Interfaces
import type { GradedItem, ListFilter } from "../../interfaces";

/** One list handed to the panel: its filters and its items. */
export type CompareInput = { filter: ListFilter; items: GradedItem[] };

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

/** One week in the strip: who is ahead, each list's figure, and A's share
 *  of the two (null with nothing sold that week). */
export type WeekBar = {
  label: string;
  gap: string;
  aFig: string;
  bFig: string;
  aShare: number | null;
  aPct: string;
  bPct: string;
};
