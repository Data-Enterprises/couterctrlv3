// Utils
import { deltaTextClass } from "../utils/itemMargins";

/** A change cell coloured by its grade, plain when the period is partial. */
const GradeCell = ({
  pct,
  threshold,
  isPts,
  partial = false,
}: {
  pct: number | null;
  threshold: number;
  isPts: boolean;
  /** The period is missing days: show the figure without a verdict colour. */
  partial?: boolean;
}) => {
  if (pct === null)
    return <span className="text-[13px] font-semibold text-content/95">—</span>;
  return (
    <span
      className={`text-[13px] font-semibold whitespace-nowrap ${partial ? "text-content" : deltaTextClass(pct, threshold)}`}
    >
      {`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}${isPts ? "pt" : "%"}`}
    </span>
  );
};

export default GradeCell;
