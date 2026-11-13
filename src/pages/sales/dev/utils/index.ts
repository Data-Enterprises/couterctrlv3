export type { Severity, SevFilter } from "../../../../utils/severity";

export {
  formatPct,
  pillClass,
  gradeSeverity,
  CTA_SEVERITY_CLASSES,
  severityDotClass,
  PCT_COL_W,
  severityHeaderBgClass,
  BADGE_BG,
  BADGE_COLOR,
  chipClass,
} from "../../../../utils/severity";

// Utils
import { CTA_SEVERITY_CLASSES, type Severity } from "../../../../utils/severity";

// Interfaces


/** The insight bar's palette for an ungraded row: no verdict, no colour. */
const NEUTRAL_CTA = {
  border: "border-line_field",
  bg: "bg-fill_soft",
  hoverBg: "hover:bg-fill_muted",
  text: "text-content",
};

export const ctaClasses = (sev: Severity | null) =>
  sev ? CTA_SEVERITY_CLASSES[sev] : NEUTRAL_CTA;

/** A signed percent to two places. */
export const fmtPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;

/** The period KPI cell's label, date, value and units lines. */
export const LABEL = "text-[10px] font-bold uppercase tracking-wide text-content";
export const DATE = "text-[10px] font-bold text-content mt-0.5";
export const VALUE = "text-[13px] font-bold text-content";
export const UNITS = "text-[10px] font-bold text-content";

// One chip per grade; clicking the active chip goes back to "all".
export const CHIPS = [
  {
    sev: "critical",
    label: "Crit",
    cls: "bg-severity_critical_bg text-severity_critical_text",
    ring: "ring-severity_critical_text/40",
  },
  {
    sev: "watch",
    label: "Watch",
    cls: "bg-severity_watch_bg text-severity_watch_text",
    ring: "ring-severity_watch_text/40",
  },
  {
    sev: "healthy",
    label: "OK",
    cls: "bg-severity_healthy_bg text-severity_healthy_text",
    ring: "ring-severity_healthy_text/40",
  },
] as const;
