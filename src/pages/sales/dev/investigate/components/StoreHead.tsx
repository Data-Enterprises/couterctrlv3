// Utils
import { splitStore } from "../utils";

interface StoreHeadProps {
  name: string;
  number: string;
  dot: string;
}

/**
 * A store over a money column: the name, then the number under it.
 *
 * One line could not hold both, and the way it failed was the worst
 * available — `justify-end` on a flex row pushes the overflow off the LEFT,
 * so a truncate that was meant to add an ellipsis instead silently ate the
 * front of the name and three stores all read "OODLAND 36_".
 */
const StoreHead = ({ name, number, dot }: StoreHeadProps) => (
  <span className="min-w-0" title={number ? `${name} ${number}` : name}>
    <span className="flex items-center justify-end gap-1.5 min-w-0">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      {/* normal-case: the names are long and uppercase is wider still, and
          the column is 96px. */}
      <span className="min-w-0 truncate normal-case">
        {splitStore(name, number)}
      </span>
    </span>
    {number && (
      <span className="block text-right tabular-nums text-[11.5px] font-bold text-content">
        {number}
      </span>
    )}
  </span>
);

export default StoreHead;
