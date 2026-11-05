import { formatCurrency2 } from "../../../../../../utils";

export const money = (v: number) => formatCurrency2(v);

/** Points, signed, two places. */
export const pts = (v: number) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2);

/** Signed dollars, for a gap rather than an amount. */
export const signedMoney = (v: number) =>
  (v >= 0 ? "+" : "−") + formatCurrency2(Math.abs(v));

export const pct = (v: number | null) => (v === null ? "—" : `${v.toFixed(2)}%`);

/** Ahead or behind. No threshold: there is no third state to grade into
 *  when the only question is which of two stores sells more of a thing. */
export const toneOf = (signed: number): "healthy" | "critical" =>
  signed >= 0 ? "healthy" : "critical";
