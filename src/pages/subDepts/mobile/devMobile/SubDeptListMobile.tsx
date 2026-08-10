import { useMemo, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useSubMarginCtx, useParams } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import {
  setGradingThreshold,
  setSubMarginSelectedDay,
} from "../../../../features/subMarginSlice";
import type { MarginTier } from "../../../../features/subMarginSlice";
import type { SevFilter } from "../../../../features/salesLedgerSlice";
import { fmtDayLabel, fmtRangeLabel } from "../../../../utils/dateLabels";
import { getTier, calculateCogs, getLYDate, setDates } from "../..";
import { SUB_DEPT_MARGINS_INFO } from "../../subDeptMarginsInfo";
import type { SubDeptMargin } from "../../../../interfaces";
import ThresholdFilter from "../../../../components/filters/ThresholdFilter";
import SevChips from "../../../../components/SevChips";
import MobilePerfHeader from "../../../../components/mobile/MobilePerfHeader";
import MobileKpiStrip from "../../../../components/mobile/MobileKpiStrip";
import MobileDayStrip from "../../../../components/mobile/MobileDayStrip";
import MobileSignalRow from "../../../../components/mobile/MobileSignalRow";
import LocationTabs from "../../../../components/filters/LocationTabs";
import type { GradingProgress } from "./SubDeptMarginsMobile";

interface Props {
  onSearch: () => void;
  gradingProgress: GradingProgress;
  /** Re-presents the cached search as one co-located location, or all of them
   *  combined when null. No refetch — see SubDeptMarginsMobile. */
  onStoreNumberChange: (storeNumber: string | null) => void;
}

const TIER_ORDER: Record<MarginTier, number> = {
  critical: 0,
  watch: 1,
  healthy: 2,
};

