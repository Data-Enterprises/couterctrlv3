// Hooks
import { useCouponSalesCtx } from "../../hooks";

// Utils
import { formatCurrency2, formatDate } from "../../../../../utils";
import { couponValueOf } from "../../utils";
import { fmtTime, receiptTotals } from "../utils";

// Components
import { ArrowDownTrayIcon, ArrowLeftIcon } from "@heroicons/react/16/solid";
import LoadingIndicator from "../../../../../components-dev/loading/LoadingIndicator";

interface ReceiptPaneProps {
  onBack: () => void;
  onExport: () => void;
}

/** The whole receipt for one transaction: who and when, every line, and the
 *  totals. The coupons payload alone only has the coupon lines. */
const ReceiptPane = ({ onBack, onExport }: ReceiptPaneProps) => {
  const { receiptLines: txLines } = useCouponSalesCtx();
  const txMeta = txLines[0] ?? null;
  const { txCoupons, txTax, txNet, txTotal } = receiptTotals(txLines);
  return (
    <>
    {/* Receipt — same layout as dev Coupons: back bar with cashier
        and terminal, every line of the sale, then the totals. */}
    <div className="flex-shrink-0 px-3 py-2 flex items-center justify-between border-b border-gray-100 bg-custom-white">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-content hover:underline transition-colors text-[11px]"
        >
          <ArrowLeftIcon className="w-3 h-3" />
          Back
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <div>
          <div className="text-[12px] font-semibold text-content">
            {txMeta?.cashier_name}
            <span className="ml-2 text-[10px] font-normal text-content">
              — Terminal {txMeta?.terminal}
            </span>
          </div>
          <div className="text-[10px] text-content">
            {fmtTime(txMeta?.sale_start_time)} – {fmtTime(txMeta?.sale_end_time)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {txLines.length > 0 && (
          <button
            onClick={onExport}
            title="Export transaction CSV"
            className="text-content hover:opacity-70 transition-opacity"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="w-px h-5 bg-gray-200" />
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-wide text-content">
            Trans
          </div>
          <div className="text-[12px] font-medium text-content">
            {txMeta?.transaction_id ?? txMeta?.sale_id?.split("-")[1]}
          </div>
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-wide text-content">
            Items
          </div>
          <div className="text-[12px] font-medium text-content">
            {txLines.length}
          </div>
        </div>
      </div>
    </div>

    {/* Store / address / date strip, same as dev Coupons */}
    <div className="flex-shrink-0 px-3 py-1.5 flex items-center gap-3 border-b border-gray-100 bg-gray-50">
      <span className="text-[11px] font-semibold text-content">
        {txMeta?.store_name}
      </span>
      <span className="text-[10px] text-content">
        {txMeta?.store_address}, {txMeta?.store_city}{" "}
        {txMeta?.store_state}
      </span>
      <div className="flex-1" />
      <span className="text-[10px] font-medium text-content">
        {txMeta?.sale_date ? formatDate(txMeta.sale_date.split("T")[0]) : ""}
      </span>
    </div>

    {txLines.length === 0 ? (
      <div className="flex-1 relative min-h-0">
        <LoadingIndicator message="Loading transaction..." />
      </div>
    ) : (
      <>
        <div className="flex-1 overflow-auto thin-scrollbar">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                {(
                  [
                    ["#", "text-right w-7"],
                    ["Description", "text-left"],
                    ["Qty", "text-right"],
                    ["Total", "text-right"],
                    ["Type", "text-center w-14"],
                  ] as const
                ).map(([label, align]) => (
                  <th
                    key={label}
                    className={`px-2 py-2 text-[9px] font-semibold uppercase tracking-wide text-content ${align}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand_navy/15">
              {txLines.map((item, i) => {
                const isCpn = item.is_coupon === 1;
                const isTender = item.sale_type === "Tender";
                return (
                  <tr
                    key={i}
                    style={isCpn ? { background: "rgba(234,179,8,0.07)" } : undefined}
                  >
                    <td className="px-2 py-2 text-right tabular-nums text-content">
                      {item.line_number}
                    </td>
                    <td className="px-2 py-2 text-content truncate max-w-0" style={{ maxWidth: 200 }}>
                      {item.product_description}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-content">
                      {(item.qty ?? 0) > 0 ? item.qty : "—"}
                    </td>
                    <td className={`px-2 py-2 text-right tabular-nums font-semibold ${isCpn ? "text-amber-700" : "text-content"}`}>
                      {formatCurrency2(isCpn ? couponValueOf(item) : item.total_sales)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span
                        className="text-[11px] font-semibold rounded px-1.5 py-0.5"
                        style={
                          isCpn
                            ? { background: "rgba(234,179,8,0.15)", color: "#92600a" }
                            : isTender
                              ? { background: "rgba(37,99,235,0.1)", color: "#1d4ed8" }
                              : { background: "rgba(22,163,74,0.1)", color: "#15803d" }
                        }
                      >
                        {isCpn ? "Cpn" : isTender ? "Tender" : "Sale"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex-shrink-0 flex items-center justify-end gap-4 px-3 py-2 border-t border-gray-100 bg-gray-50">
          {txCoupons > 0 && (
            <div className="text-[11px] text-amber-700">
              Coupons
              <span className="font-medium ml-1">-{formatCurrency2(txCoupons)}</span>
            </div>
          )}
          <div className="text-[11px] text-content">
            Tax<span className="font-medium ml-1">{formatCurrency2(txTax)}</span>
          </div>
          <div className="text-[11px] text-content">
            Net<span className="font-medium ml-1">{formatCurrency2(txNet)}</span>
          </div>
          <div className="text-[11px] text-content font-medium">
            Total<span className="ml-1">{formatCurrency2(txTotal)}</span>
          </div>
        </div>
      </>
    )}
    </>
  );
};

export default ReceiptPane;
