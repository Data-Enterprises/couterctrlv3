import { useState } from "react";
import { useAppSelector } from "../../hooks";
import { formatCurrency2, formatBigNumber, formatDate } from "../../utils";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import ReceiversExportModal from "./ReceiversExportModal";

const Chip = ({ label, value }: { label: string; value: string }) => (
  <div
    className="flex items-baseline gap-1 rounded px-1.5 py-0.5"
    style={{ background: "rgba(30,42,74,0.06)", boxShadow: "inset 0 1px 2px rgba(30,42,74,0.08)" }}
  >
    <span className="text-[8.5px] text-content/60 whitespace-nowrap">{label}</span>
    <span className="text-[10px] font-semibold text-content whitespace-nowrap">{value}</span>
  </div>
);

const ReceiverDetailPanel = () => {
  const [exportOpen, setExportOpen] = useState(false);
  const state = useAppSelector((s) => s.receivers);

  const selectedReceiver = state.selectedInvoice
    ? (state.list.find((r) => r.invoiceid.toString() === state.selectedInvoice) ?? null)
    : null;

  const totals = state.totals[0] ?? null;
  const hasDetails = state.details.length > 0 && !state.isFetchingDetails;

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
      {/* Navy header */}
      <div className="flex-shrink-0 px-4 py-[11px] flex items-start justify-between" style={{ background: "#1e2a4a" }}>
        <div>
          {selectedReceiver ? (
            <>
              <div className="text-[13px] font-semibold text-white">
                {selectedReceiver.vendor_name}
                <span className="ml-2 text-[11px] font-normal" style={{ color: "rgba(255,255,255,0.55)" }}>
                  — {selectedReceiver.cashier_name} · {formatDate(selectedReceiver.invoice_date.split("T")[0])}
                </span>
              </div>
            </>
          ) : (
            <div className="text-[13px] font-semibold text-white">Receiver Detail</div>
          )}
        </div>
        {hasDetails && (
          <div className="flex items-center gap-3 mt-0.5">
            <button
              onClick={() => setExportOpen(true)}
              title="Export CSV"
              className="text-white/60 hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/15 flex-shrink-0" />
            <div className="flex items-baseline gap-1 flex-shrink-0">
              <span className="text-[10px] uppercase tracking-wide text-white/45">Invoice</span>
              <span className="text-[13px] font-medium text-white">{selectedReceiver!.invoiceid}</span>
            </div>
            <div className="w-px h-4 bg-white/15 flex-shrink-0" />
            <div className="flex items-baseline gap-1 flex-shrink-0">
              <span className="text-[10px] uppercase tracking-wide text-white/45">Ref #</span>
              <span className="text-[13px] font-medium text-white">{selectedReceiver!.reference_number}</span>
            </div>
            <div className="w-px h-4 bg-white/15 flex-shrink-0" />
            <div className="flex items-baseline gap-1 flex-shrink-0">
              <span className="text-[10px] uppercase tracking-wide text-white/45">Items</span>
              <span className="text-[13px] font-medium text-white">{state.details.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Empty — no receiver selected */}
      {!selectedReceiver && (
        <div className="flex-1 flex flex-col items-center justify-center gap-1">
          <span className="text-[13px] font-medium text-content/60">No receiver selected</span>
          <span className="text-[11px] text-content/40">
            Select a receiver from the list to view its line items
          </span>
        </div>
      )}

      {/* Loading details */}
      {selectedReceiver && state.isFetchingDetails && (
        <div className="flex-1 relative">
          <LoadingIndicator message="Loading details" />
        </div>
      )}

      {/* Line items */}
      {selectedReceiver && !state.isFetchingDetails && (
        <>
          {/* Sub-header */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-gray-100 flex-shrink-0">
            <span className="text-[9px] font-bold uppercase tracking-wide text-content/70">Line items</span>
            <span className="text-[9px] text-content/45">— {selectedReceiver.vendor_name}</span>
            <div className="flex-1" />
            {totals && (
              <>
                <Chip label="Cases" value={String(totals.cases)} />
                <Chip label="Units" value={String(totals.units)} />
                <Chip label="U Cost" value={formatCurrency2(totals.ucost)} />
                <Chip label="Ext Cost" value={formatCurrency2(totals.ext_cost)} />
                <Chip label="Retail" value={formatCurrency2(totals.retail)} />
                <Chip label="Ext Retail" value={formatCurrency2(totals.ext_retail)} />
              </>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto thin-scrollbar">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                  <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70">
                    #
                  </th>
                  <th className="text-left px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70">
                    UPC
                  </th>
                  <th
                    className="text-left px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70"
                    style={{ width: "22%" }}
                  >
                    Description
                  </th>
                  <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70">
                    Cases
                  </th>
                  <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70">
                    Units
                  </th>
                  <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 whitespace-nowrap">
                    U Cost
                  </th>
                  <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 whitespace-nowrap">
                    Ext Cost
                  </th>
                  <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70">
                    Retail
                  </th>
                  <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 whitespace-nowrap">
                    Ext Retail
                  </th>
                  <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70">
                    GM
                  </th>
                  <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70">
                    Free
                  </th>
                  <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70">
                    Return
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {state.details.map((item) => (
                  <tr key={item.line_number} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-1.5 text-right tabular-nums text-content/70">
                      {item.line_number}
                    </td>
                    <td className="px-3 py-1.5 tabular-nums text-content/70 whitespace-nowrap">
                      {item.product_code}
                    </td>
                    <td className="px-3 py-1.5 font-medium text-content truncate max-w-0">
                      {item.product_description}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-content/70">
                      {item.cases}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-content/70">
                      {item.units}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-content/70">
                      {formatCurrency2(item.ucost)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-content">
                      {formatCurrency2(item.ext_cost)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-content/70">
                      {formatCurrency2(item.retail)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-content">
                      {formatCurrency2(item.ext_retail)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-content/70">
                      {formatBigNumber(item.gm, 2)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-content/70">
                      {item.free}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-content/70">
                      {item.return}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ReceiverDetailPanel;
