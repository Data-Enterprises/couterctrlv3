// Utils
import { PREVIEW_ROWS } from "../utils";

// Interfaces
import type { AggRow } from "../../../../../utils/csvExport";

interface PreviewPaneProps {
  columns: { key: string; label: string }[];
  rows: AggRow[];
}

/** Custom mode's preview: the same rows the download will hold. */
const PreviewPane = ({ columns, rows }: PreviewPaneProps) => (
  <div className="flex flex-col min-w-0">
    <div className="cc-bar-header flex-shrink-0">
      <p className="text-[11px] cc-caps">Preview</p>
      <span className="text-[10px] text-content/95">
        {rows.length === 0
          ? "No data — select at least one group or metric"
          : `Showing ${Math.min(PREVIEW_ROWS, rows.length)} of ${rows.length} rows`}
      </span>
    </div>

    {columns.length === 0 ? (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-[12px] text-content/95 leading-relaxed">
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
                <th key={c.key} className="cc-th text-content/95">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, PREVIEW_ROWS).map((r, idx) => (
              <tr
                key={idx}
                className={
                  idx % 2 === 0 ? "bg-custom-white" : "bg-fill_soft/50"
                }
              >
                {columns.map((c) => (
                  <td key={c.key} className="cc-td text-content/95">
                    {r[c.key] ?? "—"}
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

export default PreviewPane;
