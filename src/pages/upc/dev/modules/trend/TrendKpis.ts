import type { UpcTrend } from "../../../../../interfaces";
import type { KpiCell } from "../../types";

export function getTrendKpis(upcTrends: UpcTrend[], selectedUpcs: string[]): KpiCell[] {
  const filtered =
    selectedUpcs.length > 0
      ? upcTrends.filter((t) => selectedUpcs.includes(t.product_code))
      : upcTrends;

  const trending = filtered.filter((t) => t.slope_change > 0).length;
  const declining = filtered.filter((t) => t.slope_change < 0).length;

  return [
    { label: "UPCs selected", value: String(filtered.length) },
    { label: "Trending up", value: String(trending) },
    { label: "Declining", value: String(declining) },
  ];
}
