import { formatCurrency2 } from "../../../../../utils";
import { heatStyle } from "../../utils/heatColor";
import KpiTileGrid from "../../components/KpiTileGrid";
import CtaInsightStrip from "../../components/CtaInsightStrip";
import type { KpiCell } from "../../types";
import {
  DAYS,
  DAY_SHORT,
  fmtWeekRange,
  type UpcSalesCompStats,
} from "./salesCompStats";
import { getStatusPhrase, getStatusInsight } from "./salesCompPhrase";

interface Props {
  stats: UpcSalesCompStats;
}

const SalesCompDetailPanel = ({ stats: s }: Props) => {
  const kpis: KpiCell[] = [
    {
      label: "Total sales",
      value: formatCurrency2(s.periodTotal),
      sub:
        s.vsLYPct === null
          ? undefined
          : `${s.vsLYPct >= 0 ? "▲" : "▼"}${Math.abs(s.vsLYPct).toFixed(0)}% vs LY`,
      subVariant:
        s.vsLYPct === null ? undefined : s.vsLYPct >= 0 ? "up" : "down",
    },
    {
      label: "Peak day",
      value: DAY_SHORT[s.peakIdx],
      sub: !s.hasLY
        ? undefined
        : s.peakShifted
        ? `was ${DAY_SHORT[s.lyPeakIdx]} LY`
        : "same as LY",
      subVariant: s.peakShifted ? "down" : "neutral",
    },
    { label: "Daily avg", value: formatCurrency2(s.avgDaily) },
    {
      label: "Week over week avg",
      value:
        s.wowPct === null
          ? "—"
          : `${s.wowPct >= 0 ? "▲" : "▼"}${Math.abs(s.wowPct).toFixed(1)}%`,
      variant: s.wowPct === null ? undefined : s.wowPct >= 0 ? "up" : "down",
    },
  ];

  const phrase = getStatusPhrase(s.vsLYPct, s.wowPct);
  const insight = getStatusInsight(s.vsLYPct, s.wowPct);

  return (
    <div className="flex-1 min-w-0 overflow-y-auto thin-scrollbar">
      <CtaInsightStrip title={s.desc} insight={insight} tone={phrase.tone} />
      <KpiTileGrid items={kpis} />

      <div className="px-4">
        <div className="mb-5">
          <div className="text-[11px] font-semibold uppercase tracking-wide bg-gray-200/75 px-2 py-1.5 mb-1">
            This year (avg by day of week)
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {s.dayAvgs.map((val, di) => {
              const hs = heatStyle(val, s.rowMax);
              return (
                <div
                  key={di}
                  className="text-center rounded"
                  style={{
                    background: hs.bg,
                    color: hs.color,
                    padding: "5px 0",
                  }}
                >
                  <div className="text-[13px]">{DAY_SHORT[di]}</div>
                  <div className="text-[13px] font-medium tabular-nums">
                    {val > 0 ? formatCurrency2(val) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 gap-1 mb-3.5">
            {s.dayDeltaPcts.map((pct, di) => (
              <div
                key={di}
                className={`text-center rounded text-[12px] font-semibold py-1 tabular-nums ${
                  pct === null
                    ? "text-content/85"
                    : pct >= 0
                      ? "bg-severity_healthy_bg text-severity_healthy_text"
                      : "bg-severity_critical_bg text-severity_critical_text"
                }`}
              >
                {pct === null
                  ? "—"
                  : `${pct >= 0 ? "▲" : "▼"}${Math.abs(pct).toFixed(0)}%`}
              </div>
            ))}
          </div>

          <div className="text-[11px] font-semibold uppercase tracking-wide bg-gray-200/75 px-2 py-1.5 mb-1">
            Last year, same weeks (avg by day of week)
          </div>
          <div className="grid grid-cols-7 gap-1">
            {s.hasLY ? (
              s.lyDayAvgs.map((val, di) => {
                const hs = heatStyle(val, s.rowMax);
                return (
                  <div
                    key={di}
                    className="text-center rounded"
                    style={{
                      background: hs.bg,
                      color: hs.color,
                      padding: "5px 0",
                    }}
                  >
                    <div className="text-[13px]">{DAY_SHORT[di]}</div>
                    <div className="text-[13px] font-medium tabular-nums">
                      {val > 0 ? formatCurrency2(val) : "—"}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-7 text-[13px] text-content/85 italic py-2">
                No LY data available for this item.
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide bg-gray-200/75 px-2 py-1.5 mb-1">
            Week by week (actual)
          </div>
          <div
            className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-content pb-1.5 mb-0.5"
            style={{ gridTemplateColumns: "120px repeat(7, 1fr)" }}
          >
            <span />
            {DAY_SHORT.map((d) => (
              <span key={d} className="text-center">
                {d}
              </span>
            ))}
          </div>
          {s.weekRows.map(({ week, row }) => (
            <div
              key={week}
              className="grid gap-1 items-center py-1 border-t border-gray-200"
              style={{ gridTemplateColumns: "120px repeat(7, 1fr)" }}
            >
              <span className="text-[13px] text-content/85 truncate">
                {fmtWeekRange(week)}
              </span>
              {DAYS.map((d) => {
                const val = row[d] ?? 0;
                return (
                  <span
                    key={d}
                    className="text-center text-[13px] text-content tabular-nums"
                  >
                    {val > 0 ? formatCurrency2(val) : "—"}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesCompDetailPanel;
