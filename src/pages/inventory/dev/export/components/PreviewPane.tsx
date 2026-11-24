// Utils
import { colLabel, PREVIEW_ROWS } from "../utils";

// Interfaces
import type { Col, Row } from "../interfaces";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface PreviewPaneProps {
  columns: Col[];
  rows: Row[];
  groupNoun: string;
  canDownload: boolean;
  onCancel: () => void;
  onDownload: () => void;
}

/** Custom mode's right column: the first rows of the file, then Cancel and
 *  the download. */
const PreviewPane = ({
  columns,
  rows,
  groupNoun,
  canDownload,
  onCancel,
  onDownload,
}: PreviewPaneProps) => (
  <div className="p-3.5 flex flex-col">
    <p className="text-[10px] cc-caps mb-2">Preview</p>
    <div className="border border-line_hair rounded-md overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-fill_soft border-b border-line_hair">
            {columns.map((c) => (
              <th
                key={c.key}
                className="text-left px-2.5 py-1.5 text-content/95 font-semibold whitespace-nowrap"
              >
                {colLabel(c, groupNoun)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, PREVIEW_ROWS).map((r, i) => (
            <tr key={i} className="border-b border-line_faint">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className="px-2.5 py-1 text-content/95 whitespace-nowrap"
                >
                  {r[c.key] ?? ""}
                </td>
              ))}
            </tr>
          ))}
          {rows.length > PREVIEW_ROWS && (
            <tr>
              <td
                colSpan={Math.max(columns.length, 1)}
                className="px-2.5 py-1.5 text-[10px] text-content/95"
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
