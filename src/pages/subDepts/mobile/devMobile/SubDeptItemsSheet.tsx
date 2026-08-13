import { useMemo, useState, useRef } from "react";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import { useAppSelector } from "../../../../hooks";
import { useSubMarginCtx, useParams } from "../../hooks";
import {
  calculateCogs,
  hasNoUsableCost,
  getTier,
  getLYDate,
  setDates,
} from "../..";
import { fmtDayLabel, fmtRangeLabel } from "../../../../utils/dateLabels";
import { formatCurrency2 } from "../../../../utils";
import type { MarginTier } from "../../../../features/subMarginSlice";
import type { SevFilter } from "../../../../features/salesLedgerSlice";
import type { SubDeptMargin } from "../../../../interfaces";
import SevBadge from "../../../../components/SevBadge";
import { BADGE_BG, BADGE_COLOR } from "../../../sales/shared/ledgerUtils";
import SevChips from "../../../../components/SevChips";
import BottomSheet from "../../../../components/BottomSheet";
import { deltaPillClass } from "../../../../utils/grading";

interface Props {
  onBack: () => void;
}

type AggregatedItem = {
  product_code: string;
  product_description: string;
  tyNet: number;
  tyQty: number;
  tyMarginPct: number;
  lyNet: number;
  lyQty: number;
  lyMarginPct: number;
  lwNet: number;
  lwQty: number;
  lwMarginPct: number;
  ptsDelta: number;
  lwPtsDelta: number;
  tier: MarginTier;
  noCost: boolean;
};

const TIER_ORDER: Record<MarginTier, number> = {
  critical: 0,
  watch: 1,
  healthy: 2,
};

const computeNet = (records: SubDeptMargin[]) =>
  records.reduce((s, m) => s + (m.total_sales - m.total_tax), 0);

const computeCogs = (records: SubDeptMargin[]) =>
  records.reduce(
    (s, m) =>
      s + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight),
    0,
  );

const computeMarginPct = (net: number, cogs: number) =>
  net > 0 ? ((net - cogs) / net) * 100 : 0;

const fmt1 = (n: number) => n.toFixed(2);
// Margin deltas are percentage points, shown with a % sign to match the
// rest of mobile.
const fmtPts = (n: number) => `${n >= 0 ? "+" : ""}${fmt1(n)}%`;

