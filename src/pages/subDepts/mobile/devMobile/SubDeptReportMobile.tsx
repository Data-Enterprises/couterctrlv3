import { useMemo, useState, useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ExclamationTriangleIcon, ExclamationCircleIcon, CheckCircleIcon } from "@heroicons/react/20/solid";
import { useAppSelector } from "../../../../hooks";
import { useSubMarginCtx, useParams } from "../../hooks";
import { calculateCogs } from "../..";
import { formatCurrency2 } from "../../../../utils";
import type { MarginTier } from "../../../../features/subMarginSlice";
import type { SevFilter } from "../../../../features/salesLedgerSlice";
import type { SubDeptMargin } from "../../../../interfaces";
import SevBadge from "../../../sales/mobile/components/SevBadge";
import { BADGE_BG, BADGE_COLOR } from "../../../sales/shared/ledgerUtils";
import SevChips from "../../../sales/mobile/components/SevChips";
import BottomSheet from "../../../../components/BottomSheet";

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

const TIER_ORDER: Record<MarginTier, number> = { critical: 0, watch: 1, healthy: 2 };

const computeNet = (records: SubDeptMargin[]) =>
  records.reduce((s, m) => s + (m.total_sales - m.total_tax), 0);

const computeCogs = (records: SubDeptMargin[]) =>
  records.reduce((s, m) => s + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight), 0);

const computeMarginPct = (net: number, cogs: number) =>
  net > 0 ? ((net - cogs) / net) * 100 : 0;

const fmt1 = (n: number) => n.toFixed(1);
const fmtPts = (n: number) => `${n >= 0 ? "+" : ""}${fmt1(n)} pts`;

