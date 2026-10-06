import { useMemo, useState, type ReactNode } from "react";
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
import type { Cause, ItemVerdict } from "../shared/deptInvestigation";
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import SortHeader from "../../../../components-dev/SortHeader";
import ColFilter from "../../../../components-dev/filters/ColFilterPopover";
import { colInputStyle } from "../../../../components-dev/filters/colFilterStyles";
import UpcContextMenu from "../../../../components-dev/UpcContextMenu";
import ItemEvidence from "./ItemEvidence";
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
  "not-moving": "merchandising",
  "price-mix": "same units, less money",
  ahead: "ours to keep",
  unclassified: "worth a look",
};

/** Severity for the two supply failures, which are ordered — a buyer's miss
 *  is worse and more fixable than a price difference. Neutral for the rest,
 *  and the delta tokens where a figure carries direction. */
const CAUSE_CLASS: Record<Cause, string> = {
  "never-ordered": "bg-severity_critical_bg text-severity_critical_text",
  "not-received": "bg-severity_watch_bg text-severity_watch_text",
  "not-moving": "bg-gray-100 text-content/85",
  "price-mix": "bg-gray-100 text-content/85",
  ahead: "bg-delta_positive_bg text-delta_positive_text",
  unclassified: "bg-gray-100 text-content/85",
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

const CAUSE_ORDER: Cause[] = [
  "never-ordered",
  "not-received",
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

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

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
  "units_ratio", "dollars_ratio", "price_ratio", "sell_through",
  "ordered_qty", "received_units",
];

const csvRow = (r: ItemVerdict) => [
  r.description, r.productCode, r.vendorName,
  CAUSE_LABEL[r.cause], CAUSE_OWNER[r.cause],
  r.mineTy, r.theirsTy, r.gap,
  r.mineLw, r.theirsLw, r.mineLy, r.theirsLy,
  r.mineUnits, r.theirsUnits,
  r.ratios.units, r.ratios.dollars, r.ratios.price, r.ratios.sellThrough,
  r.orderedQty, r.receivedUnits,
];

const COLUMNS: ColumnDef[] = [
  {
    key: "item", label: "Item", width: 250, filter: "item",
    render: (r) => <span className="font-semibold">{r.description}</span>,
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
        className={`inline-block px-1.5 py-0.5 rounded font-semibold ${CAUSE_CLASS[r.cause]}`}
        title={CAUSE_OWNER[r.cause]}
      >
        {CAUSE_LABEL[r.cause]}
      </span>
    ),
  },
  {
    key: "mineTy", of: "open", label: "{mine} TY", width: 92, right: true, sort: "mine",
    render: (r, fmt) => <span className="font-semibold">{fmt(r.mineTy)}</span>,
  },
  {
    key: "theirsTy", of: "compare", label: "{theirs} TY", width: 92, right: true, sort: "theirs",
    render: (r, fmt) => fmt(r.theirsTy),
  },
  {
    key: "gap", label: "Difference", width: 104, right: true, sort: "gap",
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
  { key: "mineLw", of: "open", label: "{mine} LW", width: 90, right: true, sort: "mineLw", render: (r, fmt) => fmt(r.mineLw) },
  { key: "theirsLw", of: "compare", label: "{theirs} LW", width: 90, right: true, sort: "theirsLw", render: (r, fmt) => fmt(r.theirsLw) },
  { key: "mineLy", of: "open", label: "{mine} LY", width: 90, right: true, sort: "mineLy", render: (r, fmt) => fmt(r.mineLy) },
  { key: "theirsLy", of: "compare", label: "{theirs} LY", width: 90, right: true, sort: "theirsLy", render: (r, fmt) => fmt(r.theirsLy) },
  {
    key: "mineUnits", of: "open", label: "{mine} units", width: 88, right: true, sort: "mineUnits",
    render: (r) => r.mineUnits.toLocaleString("en-US"),
  },
  {
    key: "theirsUnits", of: "compare", label: "{theirs} units", width: 88, right: true, sort: "theirsUnits",
    render: (r) => r.theirsUnits.toLocaleString("en-US"),
  },
  {
    // Units and dollars moving apart is what names a price problem, so the
    // realised-price ratio earns a column of its own.
    key: "price", label: "Price vs", width: 82, right: true, sort: "price",
    render: (r) => mult(r.ratios.price),
  },
  {
    key: "ordered", label: "Ordered", width: 78, right: true, sort: "ordered",
    render: (r) =>
      r.orderedQty > 0 ? r.orderedQty.toLocaleString("en-US") : <span className="text-content/85">none</span>,
  },
  {
    key: "received", label: "Received", width: 84, right: true, sort: "received",
    render: (r) =>
      r.receivedUnits > 0 ? r.receivedUnits.toLocaleString("en-US") : <span className="text-content/85">none</span>,
  },
  {
    key: "sellThrough", label: "Sell-thru", width: 84, right: true, sort: "sellThrough",
    render: (r) => pct(r.ratios.sellThrough),
  },
];

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
  const worst = CAUSE_ORDER.filter(
    (c) => c !== "ahead" && (byCause.get(c)?.dollars ?? 0) < 0,
  ).slice(0, 3);

  const close = () => dispatch(setInvestigation(null));

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

      {/* The headline is a sentence, not a dashboard. Each bucket goes to a
          different person, which is the only reason to separate them. */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-brand_navy/15">
        {stage !== "failed" && worst.length > 0 && (
          <p className="text-[13.5px] text-content leading-relaxed mb-2.5">
            Of the {fmt(Math.abs(summary.gap))} gap,{" "}
            {worst.map((c, i) => (
              <span key={c}>
                {i > 0 && (i === worst.length - 1 ? " and " : ", ")}
                <span className="font-semibold">
                  {fmt(Math.abs(byCause.get(c)?.dollars ?? 0))}
                </span>{" "}
                {c === "never-ordered"
                  ? "never got ordered"
                  : c === "not-received"
                    ? "was ordered and never arrived"
                    : c === "not-moving"
                      ? "is on the shelf not moving"
                      : c === "price-mix"
                        ? "is price, not volume"
                        : "has no cause yet"}
              </span>
            ))}
            .
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setOnly(null)}
            className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
              only === null
                ? "bg-filter_active border-filter_active_border text-content"
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
                title={CAUSE_OWNER[c]}
                className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  only === c
                    ? "bg-filter_active border-filter_active_border text-content"
                    : "bg-custom-white border-brand_line text-content hover:bg-gray-50"
                }`}
              >
                {CAUSE_LABEL[c]}
                <span className="ml-1.5 text-content/85">
                  {t?.items} · {fmt(Math.abs(t?.dollars ?? 0))}
                </span>
              </button>
            );
          })}
        </div>

        {/* The windows do not line up, and the screen says so rather than
            letting the grid imply every column is diagnosed. */}
        <p className="text-[11px] text-content/85 mt-2.5">
          Causes explain this week against {target.compareStoreName}. Orders and
          deliveries are read over {SUPPLY_LOOKBACK_DAYS} days
          ({supply.start} to {supply.end}) — they cannot account for the LW or
          LY columns.
          {STAGE_NOTE[stage] && (
            <span className="ml-1.5 font-semibold">{STAGE_NOTE[stage]}</span>
          )}
        </p>
      </div>

      {problem ? (
        <div className="flex-1 flex items-center justify-center px-6 text-center text-[13px] text-content/85">
          {problem}
        </div>
      ) : (
        <>
          {/* The Sales Export preview's grid, which is this app's language for
              a lot of columns at once: one real table, every cell ruled, mono
              at 11px, a sticky heading row and a sticky row number. Dense is
              the point — a department is hundreds of items and an airy list
              shows eight of them. */}
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
            </table>

            {capped.length === 0 && stage !== "sales" && (
              <div className="px-4 py-8 text-center text-[12.5px] text-content/85">
                Nothing in this department to compare.
              </div>
            )}
          </div>

          {pickedItem && target && (
            <ItemEvidence
              item={pickedItem}
              openStoreNumber={target.storeNumber}
              compareStoreNumber={target.compareStoreNumber}
              mineOrders={orders.mine}
              theirsOrders={orders.theirs}
              mineReceipts={receipts.mine}
              theirsReceipts={receipts.theirs}
              minePoints={sales?.minePoints ?? []}
              theirsPoints={sales?.theirsPoints ?? []}
              supplyReady={stage === "done"}
              onClose={() => setPicked(null)}
            />
          )}
          </div>

          <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 border-t border-brand_line bg-custom-white text-[11.5px] text-content/85">
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
