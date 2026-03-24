import { useCashierCtx } from "..";
import {
  setCashierFilterModalOpen,
  type CashierFilterType,
  setCashierFilterType,
  resetCashierFilters,
} from "../../../features/cashiersSlice";

const CardFilters = () => {
  const ctx = useCashierCtx();

  const handleOpenFilterModal = (type: CashierFilterType) => {
    ctx.dispatch(setCashierFilterType(type));
    ctx.dispatch(setCashierFilterModalOpen(true));
  };

  const handleFilterTextDisplay = (type: CashierFilterType) => {
    // This will determin what is displayed in the button text based on if that filter is set or not
    if (type === "cashier_name") {
      return ctx.cashNameFilterApplied.length ? (
        <div>{`Cashier: ${ctx.cashNameFilterApplied}`}</div>
      ) : (
        <div>Cashier Name</div>
      );
    }
    if (type === "store_name") {
      return ctx.storeNameFilterApplied.length ? (
        <div>{`Store: ${ctx.storeNameFilterApplied}`}</div>
      ) : (
        <div>Store Name</div>
      );
    }
    if (type === "total_sales") {
      return ctx.totalSalesFilterApplied.operator !== "" ? (
        <div>
          <div>{ctx.exceptionSalesTypes.join(", ")}</div>
          <div>
            {ctx.totalSalesFilterApplied.operator}{" "}
            {ctx.totalSalesFilterApplied.value}
          </div>
        </div>
      ) : (
        <div>Exceptions Sales</div>
      );
    }
    if (type === "total_qty") {
      return ctx.totalQtyFilterApplied.operator !== "" ? (
        <div>
          <div>{ctx.exceptionQtyTypes.join(", ")}</div>
          <div>
            {ctx.totalQtyFilterApplied.operator}{" "}
            {ctx.totalQtyFilterApplied.value}
          </div>
        </div>
      ) : (
        <div>Exceptions Qty</div>
      );
    }
    if (type === "risk_level") {
      return ctx.riskLevelFilterApplied.length ? (
        <div>{`Risk: ${ctx.riskLevelFilterApplied}`}</div>
      ) : (
        <div>Risk Level</div>
      );
    }
    if (type === "exception_tier") {
      return ctx.exceptionTierFilterApplied.length ? (
        <div>{`Tier: ${ctx.exceptionTierFilterApplied}`}</div>
      ) : (
        <div>Exception Tier</div>
      );
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
      ctx.totalSalesFilterApplied.operator !== ""
    ) {
      return "bg-orange-200";
    } else if (
      type === "total_qty" &&
      ctx.totalQtyFilterApplied.operator !== ""
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
      <div className="bg-blue-500 text-custom-white py-0.5 px-2 font-medium rounded-t-lg">
        Filter By
      </div>
      <button
        onClick={() =>
          handleOpenFilterModal(
            ctx.dataView === "stores" ? "store_name" : "cashier_name",
          )
        }
        className={`py-2 shadow-md mx-2 rounded-lg hover:shadow-inner hover:text-content transition-all duration-200 text-[14px] ${activeFilterStyle(
          ctx.dataView === "stores" ? "store_name" : "cashier_name",
        )}`}
      >
        {handleFilterTextDisplay(
          ctx.dataView === "stores" ? "store_name" : "cashier_name",
        )}
      </button>
      <button
        onClick={() => handleOpenFilterModal("total_sales")}
        className={`py-2 shadow-md mx-2 rounded-lg hover:shadow-inner hover:text-content transition-all duration-200 text-[14px] ${activeFilterStyle("total_sales")}`}
      >
        {handleFilterTextDisplay("total_sales")}
      </button>
      <button
        onClick={() => handleOpenFilterModal("total_qty")}
        className={`py-2 shadow-md mx-2 rounded-lg hover:shadow-inner hover:text-content transition-all duration-200 text-[14px] ${activeFilterStyle("total_qty")}`}
      >
        {handleFilterTextDisplay("total_qty")}
      </button>
      <button
        onClick={() => handleOpenFilterModal("risk_level")}
        className={`py-2 shadow-md mx-2 rounded-lg hover:shadow-inner hover:text-content transition-all duration-200 text-[14px] ${activeFilterStyle("risk_level")}`}
      >
        {handleFilterTextDisplay("risk_level")}
      </button>
      <button
        onClick={() => handleOpenFilterModal("exception_tier")}
        className={`py-2 shadow-md mx-2 rounded-lg hover:shadow-inner hover:text-content transition-all duration-200 text-[14px] ${activeFilterStyle("exception_tier")}`}
      >
        {handleFilterTextDisplay("exception_tier")}
      </button>
      <button
        className="py-2 shadow-md mx-2 rounded-lg hover:shadow-inner hover:text-content transition-all duration-200 text-[14px]"
        onClick={() => ctx.dispatch(resetCashierFilters())}
      >
        {handleFilterTextDisplay("")}
      </button>
    </div>
  );
};

export default CardFilters;
