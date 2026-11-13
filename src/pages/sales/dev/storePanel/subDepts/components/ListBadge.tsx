// Utils
import { SIDE_FILL } from "../utils";

// Interfaces
import type { Side } from "../interfaces";

interface ListBadgeProps {
  side: Side;
}

/** A list's letter in its own colour: A navy, B slate. */
const ListBadge = ({ side }: ListBadgeProps) => (
  <span
    className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-custom-white ${SIDE_FILL[side]}`}
  >
    {side}
  </span>
);

export default ListBadge;
