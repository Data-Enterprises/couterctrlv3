import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import type { Severity } from "../utils/severity";
import { BADGE_BG, BADGE_COLOR } from "../utils/severity";

interface SeverityBadgeProps {
  severity: Severity;
  showBackground?: boolean;
}

const SeverityBadge = ({ severity, showBackground = true }: SeverityBadgeProps) => (
  <div
    className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0"
    style={showBackground ? { background: BADGE_BG[severity] } : undefined}
  >
    {severity === "critical" && (
      <ExclamationTriangleIcon
        className="w-3 h-3"
        style={{ color: BADGE_COLOR[severity] }}
      />
    )}
    {severity === "watch" && (
      <ExclamationCircleIcon
        className="w-3 h-3"
        style={{ color: BADGE_COLOR[severity] }}
      />
    )}
    {severity === "healthy" && (
      <CheckCircleIcon
        className="w-3 h-3"
        style={{ color: BADGE_COLOR[severity] }}
      />
    )}
  </div>
);

export default SeverityBadge;
