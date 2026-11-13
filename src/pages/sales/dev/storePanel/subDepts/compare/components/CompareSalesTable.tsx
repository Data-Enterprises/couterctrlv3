// Utils
import { pillClass } from "../../../../../../../utils/severity";
import { MIRROR_COLS, pctText } from "../utils";

// Interfaces
import type { SalesRow } from "../interfaces";

// Components
import CompareSalesSide from "./CompareSalesSide";
import CompareSectionHead from "./CompareSectionHead";

interface CompareSalesTableProps {
  rows: SalesRow[];
  /** The item threshold the changes grade against, as the items do. */
  threshold: number;
}

/** Sales as a butterfly: per week, A's bar grows left from the centre label and
 *  B's grows right, on one scale, each with its figure and its change to this
 *  week graded on the threshold. */
const CompareSalesTable = ({ rows, threshold }: CompareSalesTableProps) => {
  const top = Math.max(1, ...rows.flatMap((r) => r.cells.map((c) => c.value)));
  return (
    <section>
      <CompareSectionHead title="Sales" />
      {rows.map((r) => (
        <div key={r.label} className={`${MIRROR_COLS} py-1.5 text-content tabular-nums`}>
          <CompareSalesSide
            side="A"
            cell={r.cells[0]}
            share={(r.cells[0].value / top) * 100}
            now={r.now}
            chip={r.cells[0].pct === null ? null : { text: pctText(r.cells[0].pct), cls: pillClass(r.cells[0].pct, threshold) }}
          />
          <span className={`text-center text-[12.5px] ${r.now ? "font-semibold" : ""}`}>{r.label}</span>
          <CompareSalesSide
            side="B"
            cell={r.cells[1]}
            share={(r.cells[1].value / top) * 100}
            now={r.now}
            chip={r.cells[1].pct === null ? null : { text: pctText(r.cells[1].pct), cls: pillClass(r.cells[1].pct, threshold) }}
          />
        </div>
      ))}
    </section>
  );
};

export default CompareSalesTable;
