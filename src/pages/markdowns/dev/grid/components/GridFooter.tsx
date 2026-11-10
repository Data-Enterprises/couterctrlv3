// Utils
import { GRID_COLUMNS } from "../../utils";
import { totalsRow } from "../utils";

// Interfaces
import type { MarkdownTotals } from "../interfaces";

interface GridFooterProps {
  totals: MarkdownTotals;
}

/** The sticky Totals row at the foot of the grid, as Receivers' table has it,
 *  for every row the filters keep. */
const GridFooter = ({ totals }: GridFooterProps) => {
  const cells = totalsRow(totals);
  return (
    <tfoot>
      <tr className="sticky bottom-0 bg-gray-50 border-t-2 border-content/70 font-bold text-[14px]">
        {GRID_COLUMNS.map((c) => (
          <td
            key={c.key}
            className="px-3 py-2 text-right tabular-nums text-content/95 whitespace-nowrap"
          >
            {cells[c.key] ?? ""}
          </td>
        ))}
      </tr>
    </tfoot>
  );
};

export default GridFooter;
