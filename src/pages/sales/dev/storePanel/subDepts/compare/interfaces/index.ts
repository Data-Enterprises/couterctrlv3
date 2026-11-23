// Interfaces
import type { GradedItem, ListFilter, Side } from "../../interfaces";

/** One list handed to the drawer: its filters and its items. */
export type CompareInput = { filter: ListFilter; items: GradedItem[] };

/** Where an item stands, from what it sold this week, last week and last year.
 *  Every item that sold in any of the three lands in exactly one. */
export type Bucket = "more" | "less" | "new" | "stopped" | "lyOnly";

/** A list's items in one bucket: how many, and what they did. The amount is
 *  the change against last week, or last year's sales for `lyOnly`. */
export type BucketCell = { count: number; amount: number };

/** An item's figures, its bucket, and its changes on the grading measure
 *  (null = no sale to compare against). */
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
  bucket: Bucket | null;
  /** What the item did, the bucket's way: see BucketCell. */
  amount: number;
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

/** One list's week in the sales chart: its figure as text and as a number
 *  (for the bar), and its change to this week (null on the this-week row). */
export type SalesCell = { fig: string; value: number; pct: number | null };

/** A week in the sales chart. */
export type SalesRow = { label: string; now: boolean; cells: [SalesCell, SalesCell] };

/** One list's cell in the where-the-items-stand table. */
export type StandCell = {
  side: Side;
  count: number;
  amount: string;
  tone: "up" | "down" | "plain";
};

/** A row of the where-the-items-stand table. */
export type StandRow = { bucket: Bucket; label: string; cells: [StandCell, StandCell] };

/** An item in the open tab, tagged with its list. */
export type BucketItem = { side: Side; row: CompareRowData };

/** One list in the compare bar: "pepsi", "16 items", "13 not sold since LY". */
export type BarList = { side: Side; name: string; items: string; gone: string };
