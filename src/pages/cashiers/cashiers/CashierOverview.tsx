import type { CashierCard } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import ExceptionRow from "../stores/ExceptionRow";

interface Props {
  cashier: CashierCard;
}

const riskConfig = {
  Low: { bg: "#d1fae5", color: "#065f46" },
  Medium: { bg: "#fef3c7", color: "#92400e" },
  High: { bg: "#fee2e2", color: "#991b1b" },
  "Very High": { bg: "#fee2e2", color: "#991b1b" },
} as const;

const CashierOverview = ({ cashier }: Props) => {
  const risk = cashier.risk_tier as keyof typeof riskConfig;
  const rc = riskConfig[risk] ?? riskConfig["High"];

  const exceptions = [
    {
      type: "Voided",
      sales: cashier.voided_sales,
      qty: cashier.voided_qty,
      count: cashier.voided_count,
      rate: cashier.voided_rate,
    },
    {
      type: "Refunded",
      sales: cashier.refunded_sales,
      qty: cashier.refunded_qty,
      count: cashier.refunded_count,
      rate: cashier.refunded_rate,
    },
    {
      type: "No Sale",
      sales: cashier.no_sale_sales,
      qty: cashier.no_sale_qty,
      count: cashier.no_sale_count,
      rate: cashier.no_sale_rate,
    },
    {
      type: "Hand Key",
      sales: cashier.hand_key_sales,
      qty: cashier.hand_key_qty,
      count: cashier.hand_key_count,
      rate: cashier.hand_key_rate,
    },
    {
      type: "Cancelled",
      sales: cashier.cancelled_sales,
      qty: cashier.cancelled_qty,
      count: cashier.cancelled_count,
      rate: cashier.cancelled_rate,
    },
    {
      type: "Adjustment",
      sales: cashier.adjustment_sales,
      qty: cashier.adjustment_qty,
      count: cashier.adjustment_count,
      rate: cashier.adjustment_rate,
    },
    {
      type: "Backup",
      sales: cashier.backup_sales,
      qty: cashier.backup_qty,
      count: cashier.backup_count,
      rate: cashier.backup_rate,
    },
    {
      type: "Modified",
      sales: cashier.modified_sales,
      qty: cashier.modified_qty,
      count: cashier.modified_count,
      rate: cashier.modified_rate,
    },
  ] as const;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Navy header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-2.5"
        style={{ background: "#1e2a4a" }}
      >
        <div>
          <div className="text-[13px] font-medium text-custom-white">
            {cashier.cashier_name}
          </div>
          <div
            className="text-[10px] mt-0.5"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            #{cashier.cashier_number} · {cashier.store_name}
          </div>
        </div>
        <span
          className="text-[8px] font-medium px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ background: rc.bg, color: rc.color }}
        >
          {cashier.risk_tier} risk
        </span>
      </div>

      {/* KPI strip */}
      <div className="flex-shrink-0 grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        {[
          { label: "Total sales", value: formatCurrency2(cashier.total_sales) },
          { label: "Net sales", value: formatCurrency2(cashier.net_sales) },
          { label: "Qty", value: formatBigNumber(cashier.total_qty, 0) },
          {
            label: "Transactions",
            value: formatBigNumber(cashier.total_transactions, 0),
          },
        ].map(({ label, value }) => (
          <div key={label} className="px-4 py-2.5">
            <div className="text-[9px] uppercase tracking-wide font-medium text-content/50">
              {label}
            </div>
            <div className="text-[16px] font-medium text-content mt-0.5">
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Exception table header */}
      <div
        className="flex-shrink-0 grid px-4 py-2 bg-gray-50 border-b border-gray-100"
        style={{ gridTemplateColumns: "1.5fr 1fr 0.7fr 0.7fr 0.7fr" }}
      >
        {["Exception", "Sales", "Qty", "Count", "Rate"].map((h, i) => (
          <div
            key={h}
            className="text-[9px] font-semibold uppercase tracking-wide text-content/45"
            style={{ textAlign: i > 0 ? "right" : "left" }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Exception rows */}
      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
        {exceptions.map((exc, i) => (
          <ExceptionRow
            key={exc.type}
            type={exc.type as any}
            col2={exc.sales}
            col3={exc.qty}
            col4={exc.count}
            col5={exc.rate}
            storeid={cashier.storeid}
            cashierNumber={cashier.cashier_number}
            striped={i % 2 === 1}
          />
        ))}
      </div>

      {/* Footer tier badge */}
      <div className="flex-shrink-0 flex items-center justify-end gap-3 px-4 py-2.5 border-t border-gray-100">
        <span className="text-[9px] text-content/45 uppercase tracking-wide">
          Exception tier
        </span>
        <span
          className="text-[9px] font-medium px-2 py-0.5 rounded"
          style={{ background: rc.bg, color: rc.color }}
        >
          {cashier.exception_tier}
        </span>
      </div>
    </div>
  );
};

export default CashierOverview;
