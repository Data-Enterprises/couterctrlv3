// Interfaces
import type { Outcome } from "../interfaces";

// Components
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  MinusCircleIcon,
  NoSymbolIcon,
} from "@heroicons/react/20/solid";

/** The icon for one user's outcome: changed, unchanged or refused. */
const OutcomeIcon = ({ outcome }: { outcome: Outcome | null }) => {
  const cls = "w-4 h-4 flex-shrink-0";
  if (outcome === null) return null;
  switch (outcome.kind) {
    case "changed":
      return <CheckCircleIcon className={`${cls} text-brand_navy`} />;
    case "unchanged":
      return <MinusCircleIcon className={`${cls} text-content/95`} />;
    case "refused":
      return <NoSymbolIcon className={`${cls} text-brand_danger`} />;
    case "not_found":
      return <ExclamationCircleIcon className={`${cls} text-brand_danger`} />;
  }
};

export default OutcomeIcon;
