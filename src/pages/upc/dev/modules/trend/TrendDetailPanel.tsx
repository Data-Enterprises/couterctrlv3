import type { UpcTrend } from "../../../../../interfaces";
import CtaInsightStrip from "../../components/CtaInsightStrip";
import KpiTileGrid from "../../components/KpiTileGrid";
import BeforeAfterBar from "../../components/BeforeAfterBar";
import BeforeAfterLegend from "../../components/BeforeAfterLegend";
import type { KpiCell } from "../../types";
import type { TrendStatus } from "./trendStats";
import { accelerationFactor } from "./trendStats";
import { getTrendPhrase, getTrendInsight } from "./trendPhrase";
import { getWindowDays, activeRatePct, isWeakBaseline, isSmallSample } from "./trendWindow";
import TrendBeforeAfterTile from "./TrendBeforeAfterTile";

interface Props {
  trend: UpcTrend;
  status: TrendStatus;
  periods: number;
  trendStartDate: string | null;
}

const TrendDetailPanel = ({ trend: t, status, periods, trendStartDate }: Props) => {
  const phrase = getTrendPhrase(status);
  const insight = getTrendInsight(t, status);
  const factor = status === "accelerating" ? accelerationFactor(t) : null;

  const { beforeWindowDays, afterWindowDays } = trendStartDate
    ? getWindowDays(trendStartDate, periods)
    : { beforeWindowDays: periods, afterWindowDays: 0 };

  const activeRateBefore = activeRatePct(t.active_days_before, beforeWindowDays);
  const activeRateAfter = activeRatePct(t.active_days_after, afterWindowDays);
  const r2BeforePct = Math.round(t["r2-before"] * 100);
  const r2AfterPct = Math.round(t["r2-after"] * 100);
  const weakBaseline = isWeakBaseline(t["r2-before"]);
  const smallSample = isSmallSample(afterWindowDays);

  const kpis: KpiCell[] = [
    {
      label: "Impact Units",
      value: `${t.impact_units >= 0 ? "▲" : "▼"}${Math.abs(Math.round(t.impact_units)).toLocaleString()}`,
      variant: t.impact_units < 0 ? "down" : "up",
    },
    { label: "Daily rate", value: `${t.mean_before.toFixed(1)} → ${t.mean_after.toFixed(1)}` },
    ...(factor !== null
      ? [{ label: "Acceleration", value: `${factor.toFixed(1)}× faster`, variant: "down" as const }]
      : []),
    { label: "Confidence", value: `${r2AfterPct}%` },
    { label: "Since pivot", value: `${afterWindowDays}d` },
  ];

  return (
    <div className="flex-1 min-w-0 overflow-y-auto thin-scrollbar">
      <CtaInsightStrip title={t.product_description} insight={insight} tone={phrase.tone} />
      <KpiTileGrid items={kpis} />

      <div className="px-4 pb-3.5">
        <div className="mb-5">
          <div className="flex items-center justify-between bg-gray-200 px-2 py-1.5 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-content">Status</span>
            <BeforeAfterLegend />
          </div>

          <BeforeAfterBar
            label="Confidence"
            descriptor="How well the trend fits"
            beforePct={r2BeforePct}
            afterPct={r2AfterPct}
            beforeDisplay={`${r2BeforePct}%`}
            afterDisplay={`${r2AfterPct}%`}
            flagged={weakBaseline}
            note="Sales before this date were inconsistent, so Impact Units above is a rough estimate, not an exact count"
          />
          <BeforeAfterBar
            label="Active Rate"
            descriptor="Share of days actively sold"
            beforePct={activeRateBefore}
            afterPct={activeRateAfter}
            beforeDisplay={`${activeRateBefore}%`}
            afterDisplay={`${activeRateAfter}%`}
            flagged={smallSample}
            note={`Only ${t.active_days_after} selling days since the pivot — still a small sample`}
          />
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-content bg-gray-200 px-2 py-1.5 mb-1">
            Detail
          </div>
          <div className="grid grid-cols-3 gap-2">
            <TrendBeforeAfterTile
              label="Total units"
              before={t.total_before.toLocaleString()}
              after={t.total_after.toLocaleString()}
            />
            <TrendBeforeAfterTile
              label="Volatility"
              before={t.volatility_before.toFixed(1)}
              after={t.volatility_after.toFixed(1)}
            />
            <TrendBeforeAfterTile label="Slope" before={t.slope_before.toFixed(2)} after={t.slope_after.toFixed(2)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendDetailPanel;