const SubDeptListMobile = ({
  onSearch,
  gradingProgress,
  onStoreNumberChange,
}: Props) => {
  const dispatch = useAppDispatch();
  const ctx = useSubMarginCtx();
  const params = useParams();
  const actions = useSubMarginActions();
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");

  const subDeptGrades = useAppSelector((s) => s.subMargin.subDeptGrades);
  const loadingGrades = useAppSelector((s) => s.subMargin.loadingGrades);
  const availableStoreNumbers = useAppSelector(
    (s) => s.subMargin.availableStoreNumbers,
  );
  const selectedStoreNumber = useAppSelector(
    (s) => s.subMargin.selectedStoreNumber,
  );
  const rawGradingThreshold = useAppSelector(
    (s) => s.subMargin.gradingThreshold,
  );
  const gradingMetric = useAppSelector((s) => s.subMargin.gradingMetric);

  // Grading should never move sub depts around on its own when the threshold
  // input is cleared — keep grading against the last valid amount so tier
  // placement stays exactly where it was until a new number is typed.
  const gradingThresholdRef = useRef<number>(rawGradingThreshold ?? 9);
  if (rawGradingThreshold != null)
    gradingThresholdRef.current = rawGradingThreshold;
  const gradingThreshold = gradingThresholdRef.current;

  const selectedDay = useAppSelector((s) => s.subMargin.selectedDay);

  const fmt1 = (n: number) => n.toFixed(2);
  // Margin deltas are percentage points, shown with a % sign to match the
  // rest of mobile.
  const fmtPts = (n: number) => (n >= 0 ? "+" : "") + fmt1(n) + "%";
  const marginOf = (net: number, cogs: number) =>
    net > 0 ? ((net - cogs) / net) * 100 : 0;
  const sumOf = (ms: SubDeptMargin[]) =>
    ms.reduce(
      (a, m) => {
        a.net += m.total_sales - m.total_tax;
        a.cogs += calculateCogs(
          m.net_cost,
          m.cost,
          m.case_size,
          m.qty,
          m.weight,
        );
        return a;
      },
      { net: 0, cogs: 0 },
    );

  /** Every graded sub department's raw rows pooled — the store's own week.
   *  Rebuilt from the margins rather than averaging the per-dept percentages,
   *  which would weight a tiny department the same as the whole grocery aisle. */
  const pooled = useMemo(() => {
    const ty: SubDeptMargin[] = [];
    const lw: SubDeptMargin[] = [];
    const ly: SubDeptMargin[] = [];
    for (const sd of ctx.subDepts) {
      const g = subDeptGrades[sd.id];
      if (!g) continue;
      ty.push(...g.tyWeekOneMargins);
      lw.push(...g.lwWeekOneMargins);
      ly.push(...g.lyWeekOneMargins);
    }
    return { ty, lw, ly };
  }, [ctx.subDepts, subDeptGrades]);

  /** The dates present on each side, so a day can be matched across periods by
   *  position — the same index alignment the report screen uses. */
  const dateSets = useMemo(
    () => ({
      ty: [...new Set(pooled.ty.map((m) => m.sale_date))].sort(),
      lw: [...new Set(pooled.lw.map((m) => m.sale_date))].sort(),
      ly: [...new Set(pooled.ly.map((m) => m.sale_date))].sort(),
    }),
    [pooled],
  );

  const kpi = useMemo(() => {
    const pickDay = (ms: SubDeptMargin[], date: string | undefined) =>
      date ? ms.filter((m) => m.sale_date === date) : [];
    const shape = (
      ty: { net: number; cogs: number },
      lw: { net: number; cogs: number },
      ly: { net: number; cogs: number },
    ) => ({
      ty: marginOf(ty.net, ty.cogs),
      lw: marginOf(lw.net, lw.cogs),
      ly: marginOf(ly.net, ly.cogs),
      // Net, not margin: a day can genuinely post 0% and still be real data,
      // so net is what separates "no basis" from "zero".
      hasLW: lw.net > 0,
      hasLY: ly.net > 0,
    });
    if (!selectedDay) {
      return shape(sumOf(pooled.ty), sumOf(pooled.lw), sumOf(pooled.ly));
    }
    const i = dateSets.ty.indexOf(selectedDay);
    return shape(
      sumOf(pickDay(pooled.ty, selectedDay)),
      sumOf(pickDay(pooled.lw, i >= 0 ? dateSets.lw[i] : undefined)),
      sumOf(pickDay(pooled.ly, i >= 0 ? dateSets.ly[i] : undefined)),
    );
  }, [pooled, dateSets, selectedDay]);

  /** The store's week day by day, each day against LY or — failing that — LW. */
  const days = useMemo(
    () =>
      dateSets.ty.map((date, i) => {
        const ty = sumOf(pooled.ty.filter((m) => m.sale_date === date));
        const ly = sumOf(
          pooled.ly.filter((m) => m.sale_date === dateSets.ly[i]),
        );
        const lw = sumOf(
          pooled.lw.filter((m) => m.sale_date === dateSets.lw[i]),
        );
        const ref = ly.net > 0 ? ly : lw.net > 0 ? lw : null;
        return {
          date,
          hasRef: ref !== null,
          isUp: ref
            ? marginOf(ty.net, ty.cogs) >= marginOf(ref.net, ref.cogs)
            : true,
        };
      }),
    [pooled, dateSets],
  );

  const store = ctx.assignedStores.find(
    (s) => s.storeid === params.searchValue,
  );
  const storeName = store?.store_name ?? "";

  const graded = ctx.subDepts.map((sd) => {
    const grade = subDeptGrades[sd.id];
    const tier = grade
      ? getTier(grade, gradingThreshold, gradingMetric)
      : ("healthy" as MarginTier);
    return { sd, grade, tier };
  });

  const counts: Record<SevFilter, number> = {
    all: graded.length,
    critical: graded.filter((g) => g.tier === "critical").length,
    watch: graded.filter((g) => g.tier === "watch").length,
    healthy: graded.filter((g) => g.tier === "healthy").length,
  };

  const visible = graded
    .filter((g) => sevFilter === "all" || g.tier === sevFilter)
    .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] overflow-hidden">
      <MobilePerfHeader
        pageName="Sub Dept Margins"
        dateRange={fmtRangeLabel(params.start, params.end)}
        storeName={storeName}
        onSearch={onSearch}
        info={SUB_DEPT_MARGINS_INFO}
        threshold={
          <ThresholdFilter
            value={
              rawGradingThreshold === null
                ? null
                : { op: "gt", amount: rawGradingThreshold }
            }
            onChange={(v) => dispatch(setGradingThreshold(v?.amount ?? null))}
            suffix="%"
            showOp={false}
            showClear={false}
            inputWidth={40}
            variant="dark"
          />
        }
      />

      {/* Grading progress */}
      {loadingGrades && gradingProgress.total > 0 && (
        <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-[11px] text-amber-800">
          Grading {gradingProgress.completed} / {gradingProgress.total}…
        </div>
      )}

      <LocationTabs
        numbers={availableStoreNumbers}
        selected={selectedStoreNumber}
        onChange={onStoreNumberChange}
        variant="bare"
      />
      <MobileKpiStrip
        cells={[
          {
            label: "TY margin",
            dateLabel: selectedDay
              ? fmtDayLabel(selectedDay)
              : fmtRangeLabel(params.start, params.end),
            value: fmt1(kpi.ty) + "%",
          },
          {
            label: "vs last week",
            dateLabel: selectedDay
              ? fmtDayLabel(setDates(new Date(selectedDay), 7))
              : fmtRangeLabel(
                  setDates(new Date(params.end), 13),
                  setDates(new Date(params.end), 7),
                ),
            value: kpi.hasLW ? fmt1(kpi.lw) + "%" : "\u2014",
            delta: kpi.hasLW
              ? { text: fmtPts(kpi.ty - kpi.lw), up: kpi.ty - kpi.lw >= 0 }
              : null,
          },
          {
            label: "vs last year",
            dateLabel: selectedDay
              ? fmtDayLabel(getLYDate(selectedDay))
              : fmtRangeLabel(getLYDate(params.start), getLYDate(params.end)),
            value: kpi.hasLY ? fmt1(kpi.ly) + "%" : "\u2014",
            delta: kpi.hasLY
              ? { text: fmtPts(kpi.ty - kpi.ly), up: kpi.ty - kpi.ly >= 0 }
              : null,
          },
        ]}
      />

      <MobileDayStrip
        days={days}
        selected={selectedDay}
        onSelect={(d) => dispatch(setSubMarginSelectedDay(d))}
      />

      <SevChips active={sevFilter} counts={counts} onChange={setSevFilter} />

      <div className="flex-1 overflow-y-auto pb-14">
        {visible.map(({ sd, grade, tier }) => (
          <MobileSignalRow
            key={sd.id}
            sev={tier}
            label={sd.desc}
            value={grade ? fmt1(grade.tyMarginPct) + "%" : "\u2026"}
            lw={
              grade && grade.lwSales > 0
                ? { text: fmtPts(grade.lwPtsDelta), pct: grade.lwPtsDelta }
                : { text: "\u2014", pct: null }
            }
            ly={
              grade && grade.lySales > 0
                ? { text: fmtPts(grade.ptsDelta), pct: grade.ptsDelta }
                : { text: "\u2014", pct: null }
            }
            threshold={gradingThreshold}
            onClick={() => dispatch(actions.setSelectedSubDeptId(sd.id))}
          />
        ))}
      </div>
    </div>
  );
};

export default SubDeptListMobile;
