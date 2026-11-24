// Interfaces
import type { Preset } from "../../interfaces";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface PresetsPaneProps {
  options: { key: Preset; title: string; detail: string }[];
  available: Record<Preset, boolean>;
  preset: Preset;
  onPreset: (preset: Preset) => void;
  canDownload: boolean;
  onDownload: () => void;
}

/** Presets mode: the three files, each with what it holds, and the download. */
const PresetsPane = ({
  options,
  available,
  preset,
  onPreset,
  canDownload,
  onDownload,
}: PresetsPaneProps) => (
  <div className="p-4">
    <p className="text-[11px] text-content/95 uppercase tracking-wide font-medium mb-2">
      Select data to include
    </p>
    {options.map((o, i) => (
      <label
        key={o.key}
        className={`flex items-start gap-2.5 py-2.5 cursor-pointer ${
          i < options.length - 1 ? "border-b border-line_hair" : ""
        } ${!available[o.key] ? "opacity-40" : ""}`}
      >
        <input
          type="radio"
          checked={preset === o.key}
          onChange={() => onPreset(o.key)}
          disabled={!available[o.key]}
          className="mt-0.5"
        />
        <div>
          <p className="text-[13px] font-medium text-content">{o.title}</p>
          <p className="text-[11px] text-content/95 mt-0.5">{o.detail}</p>
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
