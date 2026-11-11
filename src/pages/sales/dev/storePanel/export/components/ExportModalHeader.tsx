// Interfaces
import type { ModalMode } from "../interfaces/index";

// Components
import { XMarkIcon } from "@heroicons/react/20/solid";

interface ExportModalHeaderProps {
  storeName: string;
  mode: ModalMode;
  onModeChange: (mode: ModalMode) => void;
  onClose: () => void;
}

/** The export modal's navy header: the store name, the Presets / Custom mode tabs and the close button. */
const ExportModalHeader = ({
  storeName,
  mode,
  onModeChange,
  onClose,
}: ExportModalHeaderProps) => (
  <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-brand_navy">
    <div>
      <p className="cc-navy-title text-[13px]">Export CSV</p>
      <p className="text-custom-white text-[10px] mt-0.5">{storeName}</p>
    </div>
    {/* Mode tabs */}
    <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
      {(["presets", "custom"] as ModalMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onModeChange(m)}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
            mode === m ? "bg-custom-white text-brand_navy" : "text-custom-white"
          }`}
        >
          {m === "presets" ? "Presets" : "Custom"}
        </button>
      ))}
    </div>
    <button
      onClick={onClose}
      className="cc-navy-link justify-self-end"
    >
      <XMarkIcon className="w-4 h-4" />
    </button>
  </div>
);

export default ExportModalHeader;
