// Interfaces
import type { ItemSeverity } from "../utils/itemMargins";

// Components
import { MinusCircleIcon } from "@heroicons/react/16/solid";
import SharedSeverityBadge from "./SeverityBadge";

/** "ungraded" has no shared SeverityBadge equivalent — small local adapter. */
const ItemSeverityBadge = ({ severity }: { severity: ItemSeverity }) =>
  severity === "ungraded" ? (
    <div className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 bg-gray-100">
      <MinusCircleIcon className="w-3 h-3 text-brand_slate" />
    </div>
  ) : (
    <SharedSeverityBadge severity={severity} />
  );

export default ItemSeverityBadge;
