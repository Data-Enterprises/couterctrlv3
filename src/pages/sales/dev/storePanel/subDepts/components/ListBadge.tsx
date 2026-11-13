// Utils
import { BADGE_ON_NAVY, SIDE_FILL } from "../utils";

// Interfaces
import type { Side } from "../interfaces";

interface ListBadgeProps {
  side: Side;
  /** On a navy header: A turns white so it still shows. */
  onNavy?: boolean;
  /** Larger, for the names at the head of the compare card. */
  large?: boolean;
}

/** A list's letter in its own colour: A navy, B blue. */
const ListBadge = ({ side, onNavy = false, large = false }: ListBadgeProps) => (
  <span
    className={`rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
      large ? "w-[30px] h-[30px] text-[14px]" : "w-[18px] h-[18px] text-[10.5px]"
    } ${onNavy ? BADGE_ON_NAVY[side] : `text-custom-white ${SIDE_FILL[side]}`}`}
  >
    {side}
  </span>
);

export default ListBadge;
