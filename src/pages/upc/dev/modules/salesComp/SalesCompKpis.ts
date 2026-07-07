import type { UpcSalesComp } from "../../../../../interfaces";
import type { KpiCell } from "../../types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function fmtDollars(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(1) + "k";
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function getSalesCompKpis(salesComp: UpcSalesComp[], selectedUpcs: string[]): KpiCell[] {
  const filtered =
    selectedUpcs.length > 0
      ? salesComp.filter((s) => selectedUpcs.includes(s.product_code))
      : salesComp;

  const upcCodes = [...new Set(filtered.map((s) => s.product_code))];
  const upcCount = upcCodes.length;
  const weekCount = new Set(filtered.map((s) => s.week)).size;

  const totalSales = filtered.reduce(
    (acc, s) => acc + DAYS.reduce((d, day) => d + (s[day] ?? 0), 0),
    0,
  );

  // Peak day: mode — which day is most commonly the peak day across individual UPCs
  const peakDayCounts = new Array(7).fill(0);
  for (const code of upcCodes) {
    const rows = filtered.filter((s) => s.product_code === code);
    const dayAvgs = DAYS.map((d) =>
      rows.reduce((acc, r) => acc + (r[d] ?? 0), 0) / (rows.length || 1),
    );
    const peakIdx = dayAvgs.indexOf(Math.max(...dayAvgs));
    if (peakIdx >= 0) peakDayCounts[peakIdx]++;
  }
  const modePeakIdx = peakDayCounts.indexOf(Math.max(...peakDayCounts));
  const modePeakCount = peakDayCounts[modePeakIdx];
  const peakDay = upcCount > 0 ? DAY_SHORT[modePeakIdx] : "—";
  const peakDaySub = upcCount > 0 ? `${modePeakCount} of ${upcCount} UPCs` : undefined;

  // Avg daily sales per UPC
  const daySums = DAYS.map((d) => filtered.reduce((acc, s) => acc + (s[d] ?? 0), 0));
  const activeDays = daySums.filter((v) => v > 0).length;
  const avgDaily = upcCount > 0 && activeDays > 0 ? totalSales / activeDays / upcCount : 0;

  // WoW trend: most recent week vs period average per UPC
  let trending_up = 0;
  let trending_down = 0;
  for (const code of upcCodes) {
    const rows = filtered.filter((s) => s.product_code === code);
    const weeks = [...new Set(rows.map((r) => r.week))].sort();
    if (weeks.length < 2) continue;
    const weekTotals = weeks.map((wk) =>
      rows.filter((r) => r.week === wk).reduce((a, r) => a + DAYS.reduce((d, day) => d + (r[day] ?? 0), 0), 0),
    );
    const lw = weekTotals[weekTotals.length - 1];
    const avg = weekTotals.reduce((a, b) => a + b, 0) / weekTotals.length;
    if (avg === 0) continue;
    const pct = (lw - avg) / avg;
    if (pct > 0.01) trending_up++;
    else if (pct < -0.01) trending_down++;
  }
  const trendValue = upcCount === 0 ? "—"
    : trending_up === 0 && trending_down === 0 ? "Flat"
    : `${trending_up} ↑ / ${trending_down} ↓`;

  return [
    { label: "UPCs", value: String(upcCount), sub: `${weekCount} wk${weekCount !== 1 ? "s" : ""}` },
    { label: "Total net sales", value: fmtDollars(totalSales) },
    { label: "Peak day", value: peakDay, sub: peakDaySub },
    { label: "Avg daily / UPC", value: fmtDollars(avgDaily) },
    { label: "WoW trend", value: trendValue, sub: "vs period avg" },
  ];
}
