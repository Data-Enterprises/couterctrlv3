import type { PricePoint } from "./priceOptStats";

export type PriceOptTone = "up" | "down" | "flat" | "muted";
export type PriceOptPhrase = { text: string; tone: PriceOptTone };

// Elasticity magnitude at or above this reads as "highly" price-sensitive —
// a starting threshold, not a validated cutoff. Revisit once there's a real
// distribution of elasticity values to calibrate against.
const HIGH_ELASTICITY = 2;

// No current price or cost anywhere in this data, so there's no "is this
// item priced right" verdict to give — only what's knowable from price
// history alone: how many prices were tested, and how price-sensitive the
// item looks.
export function getPriceOptPhrase(points: PricePoint[], elasticity: number | null): PriceOptPhrase {
  if (points.length < 2) return { text: "Not enough history", tone: "muted" };
  if (elasticity !== null && Math.abs(elasticity) >= HIGH_ELASTICITY) {
    return { text: "Highly price-sensitive", tone: "muted" };
  }
  return { text: `${points.length} price points tested`, tone: "muted" };
}

export function getPriceOptInsight(points: PricePoint[], elasticity: number | null): string {
  if (points.length < 2) return "Not enough price history yet for this item.";
  const elasticityNote =
    elasticity !== null
      ? ` Demand for this item has moved about ${Math.abs(elasticity).toFixed(1)}× as much as price historically — ${
          Math.abs(elasticity) >= HIGH_ELASTICITY ? "quite" : "somewhat"
        } price-sensitive.`
      : "";
  return `${points.length} price points tested so far.${elasticityNote}`;
}
