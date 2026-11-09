// Utils
import { accelerationFactor, impactUnits } from "../trendStats";
import { getTrendPhrase, getTrendInsight } from "../utils";
import { activeRatePct, isWeakBaseline, isSmallSample } from "../utils/trendWindow";

// Interfaces
import type { TrendStatus } from "../interfaces";
import type { UpcTrend } from "../../../../../../interfaces";
import type { UpcTrendWindow } from "../../../../../../features/dev/devUpcDevSlice";
import type { KpiCell } from "../../../interfaces";

// Components
import CtaInsightStrip from "../../../components/CtaInsightStrip";
import KpiTileGrid from "../../../components/KpiTileGrid";
import BeforeAfterBar from "./BeforeAfterBar";
import BeforeAfterLegend from "./BeforeAfterLegend";
import TrendBeforeAfterTile from "./TrendBeforeAfterTile";

interface TrendDetailPanelProps {
  trend: UpcTrend;
  status: TrendStatus;
  /** The windows the answer describes. Null only before the first answer. */
  window: UpcTrendWindow | null;
  fixes: boolean;
}

/** The Trend tab's right side for one item: an insight strip, KPI tiles (impact units,
 *  daily rate, confidence, days since the pivot), before/after bars for Confidence and
 *  Active Rate, and before/after tiles for total units, volatility and slope. */
const TrendDetailPanel = ({
  trend: t,
  status,
  window,
  fixes,
}: TrendDetailPanelProps) => {
  const phrase = getTrendPhrase(status);
  const insight = getTrendInsight(t, status, fixes, window);
  const factor = status === "accelerating" ? accelerationFactor(t, fixes) : null;
  const impact = Math.round(impactUnits(t, fixes, window));
  const noBaseline = status === "new";

  const beforeWindowDays = window?.beforeDays ?? 0;
  const afterWindowDays = window?.afterDays ?? 0;
  // "8/1", for the window's own label. Trend runs from the start date to
  // date whatever the search's end date says; the tile says so.
  const pivotShort = window ? window.pivot.split("/").slice(0, 2).join("/") : "";

  const activeRateBefore = beforeWindowDays ? activeRatePct(t.active_days_before, beforeWindowDays) : 0;
  const activeRateAfter = afterWindowDays ? activeRatePct(t.active_days_after, afterWindowDays) : 0;
  const r2BeforePct = Math.round(t["r2-before"] * 100);
  const r2AfterPct = Math.round(t["r2-after"] * 100);
  const weakBaseline = isWeakBaseline(t["r2-before"]);
  const smallSample = window !== null && isSmallSample(afterWindowDays);

  const kpis: KpiCell[] = [
    {
      label: "Impact Units",
      value: noBaseline
        ? "—"
        : `${impact >= 0 ? "▲" : "▼"}${Math.abs(impact).toLocaleString()}`,
      sub: noBaseline ? "no prior history" : undefined,
      variant: noBaseline ? undefined : impact < 0 ? "down" : "up",
    },
    { label: "Daily rate", value: `${t.mean_before.toFixed(1)} → ${t.mean_after.toFixed(1)}` },
    ...(factor !== null
      ? [{ label: "Acceleration", value: `${factor.toFixed(1)}× faster`, variant: "down" as const }]
      : []),
    { label: "Confidence", value: `${r2AfterPct}%` },
    {
      label: "Since pivot",
      value: window ? `${afterWindowDays}d` : "—",
      sub: window ? `from ${pivotShort}, to date` : undefined,
    },
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
            flagged={weakBaseline && !noBaseline}
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
