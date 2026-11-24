// Utils
import { isPii } from "../../utils/piiColumns";
import { CORNER_TH, ROW_NUMBER_TD } from "../utils";
// PARKED with the Dates control — see dateFormats.ts.
// import { formatDateValue, isDateColumn } from "../utils/dateFormats";

// Interfaces
import type { ExportRow } from "../../../../../api/salesExport";

interface SummaryTableProps {
  /** The group keys, then the measures. */
  columns: string[];
  rows: ExportRow[];
  /** The group keys, which sit left-aligned and name a null "(blank)". */
  keys: string[];
}

/** The summary over the sample: group keys shaded as keys, measures as
 *  measures, numbers right-aligned. No dragging, since the endpoint fixes the
 *  order. */
const SummaryTable = ({ columns, rows, keys }: SummaryTableProps) => (
  <div className="flex-1 overflow-auto thin-scrollbar">
    <table className="border-collapse font-mono text-[11px] w-max">
      <thead>
        <tr>
          <th className={CORNER_TH}></th>
          {columns.map((c) => {
            const isKey = keys.includes(c);
            return (
              <th
                key={c}
                className={`sticky top-0 z-10 border-b border-brand_line_2 border-r border-brand_line px-2.5 py-1.5 text-left font-semibold whitespace-nowrap ${
                  isPii(c)
                    ? "bg-severity_watch_bg text-severity_watch_text"
                    : isKey
                      ? "bg-row_selected text-content"
                      : "bg-filter_active text-content"
                }`}
              >
                {c}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            <td className={ROW_NUMBER_TD}>{r + 1}</td>
            {columns.map((c) => {
              // PARKED: a group key can be a date, and would be
              // written the chosen way once the endpoint can.
              // const type = ctx.columns.find((col) => col.name === c);
              // const raw =
              //   type && isDateColumn(type.data_type)
              //     ? formatDateValue(row[c], ctx.flags.dateFormat)
              //     : row[c];
              const raw = row[c];
              return (
                <td
                  key={c}
                  className={`border-r border-b border-brand_line px-2.5 py-1.5 whitespace-nowrap ${
                    keys.includes(c) ? "" : "text-right"
                  }`}
                >
                  {raw === null || raw === undefined
                    ? // A null group key is its own row in the file (the
                      // tender lines land there), so it is named.
                      keys.includes(c)
                      ? "(blank)"
                      : ""
                    : String(raw)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default SummaryTable;
