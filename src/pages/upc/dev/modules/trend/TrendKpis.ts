import type { UpcTrend } from "../../../../../interfaces";
import type { KpiCell } from "../../types";
import { getTrendStatus } from "./trendStats";

export function getTrendKpis(upcTrends: UpcTrend[], selectedUpcs: string[]): KpiCell[] {
  const filtered =
    selectedUpcs.length > 0
      ? upcTrends.filter((t) => selectedUpcs.includes(t.product_code))
      : upcTrends;

  let decliningCount = 0;
  let acceleratingCount = 0;
  let reducedAvailabilityCount = 0;
  let totalUnitsLost = 0;
  let mostImpacted: { desc: string; units: number } | null = null;

  for (const t of filtered) {
    const status = getTrendStatus(t);
    if (status === "declining" || status === "accelerating") decliningCount++;
    if (status === "accelerating") acceleratingCount++;
    if (status === "reduced-availability") reducedAvailabilityCount++;

    if (t.impact_units < 0) {
      totalUnitsLost += t.impact_units;
      if (!mostImpacted || t.impact_units < mostImpacted.units) {
        mostImpacted = { desc: t.product_description, units: t.impact_units };
      }
    }
  }

  return [
    { label: "Declining items", value: `${decliningCount} of ${filtered.length}`, sub: "vs period avg", variant: decliningCount > 0 ? "down" : undefined },
    { label: "Total units lost", value: totalUnitsLost < 0 ? totalUnitsLost.toLocaleString() : "—", sub: "impact vs before" },
    { label: "Reduced availability", value: `${reducedAvailabilityCount} of ${filtered.length}`, sub: "fewer active days, not less demand" },
    { label: "Accelerating", value: `${acceleratingCount} of ${filtered.length}`, sub: "slope worsening", variant: acceleratingCount > 0 ? "down" : undefined },
    {
      label: "Most impacted",
      value: mostImpacted ? mostImpacted.desc : "—",
      sub: mostImpacted ? `${mostImpacted.units.toLocaleString()} units` : undefined,
    },
  ];
}
