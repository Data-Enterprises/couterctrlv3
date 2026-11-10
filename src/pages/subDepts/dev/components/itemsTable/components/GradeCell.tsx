// Utils
import { deltaTextClass } from "../../../../../../utils/itemMargins";

/** A change, coloured by its grade unless the period is missing days. */
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
      {isPts
        ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}pt`
        : `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`}
    </span>
  );
};

export default GradeCell;
