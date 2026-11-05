// Utils
import { PREVIEW_ROWS } from "../utils";

interface CustomPreviewProps {
  columns: { key: string; label: string }[];
  aggRows: Record<string, string>[];
  hasItems: boolean;
}

/** The first rows of the custom export, as they will download. */
const CustomPreview = ({ columns, aggRows, hasItems }: CustomPreviewProps) => {
  return (
  <div className="flex flex-col min-w-0">
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
      <p className="text-[11px] font-semibold text-content uppercase tracking-wide">
        Preview
      </p>
      <span className="text-[10px] text-content">
        {aggRows.length === 0
          ? "No data — select at least one group or metric"
          : `Showing ${Math.min(PREVIEW_ROWS, aggRows.length)} of ${aggRows.length} rows`}
      </span>
    </div>

    {columns.length === 0 ? (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-[12px] text-content leading-relaxed">
          {hasItems ? (
            <>
              Select at least one group-by dimension
              <br />
              or metric to see a preview.
            </>
          ) : (
            <>
              Select a category first — custom exports
              <br />
              are built from its item rows.
            </>
          )}
        </p>
      </div>
    ) : (
      <div className="flex-1 overflow-auto thin-scrollbar">
        <table className="min-w-full text-[11px] border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="text-left px-3 py-2 text-content font-semibold border-b border-gray-100 whitespace-nowrap"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aggRows.slice(0, PREVIEW_ROWS).map((r, i) => (
              <tr key={i} className="border-b border-gray-100">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className="px-3 py-1.5 text-content whitespace-nowrap tabular-nums"
                  >
                    {r[c.key] ?? ""}
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
};

export default CustomPreview;
