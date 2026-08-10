import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  MinusCircleIcon,
} from "@heroicons/react/20/solid";
import type { Tier } from "../utils/grading";

/** The severity marker that opens every graded row on mobile.
 *
 *  Shared by Sales, Loss Prevention, Cashiers, Sub Dept Margins, Vendors and
 *  Categories — it lived under `pages/sales/mobile/components` while Sales was
 *  its only consumer, which stopped being true some time ago.
 *
 *  Icon, not a filled chip: it reads at a glance beside a truncated name
 *  without competing with the numbers to its right. */

/** `ungraded` is grey on purpose. An entity with no prior period to compare
 *  against hasn't passed — it hasn't been measured, and colouring it green
 *  would claim a verdict nothing supports. */
const SEV_TEXT_CLASS: Record<Tier, string> = {
  critical: "text-red-500",
  watch: "text-amber-400",
  healthy: "text-emerald-500",
  ungraded: "text-gray-400",
};

const SevBadge = ({ sev }: { sev: Tier }) => (
  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
    {sev === "critical" && (
      <ExclamationTriangleIcon className={`w-5 h-5 ${SEV_TEXT_CLASS[sev]}`} />
    )}
    {sev === "watch" && (
      <ExclamationCircleIcon className={`w-5 h-5 ${SEV_TEXT_CLASS[sev]}`} />
    )}
    {sev === "healthy" && (
      <CheckCircleIcon className={`w-5 h-5 ${SEV_TEXT_CLASS[sev]}`} />
    )}
    {sev === "ungraded" && (
      <MinusCircleIcon className={`w-5 h-5 ${SEV_TEXT_CLASS[sev]}`} />
    )}
  </div>
);

export default SevBadge;
