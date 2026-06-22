import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";

export type SeverityKey = "critical" | "watch" | "healthy";

export const SEVERITY_CONFIG = {
  critical: {
    Icon: ExclamationTriangleIcon,
    iconColor: "#ef4444",
    badgeBg: "#fee2e2",
    headerBg: "bg-red-50",
    shadowColor: "rgba(239, 68, 68, 0.25)",
    label: "Critical",
    sub: "down > 9%",
  },
  watch: {
    Icon: ExclamationCircleIcon,
    iconColor: "#f59e0b",
    badgeBg: "#fef3c7",
    headerBg: "bg-amber-50",
    shadowColor: "rgba(245, 158, 11, 0.25)",
    label: "Watch",
    sub: "down 0–9%",
  },
  healthy: {
    Icon: CheckCircleIcon,
    iconColor: "#10b981",
    badgeBg: "#d1fae5",
    headerBg: "bg-emerald-50",
    shadowColor: "rgba(16, 185, 129, 0.25)",
    label: "Healthy",
    sub: "at or above",
  },
} as const;

export const formatPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
