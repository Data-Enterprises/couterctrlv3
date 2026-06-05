import { useCashierCtx } from "..";
import Modal from "../../../components/Modal";
import {
  setApplyFilters,
  setCashierFilterModalOpen,
  setCashierFilterType,
  setExceptionQtyTypes,
  setExceptionSalesTypes,
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

  const handleClose = (isClearing: boolean = false) => {
    if (isClearing) {
      if (ctx.cashierFilterType === "cashier_name") {
        ctx.dispatch(setCashierFilterType(""));
      }

      if (ctx.cashierFilterType === "store_name") {
        ctx.dispatch(setStoreNameFilter(""));
      }

      if (ctx.cashierFilterType === "total_sales") {
        ctx.dispatch(setTotalSalesFilter({ operator: "", value: 0 }));
        ctx.dispatch(setExceptionSalesTypes([]));
      }

      if (ctx.cashierFilterType === "total_qty") {
        ctx.dispatch(setTotalQtyFilter({ operator: "", value: 0 }));
        ctx.dispatch(setExceptionQtyTypes([]));
      }

      if (ctx.cashierFilterType === "risk_level") {
        ctx.dispatch(setRiskLevelFilter(""));
      }

      if (ctx.cashierFilterType === "exception_tier") {
        ctx.dispatch(setExceptionTierFilter(""));
      }
    }

    ctx.dispatch(setCashierFilterModalOpen(false));
    ctx.dispatch(setCashierFilterType(""));
    ctx.dispatch(setApplyFilters(true));
  };

  return (
    <Modal
      isOpen={ctx.cashierFilterModalOpen}
      onClose={() => handleClose()}
      modalClassName="bg-custom-white min-w-1/4 w-[35%] xl:w-[26%] space-y-4"
    >
      {renderFilter()}
      <div className="grid grid-cols-3 gap-2">
        <button className="btn-themeGreen px-0 py-1.5 text-[13px]" onClick={handleSubmit}>
          Submit
        </button>
        <button className="btn-themeBlue px-0 py-1.5 text-[13px]" onClick={() => handleClose(true)}>
          Clear
        </button>
        <button className="btn-themeOrange px-0 py-1.5 text-[13px]" onClick={() => handleClose()}>
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default CashierFiltersModal;
