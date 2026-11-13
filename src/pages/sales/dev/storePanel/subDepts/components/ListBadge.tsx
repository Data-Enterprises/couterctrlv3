// Utils
import { BADGE_ON_NAVY, SIDE_FILL } from "../utils";

// Interfaces
import type { Side } from "../interfaces";

interface ListBadgeProps {
  side: Side;
  /** Larger, for the drawer's header. */
  big?: boolean;
  /** On a navy header: A turns white so it still shows. */
  onNavy?: boolean;
}

/** A list's letter in its own colour: A navy, B blue. */
const ListBadge = ({ side, big = false, onNavy = false }: ListBadgeProps) => (
  <span
    className={`rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
      big ? "w-[26px] h-[26px] text-[13px]" : "w-4 h-4 text-[10px]"
    } ${onNavy ? BADGE_ON_NAVY[side] : `text-custom-white ${SIDE_FILL[side]}`}`}
  >
    {side}
  </span>
);

export default ListBadge;
