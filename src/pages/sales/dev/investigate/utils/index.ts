import type { Stage } from "../hooks/useDeptInvestigation";
import type { Cause } from "./deptInvestigation";
import { formatCurrency2 } from "../../../../../utils";

/**
 * How many rows a page holds.
 *
 * A department can run to several thousand items, which is more than a
 * scroll can carry and more than a browser enjoys laying out. It used to
 * print the biggest three hundred and say so in a footer, which meant the
 * tail was unreachable: the chips could narrow it, but an item outside the
 * top three hundred of every filter could not be got to at all.
 *
 * Paged instead. The order is still biggest difference first, so page one
 * is what the cap used to show, and every later page is the tail nobody
 * could reach.
 */
export const PAGE_ROWS = 50;

/** mm/dd/yyyy. Noon, so a bare yyyy-mm-dd is not pulled back a day by the
 *  browser's timezone. */
export const usDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

/** What is still outstanding, and what the screen cannot say yet because of
 *  it. A cause that sharpens as data lands has to explain itself. */
export const STAGE_NOTE: Record<Stage, string | null> = {
  sales: "Loading this department's items…",
  orders:
    "Reading orders — until they land, nothing can be called never ordered.",
  receipts:
    "Reading what was received — until it lands, a vendor's miss cannot be told from a merchandising one.",
  done: null,
  failed: null,
};

/**
 * The piles the department's own shape points at.
 *
 * The report works out whether a gap is volume or price before anybody opens
 * this screen, and that reading says which causes are worth looking at first.
 * It MARKS them and does not apply them: a department can be entirely volume
 * and have no item flagged never-ordered, and landing somebody on an empty
 * grid would hide that disagreement instead of showing it.
 */
export const SUGGESTED: Record<string, Cause[]> = {
  ringing: ["never-ordered", "not-carried"],
  orders: ["never-ordered", "not-carried", "not-received"],
  price: ["price-mix"],
  mix: ["price-mix"],
};

export const CAUSE_ORDER: Cause[] = [
  "never-ordered",
  "not-received",
  "cost",
  "not-moving",
  "price-mix",
  "streamlined",
  "ahead",
];

/**
 * Always money, never the page's metric.
 *
 * The sales columns follow the Sales/Quantity toggle, and in quantity mode
 * `fmt` renders a unit count. Cost and margin are dollars either way — see
 * `mineSales` in the shared math — so they format themselves and ignore the
 * formatter the column is handed.
 */
export const cash = (v: number) => formatCurrency2(v);
