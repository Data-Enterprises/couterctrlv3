// Utils
import { directionalPillClass } from "../utils/grading";

interface PctPillProps {
  /** The change against the baseline, or null when there is none. */
  pct: number | null;
  minWidth: number;
  children: string;
}

/** One figure on a store row, tinted by its change against the baseline. */
const PctPill = ({ pct, minWidth, children }: PctPillProps) => (
  <span
    className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${
      pct === null
        ? "bg-row_stripe text-brand_slate"
        : directionalPillClass(pct)
    }`}
    style={{ minWidth }}
  >
    {children}
  </span>
);

export default PctPill;
