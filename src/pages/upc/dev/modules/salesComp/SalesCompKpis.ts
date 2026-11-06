// Utils
import { formatCurrency2 } from "../../../../../utils";
import {
  computeUpcSalesCompStats,
  salesCompCodes,
  weekdayCounts,
  weeksIn,
  DAYS,
  DAY_SHORT,
  type SalesCompRange,
} from "./salesCompStats";

// Interfaces
import type { UpcSalesComp } from "../../../../../interfaces";
import type { KpiCell } from "../../interfaces";

/** Calendar days in the selection on which any UPC sold. Counted per (week,
 *  weekday), not per weekday column — counting columns capped a two-week range
 *  at 7 days, so the strip's average disagreed with the detail panel's. With
 *  one UPC selected the two are the same figure. */
function activeDayCount(rows: UpcSalesComp[]): number {
  const days = new Set<string>();
  for (const r of rows) {
    for (const d of DAYS) if ((r[d] ?? 0) > 0) days.add(`${r.week}|${d}`);
  }
  return days.size;
}

export function getSalesCompKpis(
  salesComp: UpcSalesComp[],
  salesCompLY: UpcSalesComp[],
  selectedUpcs: string[],
  range: SalesCompRange,
): KpiCell[] {
  const filtered =
    selectedUpcs.length > 0
      ? salesComp.filter((s) => selectedUpcs.includes(s.product_code))
      : salesComp;
  const filteredLY =
    selectedUpcs.length > 0
      ? salesCompLY.filter((s) => selectedUpcs.includes(s.product_code))
      : salesCompLY;

  const upcCodes = salesCompCodes(filtered, filteredLY);
  const upcCount = upcCodes.length;
  // Each year's own count of items that sold, for its per-UPC average.
  const tyUpcCount = new Set(filtered.map((s) => s.product_code)).size;
  const lyUpcCount = new Set(filteredLY.map((s) => s.product_code)).size;
  const weekCount = weeksIn(range.start, range.end).length;
  const hasLY = filteredLY.length > 0;

  const stats = computeUpcSalesCompStats(upcCodes, filtered, filteredLY, range);

  const totalSales = stats.reduce((acc, s) => acc + s.periodTotal, 0);
  const totalSalesLY = stats.reduce((acc, s) => acc + (s.hasLY ? s.lyPeriodTotal : 0), 0);
  // vs LY is like for like: only items that sold in both years. A new item
  // added this year's sales with nothing against them (▲100% while every item
  // was flat), and one that stopped did the same the other way. Both stay in
  // the list with their own figures; the strip says how many it compared.
  const both = stats.filter((s) => s.periodTotal > 0 && s.lyPeriodTotal > 0);
  const bothTY = both.reduce((acc, s) => acc + s.periodTotal, 0);
  const bothLY = both.reduce((acc, s) => acc + s.lyPeriodTotal, 0);
  const vsLYPct = bothLY > 0 ? ((bothTY - bothLY) / bothLY) * 100 : null;

  // Peak day: dollar-weighted (which day the money actually lands on) leads —
  // this needs the true per-day sum across all rows, not an average of each
  // UPC's own average day, so it's computed directly rather than from `stats`.
  // Mode (which day most individual UPCs peak on) is the sub — the two can
  // genuinely disagree when a few high-volume UPCs outweigh many small ones.
  // Per occurrence of the weekday, as the item rows do: a weekday the range
  // holds twice would otherwise outweigh one it holds once.
  const dayCounts = weekdayCounts(range.start, range.end);
  const daySums = DAYS.map(
    (d, i) => filtered.reduce((acc, s) => acc + (s[d] ?? 0), 0) / (dayCounts[i] || 1),
  );
  const activeDays = activeDayCount(filtered);
  const avgDaily = tyUpcCount > 0 && activeDays > 0 ? totalSales / activeDays / tyUpcCount : 0;
  const activeDaysLY = activeDayCount(filteredLY);
  const avgDailyLY =
    hasLY && lyUpcCount > 0 && activeDaysLY > 0 ? totalSalesLY / activeDaysLY / lyUpcCount : null;

  const dollarPeakIdx = daySums.indexOf(Math.max(...daySums));
  const modePeakCounts = new Array(7).fill(0);
  stats.forEach((s) => {
    if (s.peakIdx >= 0) modePeakCounts[s.peakIdx]++;
  });
  const modePeakIdx = modePeakCounts.indexOf(Math.max(...modePeakCounts));
  const modePeakCount = modePeakCounts[modePeakIdx];
  const peakDayDiverges = upcCount > 0 && modePeakIdx !== dollarPeakIdx;

  // WoW trend: bucket each UPC's own wowPct (already computed against the
  // last COMPLETE week, same rule the table uses).
  let trendingUp = 0;
  let trendingFlat = 0;
  let trendingDown = 0;
  for (const s of stats) {
    if (s.wowPct === null) continue;
    if (s.wowPct > 1) trendingUp++;
    else if (s.wowPct < -1) trendingDown++;
    else trendingFlat++;
  }
  const trendCounted = trendingUp + trendingFlat + trendingDown;

  return [
    {
      label: "TY sales",
      value: formatCurrency2(totalSales),
      sub: `${weekCount} wk${weekCount !== 1 ? "s" : ""} · ${upcCount} UPC${upcCount !== 1 ? "s" : ""}`,
    },
    {
      label: "vs LY",
      value: vsLYPct === null ? "—" : `${vsLYPct >= 0 ? "▲" : "▼"} ${Math.abs(vsLYPct).toFixed(2)}%`,
      sub: !hasLY
        ? "no LY data"
        : both.length < upcCount
          ? `on ${both.length} of ${upcCount} items sold both years`
          : `${formatCurrency2(bothLY)} LY`,
      variant: vsLYPct === null ? undefined : vsLYPct >= 0 ? "up" : "down",
    },
    {
      label: "Peak day",
      value: upcCount > 0 ? DAY_SHORT[dollarPeakIdx] : "—",
      sub: upcCount === 0 ? undefined : peakDayDiverges
        ? `most UPCs peak ${DAY_SHORT[modePeakIdx]}`
        : `${modePeakCount} of ${upcCount} UPCs peak here`,
      variant: peakDayDiverges ? "down" : undefined,
    },
    {
      label: "Avg daily / UPC",
      value: formatCurrency2(avgDaily),
      sub: avgDailyLY !== null ? `${formatCurrency2(avgDailyLY)} LY` : undefined,
    },
    {
      label: "WoW trend",
      value: trendCounted === 0 ? "—" : `${trendingUp}↑ · ${trendingFlat}→ · ${trendingDown}↓`,
      sub: "vs complete-wk avg",
    },
  ];
}
