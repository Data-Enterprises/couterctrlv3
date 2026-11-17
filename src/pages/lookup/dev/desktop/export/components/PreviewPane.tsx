// Utils
import { PREVIEW_ROWS } from "../../utils";

// Interfaces
import type { ColDef } from "../../interfaces";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface PreviewPaneProps {
  columns: ColDef[];
  rows: (string | number)[][];
  canDownload: boolean;
  onCancel: () => void;
  onDownload: () => void;
}

/** Custom mode's right column: the first rows of the file, then Cancel and
 *  the download. */
const PreviewPane = ({
  columns,
  rows,
  canDownload,
  onCancel,
  onDownload,
}: PreviewPaneProps) => (
  <div className="p-3.5 flex flex-col">
    <p className="text-[10px] cc-caps mb-2">Preview</p>
    <div className="border border-line_hair rounded-md overflow-hidden">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-fill_soft border-b border-line_hair">
            {columns.map((c) => (
              <th
                key={c.key}
                className="text-left px-2.5 py-1.5 text-content/95 font-semibold whitespace-nowrap"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, PREVIEW_ROWS).map((row, ri) => (
            <tr key={ri} className="border-b border-line_faint">
              {row.map((cell, ci) => (
                <td
                  key={columns[ci].key}
                  className="px-2.5 py-1 text-content/95 whitespace-nowrap"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length > PREVIEW_ROWS && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-2.5 py-1.5 text-[10px] text-content/95 italic"
              >
                +{rows.length - PREVIEW_ROWS} more rows in download…
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    <div className="flex-1" />
    <div className="flex items-center justify-between mt-3.5">
      <button onClick={onCancel} className="text-[12px] cc-muted-link">
        Cancel
      </button>
      <button
        onClick={onDownload}
        disabled={!canDownload}
        className="flex items-center gap-1.5 cc-btn-primary text-[12px]"
      >
        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
        Download CSV
      </button>
    </div>
  </div>
);

export default PreviewPane;
