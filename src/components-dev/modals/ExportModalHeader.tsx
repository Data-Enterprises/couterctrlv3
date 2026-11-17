// Interfaces
import type { ExportMode } from "../interfaces";

// Components
import { XMarkIcon } from "@heroicons/react/20/solid";

interface ExportModalHeaderProps {
  /** What is being exported, in a line. */
  subtitle: string;
  mode: ExportMode;
  onMode: (mode: ExportMode) => void;
  onClose: () => void;
}

/** An export pop-up's navy title bar: what is being exported, the Presets /
 *  Custom switch and close. */
const ExportModalHeader = ({
  subtitle,
  mode,
  onMode,
  onClose,
}: ExportModalHeaderProps) => (
  <div className="cc-phone-header">
    <div className="min-w-0">
      <p className="cc-navy-title text-[13px]">Export CSV</p>
      <p className="text-custom-white text-[10px] mt-0.5 truncate">
        {subtitle}
      </p>
    </div>
    <div className="cc-segment-navy">
      {(["presets", "custom"] as ExportMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onMode(m)}
          className={`cc-chip-btn text-[11px] ${
            mode === m ? "bg-custom-white text-brand_navy" : "text-custom-white"
          }`}
        >
          {m === "presets" ? "Presets" : "Custom"}
        </button>
      ))}
    </div>
    <button
      onClick={onClose}
      aria-label="Close"
      className="cc-navy-link justify-self-end"
    >
      <XMarkIcon className="w-4 h-4" />
    </button>
  </div>
);

export default ExportModalHeader;
