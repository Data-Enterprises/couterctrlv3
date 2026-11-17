// Utils
import { PRESETS } from "../utils";

// Interfaces
import type { Row, Source } from "../interfaces";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface PresetListProps {
  presetKey: string;
  onPreset: (key: string) => void;
  rowsOf: Record<Source, Row[]>;
  /** The chosen preset's file, as it will download. */
  rowCount: number;
  colCount: number;
  receivingComplete: boolean;
  canDownload: boolean;
  onDownload: () => void;
}

/** Presets mode: who the file is for, each with what they get, and the
 *  download. The chosen one shows its row and column count. */
const PresetList = ({
  presetKey,
  onPreset,
  rowsOf,
  rowCount,
  colCount,
  receivingComplete,
  canDownload,
  onDownload,
}: PresetListProps) => (
  <div className="p-4">
    <p className="text-[11px] text-content/95 uppercase tracking-wide font-medium mb-2">
      Who is this for?
    </p>
    {PRESETS.map((pr) => {
      const count = rowsOf[pr.source].length;
      return (
        <label
          key={pr.key}
          className={`flex items-start gap-2.5 py-2.5 border-b border-line_hair last:border-b-0 cursor-pointer ${
            presetKey === pr.key || count > 0 ? "" : "opacity-40"
          }`}
        >
          <input
            type="radio"
            checked={presetKey === pr.key}
            onChange={() => onPreset(pr.key)}
            className="mt-0.5"
          />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-content">{pr.title}</p>
            <p className="text-[11px] text-content/95 mt-0.5">{pr.blurb}</p>
            {presetKey === pr.key && (
              <p className="text-[11px] text-content/95 mt-0.5 font-medium">
                {rowCount} rows · {colCount} columns
                {receivingComplete ? "" : " · still reading invoices"}
              </p>
            )}
          </div>
        </label>
      );
    })}
    <button
      onClick={onDownload}
      disabled={!canDownload}
      className="w-full mt-3 flex items-center justify-center gap-1.5 cc-btn-primary text-[12px]"
    >
      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
      Download CSV
    </button>
  </div>
);

export default PresetList;
