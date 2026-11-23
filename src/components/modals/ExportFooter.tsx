// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface ExportFooterProps {
  disabled: boolean;
  onCancel: () => void;
  onDownload: () => void;
  /** The download button's text, if not "Download CSV". */
  label?: string;
  /** Presets sits a little lower under its list. */
  spaced?: boolean;
}

/** An export pop-up's footer: Cancel and the download button. */
const ExportFooter = ({
  disabled,
  onCancel,
  onDownload,
  label = "Download CSV",
  spaced = false,
}: ExportFooterProps) => (
  <div className={spaced ? "cc-bar-footer mt-2" : "cc-bar-footer"}>
    <button
      onClick={onCancel}
      className="text-[12px] text-content transition-colors"
    >
      Cancel
    </button>
    <button
      onClick={onDownload}
      disabled={disabled}
      className="flex items-center gap-1.5 cc-btn-primary text-[12px]"
    >
      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
      {label}
    </button>
  </div>
);

export default ExportFooter;
