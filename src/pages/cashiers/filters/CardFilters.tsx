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
    ctx.dispatch(resetCashierFilters());
  };

  const handleOpenFilterModal = (type: CashierFilterType) => {
    ctx.dispatch(setCashierFilterType(type));
    ctx.dispatch(setCashierFilterModalOpen(true));
  };

  const handleFilterTextDisplay = (type: CashierFilterType) => {
    // This will determin what is displayed in the button text based on if that filter is set or not
    if (type === "cashier_name") {
      return ctx.cashNameFilterApplied.length
        ? `Cashier: ${ctx.cashNameFilterApplied}`
        : "Cashier Name";
    }
    if (type === "store_name") {
      return ctx.storeNameFilterApplied.length
        ? `${ctx.storeNameFilterApplied}`
        : "Store Name";
    }
    if (type === "total_sales") {
      return ctx.totalSalesFilterApplied.operator !== "" &&
        ctx.totalSalesFilterApplied.value > 0
        ? `Sales ${ctx.totalSalesFilterApplied.operator} ${ctx.totalSalesFilterApplied.value}`
        : "Total Sales";
    }
    if (type === "total_qty") {
      return ctx.totalQtyFilterApplied.operator !== "" &&
        ctx.totalQtyFilterApplied.value > 0
        ? `Qty ${ctx.totalQtyFilterApplied.operator} ${ctx.totalQtyFilterApplied.value}`
        : "Total Qty";
    }
    if (type === "risk_level") {
      return ctx.riskLevelFilterApplied.length
        ? `Risk: ${ctx.riskLevelFilterApplied}`
        : "Risk Level";
    }
    if (type === "exception_tier") {
      return ctx.exceptionTierFilterApplied.length
        ? `Tier: ${ctx.exceptionTierFilterApplied}`
        : "Exception Tier";
    }
    return "Refresh";
  };

  const activeFilterStyle = (type: CashierFilterType) => {
    if (type === "cashier_name" && ctx.cashNameFilterApplied.length) {
      return "bg-orange-200";
    } else if (type === "store_name" && ctx.storeNameFilterApplied.length) {
      return "bg-orange-200";
    } else if (
      type === "total_sales" &&
      ctx.totalSalesFilterApplied.operator !== "" &&
      ctx.totalSalesFilterApplied.value > 0
    ) {
      return "bg-orange-200";
    } else if (
      type === "total_qty" &&
      ctx.totalQtyFilterApplied.operator !== "" &&
      ctx.totalQtyFilterApplied.value > 0
    ) {
      return "bg-orange-200";
    } else if (type === "risk_level" && ctx.riskLevelFilterApplied.length) {
      return "bg-orange-200";
    } else if (
      type === "exception_tier" &&
      ctx.exceptionTierFilterApplied.length
    ) {
      return "bg-orange-200";
    } else {
      return "";
    }
  };

  return (
    <div className="relative bg-custom-white pb-2 rounded-lg shadow-lg flex flex-col gap-2">
      <div className="bg-blue-500 text-custom-white py-0.5 px-2 font-medium rounded-t-lg">Filter By</div>
      {showViewToggle && (
        <button
          onClick={handleToggleView}
          className="py-2 shadow-md mx-2 rounded-lg hover:bg-orange-200 hover:text-content transition-all duration-200"
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
        className={`py-2 shadow-md mx-2 rounded-lg hover:bg-orange-200 hover:text-content transition-all duration-200 ${activeFilterStyle(
          ctx.dataView === "stores" ? "store_name" : "cashier_name",
        )}`}
      >
        {handleFilterTextDisplay(
          ctx.dataView === "stores" ? "store_name" : "cashier_name",
        )}
      </button>
      <button
        onClick={() => handleOpenFilterModal("total_sales")}
        className={`py-2 shadow-md mx-2 rounded-lg hover:bg-orange-200 hover:text-content transition-all duration-200 ${activeFilterStyle("total_sales")}`}
      >
        {handleFilterTextDisplay("total_sales")}
      </button>
      <button
        onClick={() => handleOpenFilterModal("total_qty")}
        className={`py-2 shadow-md mx-2 rounded-lg hover:bg-orange-200 hover:text-content transition-all duration-200 ${activeFilterStyle("total_qty")}`}
      >
        {handleFilterTextDisplay("total_qty")}
      </button>
      <button
        onClick={() => handleOpenFilterModal("risk_level")}
        className={`py-2 shadow-md mx-2 rounded-lg hover:bg-orange-200 hover:text-content transition-all duration-200 ${activeFilterStyle("risk_level")}`}
      >
        {handleFilterTextDisplay("risk_level")}
      </button>
      <button
        onClick={() => handleOpenFilterModal("exception_tier")}
        className={`py-2 shadow-md mx-2 rounded-lg hover:bg-orange-200 hover:text-content transition-all duration-200 ${activeFilterStyle("exception_tier")}`}
      >
        {handleFilterTextDisplay("exception_tier")}
      </button>
      <button
        className="py-2 shadow-md mx-2 rounded-lg hover:bg-orange-200 hover:text-content transition-all duration-200"
        onClick={() => ctx.dispatch(resetCashierFilters())}
      >
        {handleFilterTextDisplay("")}
      </button>
    </div>
  );
};

export default CardFilters;
