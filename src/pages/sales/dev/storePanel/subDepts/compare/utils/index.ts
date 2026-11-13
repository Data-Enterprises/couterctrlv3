// Utils
import { money, whole } from "../../utils";

// Interfaces
import type { GradingMetric } from "../../../../../../../features/dev/devSalesLedgerSlice";
import type { GradedItem, Side } from "../../interfaces";
import type { CompareRowData, CompareTotals, WeekBar } from "../interfaces";

/** A list row: rank, item and UPC, this week, last week, last year. */
export const COMPARE_COLS = "grid grid-cols-[22px_minmax(0,1fr)_110px_84px_84px] gap-2.5 items-center";

/** A list's rule and its totals row's fill, in its own colour. */
export const SIDE_EDGE: Record<Side, string> = { A: "border-brand_navy", B: "border-brand_slate" };
export const SIDE_TINT: Record<Side, string> = { A: "bg-brand_navy/[0.06]", B: "bg-brand_slate/10" };

/** The panel in and out of view: off to the right, and unreachable, when shut. */
export const SLIDE_OPEN = "translate-x-0 visible";
export const SLIDE_SHUT = "translate-x-full invisible";

/** Change from `then` to `now` in percent; null with nothing to compare against. */
export const pctOf = (now: number, then: number | null) =>
  then !== null && then > 0 ? ((now - then) / then) * 100 : null;

/** This year's figure over the days that matched each comparison, as grading
 *  takes it. */
const tyFor = (i: GradedItem, metric: GradingMetric, against: "lw" | "ly") =>
  metric === "qty"
    ? ((against === "lw" ? i.tyQtyForLW : i.tyQtyForLY) ?? i.tyQty)
    : ((against === "lw" ? i.tyNetForLW : i.tyNetForLY) ?? i.tyNet);

/** An item's figures and its changes on the grading measure. */
export const rowOf = (i: GradedItem, metric: GradingMetric): CompareRowData => ({
  key: i.productCode,
  upc: i.upc,
  desc: i.desc,
  hasTY: i.hasTY !== false,
  tyNet: i.tyNet,
  tyQty: i.tyQty,
  lwNet: i.lwNet,
  lwQty: i.lwQty,
  lyNet: i.lyNet,
  lyQty: i.lyQty,
  lwPct: pctOf(tyFor(i, metric, "lw"), metric === "qty" ? i.lwQty : i.lwNet),
  lyPct: pctOf(tyFor(i, metric, "ly"), metric === "qty" ? i.lyQty : i.lyNet),
});

/** A list's totals. Its changes add up the matched days the same way. */
export const totalsOf = (items: GradedItem[], metric: GradingMetric): CompareTotals => {
  const t = { count: items.length, tyNet: 0, tyQty: 0, lwNet: 0, lwQty: 0, lyNet: 0, lyQty: 0, hasLW: false, hasLY: false };
  let tyForLW = 0;
  let tyForLY = 0;
  for (const i of items) {
    t.tyNet += i.tyNet;
    t.tyQty += i.tyQty;
    t.lwNet += i.lwNet ?? 0;
    t.lwQty += i.lwQty ?? 0;
    t.lyNet += i.lyNet ?? 0;
    t.lyQty += i.lyQty ?? 0;
    t.hasLW ||= i.lwNet !== null;
    t.hasLY ||= i.lyNet !== null;
    tyForLW += tyFor(i, metric, "lw");
    tyForLY += tyFor(i, metric, "ly");
  }
  const qty = metric === "qty";
  return {
    ...t,
    lwPct: t.hasLW ? pctOf(tyForLW, qty ? t.lwQty : t.lwNet) : null,
    lyPct: t.hasLY ? pctOf(tyForLY, qty ? t.lyQty : t.lyNet) : null,
  };
};

/** The figure on the grading measure ("—" for no sale). */
export const mainFig = (net: number | null, qty: number | null, metric: GradingMetric) =>
  metric === "qty" ? (qty === null ? "—" : whole(qty)) : net === null ? "—" : money(net);

/** The figure behind it: money under units, units under money. */
export const otherFig = (net: number | null, qty: number | null, metric: GradingMetric) =>
  metric === "qty" ? (net === null ? "" : money(net)) : qty === null ? "" : `${whole(qty)} u`;

/** A difference on the grading measure. */
export const amount = (v: number, metric: GradingMetric) =>
  metric === "qty" ? `${whole(v)} unit${Math.round(v) === 1 ? "" : "s"}` : money(v);

