// Utils
import { formatBigNumber } from "../../../../../utils";
import { mb } from "../../utils";

// Interfaces
import type { ExportFile } from "../../../../../api/salesExport";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

interface BuiltFilesProps {
  files: ExportFile[];
  /** The configuration has moved since this file was built. */
  stale: boolean;
  /** The saved query it was built from, if any. */
  queryName: string | null;
  rowsUploaded: number;
  elapsedSeconds: number;
  urlExpiresInMinutes: number;
  manifestWritten: boolean;
  onGoBack: () => void;
}

/**
 * What was built, where the Build button was: each file with its size, how
 * long the link lasts, Download, and Go back. The configuration stays on
 * screen, since the second export is nearly always an adjustment of the first.
 */
const BuiltFiles = ({
  files,
  stale,
  queryName,
  rowsUploaded,
  elapsedSeconds,
  urlExpiresInMinutes,
  manifestWritten,
  onGoBack,
}: BuiltFilesProps) => (
  <div
    className={`flex-shrink-0 rounded-xl px-4 py-3 border ${
      stale
        ? "bg-severity_watch_bg border-severity_watch_text/20"
        : "bg-card_bg border-brand_green"
    }`}
  >
    {/* A file left on screen while the configuration moves under it looks
        like the answer and is not. */}
    {stale && (
      <div className="text-[12px] font-semibold text-severity_watch_text mb-2">
        The configuration has changed since this file was built — it does not
        match what is on screen. Build export again for a file that does.
      </div>
    )}
    {files.map((f) => (
      <div key={f.key} className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand_green_tint flex items-center justify-center flex-shrink-0">
          <ArrowDownTrayIcon className="w-4 h-4 text-brand_green" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold truncate">
            {f.key.split("/").pop()}
            {queryName && (
              <span className="font-normal text-content/95">
                {" "}
                · {queryName}
              </span>
            )}
          </div>
          <div className="text-[11.5px] text-content/95 mt-0.5">
            {formatBigNumber(rowsUploaded, 0)} rows · {mb(f.bytes)} · built in{" "}
            {elapsedSeconds.toFixed(1)}s
          </div>
        </div>
        <div className="text-right mr-1">
          <div className="text-[11.5px] font-semibold text-severity_watch_text">
            Link expires in {urlExpiresInMinutes} min
          </div>
          <div className="text-[11px] text-content/95 mt-0.5">
            Build it again after that
          </div>
        </div>
        <a
          href={f.url}
          download
          className="bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[13px] font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Download
        </a>
        {/* The way out, beside the way on. */}
        <button
          type="button"
          onClick={onGoBack}
          className="text-[13px] font-medium px-4 py-2.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
        >
          Go back
        </button>
      </div>
    ))}
    <div className="text-[11px] text-content/95 mt-2">
      {manifestWritten
        ? "This build is in Previous builds, with the settings that made it."
        : "This build has no manifest, so it will not appear in Previous builds — keep this link."}
    </div>
  </div>
);

export default BuiltFiles;
