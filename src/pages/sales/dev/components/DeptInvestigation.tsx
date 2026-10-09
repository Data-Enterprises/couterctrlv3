import { useMemo, useRef, useState, type ReactNode } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import {
  setInvestigation,
  type InvestigationTarget,
} from "../../../../features/dev/devSalesLedgerSlice";
import { useDeptInvestigation, type Stage } from "../hooks/useDeptInvestigation";
import {
  SUPPLY_LOOKBACK_DAYS,
  supplyWindow,
} from "../shared/investigationData";
import type { Cause, ItemVerdict, Summary } from "../shared/deptInvestigation";
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import SortHeader from "../../../../components-dev/SortHeader";
import ColFilter from "../../../../components-dev/filters/ColFilterPopover";
import { colInputStyle } from "../../../../components-dev/filters/colFilterStyles";
import UpcContextMenu from "../../../../components-dev/UpcContextMenu";
import ItemEvidence from "./ItemEvidence";
import {
  desksOf,
  holdsUp,
  spreadOf,
  vitalsOf,
  OWNER_LABEL,
  type Desk,
  type Holds,
  type Spread,
  type Vitals as VitalsShape,
} from "../shared/investigationSteps";
import { rowsToCsv, downloadCsv } from "../../../../utils/csvExport";
import { useTriStateSort } from "../../../../utils/useTriStateSort";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

/**
 * Why this store is behind that one, in this department.
 *
 * The page's full-width state. It is reached from a row of the sub-department
 * comparison, and it takes the whole page rather than a panel because the
 * question has outgrown one: by this point the reader is four steps in, and a
 * fifth panel inside a panel is how a drill-down becomes unusable.
 *
 * Everything on screen is `shared/deptInvestigation`'s arithmetic. Nothing is
 * computed here.
 *
 * It fills in three waves — see `useDeptInvestigation`. The grid is readable
 * as soon as sales land; each item's cause sharpens behind it. That is stated
 * on screen rather than hidden, because a cause that changes while somebody
 * is reading it needs to say why.
 */

type Col =
  | "mine" | "theirs" | "gap"
  | "mineLw" | "theirsLw" | "mineLy" | "theirsLy"
  | "mineUnits" | "theirsUnits"
  | "mineCost" | "theirsCost" | "costPenalty" | "marginDiff"
  | "price" | "sellThrough" | "ordered" | "received";

/**
 * How many rows are drawn.
 *
 * A department is hundreds of items and the table is one DOM node per cell,
 * so the whole of Soft Drinks is forty thousand of them. The list is ordered
 * by the biggest difference, which means the tail is the part nobody scrolls
 * to — and the cause chips above narrow the set when somebody does want it.
 * The footer says how many were left out rather than pretending this is all
 * of them.
 */
const ROW_CAP = 300;

const CAUSE_LABEL: Record<Cause, string> = {
  "never-ordered": "Never ordered",
  "not-received": "Didn't arrive",
  cost: "Costing more",
  "not-moving": "Not moving",
  "price-mix": "Price / mix",
  ahead: "We're ahead",
  unclassified: "No cause found",
};

/** Who owns the fix. The whole reason the causes are named separately is that
 *  they go to three different people. */
const CAUSE_OWNER: Record<Cause, string> = {
  "never-ordered": "buyer",
  "not-received": "vendor",
  cost: "buying terms",
  "not-moving": "merchandising",
  "price-mix": "same units, less money",
  ahead: "ours to keep",
  unclassified: "worth a look",
};

/**
 * One tone per cause, worn everywhere that cause appears.
 *
 * The same shape Item Actions uses for its piles: the chip carries its colour
 * all the time, and selecting it adds a ring in its own tone rather than
 * swapping the fill for a generic highlight. A chip that only colours itself
 * once you click it cannot be scanned, which is the whole job of the row.
 *
 * Six distinct hues rather than three greys, because these go to six
 * different people. `GapBreakdown` paints the same causes in the same
 * order — a cause that is violet here and grey in the treemap is two
 * findings as far as a reader is concerned.
 */
const CAUSE_TONE: Record<Cause, { chip: string; ring: string }> = {
  "never-ordered": {
    chip: "bg-severity_critical_bg text-severity_critical_text",
    ring: "ring-severity_critical_text/40",
  },
  "not-received": {
    chip: "bg-severity_watch_bg text-severity_watch_text",
    ring: "ring-severity_watch_text/40",
  },
  // Violet, the tone Item Actions gives anything that is settled with a
  // vendor rather than on the shelf. Buying terms are exactly that.
  cost: { chip: "bg-violet-50 text-violet-900", ring: "ring-violet-900/40" },
  "not-moving": { chip: "bg-blue-50 text-blue-900", ring: "ring-blue-900/40" },
  "price-mix": { chip: "bg-cyan-50 text-cyan-900", ring: "ring-cyan-900/40" },
  ahead: {
    chip: "bg-delta_positive_bg text-delta_positive_text",
    ring: "ring-delta_positive_text/40",
  },
  // Grey is the honest colour for "we could not say". Giving it a hue would
  // put it on the same footing as the five findings that mean something.
  unclassified: { chip: "bg-gray-100 text-content/85", ring: "ring-content/30" },
};

/** What is still outstanding, and what the screen cannot say yet because of
 *  it. A cause that sharpens as data lands has to explain itself. */
