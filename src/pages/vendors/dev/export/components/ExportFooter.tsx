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
    <div className={`flex items-center justify-between px-4 py-3 border-t border-line_hair ${className}`}>
      <button onClick={onCancel} className="text-[12px] text-content transition-colors">
        Cancel
      </button>
      <button
        onClick={onDownload}
        disabled={disabled}
        className="flex items-center gap-1.5 cc-btn-primary hover:bg-brand_navy/85 text-[12px]"
      >
        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
        Download CSV
      </button>
    </div>
  );
};

export default ExportFooter;
