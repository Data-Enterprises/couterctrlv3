import { useMemo, useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import { useSuggestedCtx } from "./hooks";
import {
  setExportOpen,
  setUpcFilter,
  setDescFilter,
  setOnlyFlagged,
  setSelectedDay,
  setActiveTab,
  type SuggestedTab,
} from "../../features/suggestedSlice";
import {
  coverDates,
  dayLabel,
  dayLevelPct,
  deptLabel,
  fmtLb,
  fmtLb0,
  fmtLbOrDash,
  rateForDate,
  sheetRows,
  shrinkLabel,
  shrinkTitle,
} from ".";
import DayCardStrip, { type DayCardEntry } from "../../components/DayCardStrip";
import CoverageStrip from "./CoverageStrip";
import TopToOrder from "./TopToOrder";
import ProductionTab from "./ProductionTab";
import NotSellingTab from "./NotSellingTab";
import ColFilter from "../../components/filters/ColFilter";
import { colInputStyle } from "../../components/filters/colFilterStyles";
import SortHeader from "../../components/SortHeader";
import { useTriStateSort } from "../../utils/useTriStateSort";
import { SheetSkeleton } from "./Skeletons";
import KpiTileGrid, { type KpiCell } from "../../components/KpiTileGrid";
import InfoButton from "../../components/InfoButton";
import InfoPopover from "../../components/InfoPopover";
import UpcContextMenu from "../../components/UpcContextMenu";
import { SUGGESTED_INFO } from "./suggestedInfo";
import type { DowRates, SuggestedItem } from "../../interfaces";

const TH =
  "px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85";
/**
 * The sort button's own look — typography only, no padding: the `th` already
 * carries it, and repeating it here indented the label inside its own cell.
 *
 * `w-full justify-end` rather than `ml-auto`: a button is inline-block inside a
 * table cell, so it never filled the header and the cell's `text-right` had
 * nothing to push. It has to stretch before it can align.
 */
const SORT_TH =
  "w-full justify-end text-[10px] font-semibold uppercase tracking-wide text-content/85 hover:text-content";

type SortCol = "daily" | "demand" | "markdown" | "order";

const TABS: { key: SuggestedTab; label: string }[] = [
  { key: "order", label: "Order" },
  { key: "production", label: "Production" },
  { key: "notSelling", label: "Not selling" },
];

const OrderSheetPanel = () => {
  const ctx = useSuggestedCtx();
  const { sort, handleSort, applySort } = useTriStateSort<SortCol>();
  const [draftUpc, setDraftUpc] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    upc: string;
  } | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  /**
   * The department, out of the store's rows.
   *
   * `items` holds every department now, so the sheet filters to the selected one
   * here rather than at fetch time — which is what stopped the page pulling the
   * same store payload once per department click.
   */
  const filtered = useMemo(
    () =>
      sheetRows(
        ctx.items,
        ctx.sheetKey?.sub_department ?? null,
        ctx.upcFilter,
        ctx.descFilter,
        ctx.onlyFlagged,
      ),
    [ctx.items, ctx.sheetKey, ctx.upcFilter, ctx.descFilter, ctx.onlyFlagged],
  );

  /** The group row behind this department — the only source of the day-by-day
   *  history and the cross-store comparison, neither of which is on item rows. */
  const groupRow = ctx.groupRows.find(
    (r) =>
      r.storeid === ctx.sheetKey?.storeid &&
      r.sub_department === ctx.sheetKey?.sub_department,
  );

  /**
   * The demand figure a row shows: the whole cover window, or one day of it.
   *
   * Selecting a day re-points this column only. `suggested_weight` stays put —
   * you place one order for the whole window, so a per-day order quantity is
   * not a thing anyone acts on.
   */
  const demandFor = (r: SuggestedItem) =>
    ctx.selectedDay && r.dow_rates
      ? rateForDate(r.dow_rates, ctx.selectedDay)
      : (r.demand_weight ?? 0);

  // Default order is heaviest first, which is how the endpoint returns it and
  // how a buyer reads it. Sorting is a lens over that, not a new permanent
  // order — the tri-state hook is what gives the default back.
  const rows = applySort<SuggestedItem>(filtered, (r, col) =>
    col === "daily"
      ? (r.avg_daily_weight ?? null)
      : col === "demand"
        ? demandFor(r)
        : col === "markdown"
          ? (r.lifetime_markdown ?? null)
          : (r.suggested_weight ?? null),
  );

  const totals = useMemo(() => {
    const order = rows.reduce((s, r) => s + (r.suggested_weight ?? 0), 0);
    const demand = rows.reduce((s, r) => s + demandFor(r), 0);
    const daily = rows.reduce((s, r) => s + (r.avg_daily_weight ?? 0), 0);
    const capped = rows.filter((r) => r.shrink_clamped).length;
    // Never day-scoped. `demand` follows the selected day by design, so reusing
    // it for the All Week card would have made that card show one day's pounds
    // under the label "All Week".
    const week = rows.reduce((s, r) => s + (r.demand_weight ?? 0), 0);
    return { order, demand, daily, capped, week };
  }, [rows]);

  /**
   * The weekday profile, summed from the ROWS ON SCREEN rather than read off the
   * group row.
   *
   * Same arithmetic the endpoint does — the group row's `dow_rates` is its items
   * summed — so unfiltered the two agree exactly. Doing it here means the strip
   * and the Avg/day tile share one baseline: taking the values from the group
   * row and the baseline from the visible rows put two "average day" figures on
   * one screen, 781.2 against 781.25, which nobody would ever catch.
   */
  const deptRates: DowRates | undefined = useMemo(() => {
    const out: DowRates = {};
    for (let d = 0; d < 7; d++) out[String(d)] = 0;
    let any = false;
    for (const r of rows) {
      if (!r.dow_rates) continue;
      any = true;
      for (let d = 0; d < 7; d++) {
        out[String(d)] += r.dow_rates[String(d)] ?? 0;
      }
    }
    return any ? out : undefined;
  }, [rows]);

  /**
   * A card per day the order has to cover.
   *
   * These are NOT forecasts for those dates. Each one is what this department
   * does on that WEEKDAY, averaged over the lookback, labelled with the date it
   * will be delivered against — which is why the value says "typical" and the
   * date says "covers". Move the order to a different Friday and the number is
   * identical. The four sum to Cover demand, which is the honest reason they are
   * on an order screen at all.
   */
  const dayCards: DayCardEntry[] = useMemo(() => {
    if (!deptRates) return [];
    return coverDates(ctx.parameters?.cover_window).map((iso) => {
      const lb = rateForDate(deptRates, iso);
      const d = new Date(`${iso}T12:00:00`);
      return {
        iso,
        value: `${fmtLb(lb)} lb`,
        delta: dayLevelPct(lb, totals.daily),
        deltaTitle: `${fmtLb(totals.daily)} lb on an average day here`,
        basis: "vs avg day",
        label: `${d.toLocaleDateString(undefined, { weekday: "long" })}s`,
        subLabel: `covers ${d.getMonth() + 1}/${d.getDate()}`,
        valueNote: "typical",
      };
    });
  }, [deptRates, ctx.parameters, totals.daily]);

  /** A past `asOf` makes the response a comparison: the endpoint drops
   *  `suggested_weight` rather than publish an order nobody can place. */
  const isHistorical = ctx.parameters?.is_historical === true;

  const hasStore = ctx.activeStoreId !== null;
  const hasSheet = ctx.sheetKey !== null;
  const tab = ctx.activeTab;

  const headerTitle = hasSheet
    ? ctx.sheetKey!.storeLabel
    : hasStore
      ? ctx.activeStoreLabel
      : "Order Sheet";

  return (
    <div
      className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white min-h-0"
      style={{ flex: 1, minWidth: 0 }}
    >
      {/* Navy header — one row, title left, actions and metadata right. */}
      <div
        className="flex-shrink-0 px-4 py-[11px] flex items-start justify-between"
        style={{ background: "#1e2a4a" }}
      >
        <div>
          <div className="text-[13px] font-semibold text-custom-white">
            {headerTitle}
            {hasStore && (
              <span className="ml-2 text-[11px] font-normal text-custom-white">
                —{" "}
                {hasSheet
                  ? deptLabel(ctx.sheetKey!.sub_department_description)
                  : "all departments"}
              </span>
            )}
          </div>
        </div>
        {hasStore && ctx.items.length > 0 && (
          <div className="flex items-center gap-3 mt-0.5">
            {/* Scoped to the tab on screen: the same term does not mean the same
                thing on Order as it does on Production. */}
            <div className="relative">
              <InfoButton onClick={() => setInfoOpen((v) => !v)} />
              {infoOpen && (
                <InfoPopover
                  title={SUGGESTED_INFO.title}
                  purpose={SUGGESTED_INFO.purpose}
                  glossary={
                    hasSheet
                      ? SUGGESTED_INFO.byTab[tab]
                      : SUGGESTED_INFO.byTab.topToOrder
                  }
                  onClose={() => setInfoOpen(false)}
                />
              )}
            </div>
            <button
              onClick={() => ctx.dispatch(setExportOpen(true))}
              title="Export CSV"
              className="text-custom-white/85 hover:text-custom-white transition-colors flex-shrink-0"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* While the stores themselves are still arriving there is nothing to
          select, so the prompt would be telling the reader to do something they
          cannot yet do. Show the shape of the sheet instead. */}
      {!hasStore && ctx.loadingGroup && <SheetSkeleton />}

      {!hasStore && !ctx.loadingGroup && (
        <div className="flex-1 flex flex-col items-center justify-center gap-1">
          <p className="text-[13px] font-medium text-content">Select a store</p>
          <p className="text-[11px] text-content/85">
            Open one on the left to see what it needs
          </p>
        </div>
      )}

      {hasStore && isHistorical && (
        <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 bg-severity_watch_bg text-[11px] text-severity_watch_text leading-snug">
          <span className="font-semibold">Historical date.</span> This is a
          comparison, not an order — nobody buys for a date that has passed, and
          the waste rates behind an order figure are current rather than
          historical. Everything else here is the real history for that window.
        </div>
      )}

      {hasStore && ctx.loadingItems && <SheetSkeleton />}

      {/* Store opened, no department picked: the heaviest lines across all of
          them, out of the response already in hand. */}
      {hasStore && !ctx.loadingItems && !hasSheet && <TopToOrder />}

      {hasStore && !ctx.loadingItems && hasSheet && (
        <>
          <div className="flex-shrink-0 flex gap-0.5 px-3 bg-gray-50 border-b border-gray-100">
            {TABS.map((t) => {
              const on = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => ctx.dispatch(setActiveTab(t.key))}
                  className={`px-4 py-2 text-[12px] font-semibold border-b-2 transition-colors ${
                    on
                      ? "text-content border-[#1e2a4a] bg-custom-white"
                      : "text-content/85 border-transparent hover:text-content"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === "order" && (
            <>
              <div className="flex-shrink-0 px-3 pt-2 text-[10.5px] text-content/85 bg-gray-50 leading-snug">
                Each card is what this department does on that{" "}
                <span className="font-semibold text-content">weekday</span>,
                averaged over the lookback — not a forecast for that date. The
                four sum to Cover demand.
              </div>
              {/* Rising pounds are a heavier production day, not a worse one — the
                  same reason Vendors turns the red/green round for sales. */}
              <DayCardStrip
                days={dayCards}
                weekValue={`${fmtLb(totals.week)} lb`}
                weekDelta={null}
                selected={ctx.selectedDay}
                onSelect={(iso) =>
                  ctx.dispatch(setSelectedDay(iso === ctx.selectedDay ? "" : iso))
                }
                higherIsWorse={false}
              />

              <KpiTileGrid
                items={
                  [
                    {
                      label: "Order",
                      value: isHistorical ? "—" : `${fmtLb(totals.order)} lb`,
                    },
                    {
                      label: ctx.selectedDay
                        ? dayLabel(ctx.selectedDay)
                        : "Cover demand",
                      value: `${fmtLb(totals.demand)} lb`,
                    },
                    { label: "Avg / day", value: `${fmtLb(totals.daily)} lb` },
                    { label: "Items", value: rows.length.toLocaleString() },
                    { label: "Capped", value: totals.capped.toLocaleString() },
                  ] satisfies KpiCell[]
                }
              />

              <CoverageStrip coverage={ctx.coverage} />

              <div className="flex-1 overflow-auto thin-scrollbar">
                {rows.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-[11px] text-content/85">
                    No results match filters
                  </div>
                ) : (
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr className="sticky top-0 bg-gray-100 border-b border-gray-100 z-10">
                        <th
                          className={`${TH} text-left`}
                          style={{ overflow: "visible" }}
                        >
                          <ColFilter
                            label="Item"
                            active={!!ctx.descFilter}
                            onApply={() => ctx.dispatch(setDescFilter(draftDesc))}
                            onClear={() => {
                              ctx.dispatch(setDescFilter(""));
                              setDraftDesc("");
                            }}
                          >
                            <input
                              autoFocus
                              style={colInputStyle}
                              placeholder="Search description…"
                              value={draftDesc}
                              onChange={(e) => setDraftDesc(e.target.value)}
                            />
                          </ColFilter>
                        </th>
                        <th
                          className={`${TH} text-left w-32`}
                          style={{ overflow: "visible" }}
                        >
                          <ColFilter
                            label="UPC"
                            active={!!ctx.upcFilter}
                            onApply={() => ctx.dispatch(setUpcFilter(draftUpc))}
                            onClear={() => {
                              ctx.dispatch(setUpcFilter(""));
                              setDraftUpc("");
                            }}
                          >
                            <input
                              autoFocus
                              style={colInputStyle}
                              placeholder="Search UPC…"
                              value={draftUpc}
                              onChange={(e) => setDraftUpc(e.target.value)}
                            />
                          </ColFilter>
                        </th>
                        <th className={`${TH} text-right whitespace-nowrap`}>
                          <SortHeader
                            col="daily"
                            label="Avg lb/day"
                            sort={sort}
                            onSort={handleSort}
                            className={SORT_TH}
                          />
                        </th>
                        <th className={`${TH} text-right whitespace-nowrap`}>
                          <SortHeader
                            col="demand"
                            label={
                              ctx.selectedDay
                                ? dayLabel(ctx.selectedDay)
                                : "Cover demand"
                            }
                            sort={sort}
                            onSort={handleSort}
                            className={SORT_TH}
                          />
                        </th>
                        <th
                          className={`${TH} text-right`}
                          title="The percentage added to the order to cover product that will not sell — for every 100 lb sold, this much gets thrown away. Click to show only capped rows."
                        >
                          <button
                            onClick={() =>
                              ctx.dispatch(setOnlyFlagged(!ctx.onlyFlagged))
                            }
                            className={`flex items-center gap-1 w-full justify-end transition-colors ${
                              ctx.onlyFlagged
                                ? "text-severity_watch_text"
                                : "text-content/85"
                            }`}
                          >
                            Waste %
                            {ctx.onlyFlagged && (
                              <span className="w-1 h-1 rounded-full bg-severity_watch_text flex-shrink-0" />
                            )}
                          </button>
                        </th>
                        <th
                          className={`${TH} text-right whitespace-nowrap`}
                          title="Recorded waste in pounds, over each item's whole recorded life — not the cover window. Sort it to rank where the waste actually is: a small percentage of a big mover outweighs a big percentage of a slow one."
                        >
                          <SortHeader
                            col="markdown"
                            label="Marked down"
                            sort={sort}
                            onSort={handleSort}
                            className={SORT_TH}
                          />
                        </th>
                        <th className={`${TH} text-right whitespace-nowrap`}>
                          <SortHeader
                            col="order"
                            label="Order lb"
                            sort={sort}
                            onSort={handleSort}
                            className={SORT_TH}
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr
                          key={r.product_code}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setCtxMenu({
                              x: e.clientX,
                              y: e.clientY,
                              upc: String(r.product_code),
                            });
                          }}
                          className="border-b border-[#1e2a4a]/15 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-3 py-2 text-content font-medium">
                            {r.product_description ?? String(r.product_code)}
                          </td>
                          <td className="px-3 py-2 text-content/85 tabular-nums">
                            {r.product_code}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-content">
                            {fmtLb(r.avg_daily_weight)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-content">
                            {fmtLb(demandFor(r))}
                          </td>
                          <td
                            className="px-3 py-2 text-right tabular-nums"
                            title={shrinkTitle(r)}
                          >
                            <span
                              className={
                                r.shrink_clamped
                                  ? "text-severity_watch_text font-semibold"
                                  : "text-content"
                              }
                            >
                              {shrinkLabel(r)}
                            </span>
                            {r.shrink_clamped && (
                              <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-severity_watch_bg text-severity_watch_text">
                                Cap
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-content">
                            {r.lifetime_markdown
                              ? fmtLb0(r.lifetime_markdown)
                              : "—"}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-content font-semibold">
                            {fmtLbOrDash(r.suggested_weight)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="sticky bottom-0 bg-gray-50 border-t-2 border-content/70 font-bold text-[14px]">
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-right text-content/85">
                          Totals
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-content/85">
                          {fmtLb(totals.daily)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-content/85">
                          {fmtLb(totals.demand)}
                        </td>
                        <td className="px-3 py-2"></td>
                        {/* Marked down is deliberately not totalled. Every other
                            figure in this row covers the same window; these are
                            lifetime pounds over item lifetimes that differ, so a
                            sum beside them would read as a period it does not
                            have. The sort is what this column is for. */}
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-right tabular-nums text-content/85">
                          {isHistorical ? "—" : fmtLb(totals.order)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </>
          )}

          {tab === "production" && (
            <ProductionTab
              groupRow={groupRow}
              subDepartment={ctx.sheetKey!.sub_department}
            />
          )}

          {tab === "notSelling" && (
            <NotSellingTab
              subDepartment={ctx.sheetKey!.sub_department}
            />
          )}
        </>
      )}

      {ctxMenu && (
        <UpcContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          upc={ctxMenu.upc}
          allUpcs={rows.map((r) => String(r.product_code))}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
};

export default OrderSheetPanel;
