import { useCashierCtx } from "..";
import Modal from "../../../components/Modal";
import {
  setApplyFilters,
  setCashierFilterModalOpen,
  setCashierFilterType,
  setExceptionTierFilter,
  setRiskLevelFilter,
  setStoreNameFilter,
  setTotalQtyFilter,
  setTotalSalesFilter,
} from "../../../features/cashiersSlice";
import CashierNumberFilter from "./CashierNumberFilter";

import CashierTextFilter from "./CashierTextFilter";
import CashierTierFilter from "./CashierTierFilter";

const CashierFiltersModal = () => {
  const ctx = useCashierCtx();

  const handleClose = () => {
    ctx.dispatch(setCashierFilterModalOpen(false));
    ctx.dispatch(setCashierFilterType(""));
  };

  const renderFilter = () => {
    switch (ctx.cashierFilterType) {
      case "cashier_name":
      case "store_name":
        return <CashierTextFilter />;
      case "total_sales":
      case "total_qty":
      case "total_transactions":
        return <CashierNumberFilter />;

      case "risk_level":
      case "exception_tier":
        return <CashierTierFilter />;
      default:
        return null;
    }
  };

  const handleSubmit = () => {
    ctx.dispatch(setApplyFilters(true));
    handleClose();
  };

  const handleCleanup = () => {
    if (ctx.cashierFilterType === "cashier_name") {
      ctx.dispatch(setCashierFilterType(""));
    }

    if (ctx.cashierFilterType === "store_name") {
      ctx.dispatch(setStoreNameFilter(""));
    }

    if (ctx.cashierFilterType === "total_sales") {
      ctx.dispatch(setTotalSalesFilter({ operator: "", value: 0 }));
    }

    if (ctx.cashierFilterType === "total_qty") {
      ctx.dispatch(setTotalQtyFilter({ operator: "", value: 0 }));
    }

    if (ctx.cashierFilterType === "total_transactions") {
      ctx.dispatch(setTotalQtyFilter({ operator: "", value: 0 }));
    }

    if (ctx.cashierFilterType === "risk_level") {
      ctx.dispatch(setRiskLevelFilter(""));
    }

    if (ctx.cashierFilterType === "exception_tier") {
      ctx.dispatch(setExceptionTierFilter(""));
    }

    handleClose();
    ctx.dispatch(setApplyFilters(true));
  };

  return (
    <Modal
      isOpen={ctx.cashierFilterModalOpen}
      onClose={handleClose}
      modalClassName="bg-custom-white min-w-1/4 space-y-4"
    >
      {renderFilter()}
      <div className="grid grid-cols-3 gap-2">
        <button className="btn-themeGreen" onClick={handleSubmit}>
          Submit
        </button>
        <button className="btn-themeBlue" onClick={handleCleanup}>
          Clear
        </button>
        <button className="btn-themeOrange" onClick={handleClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default CashierFiltersModal;
