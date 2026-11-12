// Utils
import { formatBigNumber, formatCurrency2 } from "../../../../../utils";

// Interfaces
import type { Stage, Cause, SupplyEvent, PricePoint } from "../interfaces";

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

/** One spelling of an item code for sales, orders and receipts alike, so a
 *  code padded on one endpoint still meets itself on the others. */
export const codeOf = (c: unknown) => String(c ?? "").trim();

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

/** Sep 24, from an ISO date that may or may not carry a time behind it. */
export const onDay = (d: string) =>
  new Date(d.slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

/** "003 - IGA HUNTSVILLE AL" is a heading, not a tab. The number is what
 *  the rest of the screen calls it anyway. */
export const shortStore = (name: string) => {
  const lead = name.trim().split(/[\s-]/)[0];
  return /^\d+$/.test(lead) ? lead : name;
};

/**
 * The name without the store number it already carries.
 *
 * A column this narrow cannot hold "Bruces Foodland 369" on one line, and
 * what it was dropping was the front of it -- three stores all reading
 * "OODLAND 36_". The number goes on its own line underneath, where it is
 * the part that tells the two apart.
 */
export const splitStore = (name: string, number: string) => {
  const full = name.trim();
  if (!number || !full.endsWith(number)) return full;
  const head = full.slice(0, -number.length).replace(/[\s\-·,]+$/, "");
  return head || full;
};

/** Money to the cent, and a count with separators. */
export const money = (v: number) => formatCurrency2(v);
export const count = (v: number) => formatBigNumber(v, 0);

/** A figure the store does not have. Dashes rather than $0.00, which is a
 *  measurement and this is an absence. */
export const NONE = "—";

/** Each supply event's chip colour: grey ordered, green received. */
export const EVENT_CLASS: Record<SupplyEvent["kind"], string> = {
  ordered: "bg-fill_muted text-content",
  received: "bg-delta_positive_bg text-delta_positive_text",
};

/**
 * What one basket carried away at this price.
 *
 * Pounds over baskets on a scale item, units over baskets otherwise. Falls
 * back to the endpoint's own figure when there is no rate, which is the same
 * thing for an item sold by the each.
 */
export const perBasket = (p: PricePoint, weighed: boolean) => {
  if (!weighed) return p.unitsPerBasket;
  const lb = p.weight > 0 ? p.weight : null;
  if (lb === null || p.transactions <= 0) return p.unitsPerBasket;
  return lb / p.transactions;
};

/** "12.47 lb", or the ring count on a line that came back with no weight. */
export const weightLabel = (p: PricePoint) => {
  const lb = p.weight > 0 ? p.weight : null;
  if (lb === null)
    return `${count(p.units)} ${p.units === 1 ? "ring" : "rings"}`;
  return `${lb.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} lb`;
};

/** How many prices print before the rest folds away. */
export const LADDER_SHOWN = 4;

/** Fixed per-row widths for the skeleton's name bars, so they do not flicker. */
export const NAME_W = ["78%", "62%", "85%", "55%", "72%", "68%", "90%", "60%"];
