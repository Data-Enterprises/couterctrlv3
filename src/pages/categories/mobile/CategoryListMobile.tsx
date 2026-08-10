import { useMemo, useRef, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setThreshold,
  setSelectedCategory,
  setSelectedDay,
  CATEGORY_THRESHOLD_DEFAULT,
} from "../../../features/categoriesSlice";
import type { SevFilter } from "../../../features/salesLedgerSlice";
import ThresholdFilter from "../../../components/filters/ThresholdFilter";
import SevChips from "../../../components/SevChips";
import MobileKpiStrip from "../../../components/mobile/MobileKpiStrip";
import MobileDayStrip from "../../../components/mobile/MobileDayStrip";
import MobileSignalRow from "../../../components/mobile/MobileSignalRow";
import { fmtDayLabel, fmtRangeLabel } from "../../../utils/dateLabels";
import { formatCurrency2 } from "../../../utils";
import {
  getTier,
  sortGraded,
  shiftIso,
  LW_OFFSET,
  LY_OFFSET,
} from "../categoriesUtils";

/**
 * The graded category list — the mobile equivalent of `CategoryListPanel`.
 *
 * Laid out like the Sub Depts view on Sales mobile: KPI strip, day cards,
 * severity chips, then one compact row per category. Categories is
 * single-store, so this screen already sits where Sales' store report does —
 * the rows don't need to repeat the week's context the strip above carries.
 *
 * No metric toggle: that stays a desktop control.
 */

const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

/** The chip row's own filter. Wider than `SevFilter` because a category with
 *  neither last week nor last year can't be graded — folding those into
 *  "healthy" would claim a pass nothing measured. */
type CategoryFilter = SevFilter | "ungraded";

