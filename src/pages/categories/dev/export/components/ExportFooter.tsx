// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface ExportFooterProps {
  onCancel: () => void;
  onDownload: () => void;
  disabled: boolean;
  /** The presets footer sits a little below its list. */
  className?: string;
}

/** Cancel and Download CSV. */
const ExportFooter = ({ onCancel, onDownload, disabled, className = "" }: ExportFooterProps) => {
  return (
    <div className={`flex items-center justify-between px-4 py-3 border-t border-gray-100 ${className}`}>
      <button onClick={onCancel} className="text-[12px] text-content transition-colors">
        Cancel
      </button>
      <button
        onClick={onDownload}
        disabled={disabled}
        className="flex items-center gap-1.5 bg-brand_navy hover:bg-brand_navy/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
      >
        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
        Download CSV
      </button>
    </div>
  );
};

export default ExportFooter;
