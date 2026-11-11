// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface ExportFooterProps {
  onCancel: () => void;
  onDownload: () => void;
  disabled: boolean;
  /** The download button's text. */
  label: string;
  /** Presets mode sits the footer a little lower. */
  spaced?: boolean;
}

/** The export modal's footer: a Cancel link and the download button. */
const ExportFooter = ({
  onCancel,
  onDownload,
  disabled,
  label,
  spaced = false,
}: ExportFooterProps) => (
  <div
    className={`cc-bar-footer${
      spaced ? " mt-2" : ""
    }`}
  >
    <button onClick={onCancel} className="text-[12px] text-content transition-colors">
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
