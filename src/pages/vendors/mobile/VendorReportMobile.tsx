import { useMemo, useRef, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import { fmtDayLabel, fmtRangeLabel } from "../../../utils/dateLabels";
import {
  setSelectedDay,
  setSelectedVendor,
  VENDOR_THRESHOLD_DEFAULT,
} from "../../../features/vendorsSlice";
import BottomSheet from "../../../components/BottomSheet";
import SevBadge from "../../../components/SevBadge";
import {
  getVendorTier,
  marginPct,
  rowsForVendor,
  NO_VENDOR_LABEL,
  type VendorDay,
} from "../vendorsUtils";
import type { SubDeptMargin } from "../../../interfaces";
import { calculateCogs } from "../../subDepts";

/**
 * One vendor's week — the mobile equivalent of `VendorDetailPanel`.
 *
 * Walkthrough matches `LedgerStoreReport`, which is the canonical drill-down:
 * navy nav, a three-column KPI strip, a day strip that rescopes everything
 * below it, then the item list. Items open a `BottomSheet` rather than trying
 * to be a table — that's the rule for every Performance page.
 *
 * There is no tab strip. Vendors has exactly one report, and a one-tab strip
 * is decoration — the same call `VendorDetailPanel` makes on desktop.
 */

const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
const fmtPts = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)} pts`;

/** One aggregated item, all three periods. */
interface ItemAgg {
  code: string;
  desc: string;
  twNet: number;
  twQty: number;
  twCogs: number;
  lwNet: number | null;
  lwQty: number | null;
  lwCogs: number | null;
  lyNet: number | null;
  lyQty: number | null;
  lyCogs: number | null;
}

const netOf = (m: SubDeptMargin) => m.total_sales - m.total_tax;
const cogsOf = (m: SubDeptMargin) =>
  calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight);

/** Sum item rows by product code, optionally restricted to one date. */
const aggItems = (rows: SubDeptMargin[], day: string | null) => {
  const out = new Map<
    string,
    { desc: string; net: number; qty: number; cogs: number }
  >();
  for (const m of rows) {
    if (day && !m.sale_date.startsWith(day)) continue;
    const cur = out.get(m.product_code) ?? {
      desc: m.product_description,
      net: 0,
      qty: 0,
      cogs: 0,
    };
    cur.net += netOf(m);
    cur.qty += m.qty;
    cur.cogs += cogsOf(m);
    out.set(m.product_code, cur);
  }
  return out;
};

const VendorReportMobile = () => {
  const dispatch = useAppDispatch();
  const { rows, raw, metric, threshold, selectedVendor, selectedDay } =
    useAppSelector((s) => s.vendors);
  const [sheetCode, setSheetCode] = useState<string | null>(null);
  const sheetCloseRef = useRef<(() => void) | null>(null);

  const isMargin = metric === "margin";
  const activeThreshold = threshold ?? VENDOR_THRESHOLD_DEFAULT;

  const row = useMemo(
    () => rows.find((r) => r.vendorId === selectedVendor) ?? null,
    [rows, selectedVendor],
  );

  /** This vendor's item rows across all three periods. */
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

  /** The day strip's selection is the scope for the KPI strip and the items
   *  below, so LW and LY have to move with it — comparing a single TY day
   *  against a whole LW week is the mistake this alignment prevents. */
  const dayEntry: VendorDay | null = selectedDay
    ? (row?.days.find((d) => d.date.startsWith(selectedDay)) ?? null)
    : null;

  const items = useMemo((): ItemAgg[] => {
    const twMap = aggItems(vendorRaw.tw, selectedDay);
    // Item-level LW/LY stay at week scope even when a day is selected. The
    // vendor row's day entries carry aligned LW/LY dates; individual item rows
    // don't, and deriving an alignment here by date arithmetic would quietly
    // disagree with the day-matched KPI strip above. Selecting a day narrows
    // the TY side only.
    const lwMap = aggItems(vendorRaw.lw, null);
    const lyMap = aggItems(vendorRaw.ly, null);
    return [...twMap.entries()]
      .map(([code, ty]) => {
        const lw = lwMap.get(code) ?? null;
        const ly = lyMap.get(code) ?? null;
        return {
          code,
          desc: ty.desc,
          twNet: ty.net,
          twQty: ty.qty,
          twCogs: ty.cogs,
          lwNet: lw?.net ?? null,
          lwQty: lw?.qty ?? null,
          lwCogs: lw?.cogs ?? null,
          lyNet: ly?.net ?? null,
          lyQty: ly?.qty ?? null,
          lyCogs: ly?.cogs ?? null,
        };
      })
      .sort((a, b) => b.twNet - a.twNet);
  }, [vendorRaw, selectedDay]);

  if (!row) return null;

  const tier = getVendorTier(row, activeThreshold, metric);

  /* ── KPI values: the whole week, or the selected day ─────────────────── */
  const kTW = dayEntry ? dayEntry.twNet : row.twNet;
  const kTWCogs = dayEntry ? dayEntry.twCogs : row.twCogs;
  const kLW = dayEntry ? dayEntry.lwNet : row.hasLW ? row.lwNet : null;
  const kLWCogs = dayEntry ? (dayEntry.lwCogs ?? 0) : row.lwCogs;
  const kLY = dayEntry ? dayEntry.lyNet : row.hasLY ? row.lyNet : null;
  const kLYCogs = dayEntry ? (dayEntry.lyCogs ?? 0) : row.lyCogs;
  // Whole-week comparisons use the day-matched TY subtotal so a full TY week
  // is never measured against a partial LW or LY.
  const kTWForLW = dayEntry ? dayEntry.twNet : row.twNetForLW;
  const kTWForLWCogs = dayEntry ? dayEntry.twCogs : row.twCogsForLW;
  const kTWForLY = dayEntry ? dayEntry.twNet : row.twNetForLY;
  const kTWForLYCogs = dayEntry ? dayEntry.twCogs : row.twCogsForLY;

  const show = (net: number, cogs: number) =>
    isMargin ? `${marginPct(net, cogs).toFixed(2)}%` : formatCurrency2(net);

  const deltaOf = (
    twNet: number,
    twCogs: number,
    baseNet: number,
    baseCogs: number,
  ) =>
    isMargin
      ? marginPct(twNet, twCogs) - marginPct(baseNet, baseCogs)
      : baseNet > 0
        ? ((twNet - baseNet) / baseNet) * 100
        : 0;

  const fmtDelta = (n: number) => (isMargin ? fmtPts(n) : fmtPct(n));

  const pillClass = (n: number | null) => {
    if (n === null) return "bg-gray-100 text-gray-500";
    if (n < -activeThreshold) return "bg-red-100 text-red-800";
    if (n < 0) return "bg-amber-100 text-amber-800";
    return "bg-emerald-100 text-emerald-800";
  };

  const dayLabel = selectedDay
    ? fmtDayLabel(selectedDay)
    : fmtRangeLabel(row.days[0]?.date ?? "", row.days.at(-1)?.date ?? "");

  const sheetItem = items.find((i) => i.code === sheetCode) ?? null;

  return (
    <>
      <div className="flex flex-col h-[calc(100dvh-3rem)] bg-gray-50 overflow-hidden">
        {/* Nav */}
        <div className="bg-[#1e2a4a] px-3 pt-2 pb-2.5 flex items-start gap-3 flex-shrink-0">
          <button
            onClick={() => dispatch(setSelectedVendor(null))}
            aria-label="Back to vendors"
            className="text-custom-white/85 mt-0.5 flex-shrink-0"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-custom-white truncate">
              {row.noVendor ? NO_VENDOR_LABEL : row.vendorName}
            </div>
            <div className="text-[11px] mt-0.5 text-custom-white/85">
              {isMargin ? "Vendor margin" : "Vendor sales"}
            </div>
          </div>
          <SevBadge sev={tier} />
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 bg-custom-white border-b border-gray-100 flex-shrink-0">
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
              {isMargin ? "TY margin" : "TY net sales"}
            </div>
            <div className="text-[10px] text-content/85 mt-0.5">{dayLabel}</div>
            <div className="text-[12px] font-semibold text-content mt-0.5">
              {show(kTW, kTWCogs)}
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
              vs last week
            </div>
            <div className="text-[10px] text-content/85 mt-0.5">
              {kLW === null ? "no data" : "last week"}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[12px] font-semibold text-content">
                {kLW === null ? "—" : show(kLW, kLWCogs)}
              </span>
              {kLW !== null && (
                <span
                  className={`text-[10px] font-semibold ${
                    deltaOf(kTWForLW, kTWForLWCogs, kLW, kLWCogs) >= 0
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {fmtDelta(deltaOf(kTWForLW, kTWForLWCogs, kLW, kLWCogs))}
                </span>
              )}
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
              vs last year
            </div>
            <div className="text-[10px] text-content/85 mt-0.5">
              {kLY === null ? "no data" : "last year"}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[12px] font-semibold text-content">
                {kLY === null ? "—" : show(kLY, kLYCogs)}
              </span>
              {kLY !== null && (
                <span
                  className={`text-[10px] font-semibold ${
                    deltaOf(kTWForLY, kTWForLYCogs, kLY, kLYCogs) >= 0
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {fmtDelta(deltaOf(kTWForLY, kTWForLYCogs, kLY, kLYCogs))}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Day strip — ALL plus the week's days. Selecting one rescopes the
            KPI strip above and the TY column below it. */}
        <div className="grid grid-cols-8 bg-custom-white border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => dispatch(setSelectedDay(null))}
            className={`flex flex-col items-center justify-center py-2 border-r border-gray-100 transition-colors ${
              selectedDay === null ? "bg-[#1e2a4a]" : "hover:bg-gray-50"
            }`}
          >
            <span
              className={`text-[10px] font-bold ${selectedDay === null ? "text-custom-white" : "text-content"}`}
            >
              ALL
            </span>
            <span
              className={`text-[10px] mt-0.5 ${selectedDay === null ? "text-custom-white" : "text-content"}`}
            >
              wk
            </span>
          </button>
          {row.days.map((d) => {
            const iso = d.date.split("T")[0];
            const date = new Date(iso + "T12:00:00");
            const isSelected = selectedDay === iso;
            const hasLY = d.lyNet !== null && d.lyNet > 0;
            const hasLW = d.lwNet !== null && d.lwNet > 0;
            const hasRef = hasLY || hasLW;
            const refNet = hasLY ? (d.lyNet as number) : (d.lwNet ?? 0);
            const refCogs = hasLY ? (d.lyCogs ?? 0) : (d.lwCogs ?? 0);
            const isUp = !hasRef
              ? true
              : isMargin
                ? marginPct(d.twNet, d.twCogs) >= marginPct(refNet, refCogs)
                : d.twNet >= refNet;
            const dayBadgeColor = !hasRef
              ? "#9ca3af"
              : isUp
                ? "#10b981"
                : "#ef4444";
            return (
              <button
                key={d.date}
                onClick={() =>
                  dispatch(setSelectedDay(isSelected ? null : iso))
                }
                className={`flex flex-col items-center justify-center gap-1 py-2 border-r border-gray-100 last:border-r-0 transition-colors ${
                  isSelected ? "bg-[#1e2a4a]" : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-[10px] font-semibold leading-none ${isSelected ? "text-custom-white" : "text-content"}`}
                >
                  {date.toLocaleDateString("en-US", { weekday: "short" })}{" "}
                  <span
                    className={
                      isSelected ? "text-custom-white/85" : "text-content/85"
                    }
                  >
                    {date.toLocaleDateString("en-US", {
                      month: "numeric",
                      day: "numeric",
                    })}
                  </span>
                </span>
                <div className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center flex-shrink-0">
                  {!hasRef || isUp ? (
                    <CheckCircleIcon
                      className="w-5 h-5"
                      style={{ color: dayBadgeColor }}
                    />
                  ) : (
                    <ExclamationTriangleIcon
                      className="w-5 h-5"
                      style={{ color: dayBadgeColor }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto pb-14">
          {items.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
              No items for this vendor
            </div>
          ) : (
            items.map((item) => {
              const lwDelta =
                item.lwNet !== null && item.lwNet > 0
                  ? deltaOf(
                      item.twNet,
                      item.twCogs,
                      item.lwNet,
                      item.lwCogs ?? 0,
                    )
                  : null;
              const lyDelta =
                item.lyNet !== null && item.lyNet > 0
                  ? deltaOf(
                      item.twNet,
                      item.twCogs,
                      item.lyNet,
                      item.lyCogs ?? 0,
                    )
                  : null;
              return (
                <button
                  key={item.code}
                  onClick={() => setSheetCode(item.code)}
                  className="w-full px-3 py-2.5 bg-custom-white border-b border-gray-100 text-left active:bg-gray-50"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex-1 text-[12px] font-medium text-content truncate">
                      {item.desc}
                    </span>
                    <div className="flex items-baseline gap-2 flex-shrink-0">
                      <span className="text-[12px] font-semibold text-content">
                        {show(item.twNet, item.twCogs)}
                      </span>
                      <span className="text-[11px] text-content/85">
                        {item.twQty.toLocaleString()} u
                      </span>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-content/85 flex-shrink-0" />
                  </div>
                  <div className="flex gap-2 mt-1.5 justify-end">
                    <span
                      className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${pillClass(lwDelta)}`}
                    >
                      LW {lwDelta === null ? "—" : fmtDelta(lwDelta)}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${pillClass(lyDelta)}`}
                    >
                      LY {lyDelta === null ? "—" : fmtDelta(lyDelta)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Item detail — the shared Performance-page treatment: a BottomSheet
          with a TY/LW/LY column set, never a shrunken table. */}
      {sheetItem && (
        <BottomSheet
          onClose={() => setSheetCode(null)}
          closeRef={sheetCloseRef}
        >
          <div className="px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
            <div className="text-[14px] font-semibold text-content">
              {sheetItem.desc}
            </div>
            <div className="text-[10px] text-content/85 mt-0.5">
              {sheetItem.code} · {dayLabel}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
              {(
                [
                  ["TY", sheetItem.twNet, sheetItem.twCogs, sheetItem.twQty],
                  ["LW", sheetItem.lwNet, sheetItem.lwCogs, sheetItem.lwQty],
                  ["LY", sheetItem.lyNet, sheetItem.lyCogs, sheetItem.lyQty],
                ] as const
              ).map(([label, net, cogs, qty]) => (
                <div key={label} className="px-3 py-2.5">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
                    {label}
                  </div>
                  <div className="text-[12px] font-semibold text-content mt-0.5">
                    {net === null ? "—" : show(net, cogs ?? 0)}
                  </div>
                  {qty !== null && (
                    <div className="text-[10px] text-content/85 mt-0.5">
                      {qty.toLocaleString()} u
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Both figures, whichever the toggle is on — the sheet is where
                someone has come for the detail, so withholding the other half
                of the pair just costs them a trip back to desktop. */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[12px] text-content/90">TY net sales</span>
              <span className="text-[13px] font-semibold text-content">
                {formatCurrency2(sheetItem.twNet)}
              </span>
            </div>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[12px] text-content/90">TY margin</span>
              <span className="text-[13px] font-semibold text-content">
                {marginPct(sheetItem.twNet, sheetItem.twCogs).toFixed(2)}%
              </span>
            </div>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[12px] text-content/90">TY COGS</span>
              <span className="text-[13px] font-medium text-content">
                {formatCurrency2(sheetItem.twCogs)}
              </span>
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
};

export default VendorReportMobile;
