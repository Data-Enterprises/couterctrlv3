// Utils
import { formatCurrency2 } from "../../../../../../utils";
import { couponValueOf } from "../../../../../../utils/couponValue";

// Interfaces
import type { TransactionListItem } from "../../../../../../interfaces";

interface TxLinesTableProps {
  txLines: TransactionListItem[];
}

/** Every line of the transaction, coupons tinted. */
const TxLinesTable = ({ txLines }: TxLinesTableProps) => (
    <div className="flex-1 overflow-auto thin-scrollbar">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
            <th className="px-2 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/95 text-right w-7">
              #
            </th>
            <th className="px-2 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/95 text-left">
              Description
            </th>
            <th className="px-2 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/95 text-right">
              Qty
            </th>
            <th className="px-2 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/95 text-right">
              Total
            </th>
            <th className="px-2 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/95 text-center w-14">
              Type
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand_navy/15">
          {txLines.map((item, i: number) => {
            const isCpn = item.is_coupon === 1;
            const isTender = item.sale_type === "Tender";
            return (
              <tr
                key={i}
                style={
                  isCpn
                    ? { background: "rgba(234,179,8,0.07)" }
                    : undefined
                }
              >
                <td className="px-2 py-2 text-right tabular-nums text-content/95">
                  {item.line_number}
                </td>
                <td
                  className="px-2 py-2 text-content truncate max-w-0"
                  style={{ maxWidth: 200 }}
                >
                  {item.product_description}
                </td>
                <td className="px-2 py-2 text-right tabular-nums text-content/95">
                  {(item.qty ?? 0) > 0 ? item.qty : "—"}
                </td>
                <td
                  className={`px-2 py-2 text-right tabular-nums font-semibold ${isCpn ? "text-severity_watch_text" : "text-content"}`}
                >
                  {formatCurrency2(
                    isCpn
                      ? couponValueOf(item)
                      : item.total_sales,
                  )}
                </td>
                <td className="px-2 py-2 text-center">
                  {isCpn ? (
                    <span
                      className="text-[11px] font-semibold rounded px-1.5 py-0.5"
                      style={{
                        background: "rgb(var(--color-severity-watch-bg))",
                        color: "rgb(var(--color-severity-watch-text))",
                      }}
                    >
                      Cpn
                    </span>
                  ) : isTender ? (
                    <span
                      className="text-[11px] font-semibold rounded px-1.5 py-0.5"
                      style={{
                        background: "rgb(var(--color-filter-active))",
                        color: "rgb(var(--color-brand-navy-hover))",
                      }}
                    >
                      Tender
                    </span>
                  ) : (
                    <span
                      className="text-[11px] font-semibold rounded px-1.5 py-0.5"
                      style={{
                        background: "rgb(var(--color-severity-healthy-bg))",
                        color: "rgb(var(--color-severity-healthy-text))",
                      }}
                    >
                      Sale
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
);

export default TxLinesTable;
