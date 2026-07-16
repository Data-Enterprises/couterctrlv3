import { ExclamationTriangleIcon, ExclamationCircleIcon, CheckCircleIcon } from "@heroicons/react/20/solid";
import type { Severity } from "../../components/LedgerRow";

const SEV_TEXT_CLASS: Record<Severity, string> = {
  critical: "text-red-500",
  watch: "text-amber-400",
  healthy: "text-emerald-500",
};

const SevBadge = ({ sev }: { sev: Severity }) => (
  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
    {sev === "critical" && <ExclamationTriangleIcon className={`w-5 h-5 ${SEV_TEXT_CLASS[sev]}`} />}
    {sev === "watch" && <ExclamationCircleIcon className={`w-5 h-5 ${SEV_TEXT_CLASS[sev]}`} />}
    {sev === "healthy" && <CheckCircleIcon className={`w-5 h-5 ${SEV_TEXT_CLASS[sev]}`} />}
  </div>
);

export default SevBadge;
