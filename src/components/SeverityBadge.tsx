import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import type { Severity } from "../pages/sales/components/LedgerRow";
import { BADGE_BG, BADGE_COLOR } from "../pages/sales/components/utils";

const SeverityBadge = ({ severity }: { severity: Severity }) => (
  <div
    className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0"
    style={{ background: BADGE_BG[severity] }}
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
