// Interfaces
import type { Preset, Source } from "../interfaces";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface PresetsPaneProps {
  presets: Preset[];
  available: Record<Source, boolean>;
  source: Source;
  onSource: (source: Source) => void;
  canDownload: boolean;
  onDownload: () => void;
}

/** Presets mode: one sheet to pick, each with what it holds, and the download. */
const PresetsPane = ({
  presets,
  available,
  source,
  onSource,
  canDownload,
  onDownload,
}: PresetsPaneProps) => (
  <div className="p-4">
    <p className="text-[11px] text-content/95 uppercase tracking-wide font-medium mb-2">
      Select data to include
    </p>
    {presets.map((p) => (
      <label
        key={p.source}
        className={`flex items-start gap-2.5 py-2.5 border-b border-line_hair last:border-b-0 cursor-pointer ${
          available[p.source] ? "" : "opacity-40"
        }`}
      >
        <input
          type="radio"
          checked={source === p.source}
          onChange={() => onSource(p.source)}
          disabled={!available[p.source]}
          className="mt-0.5"
        />
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-content">{p.title}</p>
          <p className="text-[11px] text-content/95 mt-0.5 truncate">
            {p.caption}
          </p>
        </div>
      </label>
    ))}
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

export default PresetsPane;
