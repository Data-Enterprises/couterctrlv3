// Interfaces

export type PricePoint = {
  price: number;
  qty: number;
  /** Pounds, for a scale item. Zero on everything sold by the each. */
  weight: number;
  revenue: number;
};

export type PriceOptRowSummary = {
  code: string;
  desc: string;
  points: PricePoint[];
  bestPrice: number;
  /** Volume at the best price, in this item's own unit. */
  bestUnits: number;
  bestRevenue: number;
  /** Sold by the pound — what `bestUnits` and every point's figure mean. */
  weighted: boolean;
  elasticity: number | null;
};

export type PriceOptTone = "up" | "down" | "flat" | "muted";

export type PriceOptPhrase = { text: string; tone: PriceOptTone };
