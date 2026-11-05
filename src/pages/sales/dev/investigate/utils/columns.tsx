// Utils
import { formatCurrency2 } from "../../../../../utils";
import { CAUSE_LABEL, CAUSE_OWNER, CAUSE_TONE } from "./deptInvestigation";
import { cash } from ".";

// Interfaces
import type { ItemVerdict, Col, FilterKind } from "../interfaces";
import type { ReactNode } from "react";
import type { InvestigationTarget } from "../../../../../features/dev/devSalesLedgerSlice";

/* ------------------------------------------------------------------ */
/* The columns                                                         */
/* ------------------------------------------------------------------ */

type Fmt = (v: number) => string;

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
export const tintOf = (c: ColumnDef) =>
  c.of === "open"
    ? "bg-store_open_tint"
    : c.of === "compare"
      ? "bg-store_compare_tint"
      : "";

export const ruleOf = (c: ColumnDef) =>
  c.of === "open"
    ? "border-t-2 border-t-store_open"
    : c.of === "compare"
      ? "border-t-2 border-t-store_compare"
      : "border-t-2 border-t-transparent";

export const label = (c: ColumnDef, t: InvestigationTarget) =>
  c.label
    .replace("{mine}", t.storeNumber)
    .replace("{theirs}", t.compareStoreNumber);

/** A ratio reads as a multiple, which is how somebody says it out loud —
 *  "we did two fifths of their units". Null stays a dash: there is no ratio
 *  to a store that sold none, and 0 would read as a result. */
const mult = (v: number | null) => (v === null ? "—" : `${v.toFixed(2)}×`);

const pct = (v: number | null) =>
  v === null ? "—" : `${Math.round(v * 100)}%`;

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
        {v >= 0 ? "+" : "−"}
        {show(Math.abs(v))}
      </span>
    );
  };

const signed = (pick: (r: ItemVerdict) => number | null) => signedWith(pick);
/** The money columns, which do not follow the page's metric. */
const signedCash = (pick: (r: ItemVerdict) => number | null) =>
  signedWith(pick, (v) => formatCurrency2(v));

/** A count, which is a count whichever metric the page is in. */
const counted = (pick: (r: ItemVerdict) => number) => (rows: ItemVerdict[]) =>
  sum(rows, pick).toLocaleString("en-US");

