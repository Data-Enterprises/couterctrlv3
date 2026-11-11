// Utils
import { modalModes } from "../utils";

// Components
import { XMarkIcon } from "@heroicons/react/20/solid";

interface ModalHeaderProps {
  vendorName: string;
  referenceNumber: string;
  mode: "presets" | "custom";
  setMode: (mode: "presets" | "custom") => void;
  onClose: () => void;
}

/** The export modal's navy header: title with vendor and reference number, the Presets/Custom switch and a close button. */
const ModalHeader = ({
  vendorName,
  referenceNumber,
  mode,
  setMode,
  onClose,
}: ModalHeaderProps) => {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-brand_navy">
      <div>
        <p className="cc-navy-title text-[13px]">
          Export CSV
        </p>
        <p className="text-custom-white/95 text-[10px] mt-0.5">
          {vendorName} — Ref #{referenceNumber}
        </p>
      </div>
      <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
        {modalModes.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              mode === m
                ? "bg-custom-white text-brand_navy"
                : "text-custom-white/95 hover:text-custom-white"
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

export default ModalHeader;
