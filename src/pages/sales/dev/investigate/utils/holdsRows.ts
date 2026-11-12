// Utils
import { CAUSE_LABEL, DEFAULT_BANDS, rangAt, splitGap } from "./deptInvestigation";

// Interfaces
import type {
  Bands,
  BreakdownLine,
  Cause,
  HoldsRow,
  ItemVerdict,
  RowKind,
  RowReason,
  RowSection,
} from "../interfaces";

/** The Summary's rows, in the order they are listed. */
export const ROW_ORDER: RowKind[] = ["onlyTheirs", "bothLess", "bothMore", "onlyMine"];

/** Each row's item columns. Literal, so Tailwind emits them. */
export const ROW_COLS: Record<RowKind, string> = {
  onlyTheirs: "grid-cols-[22px_minmax(0,1fr)_96px_72px_92px]",
  bothLess: "grid-cols-[22px_minmax(0,1.3fr)_92px_minmax(150px,0.85fr)_minmax(170px,0.95fr)_83px]",
  bothMore: "grid-cols-[22px_minmax(0,1.3fr)_92px_minmax(150px,0.85fr)_minmax(170px,0.95fr)_83px]",
  onlyMine: "grid-cols-[22px_minmax(0,1fr)_96px_72px_92px]",
};

/** A row's label in three parts, so the store can carry its colour dot. */
export const rowLabel = (kind: RowKind, us: string, them: string) =>
  kind === "onlyTheirs"
    ? { pre: "Rang at", store: them, mine: false, post: "only" }
    : kind === "onlyMine"
      ? { pre: "Rang at", store: us, mine: true, post: "only" }
      : { pre: "Rang at both,", store: us, mine: true, post: kind === "bothLess" ? "sold less" : "sold more" };

/** The same, as it reads after an item count: "68 items rang at 003, not at 018". */
export const rowPhrase = (kind: RowKind, us: string, them: string) =>
  kind === "onlyTheirs"
    ? `rang at ${them}, not at ${us}`
    : kind === "onlyMine"
      ? `rang at ${us}, not at ${them}`
      : `rang at both, ${us} sold ${kind === "bothLess" ? "less" : "more"}`;

/** A row's tab on the items card. */
export const rowTab = (kind: RowKind, us: string, them: string) =>
  kind === "onlyTheirs"
    ? `${them} only`
    : kind === "onlyMine"
      ? `${us} only`
      : `${us} sold ${kind === "bothLess" ? "less" : "more"}`;

/** The column headings over a row's items, one per column. */
export const rowHeads = (kind: RowKind, us: string, them: string) =>
  kind === "onlyTheirs"
    ? ["", "Item", `${them} sold`, "", "Difference"]
    : kind === "onlyMine"
      ? ["", "Item", `${us} sold`, "", "Difference"]
      : ["", "Item", "Why", `Sold · ${us} vs ${them}`, `Avg price · ${us} vs ${them}`, "Difference"];

/** The row with the most money in it, which the Summary opens on. */
export const leadRow = (rows: HoldsRow[]): RowKind =>
  [...rows].sort((a, b) => Math.abs(b.total) - Math.abs(a.total))[0]?.kind ?? "onlyTheirs";

/** Why a reason chip says what it says: the price band nothing else shows. */
export const REASON_TIP: Record<RowReason, string> = {
  units: "The two prices are within 8%, so units explain the gap.",
  price: "The prices differ by more than 8%, and price is the bigger part of the gap.",
  both: "The prices differ by more than 8%, but units are the bigger part of the gap.",
};

/** The Avg price column, which people will otherwise read as the shelf tag. */
export const AVG_PRICE_TIP = "Sales ÷ units: what customers paid on average, not the shelf price.";

/**
 * What a units or price line in a breakdown is. A line pulling against its
 * slide (fewer sold on a slide ahead, a higher price on one behind) says so,
 * since a red line on a green slide is the first thing a reader asks about.
 */
