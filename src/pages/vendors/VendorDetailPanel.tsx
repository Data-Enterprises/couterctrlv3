import { useMemo, useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { formatCurrency2, formatBigNumber } from "../../utils";
import {
  pillClass,
  formatPct,
  severityDotClass,
  severityHeaderBgClass,
  type Severity,
} from "../../utils/severity";
import {
  LW_OFFSET,
  LY_OFFSET,
  isoOf,
  shiftIso,
  pctChange,
  tierOfDelta,
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
import type { SubDeptMargin } from "../../interfaces";

type Tab = "items" | "depts";

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

const byDate = (src: SubDeptMargin[], iso: string) =>
  src.filter((m) => isoOf(m.sale_date) === iso);

const netOf = (m: SubDeptMargin) => m.total_sales - m.total_tax;

const VendorDetailPanel = () => {
  const dispatch = useAppDispatch();
  const vend = useAppSelector((s) => s.vendors);
  const { rows, raw, metric, threshold, selectedVendor, selectedDay, itemThreshold } =
    vend;

  const [tab, setTab] = useState<Tab>("items");
  const [exportOpen, setExportOpen] = useState(false);

  const activeThreshold = threshold ?? VENDOR_THRESHOLD_DEFAULT;
  const isQty = metric === "qty";
  const fmt = (n: number) => (isQty ? formatBigNumber(n, 0) : formatCurrency2(n));

  const row = useMemo(
    () => rows.find((r) => r.vendorId === selectedVendor) ?? null,
    [rows, selectedVendor],
  );

  /** This vendor's item rows, all three periods. The Items tab and the Sub
   *  departments tab both read from here. */
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

  /** Narrowed to the selected day, so the departments below agree with the KPI
   *  strip above them. */
  const scoped = useMemo(() => {
    if (!selectedDay) return vendorRaw;
    return {
      tw: byDate(vendorRaw.tw, selectedDay),
      lw: byDate(vendorRaw.lw, shiftIso(selectedDay, LW_OFFSET)),
      ly: byDate(vendorRaw.ly, shiftIso(selectedDay, LY_OFFSET)),
    };
  }, [vendorRaw, selectedDay]);

  /** Which departments this vendor reaches, graded. A vendor can hold overall
   *  while quietly losing one department, which is the thing this tab is for. */
  const deptRows = useMemo(() => {
    const agg = (src: SubDeptMargin[]) => {
      const m = new Map<number, { desc: string; net: number; qty: number }>();
      for (const r of src) {
        const cur = m.get(r.sub_department) ?? {
          desc: r.sub_department_description,
          net: 0,
          qty: 0,
        };
        cur.net += netOf(r);
        cur.qty += r.qty;
        m.set(r.sub_department, cur);
      }
      return m;
    };
    const tw = agg(scoped.tw);
    const lw = agg(scoped.lw);
    const ly = agg(scoped.ly);

    return [...tw.entries()]
      .map(([id, t]) => {
        const l = lw.get(id);
        const y = ly.get(id);
        const val = (b?: { net: number; qty: number }) =>
          b ? (isQty ? b.qty : b.net) : null;
        const twVal = isQty ? t.qty : t.net;
        const lwVal = val(l);
        const lyVal = val(y);
        const lwPct = lwVal === null || lwVal === 0 ? null : pctChange(twVal, lwVal);
        const lyPct = lyVal === null || lyVal === 0 ? null : pctChange(twVal, lyVal);
        const primary = lyPct ?? lwPct;
        return {
          id,
          desc: t.desc || `Sub dept ${id}`,
          twVal,
          lwVal,
          lyVal,
          lwPct,
          lyPct,
          tier: tierOfDelta(primary, activeThreshold),
        };
      })
      .sort((a, b) => {
        const rank = { critical: 0, watch: 1, healthy: 2, ungraded: 3 };
        const d = rank[a.tier] - rank[b.tier];
        return d !== 0 ? d : b.twVal - a.twVal;
      });
  }, [scoped, isQty, activeThreshold]);

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
        selected={selectedDay ?? ""}
        onSelect={(iso) => dispatch(setSelectedDay(iso === "" ? null : iso))}
        higherIsWorse={false}
      />

      {/* Tabs */}
      <div className="flex items-center border-b border-gray-100 px-3 flex-shrink-0">
        {(["items", "depts"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
              tab === k
                ? "border-[#1e2a4a] text-content"
                : "border-transparent text-content/70 hover:text-content/80"
            }`}
          >
            {k === "items" ? "Items" : "Sub departments"}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-[10px] text-content/55 pr-1">
          {row.itemCount} {row.itemCount === 1 ? "item" : "items"} ·{" "}
          {row.subDeptCount} {row.subDeptCount === 1 ? "dept" : "depts"}
        </span>
      </div>

      {tab === "items" && (
        <ItemMarginsTable
          items={vendorRaw}
          gradingMetric={isQty ? "qty" : "sales"}
          threshold={itemThreshold}
          thresholdDefault={VENDOR_ITEM_THRESHOLD_DEFAULT}
          onThresholdChange={(v) => dispatch(setItemThreshold(v))}
          selectedDay={selectedDay}
        />
      )}

      {tab === "depts" && (
        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
          <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-gray-100 flex-shrink-0 sticky top-0 bg-custom-white z-10">
            <span className="w-2.5 flex-shrink-0" />
            <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-1">
              Sub department
            </span>
            <div className="flex items-center gap-[14px]">
              <span
                className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 text-right"
                style={{ width: 64 }}
              >
                TY
              </span>
              <span
                className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 text-center"
                style={{ width: 58 }}
              >
                vs LW
              </span>
              <span
                className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 text-center"
                style={{ width: 58 }}
              >
                vs LY
              </span>
            </div>
          </div>

          {deptRows.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-[11px] text-content/40">
              Nothing from this vendor in the selected range
            </div>
          ) : (
            deptRows.map((d) => (
              <div
                key={d.id}
                className="w-full flex items-center gap-2.5 p-3 text-left border-b border-b-[#1e2a4a]/15"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    d.tier === "ungraded"
                      ? "bg-gray-300"
                      : severityDotClass[d.tier as Severity]
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-content truncate">
                    {d.desc}
                  </div>
                  <div className="text-[12px] text-content/85 truncate">
                    LW{" "}
                    <span className="font-semibold">
                      {d.lwVal === null ? "—" : fmt(d.lwVal)}
                    </span>{" "}
                    · LY{" "}
                    <span className="font-semibold">
                      {d.lyVal === null ? "—" : fmt(d.lyVal)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-[14px]">
                  <span
                    className="text-[13px] font-semibold text-content flex-shrink-0 pl-2.5 text-right"
                    style={{ width: 64 }}
                  >
                    {fmt(d.twVal)}
                  </span>
                  <span
                    className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${pillClass(d.lwPct, activeThreshold)}`}
                    style={{ width: 58 }}
                  >
                    {d.lwPct === null ? "—" : formatPct(d.lwPct)}
                  </span>
                  <span
                    className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${pillClass(d.lyPct, activeThreshold)}`}
                    style={{ width: 58 }}
                  >
                    {d.lyPct === null ? "—" : formatPct(d.lyPct)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default VendorDetailPanel;
