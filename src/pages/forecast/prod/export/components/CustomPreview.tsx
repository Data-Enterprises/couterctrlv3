// Utils
import { cell, PREVIEW_ROWS } from "../utils";

// Interfaces
import type { ColKey, RankedRow } from "../interfaces";

interface CustomPreviewProps {
  columns: { key: ColKey; label: string }[];
  rows: RankedRow[];
}

/** Custom mode's preview: the first rows of the file, or why there are none. */
const CustomPreview = ({ columns, rows }: CustomPreviewProps) => (
  <div className="flex flex-col min-w-0">
    <div className="cc-bar-header flex-shrink-0">
      <p className="text-[11px] font-semibold text-content uppercase tracking-wide">
        Preview
      </p>
      <span className="text-[10px] text-content">
        {columns.length === 0 || rows.length === 0
          ? "No data — select at least one column"
          : `Showing ${Math.min(PREVIEW_ROWS, rows.length)} of ${rows.length} rows`}
      </span>
    </div>

    {columns.length === 0 || rows.length === 0 ? (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-[12px] text-content leading-relaxed">
          {rows.length === 0 ? (
            <>
              No rows in scope — tick items in the panel
              <br />
              or switch to All items.
            </>
          ) : (
            <>Select at least one column to see a preview.</>
          )}
        </p>
      </div>
    ) : (
      <div className="flex-1 overflow-auto thin-scrollbar">
        <table className="min-w-full text-[11px] border-collapse">
          <thead className="sticky top-0 bg-fill_soft z-10">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="cc-th text-content">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, PREVIEW_ROWS).map((r) => (
              <tr key={r.upc} className="border-b border-line_hair">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className="px-3 py-1.5 text-content whitespace-nowrap tabular-nums"
                  >
                    {cell(r, c.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default CustomPreview;
