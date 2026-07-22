import { formatCurrency2 } from "../../../../../utils";
import type { PriceOptStatus, ProfitAtRisk, PricePoint } from "./priceOptStats";

export type PriceOptTone = "up" | "down" | "flat" | "muted";
export type PriceOptPhrase = { text: string; tone: PriceOptTone };

// Elasticity magnitude at or above this reads as "highly" price-sensitive in
// the pre-store phrase — a starting threshold, not a validated cutoff.
// Revisit once there's a real distribution of elasticity values to
// calibrate against.
const HIGH_ELASTICITY = 2;

// Store-known state — Store search (always), or Group search once a store's
// been picked. Mirrors the PriceOptStatus this item already resolved to.
export function getPriceOptPhrase(status: PriceOptStatus, risk: ProfitAtRisk): PriceOptPhrase {
  switch (status) {
    case "overpriced":
      return {
        text: risk.status === "ok" ? `Overpriced, -${formatCurrency2(risk.profitAtRisk)} est.` : "Overpriced",
        tone: "down",
      };
    case "optimal":
      return { text: "Priced right", tone: "up" };
    case "no-current-price":
      return { text: "No current price yet", tone: "muted" };
    case "no-cost-data":
      return { text: "No cost data", tone: "muted" };
    case "no-comparison-data":
      return { text: "Not enough history", tone: "muted" };
  }
}

// Pre-store state — Group search, before a store's picked. Describes only
// what's knowable without one: how many prices were tested across the
// group's blended history, or how price-sensitive the item looks overall.
export function getPreStorePhrase(points: PricePoint[], elasticity: number | null): PriceOptPhrase {
  if (points.length < 2) return { text: "Not enough history", tone: "muted" };
  if (elasticity !== null && Math.abs(elasticity) >= HIGH_ELASTICITY) {
    return { text: "Highly price-sensitive", tone: "muted" };
  }
  return { text: `${points.length} price points tested`, tone: "muted" };
}

export function getPriceOptInsight(
  status: PriceOptStatus,
  risk: ProfitAtRisk,
  currentPrice: number | null,
  bestPrice: number,
): string {
  switch (status) {
    case "overpriced":
      if (risk.status === "ok" && currentPrice !== null) {
        const suppressedNote =
          risk.unitsSuppressed > 0
            ? ` with roughly ${risk.unitsSuppressed.toLocaleString()} units of demand likely suppressed by the higher price.`
            : ".";
        return `Priced at ${formatCurrency2(currentPrice)} — ${formatCurrency2(currentPrice - bestPrice)} above the ${formatCurrency2(bestPrice)} price that's historically produced the most profit. An estimated ${formatCurrency2(risk.profitAtRisk)} is being left on the table this period,${suppressedNote}`;
      }
      return `Priced above the ${formatCurrency2(bestPrice)} price that's historically produced the most profit.`;
    case "optimal":
      return currentPrice !== null
        ? `Priced at ${formatCurrency2(currentPrice)}, matching the price that's historically produced the most profit — no adjustment indicated.`
        : "Priced at or below the price that's historically produced the most profit — no adjustment indicated.";
    case "no-current-price":
      return "No current price on file for this item at this store yet.";
    case "no-cost-data":
      return "Current price is known, but cost data is missing — profit impact can't be estimated without it.";
    case "no-comparison-data":
      return "Not enough price history for this item to identify a best price.";
  }
}

export function getPreStoreInsight(points: PricePoint[], elasticity: number | null): string {
  if (points.length < 2) return "Not enough price history yet for this item.";
  const elasticityNote =
    elasticity !== null
      ? ` Demand for this item has moved about ${Math.abs(elasticity).toFixed(1)}× as much as price historically — ${
          Math.abs(elasticity) >= HIGH_ELASTICITY ? "quite" : "somewhat"
        } price-sensitive.`
      : "";
  return `${points.length} price points tested across the group so far.${elasticityNote} Select a store above to see current pricing and profit impact for this item specifically.`;
}
