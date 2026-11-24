// Utils
import { formatCurrency2 } from "../../../../utils";

// Interfaces
import type { ExplorerTotals } from "../interfaces";

interface ExplorerKpiStripProps {
  totals: ExplorerTotals;
}

/** The six figures over the explorer: exception lines, transactions, amount,
 *  stores, cashiers and items. */
const ExplorerKpiStrip = ({ totals }: ExplorerKpiStripProps) => (
  <div
    data-help="kpis"
    className="grid grid-cols-6 border-b border-line_hair flex-shrink-0"
  >
    {[
      { label: "Exception lines", value: totals.exceptions.toLocaleString() },
      { label: "Transactions", value: totals.transactions.toLocaleString() },
      { label: "Amount", value: formatCurrency2(totals.amount) },
      { label: "Stores", value: totals.stores.toLocaleString() },
      { label: "Cashiers", value: totals.cashiers.toLocaleString() },
      { label: "Items", value: totals.items.toLocaleString() },
    ].map((kpi) => (
      <div
        key={kpi.label}
        className="px-3 py-2 border-r border-line_hair last:border-r-0"
      >
        <div className="text-[11px] text-content/95">{kpi.label}</div>
        <div className="text-[16px] font-medium text-content">{kpi.value}</div>
      </div>
    ))}
  </div>
);

export default ExplorerKpiStrip;
