import { useMemo, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setThreshold,
  setSelectedVendor,
  setSelectedDay,
  VENDOR_THRESHOLD_DEFAULT,
} from "../../../features/vendorsSlice";
import type { SevFilter } from "../../../features/salesLedgerSlice";
import ThresholdFilter from "../../../components/filters/ThresholdFilter";
import SevChips from "../../../components/SevChips";
import MobilePerfHeader from "../../../components/mobile/MobilePerfHeader";
import MobileKpiStrip from "../../../components/mobile/MobileKpiStrip";
import MobileDayStrip from "../../../components/mobile/MobileDayStrip";
import MobileSignalRow from "../../../components/mobile/MobileSignalRow";
import { fmtDayLabel, fmtRangeLabel } from "../../../utils/dateLabels";
import { formatCurrency2 } from "../../../utils";
import {
  sortGraded,
  shiftIso,
  LW_OFFSET,
  LY_OFFSET,
} from "../../../utils/grading";
import { getVendorTier, marginPct, NO_VENDOR_LABEL } from "../vendorsUtils";
import { VENDORS_INFO } from "../vendorsInfo";

/**
 * The graded vendor list — the mobile equivalent of `VendorListPanel`.
 *
 * Laid out like the Sub Depts view on Sales mobile: KPI strip, day cards,
 * severity chips, then one compact row per vendor.
 *
 * Vendors is single-store, so this screen already sits where Sales' store
 * report does — there's no store-picking step in front of it. That's why the
 * rows are the compact signal shape rather than the taller TY/LW/LY card they
 * used to be: the strip above already carries the week's context, so a row only
 * has to answer "which of these is the problem".
 *
 * No metric toggle: that stays a desktop control, and mobile renders whatever
 * `metric` is already set.
 */

const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
// Margin deltas are percentage points, but shown with a % sign for
// consistency with the sales side and the rest of mobile.
const fmtPts = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

/** The chip row's own filter. Wider than `SevFilter` because a vendor with
 *  neither last week nor last year can't be graded at all — new suppliers land
 *  here, and folding them into "healthy" would claim a pass nothing measured. */
type VendorFilter = SevFilter | "ungraded";

