import { useMemo, useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import { useSuggestedCtx } from "./hooks";
import {
  setExportOpen,
  setUpcFilter,
  setDescFilter,
  setOnlyFlagged,
  setSelectedDay,
} from "../../features/suggestedSlice";
import {
  coverDates,
  dayLabel,
  dayLevelPct,
  deptLabel,
  fmtLb,
  fmtLb0,
  rateForDate,
  shrinkLabel,
  shrinkTitle,
} from ".";
import DayCardStrip, { type DayCardEntry } from "../../components/DayCardStrip";
import SoldPerDayStrip from "./SoldPerDayStrip";
import ColFilter from "../../components/filters/ColFilter";
import { colInputStyle } from "../../components/filters/colFilterStyles";
import SortHeader from "../../components/SortHeader";
import { useTriStateSort } from "../../utils/useTriStateSort";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import KpiTileGrid, { type KpiCell } from "../../components/KpiTileGrid";
import UpcContextMenu from "../../components/UpcContextMenu";
import type { SuggestedItem } from "../../interfaces";

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

  const filtered = useMemo(() => {
    const upc = ctx.upcFilter.trim().toLowerCase();
    const desc = ctx.descFilter.trim().toLowerCase();
    return ctx.items.filter((i) => {
      if (ctx.onlyFlagged && !i.shrink_clamped) return false;
      if (upc && !String(i.product_code).toLowerCase().includes(upc)) return false;
      if (desc && !(i.product_description ?? "").toLowerCase().includes(desc))
        return false;
      return true;
    });
  }, [ctx.items, ctx.upcFilter, ctx.descFilter, ctx.onlyFlagged]);

  /**
   * The department's weekday profile, read off the group row the sheet was
   * opened from rather than re-summed across items — the backend computes both
   * from the same `labelled` rows, and the group row is already in hand.
   */
  const groupRow = ctx.groupRows.find(
    (r) =>
      r.storeid === ctx.sheetKey?.storeid &&
      r.sub_department === ctx.sheetKey?.sub_department,
  );

  /**
   * No profile, no strip.
   *
   * A row whose profile is missing or unparseable reaches us with `dow_rates`
   * absent, and `rateForDate` answers 0 for a missing key — which rendered
   * every day as "0.00 lb, -100% vs avg day". That is a department that sells
   * nothing, stated confidently, and it is the opposite of true. An absent
   * field is not seven zeros.
   */
  const dayCards: DayCardEntry[] = useMemo(() => {
    if (!groupRow?.dow_rates) return [];
    return coverDates(ctx.parameters?.cover_window).map((iso) => {
      const lb = rateForDate(groupRow.dow_rates, iso);
      return {
        iso,
        value: `${fmtLb(lb)} lb`,
        delta: dayLevelPct(lb, groupRow.avg_daily_weight ?? 0),
        deltaTitle: `${fmtLb(groupRow.avg_daily_weight ?? 0)} lb on an average day here`,
        basis: "avg day",
      };
    });
  }, [groupRow, ctx.parameters]);

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
    const adjusted = rows.filter((r) => r.shrink_source !== "none").length;
    return { order, demand, daily, capped, adjusted };
  }, [rows]);

  const hasSheet = ctx.sheetKey !== null;

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
          {hasSheet ? (
            <div className="text-[13px] font-semibold text-custom-white">
              {ctx.sheetKey!.storeLabel}
              <span className="ml-2 text-[11px] font-normal text-custom-white">
                — {deptLabel(ctx.sheetKey!.sub_department_description)}
              </span>
            </div>
          ) : (
            <div className="text-[13px] font-semibold text-custom-white">
              Order Sheet
            </div>
          )}
        </div>
        {hasSheet && ctx.items.length > 0 && (
          <div className="flex items-center gap-3 mt-0.5">
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

      {!hasSheet && (
        <div className="flex-1 flex flex-col items-center justify-center gap-1">
          <p className="text-[13px] font-medium text-content">
            Select a department
          </p>
          <p className="text-[11px] text-content/85">
            Open a store on the left, then choose a department
          </p>
        </div>
      )}

      {hasSheet && ctx.loadingItems && (
        <div className="flex-1 relative">
          <LoadingIndicator message="Building the sheet" />
        </div>
      )}

      {hasSheet && !ctx.loadingItems && (
        <>
          {/* Rising pounds are a heavier production day, not a worse one — the
              same reason Vendors turns the red/green round for sales. */}
          <DayCardStrip
            days={dayCards}
            weekValue={`${fmtLb(groupRow?.demand_weight ?? 0)} lb`}
            weekDelta={null}
            selected={ctx.selectedDay}
            onSelect={(iso) =>
              ctx.dispatch(setSelectedDay(iso === ctx.selectedDay ? "" : iso))
            }
            higherIsWorse={false}
          />

          {/* What the department actually moved, under what it is forecast to.
              The cards are an average weekday; these are the days that
              happened. */}
          {groupRow?.daily?.length ? (
            <SoldPerDayStrip
              daily={groupRow.daily}
              dailyAvg={groupRow.daily_avg ?? 0}
            />
          ) : null}

          <KpiTileGrid
            items={
              [
                { label: "Order", value: `${fmtLb(totals.order)} lb` },
                {
                  label: ctx.selectedDay
                    ? dayLabel(ctx.selectedDay)
                    : "Cover demand",
                  value: `${fmtLb(totals.demand)} lb`,
                },
                { label: "Avg / day", value: `${fmtLb(totals.daily)} lb` },
                { label: "Items", value: rows.length.toLocaleString() },
                {
                  label: "Shrink applied",
                  value: totals.adjusted.toLocaleString(),
                },
                { label: "Capped", value: totals.capped.toLocaleString() },
              ] satisfies KpiCell[]
            }
          />

          <div className="flex-1 overflow-auto thin-scrollbar">
            {rows.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-[11px] text-content/85">
                {ctx.items.length === 0
                  ? "No scale items in this department"
                  : "No results match filters"}
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
                    <th className={`${TH} text-right`}>
                      <button
                        onClick={() =>
                          ctx.dispatch(setOnlyFlagged(!ctx.onlyFlagged))
                        }
                        title="Show only capped rows"
                        className={`flex items-center gap-1 w-full justify-end transition-colors ${
                          ctx.onlyFlagged
                            ? "text-severity_watch_text"
                            : "text-content/85"
                        }`}
                      >
                        Shrink
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
                        {r.lifetime_markdown ? fmtLb0(r.lifetime_markdown) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-content font-semibold">
                        {fmtLb(r.suggested_weight)}
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
                        sum sitting beside them would read as a period it does
                        not have. The sort is what this column is for. */}
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2 text-right tabular-nums text-content/85">
                      {fmtLb(totals.order)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
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
