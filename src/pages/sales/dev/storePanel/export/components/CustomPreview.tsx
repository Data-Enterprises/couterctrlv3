// Utils
import { PREVIEW_ROWS } from "../utils/index";

interface CustomPreviewProps {
  rows: Record<string, string>[];
  columns: { key: string; label: string }[];
}

/** The custom export's preview table: the first rows for the chosen columns, with a hint when nothing is selected. */
const CustomPreview = ({ rows, columns }: CustomPreviewProps) => (
  <div className="flex flex-col min-w-0">
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-line_hair flex-shrink-0">
      <p className="text-[11px] font-semibold text-content uppercase tracking-wide">
        Preview
      </p>
      <span className="text-[10px] text-content">
        {rows.length === 0
          ? "No data — select at least one group or metric"
          : `Showing ${Math.min(PREVIEW_ROWS, rows.length)} of ${rows.length} rows`}
      </span>
    </div>

    {columns.length === 0 ? (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-[12px] text-content leading-relaxed">
          Select at least one group-by dimension
          <br />
          or metric to see a preview.
        </p>
      </div>
    ) : (
      <div className="flex-1 overflow-auto thin-scrollbar">
        <table className="min-w-full text-[11px] border-collapse">
          <thead className="sticky top-0 bg-fill_soft z-10">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="text-left px-3 py-2 text-content font-semibold border-b border-line_hair whitespace-nowrap"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, PREVIEW_ROWS).map((row, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? "bg-custom-white" : "bg-fill_soft/50"}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className="px-3 py-1.5 text-content whitespace-nowrap border-b border-line_faint"
                  >
                    {row[c.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length > PREVIEW_ROWS && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-2 text-[10px] text-content italic"
                >
                  + {rows.length - PREVIEW_ROWS} more rows in
                  download…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default CustomPreview;