const STAGE_NOTE: Record<Stage, string | null> = {
  sales: "Loading this department's items…",
  orders: "Reading orders — until they land, nothing can be called never ordered.",
  receipts:
    "Reading deliveries — until they land, a vendor's miss cannot be told from a merchandising one.",
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
const SUGGESTED: Record<string, Cause[]> = {
  ringing: ["never-ordered"],
  orders: ["never-ordered", "not-received"],
  price: ["price-mix"],
  mix: ["price-mix"],
};

const CAUSE_ORDER: Cause[] = [
  "never-ordered",
  "not-received",
  "cost",
  "not-moving",
  "price-mix",
  "unclassified",
  "ahead",
];


/* ------------------------------------------------------------------ */
/* The columns                                                         */
/* ------------------------------------------------------------------ */

type Fmt = (v: number) => string;

type FilterKind = "item" | "upc" | "vendor" | "cause";

interface ColumnDef {
  key: string;
  /** A column that can be narrowed. The popover lives in the heading, which
   *  is where this app puts column filters everywhere else. */
  filter?: FilterKind;
  /** Whose figure this is. Eight of the columns belong to one store or the
   *  other and read identically without it — the tint is what stops somebody
   *  comparing 015 LW against 015 LY and thinking they have compared the
   *  stores. */
  of?: "open" | "compare";
  /** `{mine}` and `{theirs}` are filled with the two store numbers, so a
   *  heading names the store rather than leaving the reader to remember
   *  which side of the comparison it is. */
  label: string;
  width: number;
  right?: boolean;
  sort?: Col;
  render: (r: ItemVerdict, fmt: Fmt) => ReactNode;
  /**
   * This column's total, across the FILTERED set rather than the 300 rows
   * drawn. A footer that summed only what fits would be wrong by whatever
   * the cap left out, and nothing on screen would say so.
   *
   * Columns with no total leave it off: a per-unit cost and a ratio cannot
   * be added across items, and a blended figure over a case of soda and a
   * candy bar is a number that looks right and means nothing.
   */
  foot?: (rows: ItemVerdict[], fmt: Fmt) => ReactNode;
}

/** Tints, not solids: 11px mono has to stay readable on top of them. The
 *  heading takes the solid as a top rule, which is what groups the columns
 *  without a second header row. */
const tintOf = (c: ColumnDef) =>
  c.of === "open"
    ? "bg-store_open_tint"
    : c.of === "compare"
      ? "bg-store_compare_tint"
      : "";

const ruleOf = (c: ColumnDef) =>
  c.of === "open"
    ? "border-t-2 border-t-store_open"
    : c.of === "compare"
      ? "border-t-2 border-t-store_compare"
      : "border-t-2 border-t-transparent";

const label = (c: ColumnDef, t: InvestigationTarget) =>
  c.label.replace("{mine}", t.storeNumber).replace("{theirs}", t.compareStoreNumber);

/** A ratio reads as a multiple, which is how somebody says it out loud —
 *  "we did two fifths of their units". Null stays a dash: there is no ratio
 *  to a store that sold none, and 0 would read as a result. */
const mult = (v: number | null) => (v === null ? "—" : `${v.toFixed(2)}×`);

/**
 * Always money, never the page's metric.
 *
 * The sales columns follow the Sales/Quantity toggle, and in quantity mode
 * `fmt` renders a unit count. Cost and margin are dollars either way — see
 * `mineSales` in the shared math — so they format themselves and ignore the
 * formatter the column is handed.
 */
const cash = (v: number) => formatCurrency2(v);

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

const sum = (rows: ItemVerdict[], pick: (r: ItemVerdict) => number | null) =>
  rows.reduce((a, r) => a + (pick(r) ?? 0), 0);

/** A plain total, in whatever the page's metric is. */
const money =
  (pick: (r: ItemVerdict) => number | null) =>
  (rows: ItemVerdict[], fmt: Fmt) =>
    fmt(sum(rows, pick));

/** A total that carries direction, in the same pill its column's cells use. */
const signedWith =
  (pick: (r: ItemVerdict) => number | null, force?: Fmt) =>
  (rows: ItemVerdict[], fmt: Fmt) => {
    const v = sum(rows, pick);
    const show = force ?? fmt;
    return (
      <span
        className={`inline-block px-1.5 py-0.5 rounded font-bold ${
          v === 0
            ? "bg-gray-100 text-content/85"
            : v > 0
              ? "bg-delta_positive_bg text-delta_positive_text"
              : "bg-delta_negative_bg text-delta_negative_text"
        }`}
      >
        {v >= 0 ? "+" : "−"}{show(Math.abs(v))}
      </span>
    );
  };

const signed = (pick: (r: ItemVerdict) => number | null) => signedWith(pick);
/** The money columns, which do not follow the page's metric. */
const signedCash = (pick: (r: ItemVerdict) => number | null) =>
  signedWith(pick, (v) => formatCurrency2(v));

/** A count, which is a count whichever metric the page is in. */
const counted =
  (pick: (r: ItemVerdict) => number) => (rows: ItemVerdict[]) =>
    sum(rows, pick).toLocaleString("en-US");

const sortValue = (r: ItemVerdict, col: Col): number | null => {
  switch (col) {
    case "mine": return r.mineTy;
    case "theirs": return r.theirsTy;
    case "gap": return r.gap;
    case "mineLw": return r.mineLw;
    case "theirsLw": return r.theirsLw;
    case "mineLy": return r.mineLy;
    case "theirsLy": return r.theirsLy;
    case "mineUnits": return r.mineUnits;
    case "theirsUnits": return r.theirsUnits;
    case "mineCost": return r.margins.minePerUnit;
    case "theirsCost": return r.margins.theirsPerUnit;
    case "costPenalty": return r.margins.costPenalty;
    case "marginDiff": return r.margins.diff;
    case "price": return r.ratios.price;
    case "sellThrough": return r.ratios.sellThrough;
    case "ordered": return r.orderedQty;
    case "received": return r.receivedUnits;
  }
};

/**
 * The same columns, as a file.
 *
 * Raw numbers, not the screen's formatted strings: "$1,870.68" is text to a
 * spreadsheet and will not sum. Dates and names come through as they read.
 *
 * It exports what is FILTERED, not what is drawn — the 300-row cap is a
 * rendering limit, and a file that quietly stopped at the same place would be
 * wrong in a way nobody could see.
 */
const CSV_HEADERS = [
  "item", "upc", "vendor", "cause", "cause_owner",
  "mine_ty", "theirs_ty", "difference",
  "mine_lw", "theirs_lw", "mine_ly", "theirs_ly",
  "mine_units", "theirs_units",
  "mine_cogs", "theirs_cogs", "mine_cost_per_unit", "theirs_cost_per_unit",
  "cost_gap", "mine_margin", "theirs_margin", "margin_difference",
  "units_ratio", "dollars_ratio", "price_ratio", "sell_through",
  "ordered_qty", "received_units",
];

const csvRow = (r: ItemVerdict) => [
  r.description, r.productCode, r.vendorName,
  CAUSE_LABEL[r.cause], CAUSE_OWNER[r.cause],
  r.mineTy, r.theirsTy, r.gap,
  r.mineLw, r.theirsLw, r.mineLy, r.theirsLy,
  r.mineUnits, r.theirsUnits,
  r.mineCogs, r.theirsCogs, r.margins.minePerUnit, r.margins.theirsPerUnit,
  r.margins.costPenalty, r.margins.mine, r.margins.theirs, r.margins.diff,
  r.ratios.units, r.ratios.dollars, r.ratios.price, r.ratios.sellThrough,
  r.orderedQty, r.receivedUnits,
];

const COLUMNS: ColumnDef[] = [
  {
    key: "item", label: "Item", width: 250, filter: "item",
    render: (r) => <span className="font-semibold">{r.description}</span>,
    foot: (rows) => (
      <span className="uppercase tracking-wide">
        Totals · {rows.length.toLocaleString("en-US")}{" "}
        {rows.length === 1 ? "item" : "items"}
      </span>
    ),
  },
  { key: "upc", label: "UPC", width: 120, filter: "upc", render: (r) => r.productCode },
  {
    key: "vendor", label: "Vendor", width: 150, filter: "vendor",
    render: (r) => r.vendorName || <span className="text-content/85">—</span>,
  },
  {
    key: "cause", label: "Cause", width: 118, filter: "cause",
    render: (r) => (
      <span
        className={`inline-block px-1.5 py-0.5 rounded font-semibold ${CAUSE_TONE[r.cause].chip}`}
        title={CAUSE_OWNER[r.cause]}
      >
        {CAUSE_LABEL[r.cause]}
      </span>
    ),
  },
  {
    key: "mineTy", of: "open", label: "{mine} TY", width: 92, right: true, sort: "mine",
    foot: money((r) => r.mineTy),
    render: (r, fmt) => <span className="font-semibold">{fmt(r.mineTy)}</span>,
  },
  {
    key: "theirsTy", of: "compare", label: "{theirs} TY", width: 92, right: true, sort: "theirs",
    foot: money((r) => r.theirsTy),
    render: (r, fmt) => fmt(r.theirsTy),
  },
  {
    key: "marginDiff", label: "Margin diff", width: 104, right: true,
    sort: "marginDiff", foot: signedCash((r) => r.margins.diff),
    // Direction only, through the delta tokens. Margin is NOT graded: two
    // stores are not a baseline for each other, so there is no threshold
    // this could be measured against — green is up, red is down, nothing
    // more is being claimed.
    render: (r) => (
      <span
        className={`inline-block px-1.5 py-0.5 rounded font-semibold ${
          r.margins.diff === 0
            ? "bg-gray-100 text-content/85"
            : r.margins.diff > 0
              ? "bg-delta_positive_bg text-delta_positive_text"
              : "bg-delta_negative_bg text-delta_negative_text"
        }`}
      >
        {r.margins.diff >= 0 ? "+" : "−"}{cash(Math.abs(r.margins.diff))}
      </span>
    ),
  },
  {
    key: "gap", label: "Difference", width: 104, right: true, sort: "gap",
    foot: signed((r) => r.gap),
    // The ledger's pill, sized for a dense row: the comparison styling is
    // the same everywhere on this page, and a graded figure that changes
    // shape per grid is one a reader has to re-learn.
    render: (r, fmt) => (
      <span
        className={`inline-block px-1.5 py-0.5 rounded font-semibold ${
          r.gap === 0
            ? "bg-gray-100 text-content/85"
            : r.gap > 0
              ? "bg-delta_positive_bg text-delta_positive_text"
              : "bg-delta_negative_bg text-delta_negative_text"
        }`}
      >
        {r.gap >= 0 ? "+" : "−"}{fmt(Math.abs(r.gap))}
      </span>
    ),
  },
  { key: "mineLw", of: "open", label: "{mine} LW", width: 90, right: true, sort: "mineLw", render: (r, fmt) => fmt(r.mineLw), foot: money((r) => r.mineLw) },
  { key: "theirsLw", of: "compare", label: "{theirs} LW", width: 90, right: true, sort: "theirsLw", render: (r, fmt) => fmt(r.theirsLw), foot: money((r) => r.theirsLw) },
  { key: "mineLy", of: "open", label: "{mine} LY", width: 90, right: true, sort: "mineLy", render: (r, fmt) => fmt(r.mineLy), foot: money((r) => r.mineLy) },
  { key: "theirsLy", of: "compare", label: "{theirs} LY", width: 90, right: true, sort: "theirsLy", render: (r, fmt) => fmt(r.theirsLy), foot: money((r) => r.theirsLy) },
  {
    key: "mineUnits", of: "open", label: "{mine} units", width: 88, right: true, sort: "mineUnits",
    render: (r) => r.mineUnits.toLocaleString("en-US"),
    foot: counted((r) => r.mineUnits),
  },
  {
    key: "theirsUnits", of: "compare", label: "{theirs} units", width: 88, right: true, sort: "theirsUnits",
    render: (r) => r.theirsUnits.toLocaleString("en-US"),
    foot: counted((r) => r.theirsUnits),
  },
  {
    key: "mineCost", of: "open", label: "{mine} cost/u", width: 92, right: true,
    sort: "mineCost",
    render: (r) =>
      r.margins.minePerUnit === null ? "—" : cash(r.margins.minePerUnit),
  },
  {
    key: "theirsCost", of: "compare", label: "{theirs} cost/u", width: 92,
    right: true, sort: "theirsCost",
    render: (r) =>
      r.margins.theirsPerUnit === null ? "—" : cash(r.margins.theirsPerUnit),
  },
  {
    // What the per-unit difference took on the units WE sold. Money, not a
    // ratio: "$112 on 488 units" is the sentence somebody acts on.
    key: "costPenalty", label: "Cost gap", width: 98, right: true,
    sort: "costPenalty", foot: signedCash((r) => r.margins.costPenalty),
    render: (r) => {
      const v = r.margins.costPenalty;
      if (v === null || Math.abs(v) < 0.005) return "—";
      return (
        <span
          className={`inline-block px-1.5 py-0.5 rounded font-semibold ${
            v > 0
              ? "bg-delta_positive_bg text-delta_positive_text"
              : "bg-delta_negative_bg text-delta_negative_text"
          }`}
        >
          {v >= 0 ? "+" : "−"}{cash(Math.abs(v))}
        </span>
      );
    },
  },
  {
    // Units and dollars moving apart is what names a price problem, so the
    // realised-price ratio earns a column of its own.
    key: "price", label: "Price vs", width: 82, right: true, sort: "price",
    render: (r) => mult(r.ratios.price),
  },
  {
    key: "ordered", label: "Ordered", width: 78, right: true, sort: "ordered",
    foot: counted((r) => r.orderedQty),
    render: (r) =>
      r.orderedQty > 0 ? r.orderedQty.toLocaleString("en-US") : <span className="text-content/85">none</span>,
  },
  {
    key: "received", label: "Received", width: 84, right: true, sort: "received",
    foot: counted((r) => r.receivedUnits),
    render: (r) =>
      r.receivedUnits > 0 ? r.receivedUnits.toLocaleString("en-US") : <span className="text-content/85">none</span>,
  },
  {
    key: "sellThrough", label: "Sell-thru", width: 84, right: true, sort: "sellThrough",
    render: (r) => pct(r.ratios.sellThrough),
  },
];


/* ------------------------------------------------------------------ */
/* Check · does it hold, and where is it                               */
/* ------------------------------------------------------------------ */

const Card = ({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-lg bg-gray-50 px-4 py-3.5">
    <div className="text-[12px] font-bold uppercase tracking-wide text-content/85">
      {title}
    </div>
    {note && (
      <p className="text-[12px] text-content/85 leading-snug mt-1">{note}</p>
    )}
    <div className="mt-3">{children}</div>
  </div>
);

/** The department against itself: a standing difference, or something that
 *  broke in the last seven days. Values above the bars, because the labels
 *  below already anchor them and a figure under a bar reads as its caption
 *  rather than as its height. */
const Weeks = ({
  vitals,
  cash,
}: {
  vitals: VitalsShape;
  cash: (v: number) => string;
}) => {
  const tallest = Math.max(1, ...vitals.weeks.map((w) => Math.abs(w.gap)));
  return (
    <div className="grid grid-cols-3 gap-3">
      {vitals.weeks.map((w) => (
        <div key={w.label} className="flex flex-col">
          <div
            className={`text-[12.5px] font-bold tabular-nums text-center whitespace-nowrap ${
              w.gap >= 0 ? "text-delta_positive_text" : "text-delta_negative_text"
            }`}
          >
            {w.gap >= 0 ? "+" : "−"}
            {cash(Math.abs(w.gap))}
          </div>
          <div className="h-[56px] flex items-end justify-center mt-1">
            <span
              className={`block w-full rounded-t-sm ${
                w.gap >= 0 ? "bg-emerald-500" : "bg-red-500"
              }`}
              style={{ height: `${Math.max(3, (Math.abs(w.gap) / tallest) * 56)}px` }}
            />
          </div>
          <div className="h-px bg-brand_navy/15" />
          <div className="text-[12px] font-semibold uppercase tracking-wide text-content/85 text-center whitespace-nowrap mt-1">
            {w.label}
          </div>
        </div>
      ))}
    </div>
  );
};

/** Sales, units and margin on ONE rule, the counterpart at 100, so measures
 *  that disagree are seen to disagree. */
const Index = ({
  vitals,
  them,
  cash,
}: {
  vitals: VitalsShape;
  them: string;
  cash: (v: number) => string;
}) => {
  // Three bars pinned at zero say nothing, in the one case where the reason
  // they are at zero IS the finding.
  if (vitals.index.every((m) => m.mine === 0)) {
    return (
      <p className="text-[13px] leading-relaxed text-content/85">
        This store rang none of it at all, so there is nothing to put on the
        rule. {them} took{" "}
        <span className="font-semibold text-delta_negative_text">
          {cash(vitals.index[0].theirs)}
        </span>
        .
      </p>
    );
  }
  // Two thirds along, so a department running well OVER still has room.
  const RULE = 66.666;
  return (
    <div className="flex flex-col gap-2.5">
      {vitals.index.map((m) => {
        const over = (m.pct ?? 0) >= 100;
        return (
          <div key={m.label} className="flex items-center gap-2.5">
            <span className="w-[52px] flex-shrink-0 text-[12px] font-semibold uppercase tracking-wide text-content/85">
              {m.label}
            </span>
            <span className="relative flex-1 min-w-0 h-2.5 rounded-sm bg-bkg">
              <span
                className={`absolute left-0 top-0 h-2.5 rounded-sm ${
                  over ? "bg-emerald-500" : "bg-red-500"
                }`}
                style={{ width: `${Math.min(100, ((m.pct ?? 0) / 150) * 100)}%` }}
              />
              <span
                className="absolute -top-1 w-px h-[18px] bg-brand_navy/40"
                style={{ left: `${RULE}%` }}
              />
            </span>
            <span
              className={`w-[46px] flex-shrink-0 text-right text-[12.5px] font-bold tabular-nums ${
                over ? "text-delta_positive_text" : "text-delta_negative_text"
              }`}
            >
              {m.pct === null ? "—" : `${Math.round(m.pct)}%`}
            </span>
          </div>
        );
      })}
      <p className="text-[12px] text-content/85 leading-snug">
        The rule is {them} at 100.
      </p>
    </div>
  );
};

const HoldsPanel = ({
  holds,
  spread,
  summary,
  them,
  vitals,
  cash,
  marginGap,
  costPenalty,
  onPickItem,
  onVendor,
}: {
  holds: Holds;
  spread: Spread;
  summary: Summary;
  them: string;
  vitals: VitalsShape;
  cash: (v: number) => string;
  /** Sales and margin can point opposite ways, and nothing else on the
   *  screen would say so. Both come off the sales wave, so this belongs in
   *  the step that draws first. */
  marginGap: number;
  costPenalty: number;
  onPickItem: (code: string) => void;
  onVendor: (vendor: string) => void;
}) => {
  const buckets = [
    { label: `Rang at ${them}, not here`, b: holds.onlyTheirs, tone: "bg-red-500" },
    { label: "Rang at both, less here", b: holds.bothLess, tone: "bg-red-500" },
    { label: "Rang at both, more here", b: holds.bothMore, tone: "bg-emerald-500" },
  ];
  const moved = buckets.reduce((t, x) => t + Math.abs(x.b.dollars), 0);
  /** The one row with money in it leads. Three rows where two are zero makes
   *  the reader find the finding; the figure IS the finding. */
  const lead = [...buckets].sort(
    (a, b) => Math.abs(b.b.dollars) - Math.abs(a.b.dollars),
  )[0];

  const shortfall = spread.ranked.reduce((t, i) => t - i.gap, 0);
  const top = spread.ranked.slice(0, 10);
  const widest = Math.abs(top[0]?.gap ?? 1);
  const vendors = spread.byVendor.slice(0, 6);
  const widestVendor = Math.max(1, Math.abs(vendors[0]?.dollars ?? 0));

  const COLS = "minmax(0,1.55fr) minmax(290px,0.8fr)";

  return (
    <div className="flex-1 min-h-0 overflow-auto thin-scrollbar px-4 py-5">
      <div className="max-w-[1180px] mx-auto flex flex-col gap-6">

        {/* Each card sits beside the section it serves, rather than all of
            them stacking in one rail away from what they are evidence for. */}
        <div className="grid gap-8 items-start" style={{ gridTemplateColumns: COLS }}>
          <div className="flex flex-col gap-4 min-w-0">
            <p className="text-[20px] font-semibold leading-snug text-content">
              <span
                className={
                  holds.verdict === "holds"
                    ? "text-delta_positive_text"
                    : "text-severity_watch_text"
                }
              >
                {holds.verdict === "holds" ? "It holds." : "Not as the report put it."}
              </span>{" "}
              {holds.says}
            </p>

            <div className="flex items-baseline gap-3 flex-wrap">
              <span
                className={`text-[34px] font-bold tabular-nums leading-none ${
                  lead.b.dollars >= 0
                    ? "text-delta_positive_text"
                    : "text-delta_negative_text"
                }`}
              >
                {lead.b.dollars >= 0 ? "+" : "−"}
                {cash(Math.abs(lead.b.dollars))}
              </span>
              <span className="text-[13.5px] text-content/85 min-w-0">
                <span className="font-semibold text-content">
                  {lead.b.items.toLocaleString("en-US")} items
                </span>{" "}
                {lead.label.toLowerCase()}
              </span>
            </div>

            {moved > 0 && (
              <span className="flex h-2 rounded-sm overflow-hidden bg-bkg">
                {buckets.map((x) => (
                  <span
                    key={x.label}
                    className={`block h-2 ${x.tone}`}
                    style={{ width: `${(Math.abs(x.b.dollars) / moved) * 100}%` }}
                    title={`${x.label} · ${cash(Math.abs(x.b.dollars))}`}
                  />
                ))}
              </span>
            )}

            <div className="flex flex-col">
              {buckets.map((x) => (
                <div
                  key={x.label}
                  className="flex items-baseline gap-2.5 py-1.5 border-b border-brand_navy/15 last:border-b-0"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 self-center ${
                      x.b.items === 0 ? "bg-bkg" : x.tone
                    }`}
                  />
                  <span className="text-[13px] text-content/85 min-w-0">
                    {x.label}
                  </span>
                  <span className="ml-auto text-[12.5px] text-content/85 tabular-nums whitespace-nowrap">
                    {x.b.items.toLocaleString("en-US")} items
                  </span>
                  <span
                    className={`w-[96px] text-right text-[13px] font-bold tabular-nums whitespace-nowrap ${
                      x.b.items === 0
                        ? "text-content/85"
                        : x.b.dollars >= 0
                          ? "text-delta_positive_text"
                          : "text-delta_negative_text"
                    }`}
                  >
                    {x.b.dollars >= 0 ? "+" : "−"}
                    {cash(Math.abs(x.b.dollars))}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[12.5px] text-content/85 leading-relaxed">
              Sales only, so this is settled before any cause is named — and
              before anything can change under you.
            </p>

            {summary.gap >= 0 && marginGap < 0 && (
              <p className="text-[13px] leading-relaxed rounded-md bg-severity_watch_bg text-severity_watch_text px-3 py-2">
                <span className="font-bold">Ahead on sales, behind on margin.</span>{" "}
                This department took {cash(summary.gap)} more and kept{" "}
                {cash(Math.abs(marginGap))} less, because it buys the same goods
                for more.
              </p>
            )}
            {costPenalty < 0 && summary.gap < 0 && (
              <p className="text-[12.5px] text-content/85 leading-relaxed">
                Buying the same goods for more took another{" "}
                <span className="font-semibold text-content">
                  {cash(Math.abs(costPenalty))}
                </span>{" "}
                of margin on top of the sales gap.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Card
              title="The gap, week by week"
              note="Against itself: a standing difference, or something that broke this week."
            >
              <Weeks vitals={vitals} cash={cash} />
            </Card>
            <Card
              title={`Against ${them}`}
              note="One rule for all three, so measures that disagree are seen to."
            >
              <Index vitals={vitals} them={them} cash={cash} />
            </Card>
          </div>
        </div>

        <div className="flex justify-center">
          <span className="text-[13px] text-content/85 bg-gray-50 rounded-full px-4 py-1.5">
            {holds.verdict === "holds"
              ? "So the call stands. Is it a few big items, or many small ones?"
              : "So the shape is different. Where does it sit?"}
          </span>
        </div>

        <div className="grid gap-8 items-start" style={{ gridTemplateColumns: COLS }}>
          <div className="flex flex-col gap-4 min-w-0">
            <p className="text-[20px] font-semibold leading-snug text-content">
              {spread.says}
            </p>

            <span className="flex h-2 rounded-sm overflow-hidden bg-bkg">
              <span
                className="block h-2 bg-red-500"
                style={{ width: `${Math.max(4, spread.topTenShare * 100)}%` }}
              />
            </span>

            <div className="flex flex-col">
              {top.map((i, ix) => (
                <div key={i.productCode}>
                  <button
                    onClick={() => onPickItem(i.productCode)}
                    className="w-full grid gap-3 items-center px-1.5 py-1.5 border-b border-brand_navy/15 hover:bg-gray-50 rounded text-left"
                    style={{ gridTemplateColumns: "22px minmax(0,1fr) 120px 96px" }}
                  >
                    <span className="text-[12px] text-content/85 tabular-nums">
                      {ix + 1}
                    </span>
                    <span className="min-w-0 truncate text-[12.5px] font-mono text-content">
                      {i.description}
                    </span>
                    <span className="h-2 rounded-sm bg-bkg">
                      <span
                        className="block h-2 rounded-sm bg-red-500"
                        style={{ width: `${(Math.abs(i.gap) / widest) * 100}%` }}
                      />
                    </span>
                    <span className="text-right text-[12.5px] font-bold tabular-nums text-delta_negative_text">
                      {"−"}
                      {cash(Math.abs(i.gap))}
                    </span>
                  </button>
                  {/* The conclusion drawn in the list it is about, rather
                      than only stated above it. */}
                  {spread.toHalf > 0 && ix === spread.toHalf - 1 && (
                    <div className="flex items-center gap-2 py-1">
                      <span className="h-px flex-1 bg-delta_negative_text/40" />
                      <span className="text-[11.5px] font-bold uppercase tracking-wide text-delta_negative_text whitespace-nowrap">
                        half the shortfall
                      </span>
                      <span className="h-px flex-1 bg-delta_negative_text/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[12.5px] text-content/85 leading-relaxed">
              {spread.ranked.length.toLocaleString("en-US")} items behind ·
              ordered by the biggest difference · click one for its evidence ·{" "}
              {cash(shortfall)} in all
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {vendors.length > 0 && (
              /* Beside the list it filters, and still in view while it
                 scrolls. One vendor owning most of a shortfall is the
                 cluster worth finding: raising one account closes more than
                 chasing thirty items across nine. */
              <Card
                title="Who supplies it"
                note="The shortfall by vendor. Pick one to narrow the items."
              >
                <div className="flex flex-col gap-1.5">
                  {vendors.map((v) => (
                    <button
                      key={v.vendorName}
                      onClick={() => onVendor(v.vendorName)}
                      className="flex items-center gap-2.5 text-left rounded px-1 py-0.5 hover:bg-custom-white transition-colors"
                    >
                      <span className="w-[104px] flex-shrink-0 truncate text-[12.5px] text-content">
                        {v.vendorName}
                      </span>
                      <span className="flex-1 min-w-0 h-2 rounded-sm bg-bkg">
                        <span
                          className="block h-2 rounded-sm bg-red-500"
                          style={{
                            width: `${(Math.abs(v.dollars) / widestVendor) * 100}%`,
                          }}
                        />
                      </span>
                      <span className="w-[72px] flex-shrink-0 text-right text-[12.5px] font-bold tabular-nums text-delta_negative_text">
                        {"−"}
                        {cash(Math.abs(v.dollars))}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Step 5 · who fixes it                                               */
/* ------------------------------------------------------------------ */

const ActPanel = ({
  desks,
  cash,
  onShow,
  onExport,
  onPickItem,
  waiting,
}: {
  desks: Desk[];
  cash: (v: number) => string;
  onShow: (c: Cause) => void;
  onExport: (d: Desk) => void;
  onPickItem: (code: string) => void;
  waiting: boolean;
}) => {
  if (waiting) {
    return (
      <div className="flex-1 min-h-0 overflow-auto thin-scrollbar px-4 py-4">
        <div className="max-w-[920px] mx-auto rounded-md border border-dashed border-severity_watch_text/40 bg-severity_watch_bg px-4 py-4">
          <p className="text-[14px] leading-relaxed text-severity_watch_text">
            The lists are written once the causes are final, so nobody is sent
            a list that changes after they have read it.
          </p>
        </div>
      </div>
    );
  }

  const owned = desks.filter((d) => d.actionable);
  const quiet = desks.filter((d) => !d.actionable);

  return (
    <div className="flex-1 min-h-0 overflow-auto thin-scrollbar px-4 py-4">
      <div className="max-w-[920px] mx-auto flex flex-col gap-4">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
          {owned.map((d) => (
            <div
              key={d.cause}
              className="flex flex-col gap-2.5 rounded-md border border-brand_navy/15 p-3.5"
            >
              <span className="text-[12px] font-bold uppercase tracking-wide text-content/85">
                {CAUSE_LABEL[d.cause]} ·{" "}
                <span className="text-delta_negative_text">
                  {cash(Math.abs(d.dollars))}
                </span>
              </span>
              <span className="text-[15px] font-bold text-content">
                {"→"} {OWNER_LABEL[d.owner as "buyer" | "vendor" | "price"]}
              </span>
              <p className="text-[13px] leading-relaxed text-content/85">{d.says}</p>

              <ul className="flex flex-col gap-1">
                {d.items.slice(0, 4).map((i) => (
                  <li key={i.productCode} className="flex items-baseline gap-2">
                    <button
                      onClick={() => onPickItem(i.productCode)}
                      className="min-w-0 truncate text-left text-[12px] font-mono text-brand_navy_hover hover:underline"
                    >
                      {i.description}
                    </button>
                    <span className="ml-auto text-[12px] tabular-nums text-delta_negative_text whitespace-nowrap">
                      {"−"}{formatCurrency2(Math.abs(i.gap))}
                    </span>
                  </li>
                ))}
                {d.items.length > 4 && (
                  <li className="text-[12px] text-content/85">
                    + {(d.items.length - 4).toLocaleString("en-US")} more
                  </li>
                )}
              </ul>

              <div className="flex flex-wrap gap-2 mt-auto pt-1">
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      d.items.map((i) => i.productCode).join(", "),
                    )
                  }
                  className="px-3 py-1.5 rounded-md bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12px] font-bold transition-colors"
                >
                  Copy UPCs
                </button>
                <button
                  onClick={() => onExport(d)}
                  className="px-3 py-1.5 rounded-md border border-brand_line text-[12px] font-bold text-content hover:bg-gray-50 transition-colors"
                >
                  Export
                </button>
                <button
                  onClick={() => onShow(d.cause)}
                  className="px-3 py-1.5 rounded-md border border-brand_line text-[12px] font-bold text-content hover:bg-gray-50 transition-colors"
                >
                  Show in grid
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Stated, and handed to nobody. A shortfall that quietly vanishes
            from the hand-off is one somebody finds again later and trusts
            less for having been dropped. */}
        {quiet.map((d) => (
          <p
            key={d.cause}
            className="text-[13px] leading-relaxed text-content/85 border-l-2 border-brand_navy/15 pl-3"
          >
            <span className="font-semibold text-content">
              {CAUSE_LABEL[d.cause]} · {cash(Math.abs(d.dollars))}
            </span>{" "}
            {d.says} It goes on no list, because nothing here names anything to
            act on.
          </p>
        ))}
      </div>
    </div>
  );
};

interface Props {
  gradingMetric: GradingMetric;
  twStart: string;
  twEnd: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
}

const DeptInvestigation = ({
  gradingMetric,
  twStart,
  twEnd,
  lwStart,
  lwEnd,
  lyStart,
  lyEnd,
}: Props) => {
  const dispatch = useAppDispatch();
  const target = useAppSelector((state) => state.dev.salesLedger.investigation);
  const { sort, handleSort, applySort } = useTriStateSort<Col>();
  const [only, setOnly] = useState<Cause | null>(null);
  const [itemQ, setItemQ] = useState("");
  const [itemDraft, setItemDraft] = useState("");
  const [upcQ, setUpcQ] = useState("");
  const [upcDraft, setUpcDraft] = useState("");
  const [vendorQ, setVendorQ] = useState("");
  const [ctx, setCtx] = useState<{ x: number; y: number; upc: string } | null>(null);
  /** Which item's evidence is open. Held here rather than in the slice: it
   *  belongs to this screen and means nothing once you leave it. */
  const [picked, setPicked] = useState<string | null>(null);
  /**
   * Which step is on screen.
   *
   * Tabs rather than one long scroll: the grid alone is three hundred rows,
   * and a page that puts the hand-off below it leaves the last step
   * reachable only by a shortcut. The three split on the WAVE boundary —
   * "holds" needs sales alone and draws at once, the other two wait — so the
   * structure carries the loading rather than fighting it.
   *
   * The cause filter is shared across them, so moving between steps keeps
   * whatever the reader had narrowed to.
   */
  const [tab, setTab] = useState<"holds" | "items" | "act">("holds");

  const isQty = gradingMetric === "qty";
  const fmt = (v: number) => (isQty ? formatBigNumber(v, 0) : formatCurrency2(v));

  const args = useMemo(
    () => ({
      mine: {
        storeid: target?.storeid ?? 0,
        storeNumber: target?.storeNumber ?? "",
        name: target?.storeName ?? "",
      },
      theirs: {
        storeid: target?.compareStoreid ?? 0,
        storeNumber: target?.compareStoreNumber ?? "",
        name: target?.compareStoreName ?? "",
      },
      subDept: target?.subDept ?? 0,
      tw: { start: twStart, end: twEnd },
      lw: { start: lwStart, end: lwEnd },
      ly: { start: lyStart, end: lyEnd },
      metric: gradingMetric,
      enabled: target !== null,
    }),
    [target, twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd, gradingMetric],
  );

  const { stage, items, summary, problem, sales, orders, receipts } =
    useDeptInvestigation(args);

  /** Every vendor in the department, so the vendor filter is a list to pick
   *  from rather than a spelling to guess at. */
  const vendors = useMemo(
    () =>
      [...new Set(items.map((i) => i.vendorName).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [items],
  );

  const shown = useMemo(() => {
    const item = itemQ.trim().toLowerCase();
    const upc = upcQ.trim().toLowerCase();
    return items.filter(
      (i) =>
        (!only || i.cause === only) &&
        (!item || i.description.toLowerCase().includes(item)) &&
        (!upc || i.productCode.toLowerCase().includes(upc)) &&
        (!vendorQ || i.vendorName === vendorQ),
    );
  }, [items, only, itemQ, upcQ, vendorQ]);

  const pickedItem = useMemo(
    () => items.find((i) => i.productCode === picked) ?? null,
    [items, picked],
  );

  /* The three steps the grid does not answer. All three are arithmetic over
     items already in hand, so changing tab asks for nothing. */
  const holds = useMemo(
    () => holdsUp(items, target?.focus ?? "unknown"),
    [items, target?.focus],
  );
  const spread = useMemo(() => spreadOf(items), [items]);
  const vitals = useMemo(() => vitalsOf(items), [items]);
  const desks = useMemo(() => desksOf(items, cash), [items]);

  /**
   * The last item the rail showed, kept through the close.
   *
   * The rail slides out over 200ms, and unmounting its contents on the frame
   * the selection clears would empty the panel before it has finished moving
   * — the slide would be of a blank box. Written during render deliberately:
   * an effect would run a frame late, which is exactly the frame that shows.
   */
  const lastEvidence = useRef<ItemVerdict | null>(null);
  if (pickedItem) lastEvidence.current = pickedItem;
  const evidence = pickedItem ?? lastEvidence.current;

  const filterActive = (k: FilterKind) =>
    k === "item" ? !!itemQ
      : k === "upc" ? !!upcQ
        : k === "vendor" ? !!vendorQ
          : only !== null;

  /** Text filters commit on Apply; the two pickers have already committed by
   *  the time the button is reachable, so Apply just closes the popover. */
  const applyFilter = (k: FilterKind) => {
    if (k === "item") setItemQ(itemDraft);
    if (k === "upc") setUpcQ(upcDraft);
  };

  const clearFilter = (k: FilterKind) => {
    if (k === "item") { setItemQ(""); setItemDraft(""); }
    if (k === "upc") { setUpcQ(""); setUpcDraft(""); }
    if (k === "vendor") setVendorQ("");
    if (k === "cause") setOnly(null);
  };

  const filtered = only !== null || !!itemQ || !!upcQ || !!vendorQ;

  /** One desk's list, named for who it is going to. The whole-grid export
   *  in the header is a different file and says so. */
  const exportDesk = (d: Desk) => {
    if (!target) return;
    const name = [
      target.storeNumber,
      target.subDeptName.replace(/[^A-Za-z0-9]+/g, "-"),
      CAUSE_LABEL[d.cause].replace(/[^A-Za-z0-9]+/g, "-"),
      twEnd,
    ].join("_");
    downloadCsv(rowsToCsv(CSV_HEADERS, d.items.map(csvRow)), `${name}.csv`);
  };

  /** Everything the filters left, not the 300 that are drawn. */
  const exportCsv = () => {
    if (!target) return;
    const name = [
      "investigation",
      target.storeNumber,
      target.subDeptName.replace(/[^A-Za-z0-9]+/g, "-"),
      twEnd,
    ].join("_");
    downloadCsv(rowsToCsv(CSV_HEADERS, sorted.map(csvRow)), `${name}.csv`);
  };

  /**
   * Copying by CAUSE rather than by severity.
   *
   * The shared menu offers critical/watch/healthy out of the box, which are
   * threshold grades and mean nothing here. Causes are what somebody acts on:
   * the never-ordered list goes to a buyer and the didn't-arrive list goes to
   * a vendor, so those are the two lists worth having on a clipboard.
   *
   * Over the FILTERED set, so what gets copied is what is on screen.
   */
  const copyActions = CAUSE_ORDER.filter((c) => c !== "ahead")
    .map((c) => ({ cause: c, upcs: shown.filter((i) => i.cause === c).map((i) => i.productCode) }))
    .filter((g) => g.upcs.length > 0)
    .map((g) => ({
      label: `Copy ${CAUSE_LABEL[g.cause].toLowerCase()} UPCs · ${g.upcs.length}`,
      onClick: () => navigator.clipboard.writeText(g.upcs.join(", ")),
    }));
  const clearAll = () => {
    setOnly(null);
    setItemQ(""); setItemDraft("");
    setUpcQ(""); setUpcDraft("");
    setVendorQ("");
  };

  const sorted = applySort(shown, (row, col) => sortValue(row, col));
  const capped = sorted.slice(0, ROW_CAP);

  if (!target) return null;

  const supply = supplyWindow({ start: twStart, end: twEnd });
  const byCause = new Map(summary.byCause.map((c) => [c.cause, c]));
  /**
   * Sales and margin can point opposite ways, and the headline has to say so.
   *
   * A department can sell more than its counterpart and keep less, because it
   * buys the same goods for more. Reporting only the sales gap calls that a
   * win — which is the thing the cost cause exists to catch, so the sentence
   * at the top cannot go on ignoring it.
   */
  const marginGap = items.reduce((a, i) => a + i.margins.diff, 0);
  const costPenalty = items.reduce(
    (a, i) => a + Math.min(0, i.margins.costPenalty ?? 0),
    0,
  );

  const suggested = SUGGESTED[target.focus ?? ""] ?? [];

  /** Stepping walks the list the GRID is showing, not every item in the
   *  department: arrowing through "never ordered" should not wander out of
   *  it halfway down. */
  const at = capped.findIndex((r) => r.productCode === picked);
  const stepItem = (d: number) => {
    const next = capped[at + d];
    if (next) setPicked(next.productCode);
  };

  const close = () => dispatch(setInvestigation(null));

  /**
   * The bar's own content.
   *
   * Named for what each one IS rather than for the question it answers:
   * three questions in a row read as a quiz, and numbering them 1, 3 and 5
   * left two gaps nobody could account for. The conclusion beneath each name
   * is where the question gets answered.
   *
   * `answer` is a thunk because a tab that is still waiting must not
   * evaluate a conclusion it does not have yet.
   */
  const TABS = [
    {
      key: "holds" as const,
      title: "Check",
      needsAll: false,
      answer: () =>
        holds.verdict === "holds" ? "It holds" : "The items say otherwise",
    },
    {
      key: "items" as const,
      title: "Items",
      needsAll: true,
      answer: () => {
        const lead = summary.byCause.find((c) => c.cause !== "ahead" && c.dollars < 0);
        return lead
          ? `${CAUSE_LABEL[lead.cause]} · ${cash(Math.abs(lead.dollars))}`
          : "Nothing behind";
      },
    },
    {
      key: "act" as const,
      title: "Hand-off",
      needsAll: true,
      answer: () => {
        const owned = desks.filter((d) => d.actionable);
        return owned.length
          ? `${owned.length} ${owned.length === 1 ? "list" : "lists"} to hand out`
          : "Nothing to hand out";
      },
    },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-custom-white rounded-xl shadow-sm">

      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 bg-brand_navy">
        <button
          onClick={close}
          className="text-custom-white text-[12.5px] font-semibold hover:underline"
        >
          ‹ Back to the comparison
        </button>
        <span className="text-custom-white/85 text-[12.5px] truncate flex items-center gap-1.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-sm bg-store_open flex-shrink-0" />
          <span className="font-semibold text-custom-white">{target.storeName}</span>
          <span className="truncate">
            {" · "}{target.subDeptName}{" · "}week ending {twEnd}{" · against"}
          </span>
          <span className="w-2.5 h-2.5 rounded-sm bg-store_compare flex-shrink-0" />
          <span className="font-semibold text-custom-white">{target.compareStoreName}</span>
        </span>
        <button
          onClick={exportCsv}
          disabled={sorted.length === 0}
          title="Every filtered row, as a CSV"
          className="ml-auto flex-shrink-0 text-custom-white text-[12px] font-semibold px-2.5 py-1 rounded border border-custom-white/30 hover:bg-custom-white/10 disabled:opacity-40 transition-colors"
        >
          Export CSV
        </button>
        <span
          className={`flex-shrink-0 text-[13px] font-semibold px-2.5 py-1 rounded ${
            summary.gap < 0
              ? "bg-delta_negative_bg text-delta_negative_text"
              : "bg-delta_positive_bg text-delta_positive_text"
          }`}
        >
          {summary.gap >= 0 ? "+" : "−"}
          {fmt(Math.abs(summary.gap))}
        </span>
      </div>

      {/*
        The steps, as tabs.

        One scrolling page would put the hand-off below three hundred rows of
        grid, where only a shortcut reaches it. The three split on the WAVE
        boundary: the first needs sales alone and draws at once, the other
        two wait for orders and deliveries — so a tab that is not ready says
        what it is waiting for rather than showing a figure that will move.

        Each carries its own conclusion once it has one, so the bar is a
        summary of the whole notebook and not just a way to move around it.
      */}
      <div className="flex-shrink-0 grid grid-cols-3 border-b border-brand_navy/15">
        {TABS.map((t) => {
          const waiting = t.needsAll && stage !== "done" && stage !== "failed";
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-current={on}
              className={`text-left px-4 py-2 border-b-2 transition-colors min-w-0 ${
                on
                  ? "border-brand_navy bg-custom-white"
                  : "border-transparent hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-2">
                {/* Ready or not, without spending a numeral on it. */}
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    waiting
                      ? "border border-content/40"
                      : on
                        ? "bg-brand_navy"
                        : "bg-content/40"
                  }`}
                />
                <span className="text-[13.5px] font-bold text-content">
                  {t.title}
                </span>
              </span>
              <span
                className={`block text-[12px] mt-0.5 truncate ${
                  waiting ? "italic text-content/85" : "text-content/85"
                }`}
              >
                {waiting ? "Waiting on orders and deliveries" : t.answer()}
              </span>
            </button>
          );
        })}
      </div>


      {problem ? (
        <div className="flex-1 flex items-center justify-center px-6 text-center text-[13px] text-content/85">
          {problem}
        </div>
      ) : (
        <>
          {tab === "holds" && (
            <HoldsPanel
              holds={holds}
              spread={spread}
              summary={summary}
              them={target.compareStoreName}
              vitals={vitals}
              cash={cash}
              marginGap={marginGap}
              costPenalty={costPenalty}
              onPickItem={(code) => {
                setPicked(code);
                setTab("items");
              }}
              onVendor={(v) => {
                setVendorQ(v);
                setTab("items");
              }}
            />
          )}

          {tab === "act" && (
            <ActPanel
              desks={desks}
              cash={cash}
              onShow={(c) => {
                setOnly(c);
                setTab("items");
              }}
              onExport={exportDesk}
              onPickItem={(code) => {
                setPicked(code);
                setTab("items");
              }}
              waiting={stage !== "done" && stage !== "failed"}
            />
          )}

          {/* The grid stays MOUNTED behind `hidden` rather than being
              unmounted with the tab. Three hundred rows is too much to
              rebuild on every switch, and keeping it alive preserves the
              scroll position and the active filter — which matters, because
              step 5's "Show in grid" lands the reader in it.

              The Sales Export preview's grid: one real table, every cell
              ruled, mono at 11px, a sticky heading row and a sticky row
              number. Dense is the point — a department is hundreds of items
              and an airy list shows eight of them. */}
          <div
            hidden={tab !== "items"}
            className={tab === "items" ? "flex-1 min-h-0 flex flex-col overflow-hidden" : ""}
          >
          <div className="flex-shrink-0 px-4 py-2.5 border-b border-brand_navy/15">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setOnly(null)}
                className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border transition-shadow ${
                  only === null
                    ? "bg-filter_active border-filter_active_border text-content ring-2 ring-filter_active_border shadow-sm"
                    : "bg-custom-white border-brand_line text-content hover:bg-gray-50"
                }`}
              >
                All {items.length} items
              </button>
              {CAUSE_ORDER.filter((c) => byCause.has(c)).map((c) => {
                const t = byCause.get(c);
                return (
                  <button
                    key={c}
                    onClick={() => setOnly(only === c ? null : c)}
                    title={
                      suggested.includes(c)
                        ? `${CAUSE_OWNER[c]} — where this department's shape points`
                        : CAUSE_OWNER[c]
                    }
                    className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border transition-shadow ${
                      CAUSE_TONE[c].chip
                    } ${
                      suggested.includes(c)
                        ? "border-dashed border-content/40"
                        : "border-transparent"
                    } ${only === c ? `ring-2 shadow-sm ${CAUSE_TONE[c].ring}` : ""}`}
                  >
                    {CAUSE_LABEL[c]}
                    <span className="ml-1.5 font-normal tabular-nums">
                      {t?.items} · {fmt(Math.abs(t?.dollars ?? 0))}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* The windows do not line up, and the screen says so rather than
                letting the grid imply every column is diagnosed. */}
            <p className="text-[13px] text-content/85 mt-2.5">
              Causes explain this week against {target.compareStoreName}.
              Orders and deliveries are read over {SUPPLY_LOOKBACK_DAYS} days
              ({supply.start} to {supply.end}) — they cannot account for the
              LW or LY columns.
              {STAGE_NOTE[stage] && (
                <span className="ml-1.5 font-semibold">{STAGE_NOTE[stage]}</span>
              )}
            </p>
          </div>

          <div className="flex-1 min-h-0 flex overflow-hidden">
          <div className="flex-1 min-w-0 overflow-auto thin-scrollbar">
            <table className="border-collapse font-mono text-[11px] w-max">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 z-30 w-[44px] bg-bkg border-b border-brand_line_2 border-r border-brand_line px-2 py-1.5"></th>
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      style={{ minWidth: c.width }}
                      className={`sticky top-0 z-10 border-b border-brand_line_2 border-r border-brand_line px-2.5 py-1.5 text-left font-semibold whitespace-nowrap ${ruleOf(c)} ${tintOf(c) || "bg-custom-white"}`}
                    >
                      {c.filter ? (
                        <ColFilter
                          label={label(c, target)}
                          labelSize="text-[11px]"
                          active={filterActive(c.filter)}
                          onApply={() => applyFilter(c.filter as FilterKind)}
                          onClear={() => clearFilter(c.filter as FilterKind)}
                        >
                          {c.filter === "item" && (
                            <input
                              autoFocus
                              style={colInputStyle}
                              placeholder="Search item…"
                              value={itemDraft}
                              onChange={(e) => setItemDraft(e.target.value)}
                            />
                          )}
                          {c.filter === "upc" && (
                            <input
                              autoFocus
                              style={colInputStyle}
                              placeholder="Search UPC…"
                              value={upcDraft}
                              onChange={(e) => setUpcDraft(e.target.value)}
                            />
                          )}
                          {/* Vendor and cause are both closed sets, so they
                              are picked rather than typed — a vendor name is
                              not something anyone spells from memory. They
                              apply on change, since there is nothing to
                              finish typing. */}
                          {c.filter === "vendor" && (
                            <select
                              style={colInputStyle}
                              value={vendorQ}
                              onChange={(e) => setVendorQ(e.target.value)}
                            >
                              <option value="">Every vendor</option>
                              {vendors.map((v) => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                          )}
                          {c.filter === "cause" && (
                            <select
                              style={colInputStyle}
                              value={only ?? ""}
                              onChange={(e) =>
                                setOnly((e.target.value || null) as Cause | null)
                              }
                            >
                              <option value="">Every cause</option>
                              {CAUSE_ORDER.filter((x) => byCause.has(x)).map((x) => (
                                <option key={x} value={x}>{CAUSE_LABEL[x]}</option>
                              ))}
                            </select>
                          )}
                        </ColFilter>
                      ) : c.sort ? (
                        <SortHeader
                          col={c.sort}
                          label={label(c, target)}
                          sort={sort}
                          onSort={handleSort}
                          className="text-[11px] font-semibold uppercase tracking-wide text-content/85 hover:text-content"
                        />
                      ) : (
                        <span className="uppercase tracking-wide text-content/85">
                          {label(c, target)}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              {/* No zebra stripe: every cell is ruled, which is what
                  separates the rows here, and the sticky number column is
                  opaque white — a stripe would stop dead under it. */}
              <tbody>
                {capped.map((r, i) => (
                  <tr
                    key={r.productCode}
                    onClick={() =>
                      setPicked((p) => (p === r.productCode ? null : r.productCode))
                    }
                    className="cursor-pointer"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setCtx({ x: e.clientX, y: e.clientY, upc: r.productCode });
                    }}
                  >
                    {/* Selection shows on the gutter, not on the row: every
                        other cell paints its own background — the two store
                        tints especially — so a row-level fill would appear on
                        half the row and look broken. The house pair, where it
                        can be seen. */}
                    <td
                      className={`sticky left-0 z-10 border-r border-brand_line border-b border-brand_line px-2 py-1.5 text-right ${
                        picked === r.productCode
                          ? "bg-row_selected border-row_selected_border border-l-2 font-bold text-content"
                          : "bg-custom-white text-content/85"
                      }`}
                    >
                      {i + 1}
                    </td>
                    {COLUMNS.map((c) => (
                      <td
                        key={c.key}
                        className={`border-r border-b border-brand_line px-2.5 py-1.5 whitespace-nowrap ${c.right ? "text-right" : ""} ${tintOf(c)}`}
                      >
                        {c.render(r, fmt)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>

              {/* Sticky to the bottom of the scroller, so the totals are
                  readable from row 1 as well as row 300. Over the filtered
                  set — the count in the first cell says how many that is,
                  which is the number the cap can disagree with. */}
              {capped.length > 0 && (
                <tfoot>
                  <tr>
                    <td className="sticky bottom-0 left-0 z-30 bg-bkg border-t-2 border-t-brand_line_2 border-r border-brand_line px-2 py-1.5" />
                    {COLUMNS.map((c) => (
                      <td
                        key={c.key}
                        className={`sticky bottom-0 z-20 border-t-2 border-t-brand_line_2 border-r border-brand_line px-2.5 py-1.5 font-bold whitespace-nowrap ${
                          c.right ? "text-right" : ""
                        } ${tintOf(c) || "bg-bkg"}`}
                      >
                        {c.foot ? c.foot(shown, fmt) : null}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>

            {capped.length === 0 && stage !== "sales" && (
              <div className="px-4 py-8 text-center text-[12.5px] text-content/85">
                Nothing in this department to compare.
              </div>
            )}
          </div>

          {/*
            The rail moves instead of appearing.

            Clicking a row used to shove 520px of grid sideways in a single
            frame, which is a jolt in the one place the reader is trying to
            hold their position — the row they just clicked. The width is
            what animates; the contents keep their own 520px and are clipped,
            so nothing inside reflows on the way in or out.
          */}
          <div
            className={`flex-shrink-0 overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none ${
              pickedItem ? "w-[520px]" : "w-0"
            }`}
          >
           <div className="w-[520px] h-full">
            {evidence && target && (
            <ItemEvidence
              item={evidence}
              openStoreName={target.storeName}
              compareStoreName={target.compareStoreName}
              mineOrders={orders.mine}
              theirsOrders={orders.theirs}
              mineReceipts={receipts.mine}
              theirsReceipts={receipts.theirs}
              minePoints={sales?.minePoints ?? []}
              theirsPoints={sales?.theirsPoints ?? []}
              supplyReady={stage === "done"}
              position={{
                at: Math.max(0, at),
                of: capped.length,
                within: only ? CAUSE_LABEL[only] : null,
              }}
              onStep={stepItem}
              onClose={() => setPicked(null)}
            />
            )}
           </div>
          </div>
          </div>
          </div>

          <div
            hidden={tab !== "items"}
            className="flex-shrink-0 flex items-center gap-3 px-4 py-2 border-t border-brand_line bg-custom-white text-[13.5px] text-content/85"
          >
            <span>
              {shown.length > ROW_CAP ? (
                <>
                  Showing the {ROW_CAP} biggest differences of {shown.length}.
                  Narrow it with a heading filter — what is left out is the
                  tail, and nothing in it is larger than the last row here.
                </>
              ) : (
                <>
                  {shown.length} {shown.length === 1 ? "item" : "items"}
                  {filtered ? ` of ${items.length}` : ""} · ordered by the
                  biggest difference · click one for its evidence
                </>
              )}
            </span>
            {filtered && (
              <button
                onClick={clearAll}
                className="flex-shrink-0 font-semibold text-brand_navy_hover hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {ctx && (
            <UpcContextMenu
              x={ctx.x}
              y={ctx.y}
              upc={ctx.upc}
              allUpcs={shown.map((i) => i.productCode)}
              extraActions={copyActions}
              onClose={() => setCtx(null)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default DeptInvestigation;