export const partTip = (line: BreakdownLine, rowTotal: number, cash: (v: number) => string) => {
  const units = line.label === "Fewer sold" || line.label === "More sold";
  const base = units
    ? "What the difference in units sold was worth, at the two stores' average price."
    : "What the difference in price was worth, on the two stores' average units.";
  if (line.amount === 0 || rowTotal === 0 || line.amount < 0 === rowTotal < 0) return base;
  const what = units
    ? line.amount < 0 ? "selling fewer" : "selling more"
    : line.amount < 0 ? "taking less a unit" : "the higher price";
  const did = line.amount < 0 ? "gave back" : "won back";
  const of = rowTotal > 0 ? "the lead" : "the shortfall";
  return `${base} It works against this slide: ${what} ${did} ${cash(Math.abs(line.amount))} of ${of}.`;
};

/** An item's reason, worded for the row it is in. */
export const reasonLabel = (reason: RowReason, up: boolean) =>
  reason === "units"
    ? up ? "More sold" : "Fewer sold"
    : reason === "price"
      ? up ? "Higher price" : "Lower price"
      : "Both";

/** Which row an item belongs to, or null when neither store rang it. */
export const rowOf = (i: ItemVerdict): RowKind | null => {
  const here = rangAt(i.mineUnits, i.mineSales);
  const there = rangAt(i.theirsUnits, i.theirsSales);
  if (!here && there) return "onlyTheirs";
  if (here && !there) return "onlyMine";
  if (here && there) return i.gap < 0 ? "bothLess" : "bothMore";
  return null;
};

/**
 * Why an item both stores rang is apart.
 *
 * Price counts only past the band the causes use, so this never disagrees
 * with Price / mix. Past it, price wins when it is the bigger part of the
 * gap, and both are named when the units are bigger still.
 */
export const reasonOf = (i: ItemVerdict, bands: Bands = DEFAULT_BANDS): RowReason => {
  const r = i.ratios.price;
  if (r === null || Math.abs(r - 1) <= bands.price) return "units";
  const { units, price } = splitGap(i);
  return Math.abs(units) < Math.abs(price) ? "price" : "both";
};

/** Where a row's sections start, as running shares of it. */
const SECTION_CUTS = [0.5, 0.8];

/**
 * A row's items, biggest first, in up to three sections: those that make up
 * the first half of its difference, those that take it to 80%, and the rest.
 * An item falls by the running total BEFORE it, so the item that crosses a
 * cut stays in the section it starts in. Empty sections are left out.
 */
export const sectionsOf = (items: ItemVerdict[]): RowSection[] => {
  const whole = items.reduce((t, i) => t + Math.abs(i.gap), 0);
  const runs: ItemVerdict[][] = [[], [], []];
  let run = 0;
  for (const i of items) {
    const before = whole > 0 ? run / whole : 0;
    runs[before < SECTION_CUTS[0] ? 0 : before < SECTION_CUTS[1] ? 1 : 2].push(i);
    run += Math.abs(i.gap);
  }
  return runs
    .filter((r) => r.length > 0)
    .map((r) => {
      const size = r.reduce((t, i) => t + Math.abs(i.gap), 0);
      return {
        items: r,
        share: whole > 0 ? size / whole : 0,
        total: r.reduce((t, i) => t + i.gap, 0),
      };
    });
};

/** The causes behind the items one store never rang, biggest first. */
const byCause = (items: ItemVerdict[]): BreakdownLine[] => {
  const by = new Map<Cause, { n: number; amount: number }>();
  for (const i of items) {
    const at = by.get(i.cause) ?? { n: 0, amount: 0 };
    at.n += 1;
    at.amount += i.gap;
    by.set(i.cause, at);
  }
  return [...by.entries()]
    .sort((a, b) => Math.abs(b[1].amount) - Math.abs(a[1].amount))
    .map(([cause, { n, amount }]) => ({
      cause,
      label: CAUSE_LABEL[cause],
      amount,
      side: `${n.toLocaleString("en-US")} ${n === 1 ? "item" : "items"}`,
      money: false,
    }));
};

