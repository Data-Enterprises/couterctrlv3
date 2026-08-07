import { Fragment, useMemo, useState } from "react";
import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import {
  setSelectedUpc,
  setBatchAdDaysRows,
  setBatchPriceRows,
  setBatchNotesRows,
  toggleTierFilter,
  clearTierFilter,
  resetRowValues,
} from "../../../features/forecastDevSlice";
import type { ForecastOutlierRow } from "../../../features/forecastSlice";
import { formatCurrency2 } from "../../../utils";
import { useTriStateSort } from "../../../utils/useTriStateSort";
import SortHeader, { PERF_SORT_HEADER } from "../../../components/SortHeader";
import ColFilter from "../../upc/dev/components/ColFilter";
import { colFilterInputStyle } from "../../upc/dev/components/colFilterInputStyle";
import {
  rankRows,
  tierCounts,
  tierSummary,
  exceptionsFor,
  EXCEPTION_LABEL,
  TIER_LABEL,
  TIER_STRIPE,
  TIER_CHIP_ON_NAVY,
  TIER_CHIP_BASE,
  TIER_CHIP_ON,
  type Tier,
} from "./forecastRanking";

/**
 * The forecast grid.
 *
 * Rows are a CSS grid on a shared column template, the same construction
 * `AssociationItemsTable` uses — sticky uppercase header, `even:bg-row_stripe`,
 * `border-[#1e2a4a]/15` rules. No table element and no grid library: the rows
 * are a flat list with one tri-state sort, which `useTriStateSort` already
 * does for every other Performance list.
 *
 * Detail lives in the calculator popup on double-click, so there are no tabs
 * and no expanding rows here. Notes are set two ways: in bulk from the toolbar
 * across every ticked row, or per item in that popup.
 */

/** Item | notes | qty | active | at price | forecast | ad days | price | fcst | total | share | markdown */
const COLS = "1fr 109px 66px 58px 58px 62px 58px 64px 58px 80px 50px 80px";

const HEAD =
  "sticky top-0 z-10 bg-custom-white grid items-center gap-2.5 px-2 py-1.5 border-b border-[#1e2a4a]/15";

type SortCol =
  "qtySold" | "adFcst" | "fcstTotal" | "markdownDollars" | "fcstPrice";

const sortValue = (row: ForecastOutlierRow, col: SortCol) => row[col];

/** One list drives the header row so every cell — sortable or not — is built
 *  from the same class, in the same order as the row beneath it. */
const HEAD_CELLS: { col?: SortCol; label: string }[] = [
  { label: "Item" },
  { label: "Notes" },
  { col: "qtySold", label: "Qty sold" },
  { label: "Active" },
  { label: "At price" },
  { label: "Forecast" },
  { label: "Ad days" },
  { col: "fcstPrice", label: "Price" },
  { col: "adFcst", label: "Ad fcst" },
  { col: "fcstTotal", label: "Total" },
  { label: "Share" },
  { col: "markdownDollars", label: "Markdown" },
];