const VendorListMobile = ({ onSearch }: { onSearch: () => void }) => {
  const dispatch = useAppDispatch();
  const { rows, metric, threshold, storeName, twStart, twEnd, selectedDay } =
    useAppSelector((s) => s.vendors);
  const [sevFilter, setSevFilter] = useState<VendorFilter>("all");

  const isMargin = metric === "margin";
  const unit = "%";

  // Grading should never move vendors around on its own while the threshold
  // input sits empty mid-edit — keep grading against the last valid number so
  // tier placement holds until a new one is typed.
  const thresholdRef = useRef<number>(threshold ?? VENDOR_THRESHOLD_DEFAULT);
  if (threshold != null) thresholdRef.current = threshold;
  const activeThreshold = thresholdRef.current;

  const show = (net: number, cogs: number) =>
    isMargin ? `${marginPct(net, cogs).toFixed(2)}%` : formatCurrency2(net);
  const deltaOf = (
    twNet: number,
    twCogs: number,
    bNet: number,
    bCogs: number,
  ) =>
    isMargin
      ? marginPct(twNet, twCogs) - marginPct(bNet, bCogs)
      : bNet > 0
        ? ((twNet - bNet) / bNet) * 100
        : 0;
  const fmtDelta = (n: number) => (isMargin ? fmtPts(n) : fmtPct(n));

  /**
   * Store totals, summed across every vendor.
   *
   * Each comparison sums the rows' own day-matched subtotals (`twNetForLW`,
   * never the plain `twNet`), so a store total is never a full TY week measured
   * against a partial LW or LY.
   */
  const totals = useMemo(() => {
    const z = {
      twNet: 0,
      twCogs: 0,
      lwNet: 0,
      lwCogs: 0,
      twNetForLW: 0,
      twCogsForLW: 0,
      lyNet: 0,
      lyCogs: 0,
      twNetForLY: 0,
      twCogsForLY: 0,
      hasLW: false,
      hasLY: false,
    };
    for (const r of rows) {
      z.twNet += r.twNet;
      z.twCogs += r.twCogs;
      if (r.hasLW) {
        z.hasLW = true;
        z.lwNet += r.lwNet;
        z.lwCogs += r.lwCogs;
        z.twNetForLW += r.twNetForLW;
        z.twCogsForLW += r.twCogsForLW;
      }
      if (r.hasLY) {
        z.hasLY = true;
        z.lyNet += r.lyNet;
        z.lyCogs += r.lyCogs;
        z.twNetForLY += r.twNetForLY;
        z.twCogsForLY += r.twCogsForLY;
      }
    }
    return z;
  }, [rows]);

  /** The store's week day by day — every vendor's day summed onto its date. */
  const days = useMemo(() => {
    const map = new Map<
      string,
      {
        tw: number;
        twCogs: number;
        lw: number;
        lwCogs: number;
        ly: number;
        lyCogs: number;
        hasLW: boolean;
        hasLY: boolean;
      }
    >();
    for (const r of rows) {
      for (const d of r.days) {
        const iso = d.date.split("T")[0];
        const cur = map.get(iso) ?? {
          tw: 0,
          twCogs: 0,
          lw: 0,
          lwCogs: 0,
          ly: 0,
          lyCogs: 0,
          hasLW: false,
          hasLY: false,
        };
        cur.tw += d.twNet;
        cur.twCogs += d.twCogs;
        if (d.lwNet !== null) {
          cur.hasLW = true;
          cur.lw += d.lwNet;
          cur.lwCogs += d.lwCogs ?? 0;
        }
        if (d.lyNet !== null) {
          cur.hasLY = true;
          cur.ly += d.lyNet;
          cur.lyCogs += d.lyCogs ?? 0;
        }
        map.set(iso, cur);
      }
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => {
        const hasRef = v.hasLY || v.hasLW;
        const refNet = v.hasLY ? v.ly : v.lw;
        const refCogs = v.hasLY ? v.lyCogs : v.lwCogs;
        return {
          date,
          hasRef,
          isUp: !hasRef
            ? true
            : isMargin
              ? marginPct(v.tw, v.twCogs) >= marginPct(refNet, refCogs)
              : v.tw >= refNet,
        };
      });
  }, [rows, isMargin]);

  const graded = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        tier: getVendorTier(row, activeThreshold, metric),
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
    (g) => g.twNet,
  );

  const labelFor = (offset: number) =>
    selectedDay
      ? fmtDayLabel(shiftIso(selectedDay, offset))
      : fmtRangeLabel(shiftIso(twStart, offset), shiftIso(twEnd, offset));

  const lwDelta = totals.hasLW
    ? deltaOf(
        totals.twNetForLW,
        totals.twCogsForLW,
        totals.lwNet,
        totals.lwCogs,
      )
    : null;
  const lyDelta = totals.hasLY
    ? deltaOf(
        totals.twNetForLY,
        totals.twCogsForLY,
        totals.lyNet,
        totals.lyCogs,
      )
    : null;

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] bg-gray-50 overflow-hidden">
      <MobilePerfHeader
        pageName="Vendors"
        dateRange={fmtRangeLabel(twStart, twEnd)}
        storeName={storeName}
        onSearch={onSearch}
        info={VENDORS_INFO}
        threshold={
          <ThresholdFilter
            value={threshold === null ? null : { op: "gt", amount: threshold }}
            onChange={(v) => dispatch(setThreshold(v?.amount ?? null))}
            suffix={unit}
            showOp={false}
            showClear={false}
            inputWidth={40}
            variant="dark"
          />
        }
      />

      <MobileKpiStrip
        cells={[
          {
            label: isMargin ? "TY margin" : "TY net sales",
            dateLabel: labelFor(0),
            value: show(totals.twNet, totals.twCogs),
          },
          {
            label: "vs last week",
            dateLabel: labelFor(LW_OFFSET),
            value: totals.hasLW ? show(totals.lwNet, totals.lwCogs) : "—",
            delta:
              lwDelta === null
                ? null
                : { text: fmtDelta(lwDelta), up: lwDelta >= 0 },
          },
          {
            label: "vs last year",
            dateLabel: labelFor(LY_OFFSET),
            value: totals.hasLY ? show(totals.lyNet, totals.lyCogs) : "—",
            delta:
              lyDelta === null
                ? null
                : { text: fmtDelta(lyDelta), up: lyDelta >= 0 },
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
            No vendors match filter
          </div>
        ) : (
          visible.map((row) => {
            // The day strip narrows the headline figure. The two comparisons
            // stay at week scope: a vendor's day entries carry their own
            // aligned LW/LY, but the tier beside them is a whole-week grade,
            // and a day-scoped pill next to a week-scoped badge would disagree.
            const d = selectedDay
              ? row.days.find((x) => x.date.startsWith(selectedDay))
              : null;
            const twNet = d ? d.twNet : row.twNet;
            const twCogs = d ? d.twCogs : row.twCogs;
            const twQty = d ? d.twQty : row.twQty;
            const lw = row.hasLW
              ? deltaOf(row.twNetForLW, row.twCogsForLW, row.lwNet, row.lwCogs)
              : null;
            const ly = row.hasLY
              ? deltaOf(row.twNetForLY, row.twCogsForLY, row.lyNet, row.lyCogs)
              : null;
            return (
              <MobileSignalRow
                key={row.vendorId}
                sev={row.tier}
                label={row.noVendor ? NO_VENDOR_LABEL : row.vendorName}
                value={show(twNet, twCogs)}
                sub={isMargin ? undefined : `${twQty.toLocaleString()} u`}
                lw={{ text: lw === null ? "—" : fmtDelta(lw), pct: lw }}
                ly={{ text: ly === null ? "—" : fmtDelta(ly), pct: ly }}
                threshold={activeThreshold}
                onClick={() => dispatch(setSelectedVendor(row.vendorId))}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default VendorListMobile;
