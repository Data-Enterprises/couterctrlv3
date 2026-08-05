import { useMemo, useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { formatCurrency2, formatBigNumber } from "../../utils";
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
import { getVendorTier, rowsForVendor } from "./vendorsUtils";

/** Ungraded has no severity colour of its own, so the header falls back to the
 *  navy every other panel uses rather than borrowing a verdict colour. */
const headerBg = (tier: Tier) =>
  tier === "ungraded" ? "bg-[#1e2a4a]" : severityHeaderBgClass[tier as Severity];

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
  const { rows, raw, metric, threshold, selectedVendor, selectedDay, itemThreshold } =
    vend;

  const [exportOpen, setExportOpen] = useState(false);

  const activeThreshold = threshold ?? VENDOR_THRESHOLD_DEFAULT;
  const isQty = metric === "qty";
  const fmt = (n: number) => (isQty ? formatBigNumber(n, 0) : formatCurrency2(n));

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

  const dayTw = (d: typeof row.days[number]) => (isQty ? d.twQty : d.twNet);
  const dayLw = (d: typeof row.days[number]) => (isQty ? d.lwQty : d.lwNet);
  const dayLy = (d: typeof row.days[number]) => (isQty ? d.lyQty : d.lyNet);

  const twValue = activeDay ? dayTw(activeDay) : isQty ? row.twQty : row.twNet;
  const lwValue = activeDay
    ? dayLw(activeDay)
    : row.hasLW
      ? (isQty ? row.lwQty : row.lwNet)
      : null;
  const lyValue = activeDay
    ? dayLy(activeDay)
    : row.hasLY
      ? (isQty ? row.lyQty : row.lyNet)
      : null;
  const twForLW = activeDay ? dayTw(activeDay) : isQty ? row.twQtyForLW : row.twNetForLW;
  const twForLY = activeDay ? dayTw(activeDay) : isQty ? row.twQtyForLY : row.twNetForLY;
  const lwPct = lwValue === null || lwValue === 0 ? null : pctChange(twForLW, lwValue);
  const lyPct = lyValue === null || lyValue === 0 ? null : pctChange(twForLY, lyValue);

  const twLabel = selectedDay
    ? fmtDayLabel(selectedDay)
    : fmtRangeLabel(vend.twStart, vend.twEnd);
  const lwLabel = selectedDay
    ? fmtDayLabel(shiftIso(selectedDay, LW_OFFSET))
    : fmtRangeLabel(shiftIso(vend.twStart, LW_OFFSET), shiftIso(vend.twEnd, LW_OFFSET));
  const lyLabel = selectedDay
    ? fmtDayLabel(shiftIso(selectedDay, LY_OFFSET))
    : fmtRangeLabel(shiftIso(vend.twStart, LY_OFFSET), shiftIso(vend.twEnd, LY_OFFSET));

  /* ── Day strip ─────────────────────────────────────────────────────────── */

  const dayCards: DayCardEntry[] = row.days.map((d) => {
    const l = dayLw(d);
    const y = dayLy(d);
    const lp = l === null || l === 0 ? null : pctChange(dayTw(d), l);
    const yp = y === null || y === 0 ? null : pctChange(dayTw(d), y);
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
    row.hasLW && (isQty ? row.lwQty : row.lwNet) > 0
      ? pctChange(isQty ? row.twQtyForLW : row.twNetForLW, isQty ? row.lwQty : row.lwNet)
      : null;
  const weekLyPct =
    row.hasLY && (isQty ? row.lyQty : row.lyNet) > 0
      ? pctChange(isQty ? row.twQtyForLY : row.twNetForLY, isQty ? row.lyQty : row.lyNet)
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
        <button
          onClick={() => setExportOpen(true)}
          className="justify-self-end w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/60 hover:text-custom-white hover:border-custom-white/40 transition-colors"
          title="Export"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
        </button>
      </div>

      {/* KPI metric strip — values and date labels update with day selection */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <Kpi
          title={isQty ? "TY Qty" : "TY Net Sales"}
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
        weekValue={fmt(isQty ? row.twQty : row.twNet)}
        weekDelta={weekLyPct ?? weekLwPct}
        weekDeltaBasis={weekLyPct !== null ? "LY" : weekLwPct !== null ? "LW" : undefined}
        selected={selectedDay ?? ""}
        onSelect={(iso) => dispatch(setSelectedDay(iso === "" ? null : iso))}
        higherIsWorse={false}
      />

      {/* Items are the only report here — the table brings its own toolbar,
          so a one-tab strip above it would be decoration. Sub-department
          breakdowns live on Sub Dept Margins, not repeated per vendor. */}
      <ItemMarginsTable
        items={vendorRaw}
        gradingMetric={isQty ? "qty" : "sales"}
        threshold={itemThreshold}
        thresholdDefault={VENDOR_ITEM_THRESHOLD_DEFAULT}
        onThresholdChange={(v) => dispatch(setItemThreshold(v))}
        selectedDay={selectedDay}
      />

    </div>
  );
};

export default VendorDetailPanel;
