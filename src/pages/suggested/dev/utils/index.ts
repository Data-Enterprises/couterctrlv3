// Utils
import {
  ACTION_ORDER,
  deptLabel,
  lostLb,
  SCOPE_TEXT,
  suggestedAction,
} from "./figures";
import { fmtNum, rowsToCsv } from "../../../../utils/csvExport";

// Interfaces
import type {
  NotSellingItem,
  NotSellingStatus,
  SuggestedGroupRow,
  SuggestedItem,
  SuggestedNotSelling,
} from "../../../../interfaces";
import type {
  NotSellingFilter,
  SuggestedTab,
} from "../../../../features/dev/devSuggestedSlice";
import type { AggFn } from "../../../../utils/csvExport";

/** The page's table header cell, and its sortable variant. */
export const TH =
  "px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85";
export const SORT_TH =
  "w-full justify-end text-[10px] font-semibold uppercase tracking-wide text-content/85 hover:text-content";

/** Severity, in the order a reader should care: a line that stopped outright is
 *  worse news than one that slowed, and a dead line is a cleanup job. */
export const STATUS_PILL: Record<NotSellingStatus, string> = {
  stopped: "bg-severity_critical_bg text-severity_critical_text",
  declining: "bg-severity_watch_bg text-severity_watch_text",
  dead: "bg-gray-200 text-content/85",
};

/**
 * Opens on `declining`, and that ordering is the argument for the whole tab.
 *
 * Dead and stopped are visible to anyone paying attention — a case with nothing
 * in it, a line that has not scanned in a month. An item still moving at half
 * its old rate looks fine on a shelf and is being PRODUCED to the old level,
 * rotting the difference every day, and nothing else on this page surfaces it.
 */
export const STATUSES: { key: NotSellingFilter; label: string; blurb: string }[] = [
  {
    key: "all",
    label: "All",
    blurb:
      "Everything that has stopped or slowed in this department, worst first. The Status column says which is which.",
  },
  {
    key: "declining",
    label: "Declining",
    blurb:
      "Still selling, but well down on its own earlier rate — production has not followed it down.",
  },
  {
    key: "stopped",
    label: "Stopped",
    blurb: "Sold in the earlier half of the lookback, nothing in the recent half.",
  },
  {
    key: "dead",
    label: "Dead",
    blurb: "Carried, but no recorded weight in either half of the window.",
  },
];

/** The order sheet's tabs. */
export const TABS: { key: SuggestedTab; label: string }[] = [
  { key: "order", label: "Order" },
  { key: "production", label: "Production" },
  { key: "notSelling", label: "Not selling" },
];

/** Sunday first, matching the `dow_rates` keys and Postgres' extract(dow). */
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Sat/Sun. The weekend build is the single biggest shape in perishable
 *  volume, and tinting it stops a reader mistaking the weekly sawtooth for
 *  something going wrong. */
