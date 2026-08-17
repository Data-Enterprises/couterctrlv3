import { useMemo, useState } from "react";
import {
  ArrowDownTrayIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { collectGradedItems } from "./vendorGradedItems";
import type { ItemGradingMetric } from "../../utils/itemMargins";
import { useCriticalReport } from "../itemReport/criticalHandoff";
import {
  useAppSelector,
  useAppDispatch,
  useCanSeeComingSoon,
} from "../../hooks";
import { formatCurrency2 } from "../../utils";
import {
  pillClass,
  formatPct,
  severityHeaderBgClass,
  type Severity,
} from "../../utils/severity";
import {
  LW_OFFSET,
  LY_OFFSET,
  shiftIso,
  pctChange,
  type Tier,
} from "../../utils/grading";
import { fmtDayLabel, fmtRangeLabel } from "../../utils/dateLabels";
import DayCardStrip, { type DayCardEntry } from "../../components/DayCardStrip";
import ItemMarginsTable from "../../components/ItemMarginsTable";
import VendorExportModal from "./VendorExportModal";
import {
  setSelectedDay,
  setItemThreshold,
  VENDOR_THRESHOLD_DEFAULT,
  VENDOR_ITEM_THRESHOLD_DEFAULT,
} from "../../features/vendorsSlice";
import { getVendorTier, rowsForVendor, marginPct } from "./vendorsUtils";

/** Ungraded has no severity colour of its own, so the header falls back to the
 *  navy every other panel uses rather than borrowing a verdict colour. */
const headerBg = (tier: Tier) =>
  tier === "ungraded"
    ? "bg-[#1e2a4a]"
    : severityHeaderBgClass[tier as Severity];

/** One KPI cell, matching the Sales strip. The date line is load-bearing: the
 *  figure means something different once a day is selected. */
const Kpi = ({
  title,
  dateLabel,
  value,
  pct,
  threshold,
}: {
  title: string;
  dateLabel: string;
  value: string;
  pct?: number | null;
  threshold: number;
}) => (
  <div className="px-4 pt-2.5 pb-2 text-center">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content">
      {title}
    </div>
    <div className="text-[10px] font-bold text-content mb-0.5">{dateLabel}</div>
    {pct === undefined ? (
      <div className="text-[14px] font-bold text-content">{value}</div>
    ) : (
      <div className="flex items-baseline justify-center gap-2">
        <span className="text-[14px] font-bold text-content">{value}</span>
        {pct !== null && (
          <span
            className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${pillClass(pct, threshold)}`}
          >
            {formatPct(pct)}
          </span>
        )}
      </div>
    )}
  </div>
);

const VendorDetailPanel = () => {
  const dispatch = useAppDispatch();
  const vend = useAppSelector((s) => s.vendors);
  // Item Actions is unreleased, so the way in goes with it. A button that
  // navigates somewhere the nav says does not exist is worse than no button.
  const canSeeComingSoon = useCanSeeComingSoon();
  const {
    rows,
    raw,
    metric,
    threshold,
    selectedVendor,
    selectedDay,
    itemThreshold,
  } = vend;

  const [exportOpen, setExportOpen] = useState(false);
  const openCriticalReport = useCriticalReport();

  const activeThreshold = threshold ?? VENDOR_THRESHOLD_DEFAULT;
  const isMargin = metric === "margin";

  /** A net/COGS pair reduced to whichever number the toggle is showing, and the
   *  string for it. Margin is a percentage, sales are dollars — they never
   *  share a formatter. */
  const valueOf = (net: number, cogs: number) =>
    isMargin ? marginPct(net, cogs) : net;
  const fmt = (v: number) =>
    isMargin ? `${v.toFixed(2)}%` : formatCurrency2(v);

  /** Points in margin mode, percent in sales mode — the same contract
   *  vendorDelta has, and the reason the two can't share a formatter either. */
  const deltaOf = (
    twNet: number,
    twCogs: number,
    baseNet: number,
    baseCogs: number,
  ) =>
    isMargin
      ? marginPct(twNet, twCogs) - marginPct(baseNet, baseCogs)
      : pctChange(twNet, baseNet);

  const row = useMemo(
    () => rows.find((r) => r.vendorId === selectedVendor) ?? null,
    [rows, selectedVendor],
  );

  /** This vendor's item rows, all three periods — what the Items report and
   *  the export both read from. Sub-department breakdowns deliberately live on
   *  Sub Dept Margins rather than being repeated here. */
  const vendorRaw = useMemo(
    () =>
      selectedVendor
        ? {
            tw: rowsForVendor(raw.tw, selectedVendor),
            lw: rowsForVendor(raw.lw, selectedVendor),
            ly: rowsForVendor(raw.ly, selectedVendor),
          }
        : { tw: [], lw: [], ly: [] },
    [raw, selectedVendor],
  );

  /** Item grading uses its own threshold and follows the Margin/Sales toggle —
   *  the same pair the export modal derives, so the button and the file agree. */
  const activeItemThreshold = itemThreshold ?? VENDOR_ITEM_THRESHOLD_DEFAULT;
  const itemGradingMetric: ItemGradingMetric = isMargin ? "margin" : "sales";

  /**
   * This vendor's critical items, selected by the same collector the UPC List
   * export uses. Each carries the sub department it sells under, which is what
   * lets a multi-department vendor narrow the report's fan-out instead of
   * forcing it to read the whole store.
   */
  const criticalItems = useMemo(
    () =>
      row
        ? collectGradedItems(
            [row],
            raw,
            activeItemThreshold,
            itemGradingMetric,
            new Set(["critical"] as const),
          ).map((g) => ({ productCode: g.r.productCode, dept: g.dept }))
        : [],
    [row, raw, activeItemThreshold, itemGradingMetric],
  );

  if (!row) {
    return (
      <div className="flex-1 min-w-0 shadow-lg bg-custom-white rounded-xl flex items-center justify-center">
        <span className="text-[11px] text-content/40">
          Select a vendor to see its week
        </span>
      </div>
    );
  }

  const tier = getVendorTier(row, activeThreshold, metric);

  /* ── KPI values: whole week, or the selected day ───────────────────────── */

  const activeDay = selectedDay
    ? (row.days.find((d) => d.date === selectedDay) ?? null)
    : null;

  type Day = (typeof row.days)[number];
  const dayTw = (d: Day) => valueOf(d.twNet, d.twCogs);
  const dayLw = (d: Day) =>
    d.lwNet === null ? null : valueOf(d.lwNet, d.lwCogs ?? 0);
  const dayLy = (d: Day) =>
    d.lyNet === null ? null : valueOf(d.lyNet, d.lyCogs ?? 0);
  const dayDelta = (d: Day, base: "lw" | "ly") => {
    const bn = base === "lw" ? d.lwNet : d.lyNet;
    if (bn === null || bn === 0) return null;
    const bc = (base === "lw" ? d.lwCogs : d.lyCogs) ?? 0;
    return deltaOf(d.twNet, d.twCogs, bn, bc);
  };

  const twValue = activeDay ? dayTw(activeDay) : valueOf(row.twNet, row.twCogs);
  const lwValue = activeDay
    ? dayLw(activeDay)
    : row.hasLW
      ? valueOf(row.lwNet, row.lwCogs)
      : null;
  const lyValue = activeDay
    ? dayLy(activeDay)
    : row.hasLY
      ? valueOf(row.lyNet, row.lyCogs)
      : null;
  const lwPct = activeDay
    ? dayDelta(activeDay, "lw")
    : row.hasLW && row.lwNet > 0
      ? deltaOf(row.twNetForLW, row.twCogsForLW, row.lwNet, row.lwCogs)
      : null;
  const lyPct = activeDay
    ? dayDelta(activeDay, "ly")
    : row.hasLY && row.lyNet > 0
      ? deltaOf(row.twNetForLY, row.twCogsForLY, row.lyNet, row.lyCogs)
      : null;

  const twLabel = selectedDay
    ? fmtDayLabel(selectedDay)
    : fmtRangeLabel(vend.twStart, vend.twEnd);
  const lwLabel = selectedDay
    ? fmtDayLabel(shiftIso(selectedDay, LW_OFFSET))
    : fmtRangeLabel(
        shiftIso(vend.twStart, LW_OFFSET),
        shiftIso(vend.twEnd, LW_OFFSET),
      );
  const lyLabel = selectedDay
    ? fmtDayLabel(shiftIso(selectedDay, LY_OFFSET))
    : fmtRangeLabel(
        shiftIso(vend.twStart, LY_OFFSET),
        shiftIso(vend.twEnd, LY_OFFSET),
      );

  /* ── Day strip ─────────────────────────────────────────────────────────── */

  const dayCards: DayCardEntry[] = row.days.map((d) => {
    const l = dayLw(d);
    const y = dayLy(d);
    const lp = dayDelta(d, "lw");
    const yp = dayDelta(d, "ly");
    return {
      iso: d.date,
      value: fmt(dayTw(d)),
      delta: yp ?? lp,
      basis: yp !== null ? "LY" : lp !== null ? "LW" : undefined,
      deltaTitle:
        yp !== null
          ? `vs last year: ${fmt(y as number)}`
          : lp !== null
            ? `vs last week: ${fmt(l as number)}`
            : "No baseline",
    };
  });

  const weekLwPct =
    row.hasLW && row.lwNet > 0
      ? deltaOf(row.twNetForLW, row.twCogsForLW, row.lwNet, row.lwCogs)
      : null;
  const weekLyPct =
    row.hasLY && row.lyNet > 0
      ? deltaOf(row.twNetForLY, row.twCogsForLY, row.lyNet, row.lyCogs)
      : null;

  return (
    <div className="flex-1 min-w-0 shadow-lg bg-custom-white rounded-xl overflow-hidden flex flex-col">
      {exportOpen && (
        <VendorExportModal
          onClose={() => setExportOpen(false)}
          storeName={vend.storeName}
          vendorName={row.vendorName}
          dateRange={fmtRangeLabel(vend.twStart, vend.twEnd)}
          rows={rows}
          vendorRaw={vendorRaw}
          // Unsliced — the all-vendors preset splits it by vendor itself.
          allRaw={raw}
          metric={metric}
          threshold={activeThreshold}
          itemThreshold={itemThreshold ?? VENDOR_ITEM_THRESHOLD_DEFAULT}
          weekDates={row.days.map((d) => d.date)}
          selectedDay={selectedDay}
        />
      )}

      {/* Title bar — tinted to the selected vendor's severity */}
      <div
        className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 flex-shrink-0 ${headerBg(tier)}`}
      >
        <p className="text-custom-white text-[13px] font-bold leading-tight justify-self-start truncate">
          {row.vendorName}
        </p>
        <span className="text-custom-white text-[13px] font-bold justify-self-center">
          Vendor Performance · {twLabel}
        </span>
        <div className="justify-self-end flex items-center gap-1.5">
          {/* A vendor's range routinely spans several sub departments, so the
              handed-over items carry their own — that set is what narrows the
              fan-out on the report side instead of reading every department. */}
          {canSeeComingSoon && criticalItems.length > 0 && (
            <button
              onClick={() =>
                openCriticalReport({
                  storeId: vend.storeid,
                  items: criticalItems,
                  window: { start: vend.twStart, end: vend.twEnd },
                  // The vendor's rows for all three periods are already in
                  // hand — handing them over is both faster and the only way
                  // the report is guaranteed to show what this panel showed.
                  rows: {
                    ty: vendorRaw.tw,
                    lw: vendorRaw.lw,
                    ly: vendorRaw.ly,
                  },
                  sourceLabel: row.vendorName,
                  basisLabel: `${criticalItems.length} critical by ${itemGradingMetric}, ${activeItemThreshold}%`,
                })
              }
              className="w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/85 hover:text-custom-white hover:border-custom-white/40 transition-colors"
              title={`See item actions (${criticalItems.length})`}
            >
              <ClipboardDocumentListIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setExportOpen(true)}
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/85 hover:text-custom-white hover:border-custom-white/40 transition-colors"
            title="Export"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI metric strip — values and date labels update with day selection */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <Kpi
          title={isMargin ? "TY Margin" : "TY Net Sales"}
          dateLabel={twLabel}
          value={fmt(twValue)}
          threshold={activeThreshold}
        />
        <Kpi
          title="vs Last Week"
          dateLabel={lwLabel}
          value={lwValue === null ? "—" : fmt(lwValue)}
          pct={lwPct}
          threshold={activeThreshold}
        />
        <Kpi
          title="vs Last Year"
          dateLabel={lyLabel}
          value={lyValue === null ? "—" : fmt(lyValue)}
          pct={lyPct}
          threshold={activeThreshold}
        />
      </div>

      {/* Day strip — sales/qty rising is good here, so higherIsWorse is off. */}
      <DayCardStrip
        days={dayCards}
        weekValue={fmt(valueOf(row.twNet, row.twCogs))}
        weekDelta={weekLyPct ?? weekLwPct}
        weekDeltaBasis={
          weekLyPct !== null ? "LY" : weekLwPct !== null ? "LW" : undefined
        }
        selected={selectedDay ?? ""}
        onSelect={(iso) => dispatch(setSelectedDay(iso === "" ? null : iso))}
        higherIsWorse={false}
      />

      {/* Items are the only report here — the table brings its own toolbar,
          so a one-tab strip above it would be decoration. Sub-department
          breakdowns live on Sub Dept Margins, not repeated per vendor. */}
      <ItemMarginsTable
        items={vendorRaw}
        gradingMetric={isMargin ? "margin" : "sales"}
        threshold={itemThreshold}
        thresholdDefault={VENDOR_ITEM_THRESHOLD_DEFAULT}
        onThresholdChange={(v) => dispatch(setItemThreshold(v))}
        selectedDay={selectedDay}
      />
    </div>
  );
};

export default VendorDetailPanel;
