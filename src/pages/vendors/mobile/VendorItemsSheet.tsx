import { useMemo, useRef, useState } from "react";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import { fmtDayLabel, fmtRangeLabel } from "../../../utils/dateLabels";
import {
  shiftIso,
  tierOfDelta,
  deltaPillClass,
  LW_OFFSET,
  LY_OFFSET,
  type Tier,
} from "../../../utils/grading";
import {
  setSelectedVendor,
  setItemThreshold,
  VENDOR_THRESHOLD_DEFAULT,
  VENDOR_ITEM_THRESHOLD_DEFAULT,
} from "../../../features/vendorsSlice";
import type { SevFilter } from "../../../features/salesLedgerSlice";
import { BADGE_BG, BADGE_COLOR } from "../../sales/shared/ledgerUtils";
import BottomSheet from "../../../components/BottomSheet";
import SevBadge from "../../../components/SevBadge";
import SevChips from "../../../components/SevChips";
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
 * One vendor's week, as a BottomSheet.
 *
 * Same construction as the sub-department sheet on Sales mobile: header with
 * the entity and its grade, a three-column TY/LW/LY strip, a filter bar, the
 * severity chips, then every item as its own TY/LW/LY card. Picking a vendor
 * from the list opens this — there is no separate report screen, because the
 * vendor list is already the screen you picked it from.
 *
 * The day strip lives on the list screen behind this, not in here — same as
 * Sales, where the store report owns the strip and the sheet simply inherits
 * whichever day is selected.
 */

const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
// Margin deltas are percentage points, but shown with a % sign for
// consistency with the sales side and the rest of mobile.
const fmtPts = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

const netOf = (m: SubDeptMargin) => m.total_sales - m.total_tax;
const cogsOf = (m: SubDeptMargin) =>
  calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight);

interface Agg {
  desc: string;
  net: number;
  qty: number;
  weight: number;
  cogs: number;
}

/** Sum item rows by product code, optionally restricted to one date. */
const aggItems = (rows: SubDeptMargin[], day: string | null) => {
  const out = new Map<string, Agg>();
  for (const m of rows) {
    if (day && !m.sale_date.startsWith(day)) continue;
    const cur = out.get(m.product_code) ?? {
      desc: m.product_description,
      net: 0,
      qty: 0,
      weight: 0,
      cogs: 0,
    };
    cur.net += netOf(m);
    cur.qty += m.qty;
    cur.weight += m.weight ?? 0;
    cur.cogs += cogsOf(m);
    out.set(m.product_code, cur);
  }
  return out;
};

