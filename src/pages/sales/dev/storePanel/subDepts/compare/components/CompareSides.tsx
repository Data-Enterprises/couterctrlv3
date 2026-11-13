// Utils
import { MIRROR_COLS } from "../utils";

// Components
import ListBadge from "../../components/ListBadge";

interface CompareSidesProps {
  names: [string, string];
  counts: [number, number];
}

/** Who is on each side, said once: A left of centre, B right, as every row
 *  below them. */
const CompareSides = ({ names, counts }: CompareSidesProps) => (
  <div className={MIRROR_COLS}>
    <div className="flex items-center justify-end gap-2.5 min-w-0">
      <div className="text-right min-w-0">
        <div className="truncate text-[16px] font-bold text-content">{names[0]}</div>
        <div className="text-[11.5px] text-content">{counts[0].toLocaleString()} items</div>
      </div>
      <ListBadge side="A" large />
    </div>
    <span className="cc-caps text-[11px] text-center">vs</span>
    <div className="flex items-center gap-2.5 min-w-0">
      <ListBadge side="B" large />
      <div className="min-w-0">
        <div className="truncate text-[16px] font-bold text-content">{names[1]}</div>
        <div className="text-[11.5px] text-content">{counts[1].toLocaleString()} items</div>
      </div>
    </div>
  </div>
);

export default CompareSides;
