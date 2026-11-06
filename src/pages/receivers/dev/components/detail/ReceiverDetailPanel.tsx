// Hooks
import { useState } from "react";
import { useAppSelector } from "../../../../../hooks";

// Components
import LoadingIndicator from "../../../../../components-dev/loading/LoadingIndicator";
import ReceiversExportModal from "../modal/ReceiversExportModal";
import DetailNavyHeader from "./components/DetailNavHeader";
import DetailTable from "./components/detailTable/DetailTable";
import NoReceiver from "./components/NoReceiver";
import DetailKpiStrip from "./components/DetailKpiStrip";

const ReceiverDetailPanel = () => {
  const [exportOpen, setExportOpen] = useState(false);
  const state = useAppSelector((s) => s.dev.receivers);

  const selectedReceiver = state.selectedInvoice
    ? (state.list.find(
        (r) => r.invoiceid.toString() === state.selectedInvoice,
      ) ?? null)
    : null;

  const totals = state.totals[0] ?? null;

  return (
    <div
      className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white"
      style={{ flex: 1, minWidth: 0 }}
    >
      {exportOpen && selectedReceiver && (
        <ReceiversExportModal
          onClose={() => setExportOpen(false)}
          vendorName={selectedReceiver.vendor_name}
          invoiceId={selectedReceiver.invoiceid}
          referenceNumber={selectedReceiver.reference_number}
          details={state.details}
          totals={totals}
        />
      )}
      <DetailNavyHeader setExportOpen={() => setExportOpen(true)} />

      {/* Empty — no receiver selected */}
      {!selectedReceiver ? <NoReceiver /> : null}

      {/* Loading details */}
      {selectedReceiver && state.isFetchingDetails && (
        <div className="flex-1 relative">
          <LoadingIndicator message="Loading details" />
        </div>
      )}

      {/* Line items */}
      {selectedReceiver && !state.isFetchingDetails && (
        <>
          <DetailKpiStrip />
          <DetailTable />
        </>
      )}
    </div>
  );
};

export default ReceiverDetailPanel;
