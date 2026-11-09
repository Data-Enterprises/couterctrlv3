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
        <p className="text-[11px] text-content/50 uppercase tracking-wide font-medium">
          Select data to include
        </p>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked
            readOnly
            className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0"
          />
          <div>
            <p className="text-[13px] font-medium text-content group-hover:text-brand_navy transition-colors">
              Line Items
            </p>
            <p className="text-[11px] text-content/50 mt-0.5">
              {details.length} line items for {vendorName} — Invoice {invoiceId}
              {totals && ` · Cases ${totals.cases} · Units ${totals.units}`}
            </p>
          </div>
        </label>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
        <button
          onClick={onClose}
          className="text-[12px] text-content/50 hover:text-content transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handlePresetDownload}
          disabled={details.length === 0}
          className="flex items-center gap-1.5 bg-brand_navy hover:bg-brand_navy/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
        >
          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          Download CSV
        </button>
      </div>
    </>
  );
};

export default ModalPresetMode;
