import { formatCurrency2 } from "../../../../../utils";
import type { UpcPriceOpt } from "../../../../../interfaces";
import type { KpiCell } from "../../types";
import { pricePoints, elasticityFromPoints } from "./priceOptStats";

// No current price or cost anywhere in this data, so there's nothing to
// compare a price against — only what price history alone can answer:
// which price has generated the most revenue, how big the gap is between
// tested prices, and how price-sensitive demand looks.
export function getPriceOptKpis(
  optBestPrices: UpcPriceOpt[],
  optBestPricesByUpc: UpcPriceOpt[],
  selectedUpcs: string[],
): KpiCell[] {
  const filterUpc = (code: string) => selectedUpcs.length === 0 || selectedUpcs.includes(code);
  const bestByUpc = optBestPricesByUpc.filter((o) => filterUpc(o.product_code));
  const bestPrices = optBestPrices.filter((o) => filterUpc(o.product_code));
  const upcCount = bestByUpc.length;

  let withPriceData = 0;
  let topRevenue: { desc: string; price: number; revenue: number } | null = null;
  let largestGap: { desc: string; gap: number } | null = null;
  const elasticities: number[] = [];
  const pointCounts: number[] = [];

  for (const row of bestByUpc) {
    const points = pricePoints(bestPrices, row.product_code).filter((p) => p.qty > 0);
    pointCounts.push(points.length);
    if (points.length >= 2) withPriceData++;

    for (const p of points) {
      if (!topRevenue || p.revenue > topRevenue.revenue) {
        topRevenue = { desc: row.product_description, price: p.price, revenue: p.revenue };
      }
    }

    if (points.length >= 2) {
      const revenues = points.map((p) => p.revenue);
      const gap = Math.max(...revenues) - Math.min(...revenues);
      if (!largestGap || gap > largestGap.gap) {
        largestGap = { desc: row.product_description, gap };
      }
      const elasticity = elasticityFromPoints(points);
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
      value: topRevenue ? formatCurrency2(topRevenue.price) : "—",
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
