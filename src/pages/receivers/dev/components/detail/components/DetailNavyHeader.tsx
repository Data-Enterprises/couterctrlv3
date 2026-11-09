// Hooks
import { useAppSelector } from "../../../../../../hooks";

// Utils
import { formatDate } from "../../../../../../utils";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface DetailNavyHeaderProps {
  setExportOpen: () => void;
}

/** The navy header of the receiver detail: vendor, cashier and date of the selected receiver.
 *  Once its line items load it adds the export button and the invoice, reference and item counts. */
const DetailNavyHeader = ({ setExportOpen }: DetailNavyHeaderProps) => {
  const state = useAppSelector((s) => s.dev.receivers);
  const selectedReceiver = state.selectedInvoice
    ? (state.list.find(
        (r) => r.invoiceid.toString() === state.selectedInvoice,
      ) ?? null)
    : null;
  const hasDetails = state.details.length > 0 && !state.isFetchingDetails;
  return (
    <div
      className="flex-shrink-0 px-4 py-[11px] flex items-start justify-between"
      style={{ background: "rgb(var(--color-brand-navy))" }}
    >
      <div>
        {selectedReceiver ? (
          <>
            <div className="text-[13px] font-semibold text-custom-white">
              {selectedReceiver.vendor_name}
              <span className="ml-2 text-[11px] font-normal text-custom-white">
                — {selectedReceiver.cashier_name} ·{" "}
                {formatDate(selectedReceiver.invoice_date.split("T")[0])}
              </span>
            </div>
          </>
        ) : (
          <div className="text-[13px] font-semibold text-custom-white">
            Receiver Detail
          </div>
        )}
      </div>
      {hasDetails && (
        <div className="flex items-center gap-3 mt-0.5">
          <button
            data-help="export"
            onClick={setExportOpen}
            title="Export CSV"
            className="text-custom-white/60 hover:text-custom-white transition-colors flex-shrink-0"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />
          <div className="flex items-baseline gap-1 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-wide text-custom-white">
              Invoice
            </span>
            <span className="text-[13px] font-medium text-custom-white">
              {selectedReceiver!.invoiceid}
            </span>
          </div>
          <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />
          <div className="flex items-baseline gap-1 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-wide text-custom-white">
              Ref #
            </span>
            <span className="text-[13px] font-medium text-custom-white">
              {selectedReceiver!.reference_number}
            </span>
          </div>
          <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />
          <div className="flex items-baseline gap-1 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-wide text-custom-white">
              Items
            </span>
            <span className="text-[13px] font-medium text-custom-white">
              {state.details.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailNavyHeader;
