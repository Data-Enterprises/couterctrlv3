import { useCashierCtx } from "..";
import {
  setDataView,
  setCashierFilterModalOpen,
  type CashierFilterType,
  setCashierFilterType,
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

  return (
    <div className="relative bg-custom-white p-2 rounded-lg shadow-lg flex flex-col gap-2">
      {showViewToggle && (
        <button
          onClick={handleToggleView}
          className="py-2 shadow-md rounded-lg hover:bg-orange-200 transition-all duration-200"
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
        className="py-2 shadow-md rounded-lg hover:bg-orange-200 transition-all duration-200"
      >
        {ctx.dataView === "stores" ? "Store Name" : "Cashier Name"}
      </button>
      <button
        onClick={() => handleOpenFilterModal("total_sales")}
        className="py-2 shadow-md rounded-lg hover:bg-orange-200 transition-all duration-200"
      >
        Total Sales
      </button>
      <button
        onClick={() => handleOpenFilterModal("total_qty")}
        className="py-2 shadow-md rounded-lg hover:bg-orange-200 transition-all duration-200"
      >
        Total Qty
      </button>
      <button
        onClick={() => handleOpenFilterModal("total_transactions")}
        className="py-2 shadow-md rounded-lg hover:bg-orange-200 transition-all duration-200"
      >
        Total Transactions
      </button>
      <button
        onClick={() => handleOpenFilterModal("risk_level")}
        className="py-2 shadow-md rounded-lg hover:bg-orange-200 transition-all duration-200"
      >
        Risk Level
      </button>
      <button
        onClick={() => handleOpenFilterModal("exception_tier")}
        className="py-2 shadow-md rounded-lg hover:bg-orange-200 transition-all duration-200"
      >
        Exception Tier
      </button>
      <button className="py-2 shadow-md rounded-lg hover:bg-orange-200 transition-all duration-200">
        Refresh
      </button>
    </div>
  );
};

export default CardFilters;
