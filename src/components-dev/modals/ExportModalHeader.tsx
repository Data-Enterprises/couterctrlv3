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
  /** The subtitle's size: 10px by default, 11px as Cashiers draws it, 12px
   *  as Item Actions does. */
  subtitleSize?: "sm" | "md" | "lg";
}

/** An export pop-up's navy title bar: what is being exported, the Presets /
 *  Custom switch and close. */
const ExportModalHeader = ({
  subtitle,
  mode,
  onMode,
  onClose,
  subtitleSize = "sm",
}: ExportModalHeaderProps) => (
  <div className="cc-phone-header">
    <div className="min-w-0">
      <p className="cc-navy-title text-[13px]">Export CSV</p>
      <p
        className={
          subtitleSize === "lg"
            ? "text-custom-white text-[12px] truncate"
            : subtitleSize === "md"
              ? "text-custom-white text-[11px] mt-0.5 truncate"
              : "text-custom-white text-[10px] mt-0.5 truncate"
        }
      >
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