const VendorItemsSheet = () => {
  const dispatch = useAppDispatch();
  const {
    rows,
    raw,
    metric,
    threshold,
    itemThreshold,
    selectedVendor,
    selectedDay,
  } = useAppSelector((s) => s.vendors);
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [thresholdInput, setThresholdInput] = useState(
    itemThreshold === null ? "" : String(itemThreshold),
  );
  const sheetCloseRef = useRef<(() => void) | null>(null);

  const isMargin = metric === "margin";
  const activeThreshold = threshold ?? VENDOR_THRESHOLD_DEFAULT;

  // Grading shouldn't reshuffle items while the input sits empty mid-edit.
  const itemThresholdRef = useRef<number>(
    itemThreshold ?? VENDOR_ITEM_THRESHOLD_DEFAULT,
  );
  if (itemThreshold != null) itemThresholdRef.current = itemThreshold;
  const effItemThreshold = itemThresholdRef.current;

  const row = useMemo(
    () => rows.find((r) => r.vendorId === selectedVendor) ?? null,
    [rows, selectedVendor],
  );

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

  const dayEntry: VendorDay | null = selectedDay
    ? (row?.days.find((d) => d.date.startsWith(selectedDay)) ?? null)
    : null;

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

  const pillClass = (n: number | null, t = activeThreshold) =>
    deltaPillClass(n, t);

  /** TY narrows with the day strip; LW and LY stay at week scope. Item rows
   *  carry no aligned comparison dates of their own, and deriving one here by
   *  date arithmetic would quietly disagree with the day-matched strip above. */
  const items = useMemo(() => {
    const tw = aggItems(vendorRaw.tw, selectedDay);
    const lw = aggItems(vendorRaw.lw, null);
    const ly = aggItems(vendorRaw.ly, null);
    return [...tw.entries()]
      .map(([code, t]) => {
        const l = lw.get(code) ?? null;
        const y = ly.get(code) ?? null;
        const lwDelta = l ? deltaOf(t.net, t.cogs, l.net, l.cogs) : null;
        const lyDelta = y ? deltaOf(t.net, t.cogs, y.net, y.cogs) : null;
        return {
          code,
          ty: t,
          lw: l,
          ly: y,
          lwDelta,
          lyDelta,
          // Graded on last year when there is one, else last week — the same
          // fallback `vendorDelta` uses for the vendor itself, so an item's
          // marker can't contradict the row it came from.
          sev: tierOfDelta(lyDelta ?? lwDelta, effItemThreshold) as Tier,
        };
      })
      .sort((a, b) => b.ty.net - a.ty.net);
  }, [vendorRaw, selectedDay, isMargin, effItemThreshold]);

  const counts: Record<SevFilter, number> = {
    all: items.length,
    critical: items.filter((i) => i.sev === "critical").length,
    watch: items.filter((i) => i.sev === "watch").length,
    healthy: items.filter((i) => i.sev === "healthy").length,
  };
  const visible =
    sevFilter === "all" ? items : items.filter((i) => i.sev === sevFilter);

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

  const twFirst = row.days[0]?.date.split("T")[0] ?? "";
  const twLast = row.days.at(-1)?.date.split("T")[0] ?? "";
  const labelFor = (offset: number) =>
    selectedDay
      ? fmtDayLabel(shiftIso(selectedDay, offset))
      : fmtRangeLabel(shiftIso(twFirst, offset), shiftIso(twLast, offset));
  const dayLabel = labelFor(0);
  const lwLabel = labelFor(LW_OFFSET);
  const lyLabel = labelFor(LY_OFFSET);

  const sevLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <BottomSheet
      onClose={() => dispatch(setSelectedVendor(null))}
      closeRef={sheetCloseRef}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-content truncate">
            {row.noVendor ? NO_VENDOR_LABEL : row.vendorName}
          </div>
          <div className="text-[10px] text-content/85 mt-0.5">{dayLabel}</div>
        </div>
        <div
          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
          style={
            tier === "ungraded"
              ? { background: "#f3f4f6", color: "#6b7280" }
              : { background: BADGE_BG[tier], color: BADGE_COLOR[tier] }
          }
        >
          {tier === "critical" && (
            <ExclamationTriangleIcon className="w-3 h-3" />
          )}
          {tier === "watch" && <ExclamationCircleIcon className="w-3 h-3" />}
          {tier === "healthy" && <CheckCircleIcon className="w-3 h-3" />}
          {sevLabel}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* 3-col TY / LW / LY */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          <div className="px-3 py-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-content/85">
                TY
              </span>
              <span className="text-[10px] text-content/85">{dayLabel}</span>
            </div>
            <div className="text-[12px] font-semibold text-content mt-0.5">
              {show(kTW, kTWCogs)}
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-content/85">
                LW
              </span>
              <span className="text-[10px] text-content/85">{lwLabel}</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[12px] font-semibold text-content">
                {kLW === null ? "—" : show(kLW, kLWCogs)}
              </span>
              {kLW !== null && (
                <span
                  className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${pillClass(deltaOf(kTWForLW, kTWForLWCogs, kLW, kLWCogs))}`}
                >
                  {fmtDelta(deltaOf(kTWForLW, kTWForLWCogs, kLW, kLWCogs))}
                </span>
              )}
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-content/85">
                LY
              </span>
              <span className="text-[10px] text-content/85">{lyLabel}</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[12px] font-semibold text-content">
                {kLY === null ? "—" : show(kLY, kLYCogs)}
              </span>
              {kLY !== null && (
                <span
                  className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${pillClass(deltaOf(kTWForLY, kTWForLYCogs, kLY, kLYCogs))}`}
                >
                  {fmtDelta(deltaOf(kTWForLY, kTWForLYCogs, kLY, kLYCogs))}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Item threshold */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-100">
          <span className="text-[11px] font-medium text-content">
            Items ({items.length})
          </span>
          <div className="flex-1" />
          <span className="text-[10px] text-content/85">Threshold</span>
          <input
            type="number"
            min={1}
            max={99}
            value={thresholdInput}
            onChange={(e) => {
              setThresholdInput(e.target.value);
              if (e.target.value === "") {
                dispatch(setItemThreshold(null));
                return;
              }
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1 && v <= 99) dispatch(setItemThreshold(v));
            }}
            onBlur={() => {
              const v = parseInt(thresholdInput, 10);
              if (thresholdInput !== "" && (isNaN(v) || v < 1 || v > 99))
                setThresholdInput(
                  itemThreshold === null ? "" : String(itemThreshold),
                );
            }}
            className="w-9 text-center text-[10px] bg-custom-white border border-gray-200 rounded px-1 py-px focus:outline-none focus:border-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-[10px] text-content/85">%</span>
        </div>

        <SevChips active={sevFilter} counts={counts} onChange={setSevFilter} />

        {/* Every item, as its own TY/LW/LY card */}
        {visible.length === 0 ? (
          <div className="px-4 py-8 text-center text-[11px] text-content/85">
            No items match filter
          </div>
        ) : (
          visible.map((item) => (
            <div
              key={item.code}
              className="px-4 py-2.5 border-b border-gray-100"
            >
              <div className="flex items-start gap-2">
                <SevBadge sev={item.sev} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="text-[12px] font-medium text-content truncate"
                      style={{ maxWidth: "55%" }}
                    >
                      {item.ty.desc}
                    </span>
                    <span className="text-[10px] text-content/85 flex-shrink-0">
                      {item.code}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-gray-100 border border-gray-100 rounded mt-1.5">
                    <div className="px-2 py-1.5">
                      <div className="text-[11px] text-content/85 uppercase tracking-wide">
                        TY
                      </div>
                      <div className="text-[11px] font-semibold text-content mt-0.5">
                        {show(item.ty.net, item.ty.cogs)}
                      </div>
                      <div className="text-[11px] text-content/85 mt-0.5">
                        {item.ty.qty.toLocaleString()} u
                      </div>
                      {item.ty.weight > 0 && (
                        <div className="text-[11px] text-content/85 mt-0.5">
                          {item.ty.weight.toFixed(2)} lb
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <div className="text-[11px] text-content/85 uppercase tracking-wide">
                        LW
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[11px] font-semibold text-content">
                          {item.lw ? show(item.lw.net, item.lw.cogs) : "—"}
                        </span>
                        {item.lwDelta !== null && (
                          <span
                            className={`text-[11px] font-semibold px-1 py-0.5 rounded ${pillClass(item.lwDelta, effItemThreshold)}`}
                          >
                            {fmtDelta(item.lwDelta)}
                          </span>
                        )}
                      </div>
                      {item.lw && (
                        <div className="text-[11px] text-content/85 mt-0.5">
                          {item.lw.qty.toLocaleString()} u
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <div className="text-[11px] text-content/85 uppercase tracking-wide">
                        LY
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[11px] font-semibold text-content">
                          {item.ly ? show(item.ly.net, item.ly.cogs) : "—"}
                        </span>
                        {item.lyDelta !== null && (
                          <span
                            className={`text-[11px] font-semibold px-1 py-0.5 rounded ${pillClass(item.lyDelta, effItemThreshold)}`}
                          >
                            {fmtDelta(item.lyDelta)}
                          </span>
                        )}
                      </div>
                      {item.ly && (
                        <div className="text-[11px] text-content/85 mt-0.5">
                          {item.ly.qty.toLocaleString()} u
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </BottomSheet>
  );
};

export default VendorItemsSheet;