const SubDeptReportMobile = ({ onBack }: Props) => {
  const ctx = useSubMarginCtx();
  const params = useParams();
  const subDeptGrades = useAppSelector((s) => s.subMargin.subDeptGrades);
  const gradingThreshold = useAppSelector((s) => s.subMargin.gradingThreshold);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [rawItemThreshold, setRawItemThreshold] = useState<number | null>(gradingThreshold);
  const [sheetItem, setSheetItem] = useState<AggregatedItem | null>(null);

  // Grading should never move items around on its own when the threshold
  // input is cleared — keep grading against the last valid amount so tier
  // placement stays exactly where it was until a new number is typed.
  const itemThresholdRef = useRef<number>(rawItemThreshold ?? gradingThreshold ?? 9);
  if (rawItemThreshold != null) itemThresholdRef.current = rawItemThreshold;
  const itemThreshold = itemThresholdRef.current;

  const pillClass = (pts: number | null) => {
    const base = "text-[10px] font-semibold px-1.5 py-0.5 rounded";
    if (pts === null) return `${base} bg-gray-100 text-gray-500`;
    if (pts < -itemThreshold) return `${base} bg-red-100 text-red-800`;
    if (pts < 0) return `${base} bg-amber-100 text-amber-800`;
    return `${base} bg-emerald-100 text-emerald-800`;
  };

  const grade = subDeptGrades[ctx.selectedSubDeptId];
  const subDept = ctx.subDepts.find((sd) => sd.id === ctx.selectedSubDeptId);

  // Day strip: 7 TY dates, compare margin vs same-index LY date
  const dayStrip = useMemo(() => {
    if (!grade) return [];
    const tyDates = [...new Set(grade.tyWeekOneMargins.map((m) => m.sale_date))].sort();
    const lyDates = [...new Set(grade.lyWeekOneMargins.map((m) => m.sale_date))].sort();
    return tyDates.map((date, i) => {
      const tyDay = grade.tyWeekOneMargins.filter((m) => m.sale_date === date);
      const lyDay = lyDates[i] ? grade.lyWeekOneMargins.filter((m) => m.sale_date === lyDates[i]) : [];
      const tyNet = computeNet(tyDay);
      const tyCogs = computeCogs(tyDay);
      const lyNet = computeNet(lyDay);
      const lyCogs = computeCogs(lyDay);
      const tyM = computeMarginPct(tyNet, tyCogs);
      const lyM = computeMarginPct(lyNet, lyCogs);
      const d = new Date(date.split("T")[0] + "T12:00:00");
      const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateStr = d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
      const hasRef = lyNet > 0;
      return { date, weekday, dateStr, isUp: tyM >= lyM, hasRef };
    });
  }, [grade]);

  // KPI: weekly totals or single-day totals
  const kpi = useMemo(() => {
    if (!grade) return null;
    if (!selectedDay) {
      return {
        tyMarginPct: grade.tyMarginPct,
        ptsDelta: grade.ptsDelta,
        lwPtsDelta: grade.lwPtsDelta,
      };
    }
    const tyDay = grade.tyWeekOneMargins.filter((m) => m.sale_date === selectedDay);
    const tyDates = [...new Set(grade.tyWeekOneMargins.map((m) => m.sale_date))].sort();
    const lyDates = [...new Set(grade.lyWeekOneMargins.map((m) => m.sale_date))].sort();
    const lwDates = [...new Set(grade.lwWeekOneMargins.map((m) => m.sale_date))].sort();
    const dayIdx = tyDates.indexOf(selectedDay);
    const lyDay = dayIdx >= 0 && lyDates[dayIdx] ? grade.lyWeekOneMargins.filter((m) => m.sale_date === lyDates[dayIdx]) : [];
    const lwDay = dayIdx >= 0 && lwDates[dayIdx] ? grade.lwWeekOneMargins.filter((m) => m.sale_date === lwDates[dayIdx]) : [];

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
    };
  }, [grade, selectedDay]);

  // Aggregate items from selected day (or full week)
  const items = useMemo((): AggregatedItem[] => {
    if (!grade) return [];
    const source = selectedDay
      ? grade.tyWeekOneMargins.filter((m) => m.sale_date === selectedDay)
      : grade.tyWeekOneMargins;

    const byCode = new Map<string, { desc: string; ty: SubDeptMargin[]; ly: SubDeptMargin[]; lw: SubDeptMargin[] }>();

    source.forEach((m) => {
      if (!byCode.has(m.product_code)) {
        byCode.set(m.product_code, { desc: m.product_description, ty: [], ly: [], lw: [] });
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
        const tier: MarginTier =
          ptsDelta < -itemThreshold ? "critical" : ptsDelta < 0 ? "watch" : "healthy";

        const firstTy = ty[0];
        const noCost = firstTy
          ? firstTy.case_size === 0 || (firstTy.net_cost === 0 && firstTy.cost === 0)
          : false;

        return {
          product_code: code,
          product_description: desc,
          tyNet, tyQty, tyMarginPct: tyM,
          lyNet, lyQty, lyMarginPct: lyM,
          lwNet, lwQty, lwMarginPct: lwM,
          ptsDelta, lwPtsDelta, tier, noCost,
        };
      })
      .sort((a, b) => {
        if (a.tier !== b.tier) return TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
        return a.ptsDelta - b.ptsDelta;
      });
  }, [grade, selectedDay, itemThreshold]);

  const counts: Record<SevFilter, number> = {
    all: items.length,
    critical: items.filter((i) => i.tier === "critical").length,
    watch: items.filter((i) => i.tier === "watch").length,
    healthy: items.filter((i) => i.tier === "healthy").length,
  };

  const visibleItems = sevFilter === "all" ? items : items.filter((i) => i.tier === sevFilter);

  const endLabel = new Date(params.end + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] overflow-hidden bg-gray-50">
      {/* Navy header */}
      <div className="flex-shrink-0 px-3 pt-2 pb-2.5" style={{ background: "#1e2a4a" }}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-white/70 hover:text-white transition-colors flex-shrink-0 -ml-1">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="text-[13px] font-semibold text-white">{subDept?.desc ?? "Sub Dept"}</div>
            <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              Weekly Margin Report · {endLabel}
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      {kpi && (
        <div className="flex-shrink-0 grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-white">
          <div className="px-3 py-2">
            <div className="text-[8px] font-semibold uppercase tracking-wide text-content/50">TY Margin</div>
            <div className="text-[14px] font-bold text-content mt-0.5">{fmt1(kpi.tyMarginPct)}%</div>
          </div>
          <div className="px-3 py-2">
            <div className="text-[8px] font-semibold uppercase tracking-wide text-content/50">vs LW</div>
            <div className={`text-[13px] font-bold mt-0.5 ${kpi.lwPtsDelta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {fmtPts(kpi.lwPtsDelta)}
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="text-[8px] font-semibold uppercase tracking-wide text-content/50">vs LY</div>
            <div className={`text-[13px] font-bold mt-0.5 ${kpi.ptsDelta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {fmtPts(kpi.ptsDelta)}
            </div>
          </div>
        </div>
      )}

      {/* Day strip */}
      <div
        className="flex-shrink-0 grid bg-white border-b border-gray-100"
        style={{ gridTemplateColumns: `repeat(${dayStrip.length + 1}, 1fr)` }}
      >
        {/* ALL cell */}
        <button
          onClick={() => setSelectedDay(null)}
          className={`py-2 flex flex-col items-center justify-center gap-1 border-r border-gray-100 ${
            selectedDay === null ? "bg-[#1e2a4a]" : ""
          }`}
        >
          <span className={`text-[9px] font-semibold leading-none ${selectedDay === null ? "text-white" : "text-content"}`}>
            ALL
          </span>
          <span className={`text-[7px] ${selectedDay === null ? "text-white/60" : "text-content/50"}`}>wk</span>
        </button>
        {/* Day cells */}
        {dayStrip.map(({ date, weekday, dateStr, isUp, hasRef }) => {
          const isSelected = selectedDay === date;
          const dayBadgeBg = !hasRef ? "#e5e7eb" : isUp ? "#d1fae5" : "#fee2e2";
          const dayBadgeColor = !hasRef ? "#9ca3af" : isUp ? "#10b981" : "#ef4444";
          return (
            <button
              key={date}
              onClick={() => setSelectedDay(date === selectedDay ? null : date)}
              className={`py-1.5 flex flex-col items-center justify-center gap-1 border-r border-gray-100 last:border-r-0 ${
                isSelected ? "bg-[#1e2a4a]" : ""
              }`}
            >
              <span className={`text-[9px] font-semibold leading-none ${isSelected ? "text-white" : "text-content"}`}>
                {weekday}{" "}
                <span className={isSelected ? "text-white/65" : "text-content/60"}>
                  {dateStr}
                </span>
              </span>
              <div
                className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center flex-shrink-0"
                style={{ background: isSelected ? "rgba(255,255,255,0.2)" : dayBadgeBg }}
              >
                {(!hasRef || isUp)
                  ? <CheckCircleIcon className="w-2.5 h-2.5" style={{ color: isSelected ? "rgba(255,255,255,0.7)" : dayBadgeColor }} />
                  : <ExclamationTriangleIcon className="w-2.5 h-2.5" style={{ color: isSelected ? "rgba(255,255,255,0.7)" : dayBadgeColor }} />
                }
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab bar + threshold */}
      <div className="flex-shrink-0 flex items-center bg-white border-b border-gray-100 px-3">
        <div className="py-2.5 text-[11px] font-semibold text-content border-b-2 border-[#1e2a4a]">Items</div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-[9px] text-content/50">
          <span>Threshold</span>
          <input
            type="number"
            value={rawItemThreshold === null ? "" : rawItemThreshold}
            onChange={(e) => {
              if (e.target.value === "") { setRawItemThreshold(null); return; }
              const n = Number(e.target.value);
              if (!isNaN(n) && n >= 0) setRawItemThreshold(n);
            }}
            className="w-8 text-center text-[10px] bg-gray-50 border border-gray-200 rounded px-1 py-0.5 text-content"
            style={{ outline: "none", WebkitAppearance: "none", boxShadow: "none" }}
            min={0}
          />
          <span>pts</span>
        </div>
      </div>

      <SevChips active={sevFilter} counts={counts} onChange={setSevFilter} />

      {/* Item signal list */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
        {visibleItems.map((item) => (
          <button
            key={item.product_code}
            onClick={() => setSheetItem(item)}
            className="w-full px-3 py-2.5 bg-white border-b border-gray-100 text-left active:bg-gray-50"
          >
            <div className="flex items-center gap-2.5">
              <SevBadge sev={item.tier} />
              <span className="flex-1 text-[12px] font-medium text-content truncate">{item.product_description}</span>
              <div className="flex items-baseline gap-1.5 flex-shrink-0">
                <span className="text-[12px] font-semibold text-content">{formatCurrency2(item.tyNet)}</span>
                <span className="text-[11px] text-content/60">{item.tyQty.toLocaleString()} u</span>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-content/45 flex-shrink-0" />
            </div>
            <div className="flex gap-2 mt-1.5 justify-end">
              {item.lwNet > 0 && (
                <span className={pillClass(item.lwPtsDelta)}>LW {fmtPts(item.lwPtsDelta)}</span>
              )}
              <span className={pillClass(item.lyNet > 0 ? item.ptsDelta : null)}>
                LY {item.lyNet > 0 ? fmtPts(item.ptsDelta) : "—"}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Item bottom sheet */}
      {sheetItem && (
        <BottomSheet onClose={() => setSheetItem(null)}>
          <div className="flex items-start justify-between px-4 pb-3 border-b border-gray-100">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-content truncate">{sheetItem.product_description}</div>
              <div className="text-[10px] text-content/45 mt-0.5">{sheetItem.product_code}</div>
            </div>
            <div
              className="flex-shrink-0 ml-3 flex items-center gap-1.5 px-2 py-1 rounded-full"
              style={{ background: BADGE_BG[sheetItem.tier] }}
            >
              {sheetItem.tier === "critical" && (
                <ExclamationTriangleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[sheetItem.tier] }} />
              )}
              {sheetItem.tier === "watch" && (
                <ExclamationCircleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[sheetItem.tier] }} />
              )}
              {sheetItem.tier === "healthy" && (
                <CheckCircleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[sheetItem.tier] }} />
              )}
              <span className="text-[10px] font-bold" style={{ color: BADGE_COLOR[sheetItem.tier] }}>
                {sheetItem.tier.charAt(0).toUpperCase() + sheetItem.tier.slice(1)}
              </span>
            </div>
          </div>

          {/* TW / LW / LY KPI */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
            <div className="px-3 py-2.5">
              <div className="text-[8px] font-semibold uppercase tracking-wide text-content/50">TW</div>
              <div className="text-[13px] font-bold text-content mt-0.5">{formatCurrency2(sheetItem.tyNet)}</div>
              <div className="text-[9px] text-content/50 mt-0.5">{fmt1(sheetItem.tyMarginPct)}% margin</div>
              <div className="text-[9px] text-content/40">{sheetItem.tyQty.toFixed(0)} units</div>
            </div>
            <div className="px-3 py-2.5">
              <div className="text-[8px] font-semibold uppercase tracking-wide text-content/50">LW</div>
              <div className="text-[13px] font-bold text-content mt-0.5">{formatCurrency2(sheetItem.lwNet)}</div>
              <div className={`text-[9px] font-semibold mt-0.5 ${sheetItem.lwPtsDelta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {fmtPts(sheetItem.lwPtsDelta)}
              </div>
              <div className="text-[9px] text-content/40">{sheetItem.lwQty.toFixed(0)} units</div>
            </div>
            <div className="px-3 py-2.5">
              <div className="text-[8px] font-semibold uppercase tracking-wide text-content/50">LY</div>
              <div className="text-[13px] font-bold text-content mt-0.5">{formatCurrency2(sheetItem.lyNet)}</div>
              <div className={`text-[9px] font-semibold mt-0.5 ${sheetItem.ptsDelta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {fmtPts(sheetItem.ptsDelta)}
              </div>
              <div className="text-[9px] text-content/40">{sheetItem.lyQty.toFixed(0)} units</div>
            </div>
          </div>

          {/* Extra rows */}
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-content/60">LY margin</span>
            <span className="text-[11px] font-semibold text-content">{fmt1(sheetItem.lyMarginPct)}%</span>
          </div>
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-content/60">LW margin</span>
            <span className="text-[11px] font-semibold text-content">{fmt1(sheetItem.lwMarginPct)}%</span>
          </div>
          {sheetItem.noCost && (
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-[11px] text-content/60">Cost data</span>
              <span className="text-[11px] font-semibold text-red-600">Missing cost data</span>
            </div>
          )}
          <div className="h-4 flex-shrink-0" />
        </BottomSheet>
      )}
    </div>
  );
};

export default SubDeptReportMobile;
