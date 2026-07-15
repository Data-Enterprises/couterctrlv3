import { formatCurrency2 } from "../../../../../utils";
import type { UpcSalesComp } from "../../../../../interfaces";
import type { KpiCell } from "../../types";
import { computeUpcSalesCompStats, DAYS, DAY_SHORT } from "./salesCompStats";

export function getSalesCompKpis(
  salesComp: UpcSalesComp[],
  salesCompLY: UpcSalesComp[],
  selectedUpcs: string[],
  endDate: string,
): KpiCell[] {
  const filtered =
    selectedUpcs.length > 0
      ? salesComp.filter((s) => selectedUpcs.includes(s.product_code))
      : salesComp;
  const filteredLY =
    selectedUpcs.length > 0
      ? salesCompLY.filter((s) => selectedUpcs.includes(s.product_code))
      : salesCompLY;

  const upcCodes = [...new Set(filtered.map((s) => s.product_code))];
  const upcCount = upcCodes.length;
  const weekCount = new Set(filtered.map((s) => s.week)).size;
  const hasLY = filteredLY.length > 0;

  const stats = computeUpcSalesCompStats(upcCodes, filtered, filteredLY, endDate);

  const totalSales = stats.reduce((acc, s) => acc + s.periodTotal, 0);
  const totalSalesLY = stats.reduce((acc, s) => acc + (s.hasLY ? s.lyPeriodTotal : 0), 0);
  const vsLYPct = hasLY && totalSalesLY > 0 ? ((totalSales - totalSalesLY) / totalSalesLY) * 100 : null;

  // Peak day: dollar-weighted (which day the money actually lands on) leads —
  // this needs the true per-day sum across all rows, not an average of each
  // UPC's own average day, so it's computed directly rather than from `stats`.
  // Mode (which day most individual UPCs peak on) is the sub — the two can
  // genuinely disagree when a few high-volume UPCs outweigh many small ones.
  const daySums = DAYS.map((d) => filtered.reduce((acc, s) => acc + (s[d] ?? 0), 0));
  const activeDays = daySums.filter((v) => v > 0).length;
  const avgDaily = upcCount > 0 && activeDays > 0 ? totalSales / activeDays / upcCount : 0;
  const daySumsLY = DAYS.map((d) => filteredLY.reduce((acc, s) => acc + (s[d] ?? 0), 0));
  const activeDaysLY = daySumsLY.filter((v) => v > 0).length;
  const avgDailyLY = hasLY && upcCount > 0 && activeDaysLY > 0 ? totalSalesLY / activeDaysLY / upcCount : null;

  const dollarPeakIdx = daySums.indexOf(Math.max(...daySums));
  const modePeakCounts = new Array(7).fill(0);
  stats.forEach((s) => modePeakCounts[s.peakIdx]++);
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
      value: vsLYPct === null ? "—" : `${vsLYPct >= 0 ? "▲" : "▼"} ${Math.abs(vsLYPct).toFixed(1)}%`,
      sub: hasLY ? `${formatCurrency2(totalSalesLY)} LY` : "no LY data",
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
