import { useRef, useState } from "react";
import { MagnifyingGlassIcon, QuestionMarkCircleIcon } from "@heroicons/react/16/solid";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { formatDate } from "../widgets";
import { formatCurrency2 } from "../../../../utils";
import { setDates, getTier } from "../..";
import {
  setGradingThreshold,
  setGradingMetric,
  setSelectedSubDeptId,
  type MarginTier,
  type SubDeptGrade,
  type GradingMetric,
} from "../../../../features/subMarginSlice";
import ThresholdFilter from "../../../../components/filters/ThresholdFilter";
import TextFilter from "../../../../components/filters/TextFilter";
import { severityDotClass, pillClass, formatPct, type SevFilter } from "../../../../utils/severity";
import type { SubDeptMargin } from "../../../../interfaces";

interface Props {
  onSearchOpen: () => void;
}

const SEV_RANK: Record<MarginTier, number> = { critical: 0, watch: 1, healthy: 2 };

const TOGGLE_OPTS: { key: GradingMetric; label: string }[] = [
  { key: "margin", label: "Margin" },
  { key: "sales", label: "Sales" },
];

const TIER_STROKE: Record<MarginTier, string> = {
  critical: "#ef4444",
  watch: "#fbbf24",
  healthy: "#10b981",
};

// Small inline trend line for a sub dept's daily sales across the current
// week — purely visual, no axis/labels, sized to sit in a single row.
const Sparkline = ({ values, stroke }: { values: number[]; stroke: string }) => {
  const w = 48;
  const h = 18;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;
  const points = values
    .map((v, i) => {
      const x = values.length > 1 ? (i / (values.length - 1)) * w : w / 2;
      const y = range > 0 ? h - 2 - ((v - min) / range) * (h - 4) : h / 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  );
};

const MarginPerfLeftPanel = ({ onSearchOpen }: Props) => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const [legendHover, setLegendHover] = useState(false);
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [subDeptFilter, setSubDeptFilter] = useState("");

  const subDeptGrades = useAppSelector((s) => s.subMargin.subDeptGrades);
  const rawGradingThreshold = useAppSelector((s) => s.subMargin.gradingThreshold);
  const gradingMetric = useAppSelector((s) => s.subMargin.gradingMetric);

  // Grading should never move sub depts around on its own when the threshold
  // input is cleared — keep grading against the last valid amount so tier
  // placement stays exactly where it was until a new number is typed.
  const gradingThresholdRef = useRef<number>(rawGradingThreshold ?? 9);
  if (rawGradingThreshold != null) gradingThresholdRef.current = rawGradingThreshold;
  const gradingThreshold = gradingThresholdRef.current;
  const loadingGrades = useAppSelector((s) => s.subMargin.loadingGrades);

  const storeName = ctx.assignedStores.find((s) => s.storeid === ctx.searchValue)?.store_name ?? "";

  const periodEnd = ctx.singleDate ? formatDate(setDates(new Date(ctx.singleDate), 0)) : "";
  const periodStart = ctx.singleDate ? formatDate(setDates(new Date(ctx.singleDate), 6)) : "";
  const dateRange = periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : "";

  // Oldest → newest, so the sparkline reads left-to-right chronologically.
  const weekDates = ctx.singleDate
    ? Array.from({ length: 7 }, (_, i) => setDates(new Date(ctx.singleDate!), 6 - i))
    : [];

  // Each grade already carries its own week's raw line items (tyWeekOneMargins)
  // from the per-sub-dept fetch — state.subMargin.margins itself is never
  // populated in dev mode (only the legacy page's fetch dispatches setMargins),
  // so that flat array can't be used as a shared lookup here.
  const dailySeries = (margins: SubDeptMargin[]) => {
    const byDay = new Map<string, number>();
    for (const m of margins) {
      const day = m.sale_date.split("T")[0];
      byDay.set(day, (byDay.get(day) ?? 0) + (m.total_sales - m.total_tax));
    }
    return weekDates.map((d) => byDay.get(d) ?? 0);
  };

  const grades = Object.entries(subDeptGrades).map(([id, grade]) => ({
    id: Number(id),
    grade,
    tier: getTier(grade, gradingThreshold, gradingMetric),
  }));

  const criticalCount = grades.filter((g) => g.tier === "critical").length;
  const watchCount = grades.filter((g) => g.tier === "watch").length;
  const healthyCount = grades.filter((g) => g.tier === "healthy").length;

  const avgMarginPct = grades.length
    ? grades.reduce((acc, g) => acc + g.grade.tyMarginPct, 0) / grades.length
    : null;
  const avgDelta = grades.length
    ? grades.reduce((acc, g) => acc + g.grade.ptsDelta, 0) / grades.length
    : null;
  const totalTySales = grades.reduce((acc, g) => acc + g.grade.tySales, 0);
  const totalLySales = grades.reduce((acc, g) => acc + g.grade.lySales, 0);
  const totalLwSales = grades.reduce((acc, g) => acc + g.grade.lwSales, 0);
  const vsLYSalesPct = totalLySales > 0 ? ((totalTySales - totalLySales) / totalLySales) * 100 : null;
  const vsLWSalesPct = totalLwSales > 0 ? ((totalTySales - totalLwSales) / totalLwSales) * 100 : null;
  const avgLwDelta = grades.length
    ? grades.reduce((acc, g) => acc + g.grade.lwPtsDelta, 0) / grades.length
    : null;

  const threshValue = rawGradingThreshold === null ? null : { op: "gt" as const, amount: rawGradingThreshold };

  const handleSubDeptClick = (id: number) => {
    if (id === ctx.selectedSubDeptId) return;
    dispatch(setSelectedSubDeptId(id));
  };

  const rows = grades
    .map(({ id, grade, tier }) => {
      const sd = ctx.subDepts.find((s) => s.id === id);
      if (!sd) return null;
      return { id, grade, tier, name: sd.desc };
    })
    .filter((r): r is { id: number; grade: SubDeptGrade; tier: MarginTier; name: string } => r !== null);

  const sevFilteredRows =
    sevFilter === "all" ? rows : rows.filter((r) => r.tier === sevFilter);
  const textFilteredRows = subDeptFilter
    ? sevFilteredRows.filter((r) =>
        r.name.toLowerCase().includes(subDeptFilter.toLowerCase()),
      )
    : sevFilteredRows;
  const visibleRows = [...textFilteredRows].sort(
    (a, b) => SEV_RANK[a.tier] - SEV_RANK[b.tier],
  );

  const tooltipTiers =
    gradingMetric === "margin"
      ? [
          { color: "#fca5a5", label: `Critical — >${gradingThreshold}pts below LY (or LW if no LY)` },
          { color: "#fcd34d", label: `Watch — 0–${gradingThreshold}pts below LY (or LW if no LY)` },
          { color: "#6ee7b7", label: "Healthy — at or above LY (or LW if no LY)" },
        ]
      : [
          { color: "#fca5a5", label: `Critical — >${gradingThreshold}% below LY (or LW if no LY)` },
          { color: "#fcd34d", label: `Watch — 0–${gradingThreshold}% below LY (or LW if no LY)` },
          { color: "#6ee7b7", label: "Healthy — at or above LY (or LW if no LY)" },
        ];

  return (
    <div
      className="flex flex-col min-w-0 shadow-lg"
      style={{ flexBasis: "35%", flexShrink: 0 }}
    >
      {/* Navy header — 2-row canonical pattern */}
      <div className="bg-[#1e2a4a] rounded-t-xl px-4 pt-1 pb-2.5 flex flex-col gap-0">

        {/* Row 1: date range | primary value + vs LW/LY pills */}
        <div className="flex items-center gap-2 min-h-[26px]">
          <span className="text-custom-white font-semibold text-[13px] flex-shrink-0">{dateRange}</span>
          <div className="flex-1" />
          {grades.length > 0 && (
            <>
              <span className="text-[14px] font-semibold text-custom-white">
                {gradingMetric === "margin"
                  ? avgMarginPct !== null
                    ? `${avgMarginPct.toFixed(1)}%`
                    : "—"
                  : formatCurrency2(totalTySales)}
              </span>
              {(gradingMetric === "margin" ? avgLwDelta : vsLWSalesPct) !== null && (
                <span
                  className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${
                    (gradingMetric === "margin" ? avgLwDelta! : vsLWSalesPct!) >= 0
                      ? "bg-emerald-300/15 text-emerald-300"
                      : "bg-red-300/15 text-red-300"
                  }`}
                >
                  LW{" "}
                  {gradingMetric === "margin"
                    ? `${avgLwDelta! >= 0 ? "+" : ""}${avgLwDelta!.toFixed(1)} pts`
                    : formatPct(vsLWSalesPct!)}
                </span>
              )}
              {totalLySales > 0 && (gradingMetric === "margin" ? avgDelta : vsLYSalesPct) !== null && (
                <span
                  className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${
                    (gradingMetric === "margin" ? avgDelta! : vsLYSalesPct!) >= 0
                      ? "bg-emerald-300/15 text-emerald-300"
                      : "bg-red-300/15 text-red-300"
                  }`}
                >
                  LY{" "}
                  {gradingMetric === "margin"
                    ? `${avgDelta! >= 0 ? "+" : ""}${avgDelta!.toFixed(1)} pts`
                    : formatPct(vsLYSalesPct!)}
                </span>
              )}
            </>
          )}
        </div>

        {/* Row 2: search btn + store | metric toggle | threshold | help btn */}
        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-custom-white/[0.08]">
          <button
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/60 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0"
            onClick={onSearchOpen}
            title="Search"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-medium text-custom-white truncate min-w-0">{storeName}</span>

          <div className="flex-1" />

          {/* Margin / Sales grading toggle */}
          <div className="flex items-center flex-shrink-0 rounded overflow-hidden" style={{ height: 22 }}>
            {TOGGLE_OPTS.map(({ key, label }) => {
              const active = gradingMetric === key;
              return (
                <button
                  key={key}
                  onClick={() => dispatch(setGradingMetric(key))}
                  className="px-2.5 text-[10px] text-custom-white font-medium transition-colors h-full"
                  style={{
                    background: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

          {/* Threshold input */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[11px] text-custom-white font-medium">Threshold</span>
            <ThresholdFilter
              value={threshValue}
              onChange={(v) => dispatch(setGradingThreshold(v?.amount ?? null))}
              suffix="%"
              showOp={false}
              inputWidth={40}
              variant="dark"
            />
          </div>

          <div
            className="relative flex-shrink-0"
            onMouseEnter={() => setLegendHover(true)}
            onMouseLeave={() => setLegendHover(false)}
          >
            <button className="w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/75 hover:text-custom-white hover:border-custom-white/40 transition-colors">
              <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
            </button>
            {legendHover && (
              <div
                className="absolute right-0 top-full mt-1.5 z-50 bg-[#1e2a4a] border border-custom-white/15 rounded-lg shadow-lg px-3 py-2.5 flex flex-col gap-1.5"
                style={{ minWidth: 210 }}
              >
                {tooltipTiers.map(({ color, label }) => (
                  <div key={label} className="flex items-start gap-2">
                    <div className="w-[7px] h-[7px] rounded-[2px] flex-shrink-0 mt-[3px]" style={{ background: color }} />
                    <span className="text-[11px] text-custom-white leading-snug">{label}</span>
                  </div>
                ))}
                <div className="h-px bg-custom-white/10 my-0.5" />
                <div className="text-[9px] text-custom-white leading-snug mb-0.5">
                  The selected metric drives sub dept grading and all comparisons in the right panel.
                </div>
                <div className="h-px bg-custom-white/10 my-0.5" />
                <div className="text-[9px] font-semibold uppercase tracking-wide text-custom-white">
                  Metric graded
                </div>
                {([{ label: "Margin", key: "margin" }, { label: "Sales", key: "sales" }] as { label: string; key: GradingMetric }[]).map(({ label, key }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="text-custom-white text-[10px]">·</span>
                    <span className="text-[10px] text-custom-white">{label}</span>
                    {gradingMetric === key && (
                      <span className="text-[9px] text-custom-white">selected</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tier filter chips + text filter */}
      <div className="flex items-center justify-between gap-1.5 px-4 py-2 bg-custom-white border-x border-gray-100">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSevFilter((f) => (f === "critical" ? "all" : "critical"))}
            className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_critical_bg text-severity_critical_text transition-shadow ${
              sevFilter === "critical" ? "ring-2 ring-severity_critical_text/40 shadow-sm" : ""
            }`}
          >
            Crit ({criticalCount})
          </button>
          <button
            onClick={() => setSevFilter((f) => (f === "watch" ? "all" : "watch"))}
            className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_watch_bg text-severity_watch_text transition-shadow ${
              sevFilter === "watch" ? "ring-2 ring-severity_watch_text/40 shadow-sm" : ""
            }`}
          >
            Watch ({watchCount})
          </button>
          <button
            onClick={() => setSevFilter((f) => (f === "healthy" ? "all" : "healthy"))}
            className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_healthy_bg text-severity_healthy_text transition-shadow ${
              sevFilter === "healthy" ? "ring-2 ring-severity_healthy_text/40 shadow-sm" : ""
            }`}
          >
            OK ({healthyCount})
          </button>
        </div>
        <TextFilter
          value={subDeptFilter}
          onChange={setSubDeptFilter}
          placeholder="Filter by sub dept…"
          className="max-w-[180px]"
        />
      </div>

      {/* Unified sub dept list — sorted critical → watch → healthy */}
      <div className="flex-1 overflow-hidden bg-custom-white rounded-b-xl shadow-sm border border-t-0 border-gray-100 flex flex-col">
        {loadingGrades && grades.length === 0 ? (
          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-gray-200 border-t-[#1e2a4a] rounded-full animate-spin" />
            <span className="text-[11px] text-content">Grading sub departments…</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-gray-100 flex-shrink-0">
              <span className="w-2.5 flex-shrink-0" />
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-1">
                Sub Dept
              </span>
              <div className="flex items-center gap-[14px]">
                <span
                  className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-shrink-0 text-center"
                  style={{ width: 48 }}
                >
                  Trend
                </span>
                <span
                  className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-shrink-0 pl-2.5 text-right"
                  style={{ width: 64 }}
                >
                  TY
                </span>
                <span
                  className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-shrink-0 text-center"
                  style={{ width: 72 }}
                >
                  vs LW
                </span>
                <span
                  className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-shrink-0 text-center"
                  style={{ width: 72 }}
                >
                  vs LY
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto thin-scrollbar">
              {visibleRows.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-[11px] text-content/40">
                  None this week
                </div>
              ) : (
                visibleRows.map(({ id, grade, tier, name }) => {
                  const isSel = ctx.selectedSubDeptId === id;
                  const hasLY = grade.lyMarginPct > 0 || grade.lySales > 0;
                  const hasLW = grade.lwSales > 0;

                  const tyValue =
                    gradingMetric === "margin"
                      ? `${grade.tyMarginPct.toFixed(1)}%`
                      : formatCurrency2(grade.tySales);
                  const lwPct = gradingMetric === "margin" ? grade.lwPtsDelta : grade.vsLWSalesPct;
                  const lyPct = gradingMetric === "margin" ? grade.ptsDelta : grade.vsLYSalesPct;
                  const lwDisplay =
                    gradingMetric === "margin"
                      ? `${lwPct >= 0 ? "+" : ""}${lwPct.toFixed(1)} pts`
                      : formatPct(lwPct);
                  const lyDisplay =
                    gradingMetric === "margin"
                      ? `${lyPct >= 0 ? "+" : ""}${lyPct.toFixed(1)} pts`
                      : formatPct(lyPct);

                  return (
                    <button
                      key={id}
                      onClick={() => handleSubDeptClick(id)}
                      className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-[#1e2a4a]/15 ${
                        isSel
                          ? "bg-row_selected border-row_selected_border"
                          : "border-transparent hover:bg-gray-50"
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${severityDotClass[tier]}`} />
                      <span className="text-[13px] font-medium text-content truncate flex-1">
                        {name}
                      </span>
                      <div className="flex items-center gap-[14px]">
                        <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 48 }}>
                          <Sparkline
                            values={dailySeries(grade.tyWeekOneMargins)}
                            stroke={TIER_STROKE[tier]}
                          />
                        </div>
                        <span
                          className="text-[13px] font-semibold text-content flex-shrink-0 pl-2.5 text-right"
                          style={{ width: 64 }}
                        >
                          {tyValue}
                        </span>
                        <span
                          className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${
                            hasLW ? pillClass(lwPct, gradingThreshold) : "bg-gray-100 text-gray-400"
                          }`}
                          style={{ width: 72 }}
                        >
                          {hasLW ? lwDisplay : "—"}
                        </span>
                        <span
                          className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${
                            hasLY ? pillClass(lyPct, gradingThreshold) : "bg-gray-100 text-gray-400"
                          }`}
                          style={{ width: 72 }}
                        >
                          {hasLY ? lyDisplay : "—"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MarginPerfLeftPanel;
