import { useCashierCtx } from "..";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getCashierCards } from "../../../api/cashiers";
import { useCashiersActions } from "../hooks/useCashiersActions";
import type { CashierCardResp, JsonError } from "../../../interfaces";
import {
  formatBigNumber,
  formatCurrency2,
  formatGoliathDate,
} from "../../../utils";
import ExceptionRow from "./ExceptionRow";

const riskConfig = {
  Low: { bg: "#d1fae5", color: "#065f46" },
  Medium: { bg: "#fef3c7", color: "#92400e" },
  High: { bg: "#fee2e2", color: "#991b1b" },
  "Very High": { bg: "#fee2e2", color: "#991b1b" },
} as const;

const StoreOverview = () => {
  const ctx = useCashierCtx();
  const toast = useToast();
  const actions = useCashiersActions();

  const store =
    ctx.filteredStoreCards.find((s) => s.storeid === ctx.selectedStoreCard) ??
    ctx.storeCards.find((s) => s.storeid === ctx.selectedStoreCard);

  if (!store) return null;

  const risk = store.risk_tier as keyof typeof riskConfig;
  const rc = riskConfig[risk] ?? riskConfig["High"];

  const getCCards = () => {
    ctx.dispatch(actions.setCashierFilterType(""));
    ctx.dispatch(actions.setSelectedStoreCard(store.storeid));
    ctx.dispatch(actions.reQueryStepTwo());
    ctx.dispatch(actions.setLoadingCashiers(true));
    ctx.dispatch(actions.setDataView("cashiers"));

    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);
    getCashierCards(
      ctx.miktoUrl,
      ctx.userid,
      start,
      end,
      0,
      store.storeid,
      1,
      ctx.apiKey,
    )
      .then((resp) => {
        const j: CashierCardResp = resp.data;
        if (j.error === 0) ctx.dispatch(actions.setCashierCards(j.stores));
      })
      .catch((err: JsonError) => {
        ctx.dispatch(actions.setSelectedStoreCard(0));
        ctx.dispatch(actions.setDataView("stores"));
        toast.error("Error fetching cashiers: " + err.message);
      })
      .finally(() => ctx.dispatch(actions.setLoadingCashiers(false)));
  };

  const exceptions = [
    {
      type: "Voided",
      sales: store.voided_sales,
      qty: store.voided_qty,
      count: store.voided_count,
      rate: store.voided_rate,
    },
    {
      type: "Refunded",
      sales: store.refunded_sales,
      qty: store.refunded_qty,
      count: store.refunded_count,
      rate: store.refunded_rate,
    },
    {
      type: "No Sale",
      sales: store.no_sale_sales,
      qty: store.no_sale_qty,
      count: store.no_sale_count,
      rate: store.no_sale_rate,
    },
    {
      type: "Hand Key",
      sales: store.hand_key_sales,
      qty: store.hand_key_qty,
      count: store.hand_key_count,
      rate: store.hand_key_rate,
    },
    {
      type: "Cancelled",
      sales: store.cancelled_sales,
      qty: store.cancelled_qty,
      count: store.cancelled_count,
      rate: store.cancelled_rate,
    },
    {
      type: "Adjustment",
      sales: store.adjustment_sales,
      qty: store.adjustment_qty,
      count: store.adjustment_count,
      rate: store.adjustment_rate,
    },
    {
      type: "Backup",
      sales: store.backup_sales,
      qty: store.backup_qty,
      count: store.backup_count,
      rate: store.backup_rate,
    },
    {
      type: "Modified",
      sales: store.modified_sales,
      qty: store.modified_qty,
      count: store.modified_count,
      rate: store.modified_rate,
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
            {store.store_name}
          </div>
          <div
            className="text-[10px] mt-0.5"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {ctx.startDate} – {ctx.endDate}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={getCCards}
            className="text-[10px] px-2.5 py-1 rounded text-custom-white transition-colors"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "0.5px solid rgba(255,255,255,0.25)",
            }}
          >
            View cashiers →
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="flex-shrink-0 grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        {[
          { label: "Total sales", value: formatCurrency2(store.total_sales) },
          { label: "Net sales", value: formatCurrency2(store.net_sales) },
          { label: "Qty", value: formatBigNumber(store.total_qty, 0) },
          {
            label: "Transactions",
            value: formatBigNumber(store.total_transactions, 0),
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
            storeid={store.storeid}
            striped={i % 2 === 1}
          />
        ))}
      </div>

      {/* Footer tier badges */}
      <div className="flex-shrink-0 flex items-center justify-end gap-3 px-4 py-2.5 border-t border-gray-100">
        <span className="text-[9px] text-content/45 uppercase tracking-wide">
          Risk
        </span>
        <span
          className="text-[9px] font-medium px-2 py-0.5 rounded"
          style={{ background: rc.bg, color: rc.color }}
        >
          {store.risk_tier}
        </span>
        <span className="text-[9px] text-content/45 uppercase tracking-wide">
          Exception tier
        </span>
        <span
          className="text-[9px] font-medium px-2 py-0.5 rounded"
          style={{ background: rc.bg, color: rc.color }}
        >
          {store.exception_tier}
        </span>
      </div>
    </div>
  );
};

export default StoreOverview;
