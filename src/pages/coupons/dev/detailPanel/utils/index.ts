// Interfaces
import type { ThresholdValue } from "../../../../../interfaces";

/** A threshold filter as its chip shows it, such as "> $5". */
export const fmtThreshold = (t: ThresholdValue | null, prefix = ""): string => {
  if (!t) return "";
  const sym = t.op === "gt" ? ">" : t.op === "lt" ? "<" : "=";
  return `${sym} ${prefix}${t.amount}`;
};
