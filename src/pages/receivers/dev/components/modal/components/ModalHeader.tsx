import { modalModes } from "../utils";

import { XMarkIcon } from "@heroicons/react/20/solid";

interface ModalHeaderProps {
  vendorName: string;
  referenceNumber: string;
  mode: "presets" | "custom";
  setMode: (mode: "presets" | "custom") => void;
  onClose: () => void;
}

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
        <p className="text-custom-white text-[13px] font-semibold">
          Export CSV
        </p>
        <p className="text-custom-white/55 text-[10px] mt-0.5">
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
                : "text-custom-white/70 hover:text-custom-white"
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

export default ModalHeader;
