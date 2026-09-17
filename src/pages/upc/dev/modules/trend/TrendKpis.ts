import type { UpcTrend } from "../../../../../interfaces";
import type { KpiCell } from "../../types";
import { getTrendStatus, impactUnits } from "./trendStats";

export function getTrendKpis(
  upcTrends: UpcTrend[],
  selectedUpcs: string[],
  fixes = false,
): KpiCell[] {
  const filtered =
    selectedUpcs.length > 0
      ? upcTrends.filter((t) => selectedUpcs.includes(t.product_code))
      : upcTrends;

  let decliningCount = 0;
  let acceleratingCount = 0;
  let reducedAvailabilityCount = 0;
  let newCount = 0;
  let totalUnitsLost = 0;
  let mostImpacted: { desc: string; units: number } | null = null;

  for (const t of filtered) {
    const status = getTrendStatus(t, fixes);
    if (status === "declining" || status === "accelerating") decliningCount++;
    if (status === "accelerating") acceleratingCount++;
    if (status === "reduced-availability") reducedAvailabilityCount++;
    if (status === "new") newCount++;

    const impact = impactUnits(t, fixes);
    if (impact < 0) {
      totalUnitsLost += impact;
      if (!mostImpacted || impact < mostImpacted.units) {
        mostImpacted = { desc: t.product_description, units: impact };
      }
    }
  }

  const fmt = (units: number) => Math.round(units).toLocaleString();

  return [
    { label: "Declining items", value: `${decliningCount} of ${filtered.length}`, sub: "vs period avg", variant: decliningCount > 0 ? "down" : undefined },
    {
      label: "Total units lost",
      value: totalUnitsLost < 0 ? fmt(totalUnitsLost) : "—",
      // The old sub-label read "impact vs before", which was the endpoint's
      // own before/after difference across two windows of different lengths.
      sub: fixes ? "at the changed daily rate" : "impact vs before",
    },
    // Only shown once something is actually new — five tiles is the strip's
    // width, and a permanent "0 of n" would push a real number out.
    ...(fixes && newCount > 0
      ? [{ label: "New since pivot", value: `${newCount} of ${filtered.length}`, sub: "no prior history" }]
      : []),
    { label: "Reduced availability", value: `${reducedAvailabilityCount} of ${filtered.length}`, sub: "fewer active days, not less demand" },
    { label: "Accelerating", value: `${acceleratingCount} of ${filtered.length}`, sub: "slope worsening", variant: acceleratingCount > 0 ? "down" : undefined },
    {
      label: "Most impacted",
      value: mostImpacted ? mostImpacted.desc : "—",
      sub: mostImpacted ? `${fmt(mostImpacted.units)} units` : undefined,
    },
  ];
}
