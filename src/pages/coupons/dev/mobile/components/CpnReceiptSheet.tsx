// Utils
import { formatCurrency2, formatDate } from "../../../../../utils";
import { couponValueOf } from "../../../../../utils/couponValue";

// Interfaces
import type { TransactionListItem } from "../../../../../interfaces";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import BottomSheet from "../../../../../components-dev/BottomSheet";

interface CpnReceiptSheetProps {
  /** The receipt's lines; empty while it loads. */
  txLines: TransactionListItem[];
  totals: { txCoupons: number; txTax: number; txNet: number; txTotal: number };
  onExport: () => void;
  onClose: () => void;
}

/** The phone receipt sheet: the cashier, terminal and time, every line with
 *  its type, and the coupons, tax, net and total. */
const CpnReceiptSheet = ({
  txLines,
  totals,
  onExport,
  onClose,
}: CpnReceiptSheetProps) => {
  const txMeta = txLines[0] ?? null;
  const { txCoupons, txTax, txNet, txTotal } = totals;

  return (
    <BottomSheet onClose={onClose}>
      <div className="px-4 pb-3 border-b border-line_hair flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-bold text-content">
            {txMeta?.cashier_name ?? "Loading…"}
            {txMeta?.terminal && (
              <span className="ml-2 text-[10px] font-normal text-content/95">
                Terminal {txMeta.terminal}
              </span>
            )}
          </div>
          <div className="text-[10px] text-content/95 mt-0.5">
            {txMeta?.sale_date
              ? formatDate(txMeta.sale_date.split("T")[0])
              : ""}
            {txMeta?.sale_start_time
              ? ` · ${String(txMeta.sale_start_time).replace(/(\d{2})(\d{2})/, "$1:$2")}`
              : ""}
          </div>
        </div>
        {txLines.length > 0 && (
          <button
            onClick={onExport}
            className="flex items-center gap-1 px-2 py-1 rounded border border-line_field cc-muted-link hover:border-line_strong flex-shrink-0"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {txLines.length === 0 ? (
        <div className="py-8 text-center text-[11px] text-content/95">
          Loading transaction…
        </div>
      ) : (
        <>
          <div className="overflow-y-auto max-h-[420px]">
            <div
              className="grid px-4 py-1.5 bg-fill_soft border-b border-line_hair"
              style={{ gridTemplateColumns: "18px 1fr 20px 56px 40px" }}
            >
              {["#", "Description", "Qty", "Total", "Type"].map((h, i) => (
                <div
                  key={h}
                  className={`text-[10px] cc-caps ${
                    i >= 2 && i <= 3
                      ? "text-right"
                      : i === 4
                        ? "text-right"
                        : ""
                  }`}
                >
                  {h}
                </div>
              ))}
            </div>
            {txLines.map((item, i) => {
              const isCpn = item.is_coupon === 1;
              const isTender = item.sale_type === "Tender";
              return (
                <div
                  key={i}
                  className={`grid px-4 py-1.5 border-b border-line_faint items-center ${
                    isCpn ? "bg-severity_watch_bg/40" : ""
                  }`}
                  style={{ gridTemplateColumns: "18px 1fr 20px 56px 40px" }}
                >
                  <span className="text-[10px] text-content/95 tabular-nums">
                    {item.line_number}
                  </span>
                  <span
                    className={`text-[10px] truncate ${isCpn ? "text-severity_watch_text" : "text-content"}`}
                  >
                    {item.product_description}
                  </span>
                  <span className="text-[10px] text-content/95 text-right">
                    {(item.qty ?? 0) > 0 ? item.qty : "—"}
                  </span>
                  <span
                    className={`text-[10px] font-semibold text-right tabular-nums ${
                      isCpn ? "text-severity_watch_text" : "text-content"
                    }`}
                  >
                    {formatCurrency2(
                      isCpn ? couponValueOf(item) : item.total_sales,
                    )}
                  </span>
                  <div className="flex justify-end">
                    <span
                      className={`text-[10px] font-bold rounded px-1 py-0.5 ${
                        isCpn
                          ? "bg-severity_watch_bg text-severity_watch_text"
                          : isTender
                            ? "bg-filter_active text-brand_navy_hover"
                            : "bg-severity_healthy_bg text-severity_healthy_text"
                      }`}
                    >
                      {isCpn ? "Cpn" : isTender ? "Tndr" : "Sale"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-3 px-4 py-2 border-t border-line_hair bg-fill_soft">
            {txCoupons > 0 && (
              <span className="text-[10px] text-severity_watch_text">
                Cpns{" "}
                <span className="font-semibold">
                  -{formatCurrency2(txCoupons)}
                </span>
              </span>
            )}
            <span className="text-[10px] text-content/95">
              Tax{" "}
              <span className="text-content font-semibold">
                {formatCurrency2(txTax)}
              </span>
            </span>
            <span className="text-[10px] text-content/95">
              Net{" "}
              <span className="text-content font-semibold">
                {formatCurrency2(txNet)}
              </span>
            </span>
            <span className="text-[10.5px] font-bold text-content">
              Total {formatCurrency2(txTotal)}
            </span>
          </div>
        </>
      )}
      <div className="h-4 flex-shrink-0" />
    </BottomSheet>
  );
};

export default CpnReceiptSheet;
