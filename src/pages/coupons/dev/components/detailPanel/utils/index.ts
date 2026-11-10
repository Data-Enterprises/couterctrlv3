// Interfaces
import type { GroupTab } from "../../../interfaces";
import type { ThresholdValue } from "../../../../../../interfaces";

/** The panel's three groupings. */
export const GROUP_TABS: { key: GroupTab; label: string }[] = [
  { key: "subdept", label: "Sub dept" },
  { key: "date", label: "Date" },
  { key: "cashier", label: "Cashier" },
];

/** A threshold filter as its chip shows it, such as "> $5". */
export const fmtThreshold = (t: ThresholdValue | null, prefix = ""): string => {
  if (!t) return "";
  const sym = t.op === "gt" ? ">" : t.op === "lt" ? "<" : "=";
  return `${sym} ${prefix}${t.amount}`;
};
