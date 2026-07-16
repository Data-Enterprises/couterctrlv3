import { ArrowLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import type { StoreCard } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import ExceptionRow from "../stores/ExceptionRow";
import { useCashierCtx } from "..";

interface Props {
  store: StoreCard;
  onBack: () => void;
  onViewCashiers: () => void;
  onOpenSearch: () => void;
}

const riskConfig = {
  Low:         { bg: "#d1fae5", color: "#065f46" },
  Medium:      { bg: "#fef3c7", color: "#92400e" },
  High:        { bg: "#fee2e2", color: "#991b1b" },
  "Very High": { bg: "#fee2e2", color: "#991b1b" },
} as const;

const StoreOverviewMobile = ({ store, onBack, onViewCashiers, onOpenSearch }: Props) => {
  const ctx = useCashierCtx();
  const risk = store.risk_tier as keyof typeof riskConfig;
  const rc = riskConfig[risk] ?? riskConfig["High"];

  const exceptions = [
    { type: "Voided",     sales: store.voided_sales,     qty: store.voided_qty,     count: store.voided_count,     rate: store.voided_rate },
    { type: "Refunded",   sales: store.refunded_sales,   qty: store.refunded_qty,   count: store.refunded_count,   rate: store.refunded_rate },
    { type: "No Sale",    sales: store.no_sale_sales,    qty: store.no_sale_qty,    count: store.no_sale_count,    rate: store.no_sale_rate },
    { type: "Hand Key",   sales: store.hand_key_sales,   qty: store.hand_key_qty,   count: store.hand_key_count,   rate: store.hand_key_rate },
    { type: "Cancelled",  sales: store.cancelled_sales,  qty: store.cancelled_qty,  count: store.cancelled_count,  rate: store.cancelled_rate },
    { type: "Adjustment", sales: store.adjustment_sales, qty: store.adjustment_qty, count: store.adjustment_count, rate: store.adjustment_rate },
    { type: "Backup",     sales: store.backup_sales,     qty: store.backup_qty,     count: store.backup_count,     rate: store.backup_rate },
    { type: "Modified",   sales: store.modified_sales,   qty: store.modified_qty,   count: store.modified_count,   rate: store.modified_rate },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#1e2a4a] px-4 py-2.5 flex-shrink-0">
        <div className="relative flex items-center justify-center mb-2">
          <button
            onClick={onBack}
            className="absolute left-0 w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-custom-white/85 hover:text-custom-white hover:border-white/40 transition-colors"
            aria-label="Back to stores"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
          </button>
          <div className="text-center px-8">
            <div className="text-custom-white font-medium text-[13px]">{store.store_name}</div>
            <div className="text-custom-white/85 text-[10px] mt-0.5">{ctx.startDate} – {ctx.endDate}</div>
          </div>
          <button
            onClick={onOpenSearch}
            aria-label="New search"
            className="absolute right-0 w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-custom-white/85 hover:text-custom-white hover:border-white/40 transition-colors"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[
            { label: "Total", value: formatCurrency2(store.total_sales) },
            { label: "Net",   value: formatCurrency2(store.net_sales) },
            { label: "Qty",   value: formatBigNumber(store.total_qty, 0) },
            { label: "Trans", value: formatBigNumber(store.total_transactions, 0) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded px-2 py-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="text-[10px] text-custom-white/85">{label}</div>
              <div className="text-[12px] font-medium text-custom-white mt-0.5 truncate">{value}</div>
            </div>
          ))}
        </div>
        <button
          onClick={onViewCashiers}
          className="w-full mt-2 py-1.5 rounded text-[10px] font-medium transition-colors"
          style={{ background: "rgba(255,255,255,0.1)", border: "0.5px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)" }}
        >
          View cashiers →
        </button>
      </div>

      {/* Exception table header */}
      <div className="flex-shrink-0 grid px-4 py-2 bg-gray-50 border-b border-gray-100" style={{ gridTemplateColumns: "1.5fr 1fr 0.7fr 0.7fr 0.7fr" }}>
        {["Exception", "Sales", "Qty", "Count", "Rate"].map((h, i) => (
          <div key={h} className="text-[9px] font-semibold uppercase tracking-wide text-content/85" style={{ textAlign: i > 0 ? "right" : "left" }}>{h}</div>
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
            storeid={store.storeid}
            striped={i % 2 === 1}
          />
        ))}
        <div className="flex items-center justify-center gap-2 px-4 py-3">
          <span className="text-[10px] text-content/85 uppercase tracking-wide">Store risk</span>
          <span className="text-[9px] font-medium px-2 py-0.5 rounded" style={{ background: rc.bg, color: rc.color }}>{store.risk_tier}</span>
          <span className="text-[10px] text-content/85 uppercase tracking-wide ml-2">Exception tier</span>
          <span className="text-[9px] font-medium px-2 py-0.5 rounded" style={{ background: rc.bg, color: rc.color }}>{store.exception_tier}</span>
        </div>
      </div>
    </div>
  );
};

export default StoreOverviewMobile;
