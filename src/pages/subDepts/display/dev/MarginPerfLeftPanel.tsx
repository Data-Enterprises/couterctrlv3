import { useState } from "react";
import { MagnifyingGlassIcon, QuestionMarkCircleIcon } from "@heroicons/react/16/solid";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { formatDate } from "../widgets";
import { setDates } from "../..";
import {
  setGradingThreshold,
  setGradingMetric,
  setSelectedSubDeptId,
  type MarginTier,
  type SubDeptGrade,
  type GradingMetric,
} from "../../../../features/subMarginSlice";
import TierStrip from "../../../../components/TierStrip";
import UniversalTierColumn from "../../../../components/TierColumn";
import ThresholdFilter from "../../../../components/filters/ThresholdFilter";

interface Props {
  onSearchOpen: () => void;
}

const getTier = (grade: SubDeptGrade, threshold: number, metric: GradingMetric): MarginTier => {
  const vsLY = metric === "margin" ? grade.ptsDelta : grade.vsLYSalesPct;
  if (vsLY >= 0) return "healthy";
  if (vsLY < -threshold) return "critical";
  return "watch";
};

const SHADOW: Record<MarginTier, string> = {
  critical: "rgba(239, 68, 68, 0.25)",
  watch: "rgba(245, 158, 11, 0.25)",
  healthy: "rgba(16, 185, 129, 0.25)",
};

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(1)}k`
    : `$${n.toFixed(0)}`;

const SubDeptCard = ({
  id,
  grade,
  tier,
  name,
  isSelected,
  onClick,
}: {
  id: number;
  grade: SubDeptGrade;
  tier: MarginTier;
  name: string;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const ptsDelta = grade.ptsDelta;
  const hasLY = grade.lyMarginPct > 0 || grade.lySales > 0;
  const vsLY = grade.vsLYSalesPct;

  return (
    <button
      key={id}
      onClick={onClick}
      className={`flex flex-col w-full px-3 py-2.5 transition-colors gap-1.5 text-left border-b border-gray-100 ${
        isSelected ? "" : "hover:bg-gray-50"
      }`}
      style={isSelected ? { boxShadow: `inset 0 0 8px ${SHADOW[tier]}` } : undefined}
    >
      <div className="text-[11px] font-medium text-content truncate w-full text-center">{name}</div>
      <div className="grid grid-cols-4">
        {/* TY Sales */}
        <div className="px-1 py-1 text-center">
          <div className="text-[7px] text-content/45 uppercase tracking-wide">TY Sales</div>
          <div className="text-[10px] font-medium text-content mt-0.5">{fmt(grade.tySales)}</div>
        </div>
        {/* LY Sales */}
        <div className="px-1 py-1 text-center">
          <div className="text-[7px] text-content/45 uppercase tracking-wide">LY Sales</div>
          <div className="text-[10px] font-medium text-content mt-0.5">
            {hasLY ? fmt(grade.lySales) : "—"}
          </div>
          {hasLY && (
            <div
              className="text-[9px] font-medium mt-0.5"
              style={{ color: vsLY >= 0 ? "#16a34a" : "#ef4444" }}
            >
              {vsLY >= 0 ? "+" : ""}{vsLY.toFixed(1)}%
            </div>
          )}
        </div>
        {/* TY Margin */}
        <div className="px-1 py-1 text-center">
          <div className="text-[7px] text-content/45 uppercase tracking-wide">TY Mgn</div>
          <div className="text-[10px] font-medium text-content mt-0.5">{grade.tyMarginPct.toFixed(1)}%</div>
        </div>
        {/* LY Margin */}
        <div className="px-1 py-1 text-center">
          <div className="text-[7px] text-content/45 uppercase tracking-wide">LY Mgn</div>
          <div className="text-[10px] font-medium text-content mt-0.5">
            {hasLY ? `${grade.lyMarginPct.toFixed(1)}%` : "—"}
          </div>
          {hasLY && (
            <div
              className="text-[9px] font-medium mt-0.5"
              style={{ color: ptsDelta >= 0 ? "#16a34a" : "#ef4444" }}
            >
              {ptsDelta >= 0 ? "+" : ""}{ptsDelta.toFixed(1)} pts
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

const TOGGLE_OPTS: { key: GradingMetric; label: string }[] = [
  { key: "margin", label: "Margin" },
  { key: "sales", label: "Sales" },
];

const MarginPerfLeftPanel = ({ onSearchOpen }: Props) => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const [legendHover, setLegendHover] = useState(false);

  const subDeptGrades = useAppSelector((s) => s.subMargin.subDeptGrades);
  const gradingThreshold = useAppSelector((s) => s.subMargin.gradingThreshold);
  const gradingMetric = useAppSelector((s) => s.subMargin.gradingMetric);
  const loadingGrades = useAppSelector((s) => s.subMargin.loadingGrades);

  const storeName = ctx.assignedStores.find((s) => s.storeid === ctx.searchValue)?.store_name ?? "";

  const periodEnd = ctx.singleDate ? formatDate(setDates(new Date(ctx.singleDate), 0)) : "";
  const periodStart = ctx.singleDate ? formatDate(setDates(new Date(ctx.singleDate), 6)) : "";
  const dateRange = periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : "";

  const grades = Object.entries(subDeptGrades).map(([id, grade]) => ({
    id: Number(id),
    grade,
    tier: getTier(grade, gradingThreshold, gradingMetric),
  }));

  const criticalGrades = grades.filter((g) => g.tier === "critical");
  const watchGrades = grades.filter((g) => g.tier === "watch");
  const healthyGrades = grades.filter((g) => g.tier === "healthy");

  const avgMarginPct = grades.length
    ? grades.reduce((acc, g) => acc + g.grade.tyMarginPct, 0) / grades.length
    : null;
  const avgDelta = grades.length
    ? grades.reduce((acc, g) => acc + g.grade.ptsDelta, 0) / grades.length
    : null;
  const totalTySales = grades.reduce((acc, g) => acc + g.grade.tySales, 0);
  const totalLySales = grades.reduce((acc, g) => acc + g.grade.lySales, 0);
  const vsLYSalesPct = totalLySales > 0 ? ((totalTySales - totalLySales) / totalLySales) * 100 : null;
  const totalNoCost = grades.reduce((acc, g) => acc + g.grade.noCostCount, 0);

  const threshValue = { op: "gt" as const, amount: gradingThreshold };

  const handleSubDeptClick = (id: number) => {
    if (id === ctx.selectedSubDeptId) return;
    dispatch(setSelectedSubDeptId(id));
  };

  const renderCards = (tierGrades: typeof grades) => {
    if (tierGrades.length === 0) return undefined;
    return (
      <>
        {tierGrades.map(({ id, grade, tier }) => {
          const sd = ctx.subDepts.find((s) => s.id === id);
          if (!sd) return null;
          return (
            <SubDeptCard
              key={id}
              id={id}
              grade={grade}
              tier={tier}
              name={sd.desc}
              isSelected={ctx.selectedSubDeptId === id}
              onClick={() => handleSubDeptClick(id)}
            />
          );
        })}
      </>
    );
  };

  const tooltipTiers =
    gradingMetric === "margin"
      ? [
          { color: "#fca5a5", label: `Critical — >${gradingThreshold}pts below LY` },
          { color: "#fcd34d", label: `Watch — 0–${gradingThreshold}pts below LY` },
          { color: "#6ee7b7", label: "Healthy — at or above LY" },
        ]
      : [
          { color: "#fca5a5", label: `Critical — >${gradingThreshold}% below LY` },
          { color: "#fcd34d", label: `Watch — 0–${gradingThreshold}% below LY` },
          { color: "#6ee7b7", label: "Healthy — at or above LY" },
        ];

  return (
    <div
      className="flex flex-col min-w-0 shadow-lg"
      style={{ flexBasis: "46%", flexShrink: 0 }}
    >
      {/* Navy header — 2-row canonical pattern */}
      <div className="bg-[#1e2a4a] rounded-t-xl px-4 pt-1 pb-2.5 flex flex-col gap-0">

        {/* Row 1: title + date range | aggregate metrics */}
        <div className="flex items-end gap-3 min-h-[26px]">
          <span className="text-white font-medium text-[13px] flex-shrink-0">Margin performance</span>
          {dateRange && (
            <span className="text-white/35 text-[11px] flex-shrink-0">{dateRange}</span>
          )}
          <div className="flex-1" />
          {grades.length > 0 && (
            <>
              {gradingMetric === "margin" ? (
                <>
                  {avgMarginPct !== null && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] text-white/45 uppercase tracking-wide">Avg</span>
                      <span className="text-[13px] font-medium text-white">{avgMarginPct.toFixed(1)}%</span>
                    </div>
                  )}
                  {avgDelta !== null && (
                    <>
                      <div className="w-px h-4 bg-white/15 flex-shrink-0" />
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] text-white/45 uppercase tracking-wide">vs LY</span>
                        <span className="text-[13px] font-medium" style={{ color: avgDelta >= 0 ? "#86efac" : "#fca5a5" }}>
                          {avgDelta >= 0 ? "+" : ""}{avgDelta.toFixed(1)} pts
                        </span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] text-white/45 uppercase tracking-wide">Sales</span>
                    <span className="text-[13px] font-medium text-white">{fmt(totalTySales)}</span>
                  </div>
                  {vsLYSalesPct !== null && (
                    <>
                      <div className="w-px h-4 bg-white/15 flex-shrink-0" />
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] text-white/45 uppercase tracking-wide">vs LY</span>
                        <span className="text-[13px] font-medium" style={{ color: vsLYSalesPct >= 0 ? "#86efac" : "#fca5a5" }}>
                          {vsLYSalesPct >= 0 ? "+" : ""}{vsLYSalesPct.toFixed(1)}%
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}
              {totalNoCost > 0 && (
                <>
                  <div className="w-px h-4 bg-white/15 flex-shrink-0" />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] text-white/45 uppercase tracking-wide">No cost</span>
                    <span className="text-[13px] font-medium text-amber-300">{totalNoCost}</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Row 2: search btn + store | metric toggle | threshold | help btn */}
        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-white/[0.08]">
          <button
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors flex-shrink-0"
            onClick={onSearchOpen}
            title="Search"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-medium text-white/70 truncate min-w-0">{storeName}</span>

          <div className="flex-1" />

          {/* Margin / Sales grading toggle */}
          <div
            className="flex items-center rounded flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.1)", padding: 2, gap: 2 }}
          >
            {TOGGLE_OPTS.map(({ key, label }) => {
              const active = gradingMetric === key;
              return (
                <button
                  key={key}
                  onClick={() => dispatch(setGradingMetric(key))}
                  className="rounded transition-colors text-[10px] font-medium"
                  style={{
                    padding: "2px 8px",
                    background: active ? "rgba(255,255,255,0.2)" : "transparent",
                    color: active ? "#fff" : "rgba(255,255,255,0.45)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="w-px h-4 bg-white/15 flex-shrink-0" />

          {/* Threshold input */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-white/45 uppercase tracking-wide">Threshold</span>
            <ThresholdFilter
              value={threshValue}
              onChange={(v) => dispatch(setGradingThreshold(v?.amount ?? gradingThreshold))}
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
            <button className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-colors">
              <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
            </button>
            {legendHover && (
              <div
                className="absolute right-0 top-full mt-1.5 z-50 bg-[#1e2a4a] border border-white/15 rounded-lg shadow-lg px-3 py-2.5 flex flex-col gap-1.5"
                style={{ minWidth: 210 }}
              >
                {tooltipTiers.map(({ color, label }) => (
                  <div key={label} className="flex items-start gap-2">
                    <div className="w-[7px] h-[7px] rounded-[2px] flex-shrink-0 mt-[3px]" style={{ background: color }} />
                    <span className="text-[11px] text-white/90 leading-snug">{label}</span>
                  </div>
                ))}
                <div className="h-px bg-white/10 my-0.5" />
                <div className="text-[9px] text-white/50 leading-snug mb-0.5">
                  The selected metric drives sub dept grading and all comparisons in the right panel.
                </div>
                <div className="h-px bg-white/10 my-0.5" />
                <div className="text-[9px] font-semibold uppercase tracking-wide text-white/35">
                  Metric graded
                </div>
                {([{ label: "Margin", key: "margin" }, { label: "Sales", key: "sales" }] as { label: string; key: GradingMetric }[]).map(({ label, key }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="text-white/30 text-[10px]">·</span>
                    <span className="text-[10px] text-white/90">{label}</span>
                    {gradingMetric === key && (
                      <span className="text-[9px] text-white/60 italic">selected</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tier strip */}
      <TierStrip
        critical={criticalGrades.length}
        watch={watchGrades.length}
        healthy={healthyGrades.length}
        className="border-x border-gray-100"
      />

      {/* Tier columns — exactly matching Sales structure */}
      <div className="flex-1 overflow-hidden bg-custom-white rounded-b-xl shadow-sm border border-t-0 border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
        {loadingGrades && grades.length === 0 ? (
          <div className="col-span-3 flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-gray-200 border-t-[#1e2a4a] rounded-full animate-spin" />
            <span className="text-[11px] text-content/40">Grading sub departments…</span>
          </div>
        ) : (
          <>
            <UniversalTierColumn emptyText="None this week">
              {renderCards(criticalGrades)}
            </UniversalTierColumn>
            <UniversalTierColumn emptyText="None this week">
              {renderCards(watchGrades)}
            </UniversalTierColumn>
            <UniversalTierColumn emptyText="None this week">
              {renderCards(healthyGrades)}
            </UniversalTierColumn>
          </>
        )}
      </div>
    </div>
  );
};

export default MarginPerfLeftPanel;
