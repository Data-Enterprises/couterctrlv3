// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface ExportFooterProps {
  /** Presets sits a little lower under its list. */
  spaced?: boolean;
  canDownload: boolean;
  onCancel: () => void;
  onDownload: () => void;
}

/** Cancel and Download CSV, under either mode. */
const ExportFooter = ({
  spaced = false,
  canDownload,
  onCancel,
  onDownload,
}: ExportFooterProps) => (
  <div className={spaced ? "cc-bar-footer mt-2" : "cc-bar-footer"}>
    <button onClick={onCancel} className="text-[12px] cc-muted-link">
      Cancel
    </button>
    <button
      onClick={onDownload}
      disabled={!canDownload}
      className="flex items-center gap-1.5 cc-btn-primary text-[12px]"
    >
      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
      Download CSV
    </button>
  </div>
);

export default ExportFooter;
