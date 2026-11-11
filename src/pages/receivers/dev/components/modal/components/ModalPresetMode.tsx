// Interfaces
import type {
  ReceiverDetailsItem,
  ReceiverDetailsTotals,
} from "../../../../../../interfaces";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface ModalPresetModeProps {
  onClose: () => void;
  vendorName: string;
  invoiceId: number;
  referenceNumber: string;
  details: ReceiverDetailsItem[];
  totals: ReceiverDetailsTotals | null;
  handlePresetDownload: () => void;
}

/** The export modal's Presets tab: the Line Items option with its count and totals, and Cancel and Download CSV buttons. */
const ModalPresetMode = ({
  onClose,
  vendorName,
  invoiceId,
  details,
  totals,
  handlePresetDownload,
}: ModalPresetModeProps) => {
  return (
    <>
      <div className="px-4 pt-4 pb-2 space-y-3">
        <p className="text-[11px] text-content/95 uppercase tracking-wide font-medium">
          Select data to include
        </p>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked
            readOnly
            className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0"
          />
          <div>
            <p className="text-[13px] cc-row-title">
              Line Items
            </p>
            <p className="text-[11px] text-content/95 mt-0.5">
              {details.length} line items for {vendorName} — Invoice {invoiceId}
              {totals && ` · Cases ${totals.cases} · Units ${totals.units}`}
            </p>
          </div>
        </label>
      </div>

      <div className="cc-bar-footer mt-2">
        <button
          onClick={onClose}
          className="text-[12px] cc-muted-link"
        >
          Cancel
        </button>
        <button
          onClick={handlePresetDownload}
          disabled={details.length === 0}
          className="flex items-center gap-1.5 cc-btn-primary hover:bg-brand_navy/85 text-[12px]"
        >
          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          Download CSV
        </button>
      </div>
    </>
  );
};

export default ModalPresetMode;
