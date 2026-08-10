import { ChevronRightIcon } from "@heroicons/react/20/solid";
import SevBadge from "../SevBadge";
import { deltaPillClass, type Tier } from "../../utils/grading";

/**
 * One graded row in a mobile Performance list — the shape Sales uses for its
 * sub-department and hourly signals.
 *
 * A severity marker, the name, the headline figure, then the two comparisons
 * on a second line. Deliberately compact: on a single-store page the KPI strip
 * and day cards above already carry the week's context, so the row only has to
 * answer "which one of these is the problem".
 *
 * Replaces the taller three-column TY/LW/LY card these pages used while they
 * were their own top-level list — that layout repeated the header's job on
 * every row.
 */

export interface SignalComparison {
  /** Already formatted — percent on sales pages, points on margin pages. */
  text: string;
  /** Drives the pill colour. Null when there's no comparison period at all. */
  pct: number | null;
}

interface Props {
  sev: Tier;
  label: string;
  /** The headline figure, already formatted. */
  value: string;
  /** Optional secondary, e.g. "310 u". */
  sub?: string;
  lw: SignalComparison;
  ly: SignalComparison;
  /** Grading threshold, so the pills match the badge beside them. */
  threshold: number;
  onClick: () => void;
}

const MobileSignalRow = ({
  sev,
  label,
  value,
  sub,
  lw,
  ly,
  threshold,
  onClick,
}: Props) => (
  <button
    onClick={onClick}
    className="w-full px-3 py-2.5 bg-custom-white border-b border-gray-100 text-left active:bg-gray-50"
  >
    <div className="flex items-center gap-2.5">
      <SevBadge sev={sev} />
      <span className="flex-1 text-[12px] font-medium text-content truncate">
        {label}
      </span>
      <div className="flex items-baseline gap-2 flex-shrink-0">
        <span className="text-[12px] font-semibold text-content">{value}</span>
        {sub && <span className="text-[11px] text-content/85">{sub}</span>}
      </div>
      <ChevronRightIcon className="w-4 h-4 text-content/85 flex-shrink-0" />
    </div>
    <div className="flex gap-2 mt-1.5 justify-end">
      <span
        className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${deltaPillClass(lw.pct, threshold)}`}
      >
        LW {lw.text}
      </span>
      <span
        className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${deltaPillClass(ly.pct, threshold)}`}
      >
        LY {ly.text}
      </span>
    </div>
  </button>
);

export default MobileSignalRow;
