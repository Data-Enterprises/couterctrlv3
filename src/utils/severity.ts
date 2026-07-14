export type Severity = "critical" | "watch" | "healthy";

export type SevFilter = "all" | Severity;

export const formatPct = (pct: number) =>
  `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

export const pillClass = (pct: number | null, threshold: number) => {
  if (pct === null) return "bg-gray-100 text-gray-500";
  if (pct < -threshold) return "bg-severity_critical_bg text-severity_critical_text";
  if (pct < 0) return "bg-severity_watch_bg text-severity_watch_text";
  return "bg-severity_healthy_bg text-severity_healthy_text";
};

export const CTA_SEVERITY_CLASSES: Record<
  Severity,
  { border: string; bg: string; hoverBg: string; text: string }
> = {
  critical: {
    border: "border-severity_critical_text/25",
    bg: "bg-severity_critical_bg",
    hoverBg: "hover:bg-severity_critical_text/10",
    text: "text-severity_critical_text",
  },
  watch: {
    border: "border-severity_watch_text/25",
    bg: "bg-severity_watch_bg",
    hoverBg: "hover:bg-severity_watch_text/10",
    text: "text-severity_watch_text",
  },
  healthy: {
    border: "border-severity_healthy_text/25",
    bg: "bg-severity_healthy_bg",
    hoverBg: "hover:bg-severity_healthy_text/10",
    text: "text-severity_healthy_text",
  },
};

export const severityDotClass: Record<Severity, string> = {
  critical: "bg-red-500",
  watch: "bg-amber-400",
  healthy: "bg-emerald-500",
};

export const severityHeaderBgClass: Record<Severity, string> = {
  critical: "bg-red-600",
  watch: "bg-amber-500",
  healthy: "bg-emerald-600",
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
    return "bg-custom-white border border-gray-200 text-content hover:border-gray-400";
  if (!sev) return "bg-[#1e2a4a] border-[#1e2a4a] text-custom-white";
  const m: Record<Severity, string> = {
    critical: "bg-red-600 border-red-600 text-custom-white",
    watch: "bg-amber-500 border-amber-500 text-custom-white",
    healthy: "bg-emerald-600 border-emerald-600 text-custom-white",
  };
  return m[sev];
};
