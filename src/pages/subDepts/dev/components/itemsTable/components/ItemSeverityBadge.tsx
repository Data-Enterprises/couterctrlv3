// Interfaces
import type { ItemSeverity as Severity } from "../../../../../../utils/itemMargins";

// Components
import { MinusCircleIcon } from "@heroicons/react/16/solid";
import SharedSeverityBadge from "../../../../../../components-dev/SeverityBadge";

interface ItemSeverityBadgeProps {
  severity: Severity;
}

/** The severity badge for an item row: the shared badge, or a grey minus icon when the item is ungraded.
 *  "ungraded" has no shared SeverityBadge equivalent, so this is a small local adapter. */
const ItemSeverityBadge = ({ severity }: ItemSeverityBadgeProps) =>
  severity === "ungraded" ? (
    <div className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 bg-gray-100">
      <MinusCircleIcon className="w-3 h-3 text-brand_slate" />
    </div>
  ) : (
    <SharedSeverityBadge severity={severity} />
  );

export default ItemSeverityBadge;
