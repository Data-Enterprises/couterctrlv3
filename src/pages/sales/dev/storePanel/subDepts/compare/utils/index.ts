// Utils
import { formatPct, type Severity } from "../../../../../../../utils/severity";
import { money, whole } from "../../utils";

// Interfaces
import type { GradingMetric } from "../../../../../../../features/dev/devSalesLedgerSlice";
import type { GradedItem, Side } from "../../interfaces";
import type {
  Bucket,
  BucketCell,
  BucketItem,
  CompareRowData,
  CompareTotals,
  SalesRow,
  StandRow,
  Verdict,
} from "../interfaces";

/** The drawer in and out of view: off to the right, and unreachable, when shut. */
export const SLIDE_OPEN = "translate-x-0 visible";
export const SLIDE_SHUT = "translate-x-full invisible";

/** A mirrored row: A's figures right of its edge, the label centred, B's left. */
export const MIRROR_COLS = "grid grid-cols-[minmax(0,1fr)_136px_minmax(0,1fr)] items-center";

/** An item in the open tab: list badge, name, UPC, what it did. */
export const ITEM_COLS = "grid grid-cols-[18px_minmax(0,1fr)_88px_72px] gap-2.5 items-center";

/** A cell in a bucket behind a list's verdict. */
export const HOT_CELL = "bg-delta_negative_bg/60";

/** A where-the-items-stand row: dot, bucket, A's cell, B's cell, chevron. */
export const STAND_COLS = "grid grid-cols-[10px_minmax(0,1fr)_150px_150px_14px] gap-2 items-center";

/** A bucket's dot: green for gaining ground, red for losing it. */
export const BUCKET_DOT: Record<Bucket, string> = {
  more: "bg-emerald-500",
  new: "bg-emerald-500",
  less: "bg-red-500",
  stopped: "bg-red-500",
  lyOnly: "bg-red-500",
};

/** A sales bar per list: this week at full strength, earlier weeks lighter. */
export const SALES_BAR: Record<Side, [string, string]> = {
  A: ["bg-brand_navy", "bg-brand_navy/40"],
  B: ["bg-compare_b", "bg-compare_b/40"],
};

