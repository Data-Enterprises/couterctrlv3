// Utils
import { formatCurrency2 } from "../../../../../utils";
import { CAUSE_LABEL, CAUSE_OWNER } from "./deptInvestigation";
import { cash } from ".";

// Interfaces
import type { ColumnDef, Col, Fmt, GridCell, ItemVerdict } from "../interfaces";
import type { InvestigationTarget } from "../../../../../features/dev/devSalesLedgerSlice";

/* ------------------------------------------------------------------ */
/* The columns                                                         */
/* ------------------------------------------------------------------ */

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

/** A plain figure, as the cell or total shows it. */
const text = (t: string, look?: "bold" | "muted" | "caps"): GridCell => ({
  kind: "text",
  text: t,
  look,
});

/** A plain total, in whatever the page's metric is. */
const money =
  (pick: (r: ItemVerdict) => number | null) =>
  (rows: ItemVerdict[], fmt: Fmt) =>
    text(fmt(sum(rows, pick)));

/** A total that carries direction, in the same pill its column's cells use. */
const signedWith =
  (pick: (r: ItemVerdict) => number | null, force?: Fmt) =>
  (rows: ItemVerdict[], fmt: Fmt): GridCell => {
    const v = sum(rows, pick);
    const show = force ?? fmt;
    return { kind: "signedTotal", value: v, text: show(Math.abs(v)) };
  };

const signed = (pick: (r: ItemVerdict) => number | null) => signedWith(pick);
/** The money columns, which do not follow the page's metric. */
const signedCash = (pick: (r: ItemVerdict) => number | null) =>
  signedWith(pick, (v) => formatCurrency2(v));

/** A count, which is a count whichever metric the page is in. */
const counted = (pick: (r: ItemVerdict) => number) => (rows: ItemVerdict[]) =>
  text(sum(rows, pick).toLocaleString("en-US"));

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
    render: (r) => text(r.description, "bold"),
    foot: (rows) =>
      text(
        `Totals · ${rows.length.toLocaleString("en-US")} ${rows.length === 1 ? "item" : "items"}`,
        "caps",
      ),
  },
  {
    key: "upc",
    label: "UPC",
    width: 120,
    filter: "upc",
    render: (r) => text(r.productCode),
  },
  {
    key: "vendor",
    label: "Vendor",
    width: 150,
    filter: "vendor",
    render: (r) => (r.vendorName ? text(r.vendorName) : text("—", "muted")),
  },
  {
    key: "cause",
    label: "Cause",
    width: 118,
    filter: "cause",
    render: (r) => ({ kind: "cause", cause: r.cause }),
  },
  {
    key: "mineTy",
    of: "open",
    label: "{mine} TY",
    width: 92,
    right: true,
    sort: "mine",
    foot: money((r) => r.mineTy),
    render: (r, fmt) => text(fmt(r.mineTy), "bold"),
  },
  {
    key: "theirsTy",
    of: "compare",
    label: "{theirs} TY",
    width: 92,
    right: true,
    sort: "theirs",
    foot: money((r) => r.theirsTy),
    render: (r, fmt) => text(fmt(r.theirsTy)),
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
    render: (r) => ({
      kind: "signed",
      value: r.margins.diff,
      text: cash(Math.abs(r.margins.diff)),
    }),
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
    render: (r, fmt) => ({
      kind: "signed",
      value: r.gap,
      text: fmt(Math.abs(r.gap)),
    }),
  },
  {
    key: "mineLw",
    of: "open",
    label: "{mine} LW",
    width: 90,
    right: true,
    sort: "mineLw",
    render: (r, fmt) => text(fmt(r.mineLw)),
    foot: money((r) => r.mineLw),
  },
  {
    key: "theirsLw",
    of: "compare",
    label: "{theirs} LW",
    width: 90,
    right: true,
    sort: "theirsLw",
    render: (r, fmt) => text(fmt(r.theirsLw)),
    foot: money((r) => r.theirsLw),
  },
  {
    key: "mineLy",
    of: "open",
    label: "{mine} LY",
    width: 90,
    right: true,
    sort: "mineLy",
    render: (r, fmt) => text(fmt(r.mineLy)),
    foot: money((r) => r.mineLy),
  },
  {
    key: "theirsLy",
    of: "compare",
    label: "{theirs} LY",
    width: 90,
    right: true,
    sort: "theirsLy",
    render: (r, fmt) => text(fmt(r.theirsLy)),
    foot: money((r) => r.theirsLy),
  },
  {
    key: "mineUnits",
    of: "open",
    label: "{mine} units",
    width: 88,
    right: true,
    sort: "mineUnits",
    render: (r) => text(r.mineUnits.toLocaleString("en-US")),
    foot: counted((r) => r.mineUnits),
  },
  {
    key: "theirsUnits",
    of: "compare",
    label: "{theirs} units",
    width: 88,
    right: true,
    sort: "theirsUnits",
    render: (r) => text(r.theirsUnits.toLocaleString("en-US")),
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
      text(r.margins.minePerUnit === null ? "—" : cash(r.margins.minePerUnit)),
  },
  {
    key: "theirsCost",
    of: "compare",
    label: "{theirs} cost/u",
    width: 92,
    right: true,
    sort: "theirsCost",
    render: (r) =>
      text(
        r.margins.theirsPerUnit === null ? "—" : cash(r.margins.theirsPerUnit),
      ),
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
      if (v === null || Math.abs(v) < 0.005) return text("—");
      return { kind: "signed", value: v, text: cash(Math.abs(v)) };
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
    render: (r) => text(mult(r.ratios.price)),
  },
  {
    key: "ordered",
    label: "Ordered",
    width: 78,
    right: true,
    sort: "ordered",
    foot: counted((r) => r.orderedQty),
    render: (r) =>
      r.orderedQty > 0
        ? text(r.orderedQty.toLocaleString("en-US"))
        : text("none", "muted"),
  },
  {
    key: "received",
    label: "Received",
    width: 84,
    right: true,
    sort: "received",
    foot: counted((r) => r.receivedUnits),
    render: (r) =>
      r.receivedUnits > 0
        ? text(r.receivedUnits.toLocaleString("en-US"))
        : text("none", "muted"),
  },
  {
    key: "sellThrough",
    label: "Sell-thru",
    width: 84,
    right: true,
    sort: "sellThrough",
    render: (r) => text(pct(r.ratios.sellThrough)),
  },
];