/** A list's figure for one week, on the grading measure. */
const figOf = (t: CompareTotals, week: "ty" | "lw" | "ly", metric: GradingMetric) =>
  metric === "qty"
    ? week === "ty" ? t.tyQty : week === "lw" ? t.lwQty : t.lyQty
    : week === "ty" ? t.tyNet : week === "lw" ? t.lwNet : t.lyNet;

/** Who is ahead in a week, by name: "coke ahead by $691.41" this week, "… led
 *  by …" before, "Level" within a cent. */
export const gapLine = (
  a: number,
  b: number,
  thisWeek: boolean,
  metric: GradingMetric,
  names: [string, string],
) => {
  const d = a - b;
  if (Math.abs(d) < 0.005) return "Level";
  return `${d > 0 ? names[0] : names[1]} ${thisWeek ? "ahead" : "led"} by ${amount(Math.abs(d), metric)}`;
};

/** The strip at the top: a bar per week split between the two lists, with
 *  each half's figure and share, and who is ahead. */
export const weekBars = (
  a: CompareTotals,
  b: CompareTotals,
  metric: GradingMetric,
  names: [string, string],
): WeekBar[] =>
  (
    [
      { label: "This week", week: "ty", has: true, when: "this week" },
      { label: "Last week", week: "lw", has: a.hasLW || b.hasLW, when: "last week" },
      { label: "Last year", week: "ly", has: a.hasLY || b.hasLY, when: "last year" },
    ] as const
  ).map(({ label, week, has, when }) => {
    const av = figOf(a, week, metric);
    const bv = figOf(b, week, metric);
    const both = av + bv;
    const share = has && both > 0 ? (av / both) * 100 : null;
    const net = (t: CompareTotals) => (week === "ty" ? t.tyNet : week === "lw" ? t.lwNet : t.lyNet);
    const qty = (t: CompareTotals) => (week === "ty" ? t.tyQty : week === "lw" ? t.lwQty : t.lyQty);
    return {
      label,
      gap: share === null ? `No sales ${when}` : gapLine(av, bv, week === "ty", metric, names),
      aFig: mainFig(net(a), qty(a), metric),
      bFig: mainFig(net(b), qty(b), metric),
      aShare: share,
      aPct: share === null ? "" : `${Math.round(share)}%`,
      bPct: share === null ? "" : `${100 - Math.round(share)}%`,
    };
  });

/** The export's headings. The changes are on the grading measure. */
export const csvHeaders = (metric: GradingMetric) => {
  const on = metric === "qty" ? "units" : "sales";
  return ["List", "UPC", "Item", "TY $", "TY units", "LW $", "LW units", `vs LW % (${on})`, "LY $", "LY units", `vs LY % (${on})`];
};

const dp2 = (v: number | null) => (v === null ? "" : v.toFixed(2));

/** Units with the float noise of a sum taken off (87.02, not 87.02000000000001). */
const qty3 = (v: number | null) => (v === null ? "" : Math.round(v * 1000) / 1000);

/** The export's rows: every item of A then B, in the panel's order, then a
 *  total for each list. */
export const csvRows = (
  lists: { side: Side; label: string; rows: CompareRowData[]; totals: CompareTotals }[],
): (string | number)[][] => [
  ...lists.flatMap((l) =>
    l.rows.map((r) => [
      `${l.side}: ${l.label}`,
      r.upc,
      r.desc,
      r.hasTY ? dp2(r.tyNet) : "",
      r.hasTY ? qty3(r.tyQty) : "",
      dp2(r.lwNet),
      qty3(r.lwQty),
      dp2(r.lwPct),
      dp2(r.lyNet),
      qty3(r.lyQty),
      dp2(r.lyPct),
    ]),
  ),
  ...lists.map(({ side, label, totals: t }) => [
    `${side}: ${label}`,
    "",
    `Total (${t.count} item${t.count === 1 ? "" : "s"})`,
    dp2(t.tyNet),
    qty3(t.tyQty),
    t.hasLW ? dp2(t.lwNet) : "",
    t.hasLW ? qty3(t.lwQty) : "",
    dp2(t.lwPct),
    t.hasLY ? dp2(t.lyNet) : "",
    t.hasLY ? qty3(t.lyQty) : "",
    dp2(t.lyPct),
  ]),
];

/** The export's file name: store, department, "compare" and the week. */
export const compareFileName = (store: string, dept: string, week: string) =>
  `${[store, dept, "compare", week].map((s) => s.replace(/[^a-z0-9]/gi, "_")).join("_")}.csv`;
