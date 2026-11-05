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
import { CTA_SEVERITY_CLASSES } from "../../../../utils/severity";

// Interfaces
import type { Severity } from "../../../../utils/severity";

/** The insight bar's palette for an ungraded row: no verdict, no colour. */
const NEUTRAL_CTA = {
  border: "border-gray-200",
  bg: "bg-gray-50",
  hoverBg: "hover:bg-gray-100",
  text: "text-content",
};

export const ctaClasses = (sev: Severity | null) =>
  sev ? CTA_SEVERITY_CLASSES[sev] : NEUTRAL_CTA;