/** The buckets in table order, with their row and tab names. */
export const BUCKETS: { key: Bucket; label: string; tab: string }[] = [
  { key: "more", label: "Selling more", tab: "More" },
  { key: "less", label: "Selling less", tab: "Less" },
  { key: "new", label: "New this week", tab: "New" },
  { key: "stopped", label: "Stopped this week", tab: "Stopped" },
  { key: "lyOnly", label: "Sold last year only", tab: "Last year" },
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

/** An item's figure for a week on the grading measure (0 for no sale). */
const figure = (i: GradedItem, week: "ty" | "lw" | "ly", metric: GradingMetric) =>
  metric === "qty"
    ? (week === "ty" ? i.tyQty : week === "lw" ? i.lwQty : i.lyQty) ?? 0
    : (week === "ty" ? i.tyNet : week === "lw" ? i.lwNet : i.lyNet) ?? 0;

const sold = (v: number | null) => v !== null && v !== 0;

/** Where an item stands. Sold this week and last: more or less than last week
 *  (this week over the matched days); one of the two: new or stopped; neither
 *  but last year: last year only. Null for an item that sold in none. */
export const bucketOf = (i: GradedItem, metric: GradingMetric): Bucket | null => {
  const ty = i.hasTY !== false && (sold(i.tyNet) || sold(i.tyQty));
  const lw = sold(i.lwNet) || sold(i.lwQty);
  if (ty && lw) return tyFor(i, metric, "lw") >= figure(i, "lw", metric) ? "more" : "less";
  if (ty) return "new";
  if (lw) return "stopped";
  return sold(i.lyNet) || sold(i.lyQty) ? "lyOnly" : null;
};

/** What an item did, its bucket's way: the change against last week, or last
 *  year's sales for an item that only sold then. */
const amountOf = (i: GradedItem, b: Bucket | null, metric: GradingMetric) =>
  b === "more" || b === "less"
    ? tyFor(i, metric, "lw") - figure(i, "lw", metric)
    : b === "new"
      ? figure(i, "ty", metric)
      : b === "stopped"
        ? -figure(i, "lw", metric)
        : b === "lyOnly"
          ? figure(i, "ly", metric)
          : 0;

/** An item's figures, bucket and changes on the grading measure. */
export const rowOf = (i: GradedItem, metric: GradingMetric): CompareRowData => {
  const bucket = bucketOf(i, metric);
  return {
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
    bucket,
    amount: amountOf(i, bucket, metric),
  };
};

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

/** A list's rows gathered by bucket: how many items, and what they did. */
export const bucketCells = (rows: CompareRowData[]): Record<Bucket, BucketCell> => {
  const cells: Record<Bucket, BucketCell> = {
    more: { count: 0, amount: 0 },
    less: { count: 0, amount: 0 },
    new: { count: 0, amount: 0 },
    stopped: { count: 0, amount: 0 },
    lyOnly: { count: 0, amount: 0 },
  };
  for (const r of rows) {
    if (!r.bucket) continue;
    cells[r.bucket].count += 1;
    cells[r.bucket].amount += r.amount;
  }
  return cells;
};

/** What a losing bucket cost a list: what selling less or stopping took off
 *  last week, or what the last-year-only items sold then. */
const lossOf = (cells: Record<Bucket, BucketCell>, b: Bucket) =>
  b === "less" || b === "stopped" ? -cells[b].amount : b === "lyOnly" ? cells[b].amount : 0;

/** A list's problem: items gone since last year, items that sold less or
 *  stopped this week, or none (nothing losing ground). */
export type Problem = "lyOnly" | "recent" | null;

/** Whichever cost the list more: the last-year-only items, or selling less
 *  and stopping together. */
export const problemOf = (cells: Record<Bucket, BucketCell>): Problem => {
  const ly = lossOf(cells, "lyOnly");
  const recent = lossOf(cells, "less") + lossOf(cells, "stopped");
  if (ly <= 0 && recent <= 0) return null;
  return ly > recent ? "lyOnly" : "recent";
};

/** The buckets behind a list's problem, tinted in the table. */
export const hotBuckets = (cells: Record<Bucket, BucketCell>): Bucket[] => {
  const p = problemOf(cells);
  if (p === "lyOnly") return ["lyOnly"];
  if (p === "recent") return (["less", "stopped"] as const).filter((b) => cells[b].count > 0);
  return [];
};

/** The bucket the carousel opens on for a list: its problem's biggest. */
export const leadBucket = (cells: Record<Bucket, BucketCell>): Bucket | null => {
  const hot = hotBuckets(cells);
  return hot.length ? hot.reduce((m, b) => (lossOf(cells, b) > lossOf(cells, m) ? b : m)) : null;
};

/** A difference on the grading measure, with its sign. */
export const signed = (v: number, metric: GradingMetric) =>
  `${v >= 0 ? "+" : "−"}${metric === "qty" ? `${whole(Math.abs(v))} units` : money(Math.abs(v))}`;

/** A figure on the grading measure, no sign. */
const plain = (v: number, metric: GradingMetric) => (metric === "qty" ? `${whole(v)} units` : money(v));

/** One list's half of the verdict: how many of its items, doing what. */
const sideSays = (c: Record<Bucket, BucketCell>, count: number) => {
  const p = problemOf(c);
  if (p === "lyOnly") return { n: `${c.lyOnly.count} of ${count}`, says: "gone since last year" };
  if (p === "recent") {
    const says = c.less.count && c.stopped.count ? "sold less or stopped" : c.less.count ? "selling less" : "stopped this week";
    return { n: `${c.less.count + c.stopped.count} of ${count}`, says };
  }
  return c.more.count ? { n: `${c.more.count} of ${count}`, says: "selling more" } : { n: "", says: "holding up" };
};

/** The verdict: whether the two lists have the same problem, and each one's,
 *  with how many of its items it covers. */
export const verdictOf = (
  cells: [Record<Bucket, BucketCell>, Record<Bucket, BucketCell>],
  counts: [number, number],
): Verdict => {
  const [pa, pb] = [problemOf(cells[0]), problemOf(cells[1])];
  return {
    lead: pa === pb ? (pa ? "Same problem" : "Both holding up") : "Different problems",
    sides: [sideSays(cells[0], counts[0]), sideSays(cells[1], counts[1])],
  };
};

/** The verdict as the Insight strip the other Sales tabs use: named for the two
 *  lists, its line saying each one's problem, graded watch when either list is
 *  losing ground. */
export const verdictCta = (v: Verdict, names: [string, string]) => {
  const half = (i: 0 | 1) => `${names[i]}: ${[v.sides[i].n, v.sides[i].says].filter(Boolean).join(" ")}`;
  return {
    name: `${names[0]} vs ${names[1]}`,
    cta: {
      text: `${v.lead}. ${half(0)} | ${half(1)}.`,
      severity: (v.lead === "Both holding up" ? "healthy" : "watch") as Severity,
    },
  };
};

/** Each list's change against last week: its four this-week buckets added up. */
export const netVsLw = (c: Record<Bucket, BucketCell>) => c.more.amount + c.less.amount + c.new.amount + c.stopped.amount;

/** The line over the carousel: how many items the open bucket holds, and what they did. */
export const bucketHead = (b: Bucket, n: number) => {
  const items = `${n} item${n === 1 ? "" : "s"}`;
  return {
    more: `${items} selling more than last week.`,
    less: `${items} selling less than last week.`,
    new: `${items} new this week.`,
    stopped: `${items} that stopped selling this week.`,
    lyOnly: `${items} sold last year and nothing this week.`,
  }[b];
};

/** The figure on the grading measure ("—" for no sale). */
export const mainFig = (net: number | null, qty: number | null, metric: GradingMetric) =>
  metric === "qty" ? (qty === null ? "—" : whole(qty)) : net === null ? "—" : money(net);

/** A change as text. */
export const pctText = (p: number) => formatPct(p);

/** The sales chart: this week, then last week and last year with each list's
 *  change to this week. */
export const salesRows = (a: CompareTotals, b: CompareTotals, metric: GradingMetric): SalesRow[] => {
  const cell = (t: CompareTotals, week: "ty" | "lw" | "ly") => {
    const has = week === "ty" || (week === "lw" ? t.hasLW : t.hasLY);
    const net = week === "ty" ? t.tyNet : week === "lw" ? t.lwNet : t.lyNet;
    const qty = week === "ty" ? t.tyQty : week === "lw" ? t.lwQty : t.lyQty;
    return {
      fig: has ? mainFig(net, qty, metric) : "—",
      value: has ? (metric === "qty" ? qty : net) : 0,
      pct: week === "ty" ? null : week === "lw" ? t.lwPct : t.lyPct,
    };
  };
  return [
    { label: "This week", now: true, cells: [cell(a, "ty"), cell(b, "ty")] },
    { label: "Last week", now: false, cells: [cell(a, "lw"), cell(b, "lw")] },
    { label: "Last year", now: false, cells: [cell(a, "ly"), cell(b, "ly")] },
  ];
};

/** The where-the-items-stand table: per bucket, each list's count, what those
 *  items did, their share of the list, and whether it is behind the verdict. */
export const standRows = (
  cells: [Record<Bucket, BucketCell>, Record<Bucket, BucketCell>],
  counts: [number, number],
  metric: GradingMetric,
): StandRow[] => {
  const hot = [hotBuckets(cells[0]), hotBuckets(cells[1])];
  return BUCKETS.map(({ key, label }) => ({
    bucket: key,
    label,
    cells: ([0, 1] as const).map((i) => {
      const c = cells[i][key];
      const side: Side = i === 0 ? "A" : "B";
      return {
        side,
        count: c.count,
        amount: !c.count ? "" : key === "lyOnly" ? `${plain(c.amount, metric)} LY` : signed(c.amount, metric),
        tone: !c.count || key === "lyOnly" ? "plain" : c.amount < 0 ? "down" : "up",
        share: counts[i] ? (c.count / counts[i]) * 100 : 0,
        hot: hot[i].includes(key),
      };
    }) as StandRow["cells"],
  }));
};

/** A bucket's items from both lists, biggest change first. */
export const bucketItems = (a: CompareRowData[], b: CompareRowData[], bucket: Bucket): BucketItem[] =>
  [
    ...a.filter((r) => r.bucket === bucket).map((row) => ({ side: "A" as const, row })),
    ...b.filter((r) => r.bucket === bucket).map((row) => ({ side: "B" as const, row })),
  ].sort((x, y) => Math.abs(y.row.amount) - Math.abs(x.row.amount));

/** What an item in the open tab did, as the tab reads it. */
export const itemAmount = (r: CompareRowData, metric: GradingMetric) =>
  r.bucket === "lyOnly" ? plain(r.amount, metric) : signed(r.amount, metric);

/** The export's headings. The changes are on the grading measure. */
export const csvHeaders = (metric: GradingMetric) => {
  const on = metric === "qty" ? "units" : "sales";
  return ["List", "UPC", "Item", "Where it stands", "TY $", "TY units", "LW $", "LW units", `vs LW % (${on})`, "LY $", "LY units", `vs LY % (${on})`];
};

const dp2 = (v: number | null) => (v === null ? "" : v.toFixed(2));

/** Units with the float noise of a sum taken off (87.02, not 87.02000000000001). */
const qty3 = (v: number | null) => (v === null ? "" : Math.round(v * 1000) / 1000);

const BUCKET_LABEL: Record<Bucket, string> = Object.fromEntries(BUCKETS.map((b) => [b.key, b.label])) as Record<Bucket, string>;

/** The export's rows: every item of A then B, then a total for each list. */
export const csvRows = (
  lists: { side: Side; label: string; rows: CompareRowData[]; totals: CompareTotals }[],
): (string | number)[][] => [
  ...lists.flatMap((l) =>
    l.rows.map((r) => [
      `${l.side}: ${l.label}`,
      r.upc,
      r.desc,
      r.bucket ? BUCKET_LABEL[r.bucket] : "",
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
    "",
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
