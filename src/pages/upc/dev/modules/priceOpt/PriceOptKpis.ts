// Utils
import { formatCurrency2 } from "../../../../../utils";
import { computePriceOptRowSummary } from "./priceOptStats";

// Interfaces
import type { UpcPriceOpt } from "../../../../../interfaces";
import type { KpiCell } from "../../interfaces";

// This data has no current price or cost, so only what price history can
// answer: the highest-revenue price, the gap between tested prices, and price
// sensitivity.
export function getPriceOptKpis(
  optBestPrices: UpcPriceOpt[],
  optBestPricesByUpc: UpcPriceOpt[],
  selectedUpcs: string[],
  fixes = false,
): KpiCell[] {
  const filterUpc = (code: string) => selectedUpcs.length === 0 || selectedUpcs.includes(code);
  const bestByUpc = optBestPricesByUpc.filter((o) => filterUpc(o.product_code));
  const bestPrices = optBestPrices.filter((o) => filterUpc(o.product_code));
  const upcCount = bestByUpc.length;

  let withPriceData = 0;
  let topRevenue: { desc: string; price: number; revenue: number; weighted: boolean } | null = null;
  let largestGap: { desc: string; gap: number } | null = null;
  const elasticities: number[] = [];
  const pointCounts: number[] = [];

  for (const row of bestByUpc) {
    // The same summary the panel and the export read, so with one UPC
    // selected the strip and the panel give the same points and elasticity.
    const { points, weighted, elasticity } = computePriceOptRowSummary(row, bestPrices, fixes);
    pointCounts.push(points.length);
    if (points.length >= 2) withPriceData++;

    for (const p of points) {
      if (!topRevenue || p.revenue > topRevenue.revenue) {
        topRevenue = { desc: row.product_description, price: p.price, revenue: p.revenue, weighted };
      }
    }

    if (points.length >= 2) {
      const revenues = points.map((p) => p.revenue);
      const gap = Math.max(...revenues) - Math.min(...revenues);
      if (!largestGap || gap > largestGap.gap) {
        largestGap = { desc: row.product_description, gap };
      }
      if (elasticity !== null) elasticities.push(elasticity);
    }
  }

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const avgElasticity = avg(elasticities);
  const avgPricePoints = avg(pointCounts);

  return [
    { label: "Items with price data", value: `${withPriceData} of ${upcCount}`, sub: "2+ price points" },
    {
      label: "Top revenue price",
      value: topRevenue
        ? `${formatCurrency2(topRevenue.price)}${topRevenue.weighted ? "/lb" : ""}`
        : "—",
      sub: topRevenue ? topRevenue.desc : undefined,
    },
    {
      label: "Largest revenue gap",
      value: largestGap ? formatCurrency2(largestGap.gap) : "—",
      sub: largestGap ? largestGap.desc : undefined,
    },
    { label: "Avg elasticity", value: avgElasticity !== null ? avgElasticity.toFixed(1) : "—" },
    { label: "Avg price points", value: avgPricePoints !== null ? avgPricePoints.toFixed(1) : "—", sub: "tested per item" },
  ];
}
