import type { Severity } from "./LedgerRow";

export type SevFilter = "all" | "critical" | "watch" | "healthy";

export const formatPct = (pct: number) =>
  `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

export const pillClass = (pct: number | null, threshold: number) => {
  if (pct === null) return "bg-gray-100 text-gray-500";
  if (pct < -threshold) return "bg-red-100 text-red-800";
  if (pct < 0) return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
};

export const BADGE_BG: Record<Severity, string> = {
  critical: "#fee2e2",
  watch: "#fef3c7",
  healthy: "#d1fae5",
};

export const BADGE_COLOR: Record<Severity, string> = {
  critical: "#ef4444",
  watch: "#f59e0b",
  healthy: "#10b981",
};

export const chipClass = (active: boolean, sev?: Severity) => {
  if (!active)
    return "bg-white border border-gray-200 text-content hover:border-gray-400";
  if (!sev) return "bg-[#1e2a4a] border-[#1e2a4a] text-white";
  const m: Record<Severity, string> = {
    critical: "bg-red-600 border-red-600 text-white",
    watch: "bg-amber-500 border-amber-500 text-white",
    healthy: "bg-emerald-600 border-emerald-600 text-white",
  };
  return m[sev];
};
