// Interfaces
import type { AggRow } from "../../../../../../utils/csvExport";

interface CustomModeTableProps {
  aggRows: AggRow[];
  columns: { key: string }[];
  PREVIEW_ROWS: number;
}

/** The body of the custom export preview: the first rows of the grouped results,
 *  then a note of how many more rows the download holds. */
const CustomModeTable = ({
  aggRows,
  columns,
  PREVIEW_ROWS,
}: CustomModeTableProps) => {
  return (
    <tbody>
      {aggRows.slice(0, PREVIEW_ROWS).map((row, i) => (
        <tr
          key={i}
          className={i % 2 === 0 ? "bg-custom-white" : "bg-gray-50/50"}
        >
          {columns.map((c) => (
            <td
              key={c.key}
              className="px-3 py-1.5 text-content/95 whitespace-nowrap border-b border-gray-50"
            >
              {row[c.key] ?? "—"}
            </td>
          ))}
        </tr>
      ))}
      {aggRows.length > PREVIEW_ROWS && (
        <tr>
          <td
            colSpan={columns.length}
            className="px-3 py-2 text-[10px] text-content/95 italic"
          >
            + {aggRows.length - PREVIEW_ROWS} more rows in download…
          </td>
        </tr>
      )}
    </tbody>
  );
};

export default CustomModeTable;