const ForecastRowsTable = ({
  onExportClick,
}: {
  onExportClick: () => void;
}) => {
  const dispatch = useAppDispatch();
  const {
    rowData,
    checkedUpcs,
    isLoadingMore,
    notFoundUpcs,
    adListRows,
    forecastResults,
    tierFilter,
    initialRowData,
  } = useAppSelector((s) => s.forecastDev);
  const singleDate = useAppSelector((s) => s.search.singleDate);

  const [batchAdDays, setBatchAdDays] = useState("");
  const [batchPrice, setBatchPrice] = useState("");
  const [batchNotes, setBatchNotes] = useState("");
  const [notFoundOpen, setNotFoundOpen] = useState(false);
  const [draftUpc, setDraftUpc] = useState("");
  const [appliedUpc, setAppliedUpc] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [appliedDesc, setAppliedDesc] = useState("");
  /** Collapsed bands are pure presentation, so they stay local. */
  const [collapsed, setCollapsed] = useState<Set<Tier>>(() => new Set());
  const { sort, handleSort, applySort } = useTriStateSort<SortCol>();

  /** The item panel decides what this covers — the grid never filters itself. */
  const rows = useMemo(
    () => rowData.filter((r) => checkedUpcs.includes(r.upc)),
    [rowData, checkedUpcs],
  );
  /** Ranked across the whole selection, not the tier-filtered view — so a
   *  share doesn't change meaning the moment you click a chip. */
  const ranks = useMemo(() => rankRows(rows), [rows]);
  const counts = useMemo(() => tierCounts(ranks), [ranks]);
  const summary = useMemo(() => tierSummary(ranks), [ranks]);

  /** Empty selection means every tier — the chips are additive, not exclusive. */
  const visible = useMemo(
    () =>
      tierFilter.length === 0
        ? rows
        : rows.filter((r) => {
            const tier = ranks.get(r.upc)?.tier;
            return tier ? tierFilter.includes(tier) : false;
          }),
    [rows, ranks, tierFilter],
  );

  /** Column filters narrow what the tier chips left. Ranks are untouched, so a
   *  share still means share-of-the-whole-selection while you're searching. */
  const searched = useMemo(() => {
    if (!appliedUpc && !appliedDesc) return visible;
    const u = appliedUpc.toLowerCase();
    const d = appliedDesc.toLowerCase();
    return visible.filter(
      (r) =>
        (!u || r.upc.toLowerCase().includes(u)) &&
        (!d || r.description.toLowerCase().includes(d)),
    );
  }, [visible, appliedUpc, appliedDesc]);

  /** Contribution order is the default: biggest first, because on a list of any
   *  size the top handful IS the ad. A user sort replaces it entirely. */
  const sorted = useMemo(
    () =>
      sort
        ? applySort(searched, sortValue)
        : [...searched].sort((a, b) => b.fcstTotal - a.fcstTotal),
    [searched, sort],
  );

  /**
   * The row that opens each tier band. Bands only make sense while the list is
   * in contribution order — a user sort scatters the tiers, and a tier filter
   * means the chip is already saying which band you're in.
   */
  const bandStarts = useMemo(() => {
    if (sort) return new Map<string, Tier>();
    const out = new Map<string, Tier>();
    const seen = new Set<Tier>();
    for (const row of sorted) {
      const tier = ranks.get(row.upc)?.tier;
      if (!tier || seen.has(tier)) continue;
      seen.add(tier);
      out.set(row.upc, tier);
    }
    return out;
  }, [sorted, ranks, sort]);

  const coverage = useMemo(() => {
    const aRows = rows.filter((r) => ranks.get(r.upc)?.tier === "A");
    const share = aRows.reduce(
      (sum, r) => sum + (ranks.get(r.upc)?.share ?? 0),
      0,
    );
    return { count: aRows.length, share };
  }, [rows, ranks]);

  /**
   * UPCs whose applied price was typed rather than drawn from history.
   *
   * Both Qty sold and At price are meaningless for those rows and worse than
   * blank: applying a custom price sets `qtySold` to 0 — which reads as "sold
   * none" when it means "never sold at this price" — and `daysAtPrice` to an
   * estimate. The figures still drive the forecast; they just stop being
   * reported as history.
   */
  const customPriced = useMemo(() => {
    const set = new Set<string>();
    for (const row of rowData) {
      const hist = forecastResults.find((r) => r.upc === row.upc);
      if (!hist) continue;
      const known = hist.price_history.some(
        (ph) => Math.abs(parseFloat(ph.price) - row.fcstPrice) < 0.001,
      );
      if (!known) set.add(row.upc);
    }
    return set;
  }, [rowData, forecastResults]);

  const hasNotes = useMemo(
    () => searched.some((r) => (r.notes ?? "").trim() !== ""),
    [searched],
  );

  /** Reset only means something once something has been changed. Compared on
   *  the two fields the toolbar writes, so a note doesn't light it up. */
  const isEdited = useMemo(
    () =>
      searched.some((row) => {
        const original = initialRowData.find((r) => r.upc === row.upc);
        if (!original) return false;
        return (
          original.fcstPrice !== row.fcstPrice || original.adDays !== row.adDays
        );
      }),
    [searched, initialRowData],
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          units: acc.units + r.adFcst,
          total: acc.total + r.fcstTotal,
          markdown: acc.markdown + Math.max(0, r.markdownDollars),
        }),
        { units: 0, total: 0, markdown: 0 },
      ),
    [rows],
  );

  /**
   * Writes to the rows actually on screen — after the tier chips and the column
   * filters, not the whole ticked selection. Filtering to Tail and hitting
   * Apply has to mean "these ones", or the filters would be a lie.
   *
   * Single-price rows are excluded from price and ad days, as in legacy: one
   * price point can't be refitted to a new one.
   */
  const handleSetBatch = () => {
    const upcs = searched.filter((r) => !r.singlePrice).map((r) => r.upc);
    if (!upcs.length) return;
    const days = parseInt(batchAdDays);
    const price = parseFloat(batchPrice);
    if (!isNaN(days) && days > 0)
      dispatch(setBatchAdDaysRows({ upcs, adDays: days }));
    if (!isNaN(price) && price > 0)
      dispatch(setBatchPriceRows({ upcs, price }));
    // Notes go to every ticked row, single-price included — see the reducer.
    if (batchNotes.trim())
      dispatch(
        setBatchNotesRows({
          upcs: searched.map((r) => r.upc),
          notes: batchNotes.trim(),
        }),
      );
  };

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="bg-custom-white rounded-xl overflow-hidden flex flex-col h-full">
        {/* 1-row navy header */}
        <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between bg-[#1e2a4a]">
          <div className="text-[13px] font-semibold text-custom-white leading-tight">
            Last 90 days ending {singleDate}
          </div>
          <button
            className="text-custom-white transition-colors"
            onClick={onExportClick}
            title="Export"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-4 divide-x divide-[#1e2a4a]/15 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          {[
            ["Items", String(rows.length)],
            ["Ad fcst units", totals.units.toLocaleString()],
            ["Fcst total", formatCurrency2(totals.total)],
            ["Markdown", formatCurrency2(totals.markdown)],
          ].map(([label, value]) => (
            <div key={label} className="px-4 pt-2.5 pb-2.5 text-center min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wide text-content">
                {label}
              </div>
              <div className="text-[13px] font-bold text-content truncate">
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Contribution tiers. Not a grade — A items are simply the ones the
            ad's numbers rest on. The coverage line is the point of the whole
            thing on a list of any real size. */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-custom-white border-b border-gray-100 flex-shrink-0">
          {(
            [
              ["A", counts.A],
              ["B", counts.B],
              ["C", counts.C],
            ] as const
          ).map(([tier, n]) => {
            const on = tierFilter.includes(tier);
            return (
              <button
                key={tier}
                onClick={() => dispatch(toggleTierFilter(tier))}
                title={
                  tier === "A"
                    ? "Together the first 80% of the forecast"
                    : tier === "B"
                      ? "The next 15%"
                      : "The tail — the last 5%"
                }
                className={`text-[12px] font-semibold px-2 py-1 rounded-full transition-shadow ${
                  TIER_CHIP_BASE[tier]
                } ${on ? TIER_CHIP_ON[tier] : ""}`}
              >
                {TIER_LABEL[tier]} ({n})
              </button>
            );
          })}
          {tierFilter.length > 0 && (
            <button
              onClick={() => dispatch(clearTierFilter())}
              className="text-[11px] font-medium text-[#1e2a4a] hover:underline px-1"
            >
              Clear
            </button>
          )}
          <span className="ml-auto text-[11px] text-content/85">
            {coverage.count} item{coverage.count === 1 ? "" : "s"} ={" "}
            {(coverage.share * 100).toFixed(0)}% of the forecast
          </span>
        </div>

        {/* batch setter — writes to every ticked row, so the count is named */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-content/85">
            Set for {searched.length}
            {searched.length === rows.length ? " selected" : " shown"}
          </span>
          <input
            type="number"
            min={1}
            step={1}
            max={7}
            placeholder="Ad days"
            value={batchAdDays}
            onChange={(e) => setBatchAdDays(e.target.value)}
            className="text-[11px] rounded px-2 py-1 border border-gray-200 bg-custom-white w-20"
            style={{ outline: "none", boxShadow: "none" }}
          />
          <input
            type="number"
            min={0.01}
            step={0.01}
            placeholder="Price"
            value={batchPrice}
            onChange={(e) => setBatchPrice(e.target.value)}
            className="text-[11px] rounded px-2 py-1 border border-gray-200 bg-custom-white w-20"
            style={{ outline: "none", boxShadow: "none" }}
          />
          <input
            type="text"
            placeholder="Note"
            value={batchNotes}
            onChange={(e) => setBatchNotes(e.target.value)}
            className="text-[11px] rounded px-2 py-1 border border-gray-200 bg-custom-white w-32"
            style={{ outline: "none", boxShadow: "none" }}
          />
          <button
            onClick={handleSetBatch}
            disabled={
              !searched.length ||
              (!batchAdDays && !batchPrice && !batchNotes.trim())
            }
            className="text-[11px] font-semibold px-2.5 py-1 rounded bg-[#1e2a4a] text-custom-white hover:bg-[#2a3a63] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Apply
          </button>
          {/* Undoes price and ad days on the same rows Apply writes to, back to
              what the search returned. Notes survive it — see the reducer. */}
          <button
            onClick={() => {
              dispatch(resetRowValues(searched.map((r) => r.upc)));
              setBatchAdDays("");
              setBatchPrice("");
            }}
            disabled={!isEdited}
            title="Put price and ad days back to what the search returned"
            className="text-[11px] font-semibold px-2.5 py-1 rounded border border-gray-200 text-content hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          {/* Notes are deliberately outside Reset — authored text shouldn't
              disappear as a side effect of undoing a price. Clearing them is
              its own action, and the batch field can't do it (an empty note
              submits nothing, by design). */}
          <button
            onClick={() => {
              dispatch(
                setBatchNotesRows({
                  upcs: searched.map((r) => r.upc),
                  notes: "",
                }),
              );
              setBatchNotes("");
            }}
            disabled={!hasNotes}
            title="Remove the note from every selected row"
            className="text-[11px] font-semibold px-2.5 py-1 rounded border border-gray-200 text-content hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Clear notes
          </button>
          <span className="text-[10.5px] text-content/85 ml-auto">
            Double-click a row for the calculator
          </span>
        </div>

        {isLoadingMore && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border-b border-blue-100 flex-shrink-0">
            <div className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0" />
            <span className="text-[11px] text-blue-600 font-medium">
              Loading more items…
            </span>
          </div>
        )}

        {notFoundUpcs.length > 0 && !isLoadingMore && (
          <div className="flex-shrink-0 border-b border-amber-200 relative">
            <button
              className="w-full flex items-center justify-between px-3 py-1 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
              onClick={() => setNotFoundOpen((o) => !o)}
            >
              <span className="text-[11px] text-amber-700 font-medium">
                {notFoundUpcs.length} item{notFoundUpcs.length !== 1 ? "s" : ""}{" "}
                had no sales history at the selected stores
              </span>
              <span className="text-[10px] text-amber-500 ml-2 shrink-0">
                {notFoundOpen ? "hide" : "show"}
              </span>
            </button>
            {notFoundOpen && (
              <div className="absolute left-0 right-0 top-full z-20 max-h-96 overflow-y-auto thin-scrollbar bg-amber-50 border border-amber-200 shadow-lg rounded-b-md px-3 pb-2">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 pt-1">
                  {notFoundUpcs.map((upc) => (
                    <div key={upc} className="contents">
                      <span className="text-[11px] font-medium text-content tabular-nums">
                        {upc}
                      </span>
                      <span className="text-[11px] font-medium text-content/85 truncate">
                        {adListRows[upc]?.featureDescription ||
                          adListRows[upc]?.pageName ||
                          "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* rows */}
        <div className="flex-1 overflow-y-auto thin-scrollbar min-h-0">
          <div className={HEAD} style={{ gridTemplateColumns: COLS }}>
            {/* Same construction as ItemMarginsTable's header: the column
                name, then the two filter labels beside it. */}
            <span
              className={`${PERF_SORT_HEADER} flex-1 flex items-center gap-2 min-w-0`}
            >
              Item
              <ColFilter
                label="UPC"
                labelSize="text-[9px]"
                active={!!appliedUpc}
                onApply={() => setAppliedUpc(draftUpc)}
                onClear={() => {
                  setAppliedUpc("");
                  setDraftUpc("");
                }}
              >
                <input
                  autoFocus
                  style={colFilterInputStyle}
                  placeholder="Search UPC…"
                  value={draftUpc}
                  onChange={(e) => setDraftUpc(e.target.value)}
                />
              </ColFilter>
              <ColFilter
                label="Desc"
                labelSize="text-[9px]"
                active={!!appliedDesc}
                onApply={() => setAppliedDesc(draftDesc)}
                onClear={() => {
                  setAppliedDesc("");
                  setDraftDesc("");
                }}
              >
                <input
                  autoFocus
                  style={colFilterInputStyle}
                  placeholder="Search description…"
                  value={draftDesc}
                  onChange={(e) => setDraftDesc(e.target.value)}
                />
              </ColFilter>
            </span>
            {HEAD_CELLS.slice(1).map((cell) =>
              cell.col ? (
                <SortHeader
                  key={cell.label}
                  col={cell.col}
                  label={cell.label}
                  sort={sort}
                  onSort={handleSort}
                  className={`${PERF_SORT_HEADER} justify-end`}
                />
              ) : (
                <span
                  key={cell.label}
                  className={`${PERF_SORT_HEADER} ${
                    cell.label === "Notes" ? "" : "text-right"
                  }`}
                >
                  {cell.label}
                </span>
              ),
            )}
          </div>

          {sorted.length === 0 ? (
            <div className="text-[12px] text-content/85 py-6 text-center">
              Nothing selected — tick items in the list on the left.
            </div>
          ) : (
            sorted.map((row) => {
              const flags = exceptionsFor(
                row,
                ranks.get(row.upc),
                forecastResults.find((r) => r.upc === row.upc),
                customPriced.has(row.upc),
              );
              const entry = ranks.get(row.upc);
              const band = bandStarts.get(row.upc);
              // A collapsed band keeps its header and drops its rows.
              const isHidden = entry ? collapsed.has(entry.tier) : false;
              return (
                <Fragment key={row.upc}>
                  {band && (
                    <button
                      onClick={() =>
                        setCollapsed((prev) => {
                          const next = new Set(prev);
                          if (next.has(band)) next.delete(band);
                          else next.add(band);
                          return next;
                        })
                      }
                      title={
                        collapsed.has(band)
                          ? `Show the ${band} band`
                          : `Collapse the ${band} band`
                      }
                      className="w-full flex items-center gap-2.5 px-2 py-2 bg-[#1e2a4ad9] hover:bg-[#1e2a4a] transition-colors"
                    >
                      {collapsed.has(band) ? (
                        <ChevronRightIcon className="w-3.5 h-3.5 text-custom-white flex-shrink-0" />
                      ) : (
                        <ChevronDownIcon className="w-3.5 h-3.5 text-custom-white flex-shrink-0" />
                      )}
                      <span
                        className={`w-6 h-6 rounded flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${TIER_CHIP_ON_NAVY[band]}`}
                      >
                        {band}
                      </span>
                      <span className="text-[12px] font-bold uppercase tracking-wide text-custom-white">
                        {TIER_LABEL[band]}
                      </span>
                      <span className="flex-1 h-px bg-custom-white/20" />
                      <span className="text-[12px] font-bold text-custom-white tabular-nums flex-shrink-0">
                        {summary[band].count} item
                        {summary[band].count === 1 ? "" : "s"} ·{" "}
                        {(summary[band].share * 100).toFixed(0)}%
                      </span>
                    </button>
                  )}
                  {!isHidden && (
                    <div
                      onDoubleClick={() =>
                        !row.singlePrice && dispatch(setSelectedUpc(row.upc))
                      }
                      title={
                        row.singlePrice
                          ? "Only one price point — nothing to model"
                          : "Double-click for the calculator"
                      }
                      className={`grid gap-2.5 items-center pl-1.5 pr-2 py-[7px] border-b border-[#1e2a4a]/15 last:border-b-0 border-l-4 ${
                        entry ? TIER_STRIPE[entry.tier] : "border-l-transparent"
                      } ${row.singlePrice ? "" : "even:bg-row_stripe hover:bg-gray-50"}`}
                      style={{ gridTemplateColumns: COLS }}
                    >
                      <div className="min-w-0 flex items-baseline gap-2">
                        <span className="flex items-baseline gap-1.5 flex-shrink-0">
                          <span className="text-[14px] font-bold tabular-nums text-content w-6 text-right">
                            {entry?.rank ?? ""}
                          </span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] font-medium text-content truncate flex items-center gap-1">
                            <span className="truncate">{row.description}</span>
                            {row.adListData && (
                              <span className="shrink-0 text-[9px] bg-blue-500 text-custom-white rounded px-0.5 font-medium">
                                AD
                              </span>
                            )}
                          </div>
                          {/* The badges sit on the UPC line at UPC size —
                              the description keeps the full width for the
                              thing people actually read the row by. */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] font-medium text-content/85 tabular-nums flex-shrink-0">
                              {row.upc}
                            </span>
                            {row.singlePrice && (
                              <span className="flex-shrink-0 text-[11px] bg-yellow-200 text-yellow-700 rounded px-1 font-medium">
                                1pt
                              </span>
                            )}
                            {flags.length > 0 && (
                              <span
                                title={flags.map((f) => f.detail).join("\n")}
                                className="truncate text-[11px] bg-severity_watch_bg text-severity_watch_text rounded px-1 font-medium"
                              >
                                {EXCEPTION_LABEL[flags[0].kind]}
                                {flags.length > 1
                                  ? ` +${flags.length - 1}`
                                  : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span
                        className="text-[11px] font-medium text-content/85 truncate"
                        title={row.notes || ""}
                      >
                        {row.notes || ""}
                      </span>
                      <span className="text-right text-[12px] font-medium tabular-nums text-content">
                        {customPriced.has(row.upc)
                          ? "—"
                          : row.qtySold.toLocaleString()}
                      </span>
                      <span className="text-right text-[12px] font-medium tabular-nums text-content/85">
                        {row.daysActive}/90
                      </span>
                      <span className="text-right text-[12px] font-medium tabular-nums text-content/85">
                        {customPriced.has(row.upc)
                          ? "—"
                          : `${row.daysAtPrice}/${row.daysActive}`}
                      </span>
                      <span className="text-right text-[12px] font-medium tabular-nums text-content/85">
                        {row.forecastWindow}
                      </span>
                      <span className="text-right text-[12px] font-medium tabular-nums text-content">
                        {row.adDays === 0 ? "—" : row.adDays}
                      </span>
                      <span className="text-right text-[12px] font-medium tabular-nums text-content">
                        {formatCurrency2(row.fcstPrice)}
                      </span>
                      <span className="text-right text-[12px] font-medium tabular-nums text-content">
                        {row.adFcst.toLocaleString()}
                      </span>
                      <span className="text-right text-[13px] font-bold tabular-nums text-content">
                        {formatCurrency2(row.fcstTotal)}
                      </span>
                      <span className="text-right text-[12px] font-medium tabular-nums text-content/85">
                        {((ranks.get(row.upc)?.share ?? 0) * 100).toFixed(1)}%
                      </span>
                      <span className="text-right text-[12px] font-medium tabular-nums text-content">
                        {formatCurrency2(Math.max(0, row.markdownDollars))}
                      </span>
                    </div>
                  )}
                </Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ForecastRowsTable;
