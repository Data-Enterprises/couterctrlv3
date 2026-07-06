import type { UpcPriceOpt } from "../../../../../interfaces";
import type { KpiCell } from "../../types";

export function getPriceOptKpis(optBestPrices: UpcPriceOpt[], selectedUpcs: string[]): KpiCell[] {
  const filtered =
    selectedUpcs.length > 0
      ? optBestPrices.filter((o) => selectedUpcs.includes(o.product_code))
      : optBestPrices;

  const totalRevenue = filtered.reduce((acc, o) => acc + o.total_revenue, 0);
  const totalQty = filtered.reduce((acc, o) => acc + o.total_qty, 0);
  const upcCount = new Set(filtered.map((o) => o.product_code)).size;

  return [
    { label: "UPCs selected", value: String(upcCount) },
    {
      label: "Total revenue",
      value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    { label: "Total qty", value: totalQty.toLocaleString() },
  ];
}
