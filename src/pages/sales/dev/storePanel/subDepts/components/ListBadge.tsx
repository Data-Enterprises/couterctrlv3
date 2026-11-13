// Utils
import { SIDE_FILL } from "../utils";

// Interfaces
import type { Side } from "../interfaces";

interface ListBadgeProps {
  side: Side;
  /** Larger, for the names in the compare bar. */
  large?: boolean;
}

/** A list's letter in its own colour: A navy, B blue. */
const ListBadge = ({ side, large = false }: ListBadgeProps) => (
  <span
    className={`rounded-full flex items-center justify-center flex-shrink-0 font-bold text-custom-white ${SIDE_FILL[side]} ${
      large ? "w-[22px] h-[22px] text-[12px]" : "w-[18px] h-[18px] text-[10.5px]"
    }`}
  >
    {side}
  </span>
);

export default ListBadge;
