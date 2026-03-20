import { useCashierCtx } from "..";
import {
  setDataView,
  setCashierFilterModalOpen,
  type CashierFilterType,
  setCashierFilterType,
  resetCashierFilters,
} from "../../../features/cashiersSlice";

const CardFilters = () => {
  const ctx = useCashierCtx();

  const showViewToggle =
    ctx.storeCards.length > 0 && ctx.cashierCards.length > 0;

  const handleToggleView = () => {
    ctx.dispatch(
      setDataView(ctx.dataView === "stores" ? "cashiers" : "stores"),
    );
  };

  const handleOpenFilterModal = (type: CashierFilterType) => {
    ctx.dispatch(setCashierFilterType(type));
    ctx.dispatch(setCashierFilterModalOpen(true));
  };

  const handleFilterTextDisplay = (type: CashierFilterType) => {
    // This will determin what is displayed in the button text based on if that filter is set or not
    if (type === "cashier_name") {
      return ctx.cashierNameFilter.length
        ? `Cashier: ${ctx.cashierNameFilter}`
        : "Cashier Name";
    }
    if (type === "store_name") {
      return ctx.storeNameFilter.length
        ? `${ctx.storeNameFilter}`
        : "Store Name";
    }
    if (type === "total_sales") {
      return ctx.totalSalesFilter.operator !== "" && ctx.totalSalesFilter.value > 0
        ? `Sales ${ctx.totalSalesFilter.operator} ${ctx.totalSalesFilter.value}`
        : "Total Sales";
    }
    if (type === "total_qty") {
      return ctx.totalQtyFilter.operator !== "" && ctx.totalQtyFilter.value > 0
        ? `Qty ${ctx.totalQtyFilter.operator} ${ctx.totalQtyFilter.value}`
        : "Total Qty";
    }
    if (type === "total_transactions") {
      return ctx.totalTransactionsFilter.operator !== "" && ctx.totalTransactionsFilter.value > 0
        ? `Transactions ${ctx.totalTransactionsFilter.operator} ${ctx.totalTransactionsFilter.value}`
        : "Total Transactions";
    }
    if (type === "risk_level") {
      return ctx.riskLevelFilter.length
        ? `Risk: ${ctx.riskLevelFilter}`
        : "Risk Level";
    }
    if (type === "exception_tier") {
      return ctx.exceptionTierFilter.length
        ? `Tier: ${ctx.exceptionTierFilter}`
        : "Exception Tier";
    }
    return "Refresh";
  };

  const activeFilterStyle = (type: CashierFilterType) => {
    if (type === "cashier_name" && ctx.cashierNameFilter.length) {
      return "bg-orange-500 text-white font-medium";
    } else if (type === "store_name" && ctx.storeNameFilter.length) {
      return "bg-orange-500 text-white font-medium";
    } else if (
      type === "total_sales" &&
      ctx.totalSalesFilter.operator !== "" &&
      ctx.totalSalesFilter.value > 0
    ) {
      return "bg-orange-500 text-white font-medium";
    } else if (
      type === "total_qty" &&
      ctx.totalQtyFilter.operator !== "" &&
      ctx.totalQtyFilter.value > 0
    ) {
      return "bg-orange-500 text-white font-medium";
    } else if (
      type === "total_transactions" &&
      ctx.totalTransactionsFilter.operator !== "" &&
      ctx.totalTransactionsFilter.value > 0
    ) {
      return "bg-orange-500 text-white font-medium";
    } else if (type === "risk_level" && ctx.riskLevelFilter.length) {
      return "bg-orange-500 text-white font-medium";
    } else if (type === "exception_tier" && ctx.exceptionTierFilter.length) {
      return "bg-orange-500 text-white font-medium";
    } else {
      return "";
    }
  };

  return (
    <div className="relative bg-custom-white p-2 rounded-lg shadow-lg flex flex-col gap-2">
      {showViewToggle && (
        <button
          onClick={handleToggleView}
          className="py-2 shadow-md rounded-lg hover:bg-orange-200 hover:text-content transition-all duration-200"
        >
          View {ctx.dataView === "stores" ? "Cashiers" : "Stores"}
        </button>
      )}
      <button
        onClick={() =>
          handleOpenFilterModal(
            ctx.dataView === "stores" ? "store_name" : "cashier_name",
          )
        }
        className={`py-2 shadow-md rounded-lg hover:bg-orange-200 hover:text-content transition-all duration-200 ${activeFilterStyle(
          ctx.dataView === "stores" ? "store_name" : "cashier_name",
        )}`}
      >
        {handleFilterTextDisplay(
          ctx.dataView === "stores" ? "store_name" : "cashier_name",
        )}
      </button>
      <button
        onClick={() => handleOpenFilterModal("total_sales")}
        className={`py-2 shadow-md rounded-lg hover:bg-orange-200 hover:text-content transition-all duration-200 ${activeFilterStyle("total_sales")}`}
      >
        {handleFilterTextDisplay("total_sales")}
      </button>
      <button
        onClick={() => handleOpenFilterModal("total_qty")}
        className={`py-2 shadow-md rounded-lg hover:bg-orange-200 hover:text-content transition-all duration-200 ${activeFilterStyle("total_qty")}`}
      >
        {handleFilterTextDisplay("total_qty")}
      </button>
      <button
        onClick={() => handleOpenFilterModal("total_transactions")}
        className={`py-2 shadow-md rounded-lg hover:bg-orange-200 hover:text-content transition-all duration-200 ${activeFilterStyle("total_transactions")}`}
      >
        {handleFilterTextDisplay("total_transactions")}
      </button>
      <button
        onClick={() => handleOpenFilterModal("risk_level")}
        className={`py-2 shadow-md rounded-lg hover:bg-orange-200 hover:text-content transition-all duration-200 ${activeFilterStyle("risk_level")}`}
      >
        {handleFilterTextDisplay("risk_level")}
      </button>
      <button
        onClick={() => handleOpenFilterModal("exception_tier")}
        className={`py-2 shadow-md rounded-lg hover:bg-orange-200 hover:text-content transition-all duration-200 ${activeFilterStyle("exception_tier")}`}
      >
        {handleFilterTextDisplay("exception_tier")}
      </button>
      <button
        className="py-2 shadow-md rounded-lg hover:bg-orange-200 hover:text-content transition-all duration-200"
        onClick={() => ctx.dispatch(resetCashierFilters())}
      >
        {handleFilterTextDisplay("")}
      </button>
    </div>
  );
};

export default CardFilters;
