// Interfaces
import type { ModalMode } from "../../../interfaces";

// Components
import { XMarkIcon } from "@heroicons/react/20/solid";

interface ExportModalHeaderProps {
  subtitle: string;
  mode: ModalMode;
  setMode: (mode: ModalMode) => void;
  onClose: () => void;
}

/** The export pop-up's title bar: what is being exported, Presets or Custom,
 *  and close. */
const ExportModalHeader = ({
  subtitle,
  mode,
  setMode,
  onClose,
}: ExportModalHeaderProps) => (
  <div className="cc-phone-header">
    <div>
      <p className="cc-navy-title text-[13px]">Export CSV</p>
      <p className="text-custom-white/95 text-[10px] mt-0.5">{subtitle}</p>
    </div>
    <div className="cc-segment-navy">
      {(["presets", "custom"] as ModalMode[]).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`cc-chip-btn text-[11px] ${mode === m ? "bg-custom-white text-brand_navy" : "text-custom-white/95 hover:text-custom-white"}`}
        >
          {m === "presets" ? "Presets" : "Custom"}
        </button>
      ))}
    </div>
    <button onClick={onClose} className="cc-navy-link justify-self-end">
      <XMarkIcon className="w-4 h-4" />
    </button>
  </div>
);

export default ExportModalHeader;
