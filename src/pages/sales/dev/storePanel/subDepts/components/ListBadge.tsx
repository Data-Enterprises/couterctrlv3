// Utils
import { BADGE_ON_NAVY, SIDE_FILL } from "../utils";

// Interfaces
import type { Side } from "../interfaces";

interface ListBadgeProps {
  side: Side;
  /** On a navy header: A turns white so it still shows. */
  onNavy?: boolean;
}

/** A list's letter in its own colour: A navy, B blue. */
const ListBadge = ({ side, onNavy = false }: ListBadgeProps) => (
  <span
    className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
      onNavy ? BADGE_ON_NAVY[side] : `text-custom-white ${SIDE_FILL[side]}`
    }`}
  >
    {side}
  </span>
);

export default ListBadge;
