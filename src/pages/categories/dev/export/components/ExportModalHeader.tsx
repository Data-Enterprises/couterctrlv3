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
    <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-brand_navy">
      <div>
        <p className="text-custom-white text-[13px] font-semibold">Export CSV</p>
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
        className="text-custom-white/60 hover:text-custom-white transition-colors justify-self-end"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ExportModalHeader;
