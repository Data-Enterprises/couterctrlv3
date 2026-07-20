import { formatCurrency2 } from "../../../../../utils";
import type { UpcPriceOpt } from "../../../../../interfaces";
import type { UpcCurrentPriceCost } from "../../../../../features/upcDevSlice";
import type { KpiCell } from "../../types";
import { pricePoints, bestPriceByProfit, isOverpriced, elasticityFromPoints, computeProfitAtRisk } from "./priceOptStats";

export function getPriceOptKpis(
  optBestPrices: UpcPriceOpt[],
  optBestPricesByUpc: UpcPriceOpt[],
  selectedUpcs: string[],
  currentPriceCost: Record<string, UpcCurrentPriceCost>,
  storeId: number | null,
): KpiCell[] {
  const filterUpc = (code: string) => selectedUpcs.length === 0 || selectedUpcs.includes(code);
  const bestByUpc = optBestPricesByUpc.filter((o) => filterUpc(o.product_code));
  const bestPrices = optBestPrices.filter((o) => filterUpc(o.product_code));
  const upcCount = bestByUpc.length;

  return storeId === null
    ? groupModeKpis(bestPrices, bestByUpc, upcCount)
    : storeModeKpis(bestPrices, bestByUpc, upcCount, currentPriceCost, storeId);
}

function storeModeKpis(
  bestPrices: UpcPriceOpt[],
  bestByUpc: UpcPriceOpt[],
  upcCount: number,
  currentPriceCost: Record<string, UpcCurrentPriceCost>,
  storeId: number,
): KpiCell[] {
  let overpricedCount = 0;
  let totalProfitAtRisk = 0;
  let totalUnitsSuppressed = 0;
  let mostImpacted: { desc: string; amount: number } | null = null;
  const elasticities: number[] = [];

  for (const row of bestByUpc) {
    const cpc = currentPriceCost[`${storeId}:${row.product_code}`];
    const currentPrice = cpc?.currentPrice ?? null;
    const currentCost = cpc?.currentCost ?? null;
    const points = pricePoints(bestPrices, row.product_code);
    const best = bestPriceByProfit(points, currentCost, row.price, row.total_qty, row.total_revenue);

    if (isOverpriced(currentPrice, best.price)) {
      overpricedCount++;
      const risk = computeProfitAtRisk(currentPrice, currentCost, best.price, best.qty, points);
      if (risk.status === "ok") {
        totalProfitAtRisk += risk.profitAtRisk;
        totalUnitsSuppressed += risk.unitsSuppressed;
        if (!mostImpacted || risk.profitAtRisk > mostImpacted.amount) {
          mostImpacted = { desc: row.product_description, amount: risk.profitAtRisk };
        }
      }
    }

    const elasticity = elasticityFromPoints(points);
    if (elasticity !== null) elasticities.push(elasticity);
  }

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const avgElasticity = avg(elasticities);

  return [
    { label: "Overpriced items", value: `${overpricedCount} of ${upcCount}`, variant: overpricedCount > 0 ? "down" : undefined },
    { label: "Profit at risk", value: totalProfitAtRisk > 0 ? `+${formatCurrency2(totalProfitAtRisk)} est.` : "—", variant: totalProfitAtRisk > 0 ? "up" : undefined },
    {
      label: "Units suppressed",
      value: totalUnitsSuppressed > 0 ? totalUnitsSuppressed.toLocaleString() : "—",
      sub: "est. lost to current price",
    },
    {
      label: "Most impacted",
      value: mostImpacted ? mostImpacted.desc : "—",
      sub: mostImpacted ? `+${formatCurrency2(mostImpacted.amount)} est.` : undefined,
    },
    { label: "Avg elasticity", value: avgElasticity !== null ? avgElasticity.toFixed(1) : "—" },
  ];
}

function groupModeKpis(bestPrices: UpcPriceOpt[], bestByUpc: UpcPriceOpt[], upcCount: number): KpiCell[] {
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
