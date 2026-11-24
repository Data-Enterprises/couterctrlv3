// Utils
import {
  CAUSE_LABEL,
  CAUSE_OWNER,
  CAUSE_TONE,
} from "../../../utils/deptInvestigation";

// Interfaces
import type { GridCell } from "../../../interfaces";

interface GridCellContentProps {
  cell: GridCell;
}

/** What goes inside one grid cell or total: a figure (plain, bold, muted or
 *  in caps), a signed change pill, or the item's cause chip. */
const GridCellContent = ({ cell }: GridCellContentProps) => {
  if (cell.kind === "cause")
    return (
      <span
        className={`inline-block px-1.5 py-0.5 rounded font-semibold ${CAUSE_TONE[cell.cause].chip}`}
        title={CAUSE_OWNER[cell.cause]}
      >
        {CAUSE_LABEL[cell.cause]}
      </span>
    );

  /* Direction only, through the delta tokens. These figures are not graded:
     two stores are not a baseline for each other, so green is up, red is
     down, and nothing more is being claimed. */
  if (cell.kind === "signed")
    return (
      <span
        className={`inline-block px-1.5 py-0.5 rounded font-semibold ${
          cell.value === 0
            ? "bg-fill_muted text-content/95"
            : cell.value > 0
              ? "bg-delta_positive_bg text-delta_positive_text"
              : "bg-delta_negative_bg text-delta_negative_text"
        }`}
      >
        {cell.value >= 0 ? "+" : "−"}
        {cell.text}
      </span>
    );

  if (cell.kind === "signedTotal")
    return (
      <span
        className={`inline-block cc-tag ${
          cell.value === 0
            ? "bg-fill_muted text-content/95"
            : cell.value > 0
              ? "bg-delta_positive_bg text-delta_positive_text"
              : "bg-delta_negative_bg text-delta_negative_text"
        }`}
      >
        {cell.value >= 0 ? "+" : "−"}
        {cell.text}
      </span>
    );

  if (cell.look === "bold")
    return <span className="font-semibold">{cell.text}</span>;
  if (cell.look === "muted")
    return <span className="text-content/95">{cell.text}</span>;
  if (cell.look === "caps")
    return <span className="uppercase tracking-wide">{cell.text}</span>;
  return <>{cell.text}</>;
};

export default GridCellContent;
