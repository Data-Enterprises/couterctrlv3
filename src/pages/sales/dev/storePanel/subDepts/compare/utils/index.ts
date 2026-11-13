// Utils
import { formatPct } from "../../../../../../../utils/severity";
import { money, whole } from "../../utils";

// Interfaces
import type { GradingMetric } from "../../../../../../../features/dev/devSalesLedgerSlice";
import type { GradedItem, Side } from "../../interfaces";
import type { CompareRowData, CompareSort, CompareTotals, WeekBoxData } from "../interfaces";

/** A list row: rank, item and UPC, this week, LW, vs LW, LY, vs LY. */
export const COMPARE_COLS =
  "grid grid-cols-[18px_minmax(0,1fr)_96px_68px_64px_68px_64px] gap-2 items-center";

/** The top band: the answer, then a box per week. */
export const BAND_COLS = "grid grid-cols-[minmax(200px,1fr)_repeat(3,minmax(0,250px))] gap-2.5";

/** A list's rule and its totals row's fill, in its own colour. */
export const SIDE_EDGE: Record<Side, string> = { A: "border-brand_navy", B: "border-brand_slate" };
export const SIDE_TINT: Record<Side, string> = { A: "bg-brand_navy/[0.06]", B: "bg-brand_slate/10" };

/** The panel in and out of view: off to the right, and unreachable, when shut. */
export const SLIDE_OPEN = "translate-x-0 visible";
export const SLIDE_SHUT = "translate-x-full invisible";

/** The sort bar's choices. */
export const SORTS: { value: CompareSort; label: string }[] = [
  { value: "ty", label: "This week" },
  { value: "vsLW", label: "vs LW" },
  { value: "vsLY", label: "vs LY" },
];

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

/** Ranks a list: this week biggest first, or a change biggest drop first. An
 *  item with nothing to rank on goes last. */
export const sortRows = (rows: CompareRowData[], sort: CompareSort, metric: GradingMetric) => {
  const key = (r: CompareRowData) =>
    sort === "ty"
      ? r.hasTY
        ? -(metric === "qty" ? r.tyQty : r.tyNet)
        : Infinity
      : ((sort === "vsLW" ? r.lwPct : r.lyPct) ?? Infinity);
  return [...rows].sort((a, b) => key(a) - key(b));
};

/** The figure on the grading measure ("—" for no sale). */
export const mainFig = (net: number | null, qty: number | null, metric: GradingMetric) =>
  metric === "qty" ? (qty === null ? "—" : whole(qty)) : net === null ? "—" : money(net);

/** The figure behind it: money under units, units under money. */
export const otherFig = (net: number | null, qty: number | null, metric: GradingMetric) =>
  metric === "qty" ? (net === null ? "" : money(net)) : qty === null ? "" : `${whole(qty)} u`;

/** A change as text, "—" when there is nothing to compare against. */
export const pctText = (p: number | null) => (p === null ? "—" : formatPct(p));

/** A change's colour: direction, not a grade. */
export const pctTextClass = (p: number | null) =>
  p === null ? "text-content" : p < 0 ? "text-delta_negative_text" : "text-delta_positive_text";

/** A change's chip in a week box. */
export const pctChipClass = (p: number) =>
  p < 0 ? "bg-delta_negative_bg text-delta_negative_text" : "bg-delta_positive_bg text-delta_positive_text";

/** A difference on the grading measure. */
export const amount = (v: number, metric: GradingMetric) =>
  metric === "qty" ? `${whole(v)} unit${Math.round(v) === 1 ? "" : "s"}` : money(v);

/** A list's figure for one week, on the grading measure. */
const figOf = (t: CompareTotals, week: "ty" | "lw" | "ly", metric: GradingMetric) =>
  metric === "qty"
    ? week === "ty" ? t.tyQty : week === "lw" ? t.lwQty : t.lyQty
    : week === "ty" ? t.tyNet : week === "lw" ? t.lwNet : t.lyNet;