const CategoryListMobile = ({ onSearch }: { onSearch: () => void }) => {
  const dispatch = useAppDispatch();
  const { rows, metric, threshold, storeName, twStart, twEnd, selectedDay } =
    useAppSelector((s) => s.categories);
  const [sevFilter, setSevFilter] = useState<CategoryFilter>("all");

  const isQty = metric === "qty";

  // Grading should never move categories around on its own while the threshold
  // input sits empty mid-edit.
  const thresholdRef = useRef<number>(threshold ?? CATEGORY_THRESHOLD_DEFAULT);
  if (threshold != null) thresholdRef.current = threshold;
  const activeThreshold = thresholdRef.current;

  const pick = (net: number, qty: number) => (isQty ? qty : net);
  const fmtVal = (v: number) =>
    isQty ? `${v.toLocaleString()} u` : formatCurrency2(v);
  const pct = (tw: number, prior: number) =>
    prior > 0 ? ((tw - prior) / prior) * 100 : null;

  /**
   * Store totals, summed across every category. Each comparison sums the rows'
   * own day-matched subtotals, never the plain TY total, so the strip can't
   * measure a full week against a partial one.
   */
  const totals = useMemo(() => {
    const z = {
      tw: 0,
      lw: 0,
      twForLW: 0,
      ly: 0,
      twForLY: 0,
      hasLW: false,
      hasLY: false,
    };
    for (const r of rows) {
      z.tw += pick(r.twNet, r.twQty);
      if (r.hasLW) {
        z.hasLW = true;
        z.lw += pick(r.lwNet, r.lwQty);
        z.twForLW += pick(r.twNetForLW, r.twQtyForLW);
      }
      if (r.hasLY) {
        z.hasLY = true;
        z.ly += pick(r.lyNet, r.lyQty);
        z.twForLY += pick(r.twNetForLY, r.twQtyForLY);
      }
    }
    return z;
  }, [rows, isQty]);

  /** The store's week day by day — every category's day summed onto its date. */
  const days = useMemo(() => {
    const map = new Map<
      string,
      { tw: number; lw: number; ly: number; hasLW: boolean; hasLY: boolean }
    >();
    for (const r of rows) {
      for (const d of r.days) {
        const cur = map.get(d.date) ?? {
          tw: 0,
          lw: 0,
          ly: 0,
          hasLW: false,
          hasLY: false,
        };
        cur.tw += pick(d.twNet, d.twQty);
        const lwVal = isQty ? d.lwQty : d.lwNet;
        const lyVal = isQty ? d.lyQty : d.lyNet;
        if (lwVal !== null) {
          cur.hasLW = true;
          cur.lw += lwVal;
        }
        if (lyVal !== null) {
          cur.hasLY = true;
          cur.ly += lyVal;
        }
        map.set(d.date, cur);
      }
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => {
        const hasRef = v.hasLY || v.hasLW;
        const ref = v.hasLY ? v.ly : v.lw;
        return { date, hasRef, isUp: !hasRef ? true : v.tw >= ref };
      });
  }, [rows, isQty]);

  const graded = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        tier: getTier(row, activeThreshold, metric),
      })),
    [rows, activeThreshold, metric],
  );

  const counts: Record<SevFilter, number> = {
    all: graded.length,
    critical: graded.filter((g) => g.tier === "critical").length,
    watch: graded.filter((g) => g.tier === "watch").length,
    healthy: graded.filter((g) => g.tier === "healthy").length,
  };
  const ungradedCount = graded.filter((g) => g.tier === "ungraded").length;

  const visible = sortGraded(
    graded.filter((g) => sevFilter === "all" || g.tier === sevFilter),
    metric,
  );

  const labelFor = (offset: number) =>
    selectedDay
      ? fmtDayLabel(shiftIso(selectedDay, offset))
      : fmtRangeLabel(shiftIso(twStart, offset), shiftIso(twEnd, offset));

  const lwDelta = totals.hasLW ? pct(totals.twForLW, totals.lw) : null;
  const lyDelta = totals.hasLY ? pct(totals.twForLY, totals.ly) : null;

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] bg-gray-50 overflow-hidden">
      {/* Navy header — unchanged */}
      <div
        className="flex-shrink-0 px-3 pt-2 pb-2.5"
        style={{ background: "#1e2a4a" }}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-custom-white truncate">
              {storeName}
            </div>
            <div className="text-[11px] mt-0.5 text-custom-white/85">
              {fmtRangeLabel(twStart, twEnd)}
            </div>
          </div>
          <button
            onClick={onSearch}
            aria-label="New search"
            className="w-[30px] h-[30px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/85 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0 mt-0.5"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-red-200 flex-shrink-0" />
              <span className="text-custom-white/85 text-[10px]">
                Critical &gt;{activeThreshold}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-amber-200 flex-shrink-0" />
              <span className="text-custom-white/85 text-[10px]">
                Watch ≤{activeThreshold}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-emerald-200 flex-shrink-0" />
              <span className="text-custom-white/85 text-[10px]">Healthy</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-custom-white/85">Threshold</span>
            <ThresholdFilter
              value={
                threshold === null ? null : { op: "gt", amount: threshold }
              }
              onChange={(v) => dispatch(setThreshold(v?.amount ?? null))}
              suffix="%"
              showOp={false}
              showClear={false}
              inputWidth={40}
              variant="dark"
            />
          </div>
        </div>
      </div>

      <MobileKpiStrip
        cells={[
          {
            label: isQty ? "TY units" : "TY net sales",
            dateLabel: labelFor(0),
            value: fmtVal(totals.tw),
          },
          {
            label: "vs last week",
            dateLabel: labelFor(LW_OFFSET),
            value: totals.hasLW ? fmtVal(totals.lw) : "—",
            delta:
              lwDelta === null
                ? null
                : { text: fmtPct(lwDelta), up: lwDelta >= 0 },
          },
          {
            label: "vs last year",
            dateLabel: labelFor(LY_OFFSET),
            value: totals.hasLY ? fmtVal(totals.ly) : "—",
            delta:
              lyDelta === null
                ? null
                : { text: fmtPct(lyDelta), up: lyDelta >= 0 },
          },
        ]}
      />

      <MobileDayStrip
        days={days}
        selected={selectedDay}
        onSelect={(d) => dispatch(setSelectedDay(d))}
      />

      <SevChips
        active={sevFilter}
        counts={counts}
        onChange={setSevFilter}
        extra={{
          label: "Ungraded",
          count: ungradedCount,
          active: sevFilter === "ungraded",
          onClick: () =>
            setSevFilter((f) => (f === "ungraded" ? "all" : "ungraded")),
        }}
      />

      {/* pb-14 clears the fixed bottom tab bar, which is outside document flow
          and would otherwise hide the last row. */}
      <div className="flex-1 overflow-y-auto pb-14">
        {visible.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
            No categories match filter
          </div>
        ) : (
          visible.map((row) => {
            // The day strip narrows the headline figure. The comparisons stay
            // at week scope so a day-scoped pill never sits beside a
            // week-scoped severity badge.
            const d = selectedDay
              ? row.days.find((x) => x.date === selectedDay)
              : null;
            const tw = d ? pick(d.twNet, d.twQty) : pick(row.twNet, row.twQty);
            const lw = row.hasLW
              ? pct(
                  pick(row.twNetForLW, row.twQtyForLW),
                  pick(row.lwNet, row.lwQty),
                )
              : null;
            const ly = row.hasLY
              ? pct(
                  pick(row.twNetForLY, row.twQtyForLY),
                  pick(row.lyNet, row.lyQty),
                )
              : null;
            return (
              <MobileSignalRow
                key={row.category}
                sev={row.tier}
                label={
                  row.uncategorized
                    ? "Uncategorized"
                    : (row.description ?? `Category ${row.category}`)
                }
                value={fmtVal(tw)}
                sub={
                  isQty
                    ? undefined
                    : `${(d ? d.twQty : row.twQty).toLocaleString()} u`
                }
                lw={{ text: lw === null ? "—" : fmtPct(lw), pct: lw }}
                ly={{ text: ly === null ? "—" : fmtPct(ly), pct: ly }}
                threshold={activeThreshold}
                onClick={() => dispatch(setSelectedCategory(row.category))}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default CategoryListMobile;
