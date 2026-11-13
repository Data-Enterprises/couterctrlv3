// Utils
import { GRID_COLUMNS } from "../../utils";

// Interfaces
import type { MarkdownItem } from "../../../../../interfaces/markdowns";

interface GridRowProps {
  row: MarkdownItem;
}

/** One markdown, as Receivers draws a line item: every grid column. */
const GridRow = ({ row }: GridRowProps) => (
  <tr className="even:bg-row_stripe hover:bg-fill_soft transition-colors">
    {GRID_COLUMNS.map((c) => (
      <td
        key={c.key}
        className={`px-3 py-2 tabular-nums text-content/95 whitespace-nowrap ${
          c.align === "right" ? "text-right" : ""
        } ${c.key === "description" ? "font-medium" : ""}`}
      >
        {c.show(row)}
      </td>
    ))}
  </tr>
);

export default GridRow;
