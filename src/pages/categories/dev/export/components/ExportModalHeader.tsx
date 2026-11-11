// Interfaces
import type { ModalMode } from "../interfaces";

// Components
import { XMarkIcon } from "@heroicons/react/20/solid";

interface ExportModalHeaderProps {
  categoryName: string;
  storeName: string;
  mode: ModalMode;
  onMode: (m: ModalMode) => void;
  onClose: () => void;
}

/** The title, the Presets / Custom switch and the close button. */
const ExportModalHeader = ({ categoryName, storeName, mode, onMode, onClose }: ExportModalHeaderProps) => {
  return (
    <div className="cc-phone-header">
      <div>
        <p className="cc-navy-title text-[13px]">Export CSV</p>
        <p className="text-custom-white text-[10px] mt-0.5">
          {categoryName} · {storeName}
        </p>
      </div>
      <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
        {(["presets", "custom"] as ModalMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onMode(m)}
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
};

export default ExportModalHeader;
