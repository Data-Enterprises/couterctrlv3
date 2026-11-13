// Utils
import { pillClass } from "../../../../../../../utils/severity";
import { MIRROR_COLS, pctText } from "../utils";

// Interfaces
import type { SalesCell, SalesRow } from "../interfaces";

// Components
import CompareSectionHead from "./CompareSectionHead";

interface CompareSalesTableProps {
  rows: SalesRow[];
  /** The item threshold the changes grade against, as the items do. */
  threshold: number;
}

/** This week, then last week and last year, mirrored: A's figures run right
 *  to the centre label, B's run left from it. Changes grade on the threshold. */
const CompareSalesTable = ({ rows, threshold }: CompareSalesTableProps) => {
  const figure = (c: SalesCell) =>
    c.pct !== null ? (
      <span className={`cc-tag min-w-[62px] text-center text-[12px] ${pillClass(c.pct, threshold)}`}>{pctText(c.pct)}</span>
    ) : (
      <span className="text-[17px] font-bold">{c.main}</span>
    );
  return (
    <section>
      <CompareSectionHead title="Sales" />
      {rows.map((r, i) => (
        <div
          key={r.label}
          className={`${MIRROR_COLS} ${i === 0 ? "h-11" : "h-9"} border-b border-line_hair text-content tabular-nums`}
        >
          <span className="flex items-baseline justify-end gap-2 pr-3 whitespace-nowrap">
            <span className="text-[11.5px]">{r.cells[0].sub}</span>
            {figure(r.cells[0])}
          </span>
          <span className="text-center text-[12.5px]">{r.label}</span>
          <span className="flex items-baseline gap-2 pl-3 whitespace-nowrap">
            {figure(r.cells[1])}
            <span className="text-[11.5px]">{r.cells[1].sub}</span>
          </span>
        </div>
      ))}
    </section>
  );
};

export default CompareSalesTable;