const SubDeptItemsSheet = ({ onBack }: Props) => {
  const ctx = useSubMarginCtx();
  const params = useParams();
  const subDeptGrades = useAppSelector((s) => s.subMargin.subDeptGrades);
  const gradingThreshold = useAppSelector((s) => s.subMargin.gradingThreshold);
  const gradingMetric = useAppSelector((s) => s.subMargin.gradingMetric);

  // The day comes from the slice so it survives opening a sub dept from a
  // day-scoped list — see `selectedDay` in subMarginSlice.
  const selectedDay = useAppSelector((s) => s.subMargin.selectedDay);
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [rawItemThreshold, setRawItemThreshold] = useState<number | null>(
    gradingThreshold,
  );

  // Grading should never move items around on its own when the threshold
  // input is cleared — keep grading against the last valid amount so tier
  // placement stays exactly where it was until a new number is typed.
  const itemThresholdRef = useRef<number>(
    rawItemThreshold ?? gradingThreshold ?? 9,
  );
  if (rawItemThreshold != null) itemThresholdRef.current = rawItemThreshold;
  const itemThreshold = itemThresholdRef.current;

  const grade =
    ctx.selectedSubDeptKey != null
      ? subDeptGrades[ctx.selectedSubDeptKey]
      : undefined;
  const subDept = ctx.subDepts.find((sd) => sd.key === ctx.selectedSubDeptKey);

  /** The department's week, or the selected day. LW and LY are matched to the
   *  chosen day by position in each period's own date list — the periods can
   *  have different gaps, so a positional match is what keeps a Tuesday against
   *  a Tuesday. */
  const kpi = useMemo(() => {
    if (!grade) return null;
    if (!selectedDay) {
      return {
        tyMarginPct: grade.tyMarginPct,
        ptsDelta: grade.ptsDelta,
        lwPtsDelta: grade.lwPtsDelta,
        lwMarginPct: grade.lwMarginPct,
        lyMarginPct: grade.lyMarginPct,
        hasLW: grade.lwSales > 0,
        hasLY: grade.lySales > 0,
      };
    }
    const tyDay = grade.tyWeekOneMargins.filter(
      (m) => m.sale_date === selectedDay,
    );
    const tyDates = [
      ...new Set(grade.tyWeekOneMargins.map((m) => m.sale_date)),
    ].sort();
    const lyDates = [
      ...new Set(grade.lyWeekOneMargins.map((m) => m.sale_date)),
    ].sort();
    const lwDates = [
      ...new Set(grade.lwWeekOneMargins.map((m) => m.sale_date)),
    ].sort();
    const dayIdx = tyDates.indexOf(selectedDay);
    const lyDay =
      dayIdx >= 0 && lyDates[dayIdx]
        ? grade.lyWeekOneMargins.filter((m) => m.sale_date === lyDates[dayIdx])
        : [];
    const lwDay =
      dayIdx >= 0 && lwDates[dayIdx]
        ? grade.lwWeekOneMargins.filter((m) => m.sale_date === lwDates[dayIdx])
        : [];

    const tyNet = computeNet(tyDay);
    const tyCogs = computeCogs(tyDay);
    const lyNet = computeNet(lyDay);
    const lyCogs = computeCogs(lyDay);
    const lwNet = computeNet(lwDay);
    const lwCogs = computeCogs(lwDay);

    const tyM = computeMarginPct(tyNet, tyCogs);
    const lyM = computeMarginPct(lyNet, lyCogs);
    const lwM = computeMarginPct(lwNet, lwCogs);

    return {
      tyMarginPct: tyM,
      ptsDelta: lyM > 0 ? tyM - lyM : 0,
      lwPtsDelta: lwM > 0 ? tyM - lwM : 0,
      lwMarginPct: lwM,
      lyMarginPct: lyM,
      // Net, not margin: a day can genuinely post 0% and still be real data.
      hasLW: lwNet > 0,
      hasLY: lyNet > 0,
    };
  }, [grade, selectedDay]);

  // Aggregate items from selected day (or full week)
  const items = useMemo((): AggregatedItem[] => {
    if (!grade) return [];
    const source = selectedDay
      ? grade.tyWeekOneMargins.filter((m) => m.sale_date === selectedDay)
      : grade.tyWeekOneMargins;

    const byCode = new Map<
      string,
      {
        desc: string;
        ty: SubDeptMargin[];
        ly: SubDeptMargin[];
        lw: SubDeptMargin[];
      }
    >();

    source.forEach((m) => {
      if (!byCode.has(m.product_code)) {
        byCode.set(m.product_code, {
          desc: m.product_description,
          ty: [],
          ly: [],
          lw: [],
        });
      }
      byCode.get(m.product_code)!.ty.push(m);
    });

    grade.lyWeekOneMargins.forEach((m) => {
      if (byCode.has(m.product_code)) byCode.get(m.product_code)!.ly.push(m);
    });
    grade.lwWeekOneMargins.forEach((m) => {
      if (byCode.has(m.product_code)) byCode.get(m.product_code)!.lw.push(m);
    });

    return Array.from(byCode.entries())
      .map(([code, { desc, ty, ly, lw }]) => {
        const tyNet = computeNet(ty);
        const tyCogs = computeCogs(ty);
        const tyQty = ty.reduce((s, m) => s + m.qty, 0);
        const tyM = computeMarginPct(tyNet, tyCogs);

        const lyNet = computeNet(ly);
        const lyCogs = computeCogs(ly);
        const lyQty = ly.reduce((s, m) => s + m.qty, 0);
        const lyM = computeMarginPct(lyNet, lyCogs);

        const lwNet = computeNet(lw);
        const lwCogs = computeCogs(lw);
        const lwQty = lw.reduce((s, m) => s + m.qty, 0);
        const lwM = computeMarginPct(lwNet, lwCogs);

        const ptsDelta = lyM > 0 ? tyM - lyM : 0;
        const lwPtsDelta = lwM > 0 ? tyM - lwM : 0;

        // Grades on whichever metric is selected (Margin/Sales toggle),
        // same as getTier does for sub dept rows, and prefers LY over LW
        // like desktop's getItemSeverity — separate from ptsDelta/lwPtsDelta
        // above, which stay LY-only/LW-only for the two displayed pills.
        const marginRaw = lyM > 0 ? tyM - lyM : lwM > 0 ? tyM - lwM : null;
        const salesRaw =
          lyNet > 0
            ? ((tyNet - lyNet) / lyNet) * 100
            : lwNet > 0
              ? ((tyNet - lwNet) / lwNet) * 100
              : null;
        const raw = gradingMetric === "sales" ? salesRaw : marginRaw;
        // Rounded before grading — tyNet/lyNet/lwNet (and the margin %s
        // derived from them) are sums of individual line items, so
        // floating-point noise can leave a value like -0.0000000001% even
        // when the displayed figures are identical, misgrading it "watch".
        const delta = raw === null ? 0 : Math.round(raw * 10) / 10;
        const tier: MarginTier =
          delta < -itemThreshold ? "critical" : delta < 0 ? "watch" : "healthy";

        const firstTy = ty[0];
        const noCost = firstTy ? hasNoUsableCost(firstTy) : false;

        return {
          product_code: code,
          product_description: desc,
          tyNet,
          tyQty,
          tyMarginPct: tyM,
          lyNet,
          lyQty,
          lyMarginPct: lyM,
          lwNet,
          lwQty,
          lwMarginPct: lwM,
          ptsDelta,
          lwPtsDelta,
          tier,
          noCost,
        };
      })
      .sort((a, b) => {
        if (a.tier !== b.tier) return TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
        return a.ptsDelta - b.ptsDelta;
      });
  }, [grade, selectedDay, itemThreshold, gradingMetric]);

  const counts: Record<SevFilter, number> = {
    all: items.length,
    critical: items.filter((i) => i.tier === "critical").length,
    watch: items.filter((i) => i.tier === "watch").length,
    healthy: items.filter((i) => i.tier === "healthy").length,
  };

  const visibleItems =
    sevFilter === "all" ? items : items.filter((i) => i.tier === sevFilter);

  /** Each KPI cell names the window it is actually reporting, matching the
   *  Sales strip — "vs LW" alone leaves the reader to work out which seven
   *  days that was, and it changes with the day strip.
   *
   *  Built from the very expressions the fetch used (`getLYDate`, `setDates`),
   *  not re-derived, so a label can never disagree with the figure beside it:
   *  LY is day-of-week preserving rather than a flat -365. */
  const lwStart = setDates(new Date(params.end), 13);
  const lwEnd = setDates(new Date(params.end), 7);
  const tyLabel = selectedDay
    ? fmtDayLabel(selectedDay)
    : fmtRangeLabel(params.start, params.end);
  const lwLabel = selectedDay
    ? fmtDayLabel(setDates(new Date(selectedDay), 7))
    : fmtRangeLabel(lwStart, lwEnd);
  const lyLabel = selectedDay
    ? fmtDayLabel(getLYDate(selectedDay))
    : fmtRangeLabel(getLYDate(params.start), getLYDate(params.end));

  const endLabel = new Date(params.end + "T00:00:00").toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );

  // The header pill grades on the dept-level threshold, the same number the
  // list behind this sheet used — falling back to the default while the
  // input is empty mid-edit, exactly as the list does.
  const tier = grade
    ? getTier(grade, gradingThreshold ?? 9, gradingMetric)
    : null;
  const sevLabel = tier
    ? tier.charAt(0).toUpperCase() + tier.slice(1)
    : "Ungraded";

  return (
    <BottomSheet onClose={onBack}>
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-content truncate">
            {subDept?.desc ?? "Sub Dept"}
          </div>
          <div className="text-[10px] text-content/85 mt-0.5">
            {selectedDay ? fmtDayLabel(selectedDay) : endLabel}
          </div>
        </div>
        {tier && (
          <div
            className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: BADGE_BG[tier], color: BADGE_COLOR[tier] }}
          >
            {tier === "critical" && (
              <ExclamationTriangleIcon className="w-3 h-3" />
            )}
            {tier === "watch" && <ExclamationCircleIcon className="w-3 h-3" />}
            {tier === "healthy" && <CheckCircleIcon className="w-3 h-3" />}
            {sevLabel}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* 3-col TY / LW / LY — the department's own week. The day strip that
            scopes it lives on the list screen behind this sheet, same as
            Sales. */}
        {kpi && (
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
            <div className="px-3 py-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wide text-content/85">
                  TY
                </span>
                <span className="text-[10px] text-content/85">{tyLabel}</span>
              </div>
              <div className="text-[12px] font-semibold text-content mt-0.5">
                {fmt1(kpi.tyMarginPct)}%
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
                  {kpi.hasLW ? `${fmt1(kpi.lwMarginPct)}%` : "\u2014"}
                </span>
                {kpi.hasLW && (
                  <span
                    className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${deltaPillClass(kpi.lwPtsDelta, itemThreshold)}`}
                  >
                    {fmtPts(kpi.lwPtsDelta)}
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
                  {kpi.hasLY ? `${fmt1(kpi.lyMarginPct)}%` : "\u2014"}
                </span>
                {kpi.hasLY && (
                  <span
                    className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${deltaPillClass(kpi.ptsDelta, itemThreshold)}`}
                  >
                    {fmtPts(kpi.ptsDelta)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Item threshold */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-100">
          <span className="text-[11px] font-medium text-content">
            Items ({items.length})
          </span>
          <div className="flex-1" />
          <span className="text-[10px] text-content/85">Threshold</span>
          <input
            type="number"
            value={rawItemThreshold === null ? "" : rawItemThreshold}
            onChange={(e) => {
              if (e.target.value === "") {
                setRawItemThreshold(null);
                return;
              }
              const n = Number(e.target.value);
              if (!isNaN(n) && n >= 0) setRawItemThreshold(n);
            }}
            className="w-9 text-center text-[10px] bg-custom-white border border-gray-200 rounded px-1 py-px text-content"
            style={{
              outline: "none",
              WebkitAppearance: "none",
              boxShadow: "none",
            }}
            min={0}
          />
          <span className="text-[10px] text-content/85">%</span>
        </div>

        <SevChips active={sevFilter} counts={counts} onChange={setSevFilter} />

        {/* Every item as its own TY/LW/LY card — the same treatment Vendors
            and Categories give theirs, so there is no second sheet to open. */}
        {visibleItems.length === 0 ? (
          <div className="px-4 py-8 text-center text-[11px] text-content/85">
            No items match filter
          </div>
        ) : (
          visibleItems.map((item) => (
            <div
              key={item.product_code}
              className="px-4 py-2.5 border-b border-gray-100"
            >
              <div className="flex items-start gap-2">
                <SevBadge sev={item.tier} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="text-[12px] font-medium text-content truncate"
                      style={{ maxWidth: "55%" }}
                    >
                      {item.product_description}
                    </span>
                    <span className="text-[10px] text-content/85 flex-shrink-0">
                      {item.product_code}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-gray-100 border border-gray-100 rounded mt-1.5">
                    <div className="px-2 py-1.5">
                      <div className="text-[11px] text-content/85 uppercase tracking-wide">
                        TY
                      </div>
                      <div className="text-[11px] font-semibold text-content mt-0.5">
                        {fmt1(item.tyMarginPct)}%
                      </div>
                      <div className="text-[11px] text-content/85 mt-0.5">
                        {formatCurrency2(item.tyNet)}
                      </div>
                      <div className="text-[11px] text-content/85 mt-0.5">
                        {item.tyQty.toFixed(0)} u
                      </div>
                    </div>
                    <div className="px-2 py-1.5">
                      <div className="text-[11px] text-content/85 uppercase tracking-wide">
                        LW
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[11px] font-semibold text-content">
                          {item.lwNet > 0
                            ? `${fmt1(item.lwMarginPct)}%`
                            : "\u2014"}
                        </span>
                        {item.lwNet > 0 && (
                          <span
                            className={`text-[11px] font-semibold px-1 py-0.5 rounded ${deltaPillClass(item.lwPtsDelta, itemThreshold)}`}
                          >
                            {fmtPts(item.lwPtsDelta)}
                          </span>
                        )}
                      </div>
                      {item.lwNet > 0 && (
                        <>
                          <div className="text-[11px] text-content/85 mt-0.5">
                            {formatCurrency2(item.lwNet)}
                          </div>
                          <div className="text-[11px] text-content/85 mt-0.5">
                            {item.lwQty.toFixed(0)} u
                          </div>
                        </>
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <div className="text-[11px] text-content/85 uppercase tracking-wide">
                        LY
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[11px] font-semibold text-content">
                          {item.lyNet > 0
                            ? `${fmt1(item.lyMarginPct)}%`
                            : "\u2014"}
                        </span>
                        {item.lyNet > 0 && (
                          <span
                            className={`text-[11px] font-semibold px-1 py-0.5 rounded ${deltaPillClass(item.ptsDelta, itemThreshold)}`}
                          >
                            {fmtPts(item.ptsDelta)}
                          </span>
                        )}
                      </div>
                      {item.lyNet > 0 && (
                        <>
                          <div className="text-[11px] text-content/85 mt-0.5">
                            {formatCurrency2(item.lyNet)}
                          </div>
                          <div className="text-[11px] text-content/85 mt-0.5">
                            {item.lyQty.toFixed(0)} u
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {item.noCost && (
                    <div className="text-[11px] font-medium text-red-600 mt-1">
                      Missing cost data
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div className="h-4 flex-shrink-0" />
      </div>
    </BottomSheet>
  );
};

export default SubDeptItemsSheet;
