// Hooks
import { useMarkdownsCtx } from "../../hooks";

// Components
import { XMarkIcon } from "@heroicons/react/16/solid";

interface ExportHeaderProps {
  onClose: () => void;
}

/** The export pop-up's navy header, as Receivers' export has it. */
const ExportHeader = ({ onClose }: ExportHeaderProps) => {
  const ctx = useMarkdownsCtx();
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-brand_navy flex-shrink-0">
      <div>
        <p className="text-custom-white text-[13px] font-semibold">
          Export CSV
        </p>
        <p className="text-custom-white/95 text-[10px] mt-0.5">
          {ctx.shown.scope} — {ctx.shown.startDate} – {ctx.shown.endDate}
        </p>
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        className="text-custom-white/95 hover:text-custom-white transition-colors"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ExportHeader;
