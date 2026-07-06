import type { UpcForecastData } from "../../../../../interfaces";
import type { KpiCell } from "../../types";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function getForecastKpis(forecastQtyData: UpcForecastData[], selectedUpcs: string[]): KpiCell[] {
  const filtered =
    selectedUpcs.length > 0
      ? forecastQtyData.filter((f) => selectedUpcs.includes(f.product_code))
      : forecastQtyData;

  if (!filtered.length) {
    return [
      { label: "7-day forecast", value: "—" },
      { label: "Peak day", value: "—" },
      { label: "vs historical avg", value: "—" },
      { label: "Top item", value: "—" },
      { label: "Active UPCs", value: "—" },
    ];
  }

  // Total 7-day forecast across all selected UPCs
  const totalForecast = filtered.reduce(
    (acc, f) => acc + f.data.forecast.slice(0, 7).reduce((s, p) => s + p.value, 0),
    0,
  );

  // Peak day: mode — which day of week is most commonly the peak across individual UPCs
  const peakDayCounts = new Array(7).fill(0);
  for (const f of filtered) {
    const days = f.data.forecast.slice(0, 7);
    if (!days.length) continue;
    const maxVal = Math.max(...days.map((p) => p.value));
    const peakEntry = days.find((p) => p.value === maxVal);
    if (peakEntry) {
      const dow = new Date(peakEntry.date + "T12:00:00").getDay();
      peakDayCounts[dow]++;
    }
  }
  const modeDowIdx = peakDayCounts.indexOf(Math.max(...peakDayCounts));
  const modeDowCount = peakDayCounts[modeDowIdx];
  const peakDay = DOW[modeDowIdx];
  const peakDaySub = `${modeDowCount} of ${filtered.length} UPCs`;

  // vs historical avg: compare total forecast to what historical avg × 7 days × N UPCs would predict
  const historicalExpected = filtered.reduce((acc, f) => acc + f.data.metrics.avg_daily_qty * 7, 0);
  const vsPct =
    historicalExpected > 0 ? ((totalForecast - historicalExpected) / historicalExpected) * 100 : null;
  const vsValue =
    vsPct === null ? "—"
    : vsPct > 0 ? `+${vsPct.toFixed(1)}%`
    : `${vsPct.toFixed(1)}%`;
  const vsSub = vsPct !== null ? (vsPct >= 0 ? "above expected" : "below expected") : undefined;

  // Top item: UPC with highest 7-day forecast total
  let topItem = filtered[0];
  let topTotal = 0;
  for (const f of filtered) {
    const t = f.data.forecast.slice(0, 7).reduce((s, p) => s + p.value, 0);
    if (t > topTotal) { topTotal = t; topItem = f; }
  }
  const topDesc = topItem.data.metrics.description;
  const topShort = topDesc.length > 16 ? topDesc.slice(0, 15) + "…" : topDesc;

  // Active UPCs: items with days_active > 0
  const activeCount = filtered.filter((f) => f.data.metrics.days_active > 0).length;

  return [
    { label: "7-day forecast", value: Math.round(totalForecast).toLocaleString("en-US") + " units" },
    { label: "Peak day", value: peakDay, sub: peakDaySub },
    { label: "vs historical avg", value: vsValue, sub: vsSub },
    { label: "Top item", value: topShort, sub: Math.round(topTotal).toLocaleString("en-US") + " units" },
    { label: "Active UPCs", value: String(activeCount) },
  ];
}