/**
 * Units against price, over items both stores rang.
 *
 * Each item's own split, added up. Splitting the row's totals instead would
 * invent a mix effect across items sold at different prices.
 */
const byUnitsAndPrice = (items: ItemVerdict[]): BreakdownLine[] => {
  const units = items.reduce((t, i) => t + splitGap(i).units, 0);
  const price = items.reduce((t, i) => t + splitGap(i).price, 0);
  const gross = Math.abs(units) + Math.abs(price);
  const pct = (v: number) => (gross > 0 ? `${Math.round((Math.abs(v) / gross) * 100)}%` : "0%");
  return [
    { label: units < 0 ? "Fewer sold" : "More sold", amount: units, side: pct(units), money: true },
    { label: price < 0 ? "Lower price" : "Higher price", amount: price, side: pct(price), money: true },
  ];
};

/** Every row with its items, total and breakdown. Empty rows are kept, so the
 *  Summary always lists all four and a zero reads as a finding. */
export const rowsOf = (items: ItemVerdict[]): HoldsRow[] =>
  ROW_ORDER.map((kind) => {
    const rows = items
      .filter((i) => rowOf(i) === kind)
      .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
    return {
      kind,
      items: rows,
      total: rows.reduce((t, i) => t + i.gap, 0),
      breakdown:
        rows.length === 0
          ? []
          : kind === "onlyTheirs"
            ? byCause(rows)
            : kind === "onlyMine"
              ? []
              : byUnitsAndPrice(rows),
      sections: sectionsOf(rows),
    };
  });

/** How a cause reads inside a sentence. */
const CAUSE_PHRASE: Partial<Record<Cause, string>> = {
  "never-ordered": "never ordered",
  "not-carried": "not carried here",
  "not-received": "ordered with no receiver on file",
  unsold: "received but not sold",
};

/**
 * The headline over a row's items.
 *
 * Says what the breakdown under it shows: the biggest cause for the items one
 * store never rang, and whether units or price carry a row both rang. Two
 * thirds is "mostly"; under that, both are named.
 */
export const rowSays = (
  row: HoldsRow,
  us: string,
  them: string,
  fmt: (v: number) => string,
  cash: (v: number) => string,
): string => {
  const n = row.items.length;
  const items = `${n.toLocaleString("en-US")} ${n === 1 ? "item" : "items"}`;
  if (n === 0) return "No items in this row.";

  if (row.kind === "onlyMine")
    return `${items} rang at ${us} and not at ${them}, worth ${fmt(Math.abs(row.total))}.`;

  if (row.kind === "onlyTheirs") {
    const lead = row.breakdown[0];
    const cause = lead.cause;
    if (cause === "no-receipts")
      return "The receivers couldn't be read, so these can't be explained yet.";
    const phrase = (cause && CAUSE_PHRASE[cause]) ?? lead.label.toLowerCase();
    const most = Math.abs(lead.amount) >= Math.abs(row.total) / 2;
    const led = row.items.filter((i) => i.cause === cause).length;
    if (led === n) return n === 1 ? `The one item was ${phrase}.` : `All ${items} were ${phrase}.`;
    return `${most ? "Most of it was" : "The biggest part was"} ${phrase}: ${led.toLocaleString("en-US")} of the ${items}.`;
  }

  const [units, price] = row.breakdown;
  const gross = Math.abs(units.amount) + Math.abs(price.amount);
  const net = cash(Math.abs(units.amount + price.amount));
  if (gross > 0 && Math.abs(units.amount) / gross >= 2 / 3)
    return `Mostly ${units.label.toLowerCase()}, not price: units account for ${cash(Math.abs(units.amount))} of the ${net}.`;
  if (gross > 0 && Math.abs(price.amount) / gross >= 2 / 3)
    return `Mostly price, not units: ${price.label.toLowerCase()} accounts for ${cash(Math.abs(price.amount))} of the ${net}.`;
  return `${units.label} and ${price.label.toLowerCase()}, in about equal parts.`;
};