export const isWeekend = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`).getDay();
  return d === 0 || d === 6;
};

/** Header and rows share these, so a column cannot drift from its label. */
export const STORE_COLS = "grid-cols-[1fr_56px_72px_32px]";
export const DEPT_COLS = "grid-cols-[1fr_56px_72px]";

/** Sunday-first, matching the `dow_rates` keys. */
export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The dimensions a custom export can group by. */
export const DIMS = [
  { key: "product_code", label: "UPC" },
  { key: "product_description", label: "Description" },
  { key: "sub_department_description", label: "Department" },
  { key: "store_name", label: "Store" },
  // Renamed with the column it describes — "shrink" means total inventory loss
  // on a grocery floor, which is not what this is.
  { key: "shrink_source", label: "Waste source" },
  { key: "rhythm_action", label: "Rhythm" },
];

/** The figures a custom export can total. */
export const METRICS = [
  { key: "suggested_weight", label: "Order lb" },
  { key: "demand_weight", label: "Cover demand lb" },
  { key: "avg_daily_weight", label: "Avg lb/day" },
  { key: "sold_weight_window", label: "Lookback lb" },
  { key: "shrink_multiplier", label: "Shrink multiplier" },
  { key: "markdown_weight_window", label: "Marked down lb" },
  ...DOW.map((d, i) => ({ key: `dow_${i}`, label: `${d} lb` })),
  { key: "on_hand_weight", label: "On hand lb" },
  { key: "days_of_cover", label: "Days of cover" },
];

/** How a custom export combines a figure. */
export const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Avg" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "count", label: "Count" },
];

/** How many rows the custom preview shows. */
export const PREVIEW_ROWS = 5;

/** The order sheet as CSV, one row per item. */
export const buildSheetCsv = (items: SuggestedItem[]) => {
  const headers = [
    "UPC",
    "Description",
    "Department",
    "Avg lb/day",
    "Cover demand lb",
    // The two the sheet on screen does not have room for. A buyer checking a
    // suggestion against their own sense of the item reaches for these before
    // anything else: what did we buy over the window, and what went out.
    "Ordered lb (lookback)",
    "Sold lb (lookback)",
    "Shrink source",
    "Shrink multiplier",
    "Capped",
    "Marked down lb (lookback)",
    "On hand lb",
    "Order lb",
    ...DOW.map((d) => `${d} lb`),
  ];
  const rows = items.map((i) => [
    i.product_code,
    i.product_description ?? "",
    deptLabel(i.sub_department_description),
    fmtNum(i.avg_daily_weight ?? 0),
    fmtNum(i.demand_weight ?? 0),
    fmtNum(i.ordered_weight ?? 0),
    fmtNum(i.sold_weight_window ?? 0),
    i.shrink_source,
    fmtNum(i.shrink_multiplier ?? 1, 4),
    i.shrink_clamped ? "yes" : "",
    fmtNum(i.markdown_weight_window ?? 0),
    fmtNum(i.on_hand_weight ?? 0),
    fmtNum(i.suggested_weight ?? 0),
    ...DOW.map((_, d) => fmtNum(i.dow_rates?.[String(d)] ?? 0)),
  ]);
  // The order total is the number the buyer signs off on, so it ships with the
  // sheet rather than being left for a spreadsheet formula.
  rows.push([
    "",
    "Totals",
    "",
    fmtNum(items.reduce((s, i) => s + (i.avg_daily_weight ?? 0), 0)),
    fmtNum(items.reduce((s, i) => s + (i.demand_weight ?? 0), 0)),
    fmtNum(items.reduce((s, i) => s + (i.ordered_weight ?? 0), 0)),
    fmtNum(items.reduce((s, i) => s + (i.sold_weight_window ?? 0), 0)),
    "",
    "",
    "",
    fmtNum(items.reduce((s, i) => s + (i.markdown_weight_window ?? 0), 0)),
    fmtNum(items.reduce((s, i) => s + (i.on_hand_weight ?? 0), 0)),
    fmtNum(items.reduce((s, i) => s + (i.suggested_weight ?? 0), 0)),
    ...DOW.map((_, d) =>
      fmtNum(items.reduce((s, i) => s + (i.dow_rates?.[String(d)] ?? 0), 0)),
    ),
  ]);
  return rowsToCsv(headers, rows);
};

/**
 * The store's heaviest lines, every department, in the order the endpoint
 * returned them.
 *
 * Not truncated. A buyer wanting the top twenty sorts or filters in Excel;
 * shipping two presets that differ only by row count is a control nobody asked
 * for. The Department column is what makes it readable as one list.
 */
export const buildStoreOrderCsv = (items: SuggestedItem[]) => {
  const headers = [
    "UPC",
    "Description",
    "Department",
    "Avg lb/day",
    "Cover demand lb",
    "Waste %",
    "Order lb",
  ];
  const rows = items.map((i) => [
    i.product_code,
    i.product_description ?? "",
    deptLabel(i.sub_department_description),
    fmtNum(i.avg_daily_weight ?? 0),
    fmtNum(i.demand_weight ?? 0),
    fmtNum(((i.shrink_multiplier ?? 1) - 1) * 100),
    fmtNum(i.suggested_weight ?? 0),
  ]);
  rows.push([
    "",
    `Totals — ${items.length} items`,
    "",
    fmtNum(items.reduce((s, i) => s + (i.avg_daily_weight ?? 0), 0)),
    fmtNum(items.reduce((s, i) => s + (i.demand_weight ?? 0), 0)),
    "",
    fmtNum(items.reduce((s, i) => s + (i.suggested_weight ?? 0), 0)),
  ]);
  return rowsToCsv(headers, rows);
};

/**
 * The rows with something to do about them, and why.
 *
 * The one preset that is not a copy of a view: the sheet on screen shows a chip
 * and hides the reasoning in a popover, which does not survive a CSV. Here the
 * sentence IS the row, because the person reading the file is usually not the
 * person who opened the page.
 *
 * Ordered by the action ladder rather than by pounds. Every other export on
 * this page is heaviest-first; this one is worst-first, because a list of
 * things to do is worked from the top.
 */
export const buildActionsCsv = (
  items: SuggestedItem[],
  notSelling: SuggestedNotSelling | null,
  cycleDays: number,
) => {
  const nsByCode = new Map<string, NotSellingItem>();
  for (const r of notSelling?.items ?? []) nsByCode.set(String(r.product_code), r);
  const recentDays = notSelling?.window.recent.days ?? 0;

  const rank = new Map(ACTION_ORDER.map((a, i) => [a.key, i]));
  const withAction = items
    .map((i) => ({
      item: i,
      action: suggestedAction(
        i,
        nsByCode.get(String(i.product_code)),
        recentDays,
        cycleDays,
      ),
    }))
    .filter((r) => r.action !== null)
    .sort(
      (a, b) =>
        (rank.get(a.action!.key) ?? 99) - (rank.get(b.action!.key) ?? 99) ||
        (b.item.suggested_weight ?? 0) - (a.item.suggested_weight ?? 0),
    );

  const headers = [
    "Action",
    "About",
    "UPC",
    "Description",
    "Department",
    "Order lb",
    "On hand lb",
    "Days of cover",
    `Days one delivery covers`,
    "Ordered ÷ sold",
    "Waste %",
    "Why",
  ];
  const rows = withAction.map(({ item: i, action: a }) => [
    a!.label,
    SCOPE_TEXT[a!.scope],
    i.product_code,
    i.product_description ?? "",
    deptLabel(i.sub_department_description),
    fmtNum(i.suggested_weight ?? 0),
    fmtNum(i.on_hand_weight ?? 0),
    i.days_of_cover == null ? "" : fmtNum(i.days_of_cover),
    cycleDays,
    i.order_ratio == null ? "" : fmtNum(i.order_ratio, 3),
    fmtNum(((i.shrink_multiplier ?? 1) - 1) * 100),
    a!.detail,
  ]);
  return rowsToCsv(headers, rows);
};

/**
 * The production reading: what each department produces on each weekday.
 *
 * Department grain rather than item, because that is the level somebody plans a
 * week at — an item's Tuesday rate is noise, a department's is a shift.
 */
export const buildProductionCsv = (rows: SuggestedGroupRow[]) => {
  const headers = [
    "Store",
    "Department",
    "Items",
    "Avg lb/day",
    ...DOW.map((d) => `${d} lb`),
    "Lookback lb",
  ];
  return rowsToCsv(
    headers,
    rows.map((r) => [
      r.store_name ?? String(r.storeid),
      deptLabel(r.sub_department_description),
      r.item_count,
      fmtNum(r.avg_daily_weight ?? 0),
      ...DOW.map((_, d) => fmtNum(r.dow_rates?.[String(d)] ?? 0)),
      fmtNum(r.sold_weight_window ?? 0),
    ]),
  );
};

/**
 * What has stopped or slowed, worst first.
 *
 * Ordered by Lost lb rather than by status: a heavy item that stopped costs
 * more than a slow one that died, and grouping by status alone buries it. Lost
 * lb is computed here for the same reason it is computed on screen — the
 * endpoint returns both rates but not the gap between them.
 */
export const buildNotSellingCsv = (ns: SuggestedNotSelling) => {
  const days = ns.window.recent.days;
  const headers = [
    "Status",
    "UPC",
    "Description",
    "Department",
    "Prior lb/day",
    "Recent lb/day",
    "Change %",
    "Lost lb",
  ];
  const sorted = [...ns.items].sort(
    (a, b) => lostLb(b, days) - lostLb(a, days),
  );
  return rowsToCsv(
    headers,
    sorted.map((r) => [
      r.status,
      r.product_code,
      r.product_description ?? "",
      deptLabel(r.sub_department_description),
      fmtNum(r.prior_lb_per_day ?? 0),
      fmtNum(r.recent_lb_per_day ?? 0),
      r.change_ratio === null ? "" : fmtNum(r.change_ratio * 100),
      fmtNum(lostLb(r, days)),
    ]),
  );
};

/** The store and department rollup as CSV. */
export const buildRollupCsv = (rows: SuggestedGroupRow[]) => {
  const headers = [
    "Store",
    "Store #",
    "Department",
    "Items",
    "Avg lb/day",
    "Lb/day per item",
    "Cover demand lb",
    "Order lb",
    "Shrink items",
    "Capped items",
    ...DOW.map((d) => `${d} lb/day`),
  ];
  return rowsToCsv(
    headers,
    rows.map((r) => [
      r.store_name ?? String(r.storeid),
      r.store_number ?? "",
      deptLabel(r.sub_department_description),
      r.item_count,
      fmtNum(r.avg_daily_weight ?? 0),
      // The only figure here that compares across stores. Raw lb/day says a
      // store carrying five meat items is down 99% on one carrying 189, when it
      // simply has no meat case.
      fmtNum(r.item_count > 0 ? (r.avg_daily_weight ?? 0) / r.item_count : 0),
      fmtNum(r.demand_weight ?? 0),
      fmtNum(r.suggested_weight ?? 0),
      // Every source that produced an uplift, not just damage. Markdown
      // REPLACES damage per item rather than stacking, so once markdown lands
      // `items_damage` collapses to the handful markdown missed — exporting it
      // alone would read as "this department tracks no waste" on exactly the
      // departments where waste is now measured best. Matches the Shrink
      // applied tile, which counts shrink_source !== "none".
      r.items_receipts + r.items_markdown + r.items_damage,
      r.items_clamped,
      ...DOW.map((_, d) => fmtNum(r.dow_rates?.[String(d)] ?? 0)),
    ]),
  );
};

/** The help's navy, for its bars. */
export const NAVY = "rgb(var(--color-brand-navy))";

/** Severity tokens rather than the document's own palette — a reader who has
 *  seen a watch-coloured chip on the grid should meet the same colour here. */
export const PILL: Record<string, string> = {
  ok: "bg-severity_healthy_bg text-severity_healthy_text",
  warn: "bg-severity_watch_bg text-severity_watch_text",
  off: "bg-gray-200 text-content/85",
};

/** The weekday bars. Same navy as the Production tab's, so the two read as one
 *  chart seen twice rather than two different ones. */
export const DAY_ROWS: { n: string; pct: number; lb: string; tone?: "peak" | "low" }[] = [
  { n: "Sunday", pct: 69.6, lb: "802 lb" },
  { n: "Monday", pct: 54.2, lb: "624 lb" },
  { n: "Tuesday", pct: 50.6, lb: "582 lb" },
  { n: "Wednesday", pct: 49.1, lb: "565 lb", tone: "low" },
  { n: "Thursday", pct: 62.2, lb: "716 lb" },
  { n: "Friday", pct: 89.4, lb: "1,029 lb" },
  { n: "Saturday", pct: 100, lb: "1,151 lb", tone: "peak" },
];

/** How many of the store's heaviest lines the list shows. */
export const TOP_N = 25;

/** Deterministic per-index widths — random ones would reshuffle on every
 *  render and make the block flicker while it waits. */
export const NAME_W = ["78%", "62%", "85%", "55%", "72%", "68%", "90%", "60%"];
