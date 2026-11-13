// Utils
import { SIDE_FILL } from "../utils";

// Interfaces
import type { Side } from "../interfaces";

interface ListBadgeProps {
  side: Side;
}

/** A list's letter in its own colour: A navy, B blue. */
const ListBadge = ({ side }: ListBadgeProps) => (
  <span
    className={`w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 text-[10.5px] font-bold text-custom-white ${SIDE_FILL[side]}`}
  >
    {side}
  </span>
);

export default ListBadge;
