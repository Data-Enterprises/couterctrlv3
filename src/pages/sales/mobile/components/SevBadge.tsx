import { ExclamationTriangleIcon, ExclamationCircleIcon, CheckCircleIcon } from "@heroicons/react/20/solid";
import { BADGE_BG, BADGE_COLOR } from "../../shared/ledgerUtils";
import type { Severity } from "../../components/LedgerRow";

const SevBadge = ({ sev }: { sev: Severity }) => (
  <div
    className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center flex-shrink-0"
    style={{ background: BADGE_BG[sev] }}
  >
    {sev === "critical" && <ExclamationTriangleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[sev] }} />}
    {sev === "watch" && <ExclamationCircleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[sev] }} />}
    {sev === "healthy" && <CheckCircleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[sev] }} />}
  </div>
);

export default SevBadge;