export const sortValue = (r: ItemVerdict, col: Col): number | null => {
  switch (col) {
    case "mine":
      return r.mineTy;
    case "theirs":
      return r.theirsTy;
    case "gap":
      return r.gap;
    case "mineLw":
      return r.mineLw;
    case "theirsLw":
      return r.theirsLw;
    case "mineLy":
      return r.mineLy;
    case "theirsLy":
      return r.theirsLy;
    case "mineUnits":
      return r.mineUnits;
    case "theirsUnits":
      return r.theirsUnits;
    case "mineCost":
      return r.margins.minePerUnit;
    case "theirsCost":
      return r.margins.theirsPerUnit;
    case "costPenalty":
      return r.margins.costPenalty;
    case "marginDiff":
      return r.margins.diff;
    case "price":
      return r.ratios.price;
    case "sellThrough":
      return r.ratios.sellThrough;
    case "ordered":
      return r.orderedQty;
    case "received":
      return r.receivedUnits;
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
export const CSV_HEADERS = [
  "item",
  "upc",
  "vendor",
  "cause",
  "cause_owner",
  "mine_ty",
  "theirs_ty",
  "difference",
  "mine_lw",
  "theirs_lw",
  "mine_ly",
  "theirs_ly",
  "mine_units",
  "theirs_units",
  "mine_cogs",
  "theirs_cogs",
  "mine_cost_per_unit",
  "theirs_cost_per_unit",
  "cost_gap",
  "mine_margin",
  "theirs_margin",
  "margin_dollar_gap",
  "units_ratio",
  "dollars_ratio",
  "price_ratio",
  "sell_through",
  "ordered_qty",
  "received_units",
];

export const csvRow = (r: ItemVerdict) => [
  r.description,
  r.productCode,
  r.vendorName,
  CAUSE_LABEL[r.cause],
  CAUSE_OWNER[r.cause],
  r.mineTy,
  r.theirsTy,
  r.gap,
  r.mineLw,
  r.theirsLw,
  r.mineLy,
  r.theirsLy,
  r.mineUnits,
  r.theirsUnits,
  r.mineCogs,
  r.theirsCogs,
  r.margins.minePerUnit,
  r.margins.theirsPerUnit,
  r.margins.costPenalty,
  r.margins.mine,
  r.margins.theirs,
  r.margins.diff,
  r.ratios.units,
  r.ratios.dollars,
  r.ratios.price,
  r.ratios.sellThrough,
  r.orderedQty,
  r.receivedUnits,
];

export const COLUMNS: ColumnDef[] = [
  {
    key: "item",
    label: "Item",
    width: 250,
    filter: "item",
    render: (r) => <span className="font-semibold">{r.description}</span>,
    foot: (rows) => (
      <span className="uppercase tracking-wide">
        Totals · {rows.length.toLocaleString("en-US")}{" "}
        {rows.length === 1 ? "item" : "items"}
      </span>
    ),
  },
  {
    key: "upc",
    label: "UPC",
    width: 120,
    filter: "upc",
    render: (r) => r.productCode,
  },
  {
    key: "vendor",
    label: "Vendor",
    width: 150,
    filter: "vendor",
    render: (r) => r.vendorName || <span className="text-content/85">—</span>,
  },
  {
    key: "cause",
    label: "Cause",
    width: 118,
    filter: "cause",
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
    key: "mineTy",
    of: "open",
    label: "{mine} TY",
    width: 92,
    right: true,
    sort: "mine",
    foot: money((r) => r.mineTy),
    render: (r, fmt) => <span className="font-semibold">{fmt(r.mineTy)}</span>,
  },
  {
    key: "theirsTy",
    of: "compare",
    label: "{theirs} TY",
    width: 92,
    right: true,
    sort: "theirs",
    foot: money((r) => r.theirsTy),
    render: (r, fmt) => fmt(r.theirsTy),
  },
  {
    key: "marginDiff",
    // Dollars between the two stores, not a margin rate: "diff" read as a
    // percentage.
    label: "Margin $ Gap",
    width: 104,
    right: true,
    sort: "marginDiff",
    foot: signedCash((r) => r.margins.diff),
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
        {r.margins.diff >= 0 ? "+" : "−"}
        {cash(Math.abs(r.margins.diff))}
      </span>
    ),
  },
  {
    key: "gap",
    label: "Difference",
    width: 104,
    right: true,
    sort: "gap",
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
        {r.gap >= 0 ? "+" : "−"}
        {fmt(Math.abs(r.gap))}
      </span>
    ),
  },
  {
    key: "mineLw",
    of: "open",
    label: "{mine} LW",
    width: 90,
    right: true,
    sort: "mineLw",
    render: (r, fmt) => fmt(r.mineLw),
    foot: money((r) => r.mineLw),
  },
  {
    key: "theirsLw",
    of: "compare",
    label: "{theirs} LW",
    width: 90,
    right: true,
    sort: "theirsLw",
    render: (r, fmt) => fmt(r.theirsLw),
    foot: money((r) => r.theirsLw),
  },
  {
    key: "mineLy",
    of: "open",
    label: "{mine} LY",
    width: 90,
    right: true,
    sort: "mineLy",
    render: (r, fmt) => fmt(r.mineLy),
    foot: money((r) => r.mineLy),
  },
  {
    key: "theirsLy",
    of: "compare",
    label: "{theirs} LY",
    width: 90,
    right: true,
    sort: "theirsLy",
    render: (r, fmt) => fmt(r.theirsLy),
    foot: money((r) => r.theirsLy),
  },
  {
    key: "mineUnits",
    of: "open",
    label: "{mine} units",
    width: 88,
    right: true,
    sort: "mineUnits",
    render: (r) => r.mineUnits.toLocaleString("en-US"),
    foot: counted((r) => r.mineUnits),
  },
  {
    key: "theirsUnits",
    of: "compare",
    label: "{theirs} units",
    width: 88,
    right: true,
    sort: "theirsUnits",
    render: (r) => r.theirsUnits.toLocaleString("en-US"),
    foot: counted((r) => r.theirsUnits),
  },
  {
    key: "mineCost",
    of: "open",
    label: "{mine} cost/u",
    width: 92,
    right: true,
    sort: "mineCost",
    render: (r) =>
      r.margins.minePerUnit === null ? "—" : cash(r.margins.minePerUnit),
  },
  {
    key: "theirsCost",
    of: "compare",
    label: "{theirs} cost/u",
    width: 92,
    right: true,
    sort: "theirsCost",
    render: (r) =>
      r.margins.theirsPerUnit === null ? "—" : cash(r.margins.theirsPerUnit),
  },
  {
    // What the per-unit difference took on the units WE sold. Money, not a
    // ratio: "$112 on 488 units" is the sentence somebody acts on.
    key: "costPenalty",
    label: "Cost gap",
    width: 98,
    right: true,
    sort: "costPenalty",
    foot: signedCash((r) => r.margins.costPenalty),
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
          {v >= 0 ? "+" : "−"}
          {cash(Math.abs(v))}
        </span>
      );
    },
  },
  {
    // Units and dollars moving apart is what names a price problem, so the
    // realised-price ratio earns a column of its own.
    key: "price",
    label: "Price vs",
    width: 82,
    right: true,
    sort: "price",
    render: (r) => mult(r.ratios.price),
  },
  {
    key: "ordered",
    label: "Ordered",
    width: 78,
    right: true,
    sort: "ordered",
    foot: counted((r) => r.orderedQty),
    render: (r) =>
      r.orderedQty > 0 ? (
        r.orderedQty.toLocaleString("en-US")
      ) : (
        <span className="text-content/85">none</span>
      ),
  },
  {
    key: "received",
    label: "Received",
    width: 84,
    right: true,
    sort: "received",
    foot: counted((r) => r.receivedUnits),
    render: (r) =>
      r.receivedUnits > 0 ? (
        r.receivedUnits.toLocaleString("en-US")
      ) : (
        <span className="text-content/85">none</span>
      ),
  },
  {
    key: "sellThrough",
    label: "Sell-thru",
    width: 84,
    right: true,
    sort: "sellThrough",
    render: (r) => pct(r.ratios.sellThrough),
  },
];
