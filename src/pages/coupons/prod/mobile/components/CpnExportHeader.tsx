// Interfaces
import type { ModalMode } from "../../interfaces";

interface CpnExportHeaderProps {
  subtitle: string;
  mode: ModalMode;
  setMode: (mode: ModalMode) => void;
}

/** The phone export sheet's title and its Presets/Custom switch. */
const CpnExportHeader = ({ subtitle, mode, setMode }: CpnExportHeaderProps) => (
  <div className="flex items-center justify-between px-4 pb-3 border-b border-line_hair">
    <div className="min-w-0">
      <div className="text-[13px] font-bold text-content">Export CSV</div>
      <div className="text-[10px] text-content/95 mt-0.5 truncate">
        {subtitle}
      </div>
    </div>
    <div className="flex items-center gap-0.5 bg-content/5 rounded-md p-0.5 flex-shrink-0">
      {(["presets", "custom"] as ModalMode[]).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`cc-chip-btn text-[11px] ${
            mode === m ? "bg-brand_navy text-custom-white" : "text-content/95"
          }`}
        >
          {m === "presets" ? "Presets" : "Custom"}
        </button>
      ))}
    </div>
  </div>
);

export default CpnExportHeader;
