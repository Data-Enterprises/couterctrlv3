import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  MinusCircleIcon,
} from "@heroicons/react/20/solid";
import type { Severity } from "../../../../utils/severity";
import { BADGE_BG, BADGE_COLOR } from "../../../../utils/severity";

interface SeverityBadgeProps {
  /** Null renders a grey "not graded" mark — nothing to compare against, so no
   *  verdict colour. */
  severity: Severity | null;
  showBackground?: boolean;
}

const SeverityBadge = ({ severity, showBackground = true }: SeverityBadgeProps) => (
  <div
    className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0"
    style={
      showBackground && severity ? { background: BADGE_BG[severity] } : undefined
    }
    title={severity ? undefined : "Not graded"}
  >
    {severity === null && <MinusCircleIcon className="w-3 h-3 text-gray-400" />}
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
