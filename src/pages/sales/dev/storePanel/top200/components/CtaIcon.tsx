// Interfaces
import type { ItemTone } from "../utils/topItems";

// Components
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";

/** The call-to-action's icon for an item's tone. */
const CtaIcon = ({ tone, cls }: { tone: ItemTone; cls: string }) => {
  if (tone === "critical") return <ExclamationTriangleIcon className={cls} />;
  if (tone === "watch") return <ExclamationCircleIcon className={cls} />;
  if (tone === "healthy") return <CheckCircleIcon className={cls} />;
  return null;
};

export default CtaIcon;