/** Which list is ahead by more than a cent, or null when level. */
const leadOf = (d: number): Side | null => (Math.abs(d) < 0.005 ? null : d > 0 ? "A" : "B");

/** Who is ahead in a week: "B ahead by $67.26" this week, "A led by …" before. */
export const gapLine = (a: number, b: number, thisWeek: boolean, metric: GradingMetric) => {
  const lead = leadOf(a - b);
  return lead ? `${lead} ${thisWeek ? "ahead" : "led"} by ${amount(Math.abs(a - b), metric)}` : "Level";
};

/** The panel's answer: who sold more this week, and who led last week and
 *  last year. */
export const answerLine = (a: CompareTotals, b: CompareTotals, metric: GradingMetric) => {
  const d = figOf(a, "ty", metric) - figOf(b, "ty", metric);
  const lead = leadOf(d);
  const first = lead
    ? `${lead} outsold ${lead === "A" ? "B" : "A"} by ${amount(Math.abs(d), metric)} this week.`
    : "A and B sold the same this week.";
  const past = [
    { when: "last week", has: a.hasLW || b.hasLW, d: figOf(a, "lw", metric) - figOf(b, "lw", metric) },
    { when: "last year", has: a.hasLY || b.hasLY, d: figOf(a, "ly", metric) - figOf(b, "ly", metric) },
  ].filter((p) => p.has);
  if (!past.length) return first;
  const say = (p: (typeof past)[number]) => {
    const l = leadOf(p.d);
    return l ? `${p.when} ${l} led by ${amount(Math.abs(p.d), metric)}` : `${p.when} they were level`;
  };
  const [p1, p2] = past;
  const rest =
    p2 && leadOf(p1.d) && leadOf(p1.d) === leadOf(p2.d)
      ? `${say(p1)}, and ${p2.when} by ${amount(Math.abs(p2.d), metric)}`
      : past.map(say).join(", and ");
  return `${first} ${rest.charAt(0).toUpperCase()}${rest.slice(1)}.`;
};

/** The three boxes at the top: this week, last week and last year, each list's
 *  figure with its change to this week, and who is ahead. */
export const weekBoxes = (
  a: CompareTotals,
  b: CompareTotals,
  metric: GradingMetric,
  dates: { tw: string; lw: string; ly: string },
): WeekBoxData[] => {
  const now = (side: Side, t: CompareTotals) => ({
    side,
    value: mainFig(t.tyNet, t.tyQty, metric),
    other: otherFig(t.tyNet, t.tyQty, metric),
    pct: null,
  });
  const then = (side: Side, t: CompareTotals, week: "lw" | "ly") => {
    const has = week === "lw" ? t.hasLW : t.hasLY;
    const net = has ? (week === "lw" ? t.lwNet : t.lyNet) : null;
    const qty = has ? (week === "lw" ? t.lwQty : t.lyQty) : null;
    return { side, value: mainFig(net, qty, metric), other: otherFig(net, qty, metric), pct: week === "lw" ? t.lwPct : t.lyPct };
  };
  const past = (week: "lw" | "ly", label: string, when: string, d: string): WeekBoxData => ({
    label,
    dates: d,
    lines: [then("A", a, week), then("B", b, week)],
    gap:
      (week === "lw" ? a.hasLW || b.hasLW : a.hasLY || b.hasLY)
        ? gapLine(figOf(a, week, metric), figOf(b, week, metric), false, metric)
        : `No sales ${when}`,
  });
  return [
    {
      label: "This week",
      dates: dates.tw,
      lines: [now("A", a), now("B", b)],
      gap: gapLine(figOf(a, "ty", metric), figOf(b, "ty", metric), true, metric),
    },
    past("lw", "vs last week", "last week", dates.lw),
    past("ly", "vs last year", "last year", dates.ly),
  ];
};

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
