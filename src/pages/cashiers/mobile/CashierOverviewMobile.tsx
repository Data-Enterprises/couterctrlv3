import { ArrowLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useCashierCtx } from "..";
import type { CashierCard } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import ExceptionRow from "../stores/ExceptionRow";

interface Props {
  cashier: CashierCard;
  onBack: () => void;
  onOpenSearch: () => void;
}

const riskConfig = {
  Low:         { bg: "#d1fae5", color: "#065f46" },
  Medium:      { bg: "#fef3c7", color: "#92400e" },
  High:        { bg: "#fee2e2", color: "#991b1b" },
  "Very High": { bg: "#fee2e2", color: "#991b1b" },
} as const;

const CashierOverviewMobile = ({ cashier, onBack, onOpenSearch }: Props) => {
  const ctx = useCashierCtx();
  const risk = cashier.risk_tier as keyof typeof riskConfig;
  const rc = riskConfig[risk] ?? riskConfig["High"];

  const exceptions = [
    { type: "Voided",     sales: cashier.voided_sales,     qty: cashier.voided_qty,     count: cashier.voided_count,     rate: cashier.voided_rate },
    { type: "Refunded",   sales: cashier.refunded_sales,   qty: cashier.refunded_qty,   count: cashier.refunded_count,   rate: cashier.refunded_rate },
    { type: "No Sale",    sales: cashier.no_sale_sales,    qty: cashier.no_sale_qty,    count: cashier.no_sale_count,    rate: cashier.no_sale_rate },
    { type: "Hand Key",   sales: cashier.hand_key_sales,   qty: cashier.hand_key_qty,   count: cashier.hand_key_count,   rate: cashier.hand_key_rate },
    { type: "Cancelled",  sales: cashier.cancelled_sales,  qty: cashier.cancelled_qty,  count: cashier.cancelled_count,  rate: cashier.cancelled_rate },
    { type: "Adjustment", sales: cashier.adjustment_sales, qty: cashier.adjustment_qty, count: cashier.adjustment_count, rate: cashier.adjustment_rate },
    { type: "Backup",     sales: cashier.backup_sales,     qty: cashier.backup_qty,     count: cashier.backup_count,     rate: cashier.backup_rate },
    { type: "Modified",   sales: cashier.modified_sales,   qty: cashier.modified_qty,   count: cashier.modified_count,   rate: cashier.modified_rate },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#1e2a4a] px-4 py-2.5 flex-shrink-0">
        <div className="relative flex items-center justify-center mb-2">
          <button
            onClick={onBack}
            className="absolute left-0 w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
            aria-label="Back to cashiers"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
          </button>
          <div className="text-center px-8">
            <div className="text-white font-medium text-[13px]">{cashier.cashier_name}</div>
            <div className="text-white/60 text-[10px] mt-0.5">{cashier.store_name}</div>
          </div>
          <button
            onClick={onOpenSearch}
            aria-label="New search"
            className="absolute right-0 w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[
            { label: "Total", value: formatCurrency2(cashier.total_sales) },
            { label: "Net",   value: formatCurrency2(cashier.net_sales) },
            { label: "Qty",   value: formatBigNumber(cashier.total_qty, 0) },
            { label: "Trans", value: formatBigNumber(cashier.total_transactions, 0) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded px-2 py-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="text-[10px] text-white/50">{label}</div>
              <div className="text-[12px] font-medium text-white mt-0.5 truncate">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Exception table header */}
      <div className="flex-shrink-0 grid px-4 py-2 bg-gray-50 border-b border-gray-100" style={{ gridTemplateColumns: "1.5fr 1fr 0.7fr 0.7fr 0.7fr" }}>
        {["Exception", "Sales", "Qty", "Count", "Rate"].map((h, i) => (
          <div key={h} className="text-[9px] font-semibold uppercase tracking-wide text-content/45" style={{ textAlign: i > 0 ? "right" : "left" }}>{h}</div>
        ))}
      </div>

      {/* Exception rows + grades */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
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
        <div className="flex items-center justify-center gap-2 px-4 py-3">
          <span className="text-[10px] text-content/45 uppercase tracking-wide">Cashier risk</span>
          <span className="text-[9px] font-medium px-2 py-0.5 rounded" style={{ background: rc.bg, color: rc.color }}>{cashier.risk_tier}</span>
          <span className="text-[10px] text-content/45 uppercase tracking-wide ml-2">Exception tier</span>
          <span className="text-[9px] font-medium px-2 py-0.5 rounded" style={{ background: rc.bg, color: rc.color }}>{cashier.exception_tier}</span>
        </div>
      </div>
    </div>
  );
};

export default CashierOverviewMobile;
