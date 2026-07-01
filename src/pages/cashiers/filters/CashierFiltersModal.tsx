import { useCashierCtx } from "..";
import Modal from "../../../components/Modal";
import { useCashiersActions } from "../hooks/useCashiersActions";
import CashierNumberFilter from "./CashierNumberFilter";

import CashierTextFilter from "./CashierTextFilter";
import CashierTierFilter from "./CashierTierFilter";

const CashierFiltersModal = () => {
  const ctx = useCashierCtx();
  const actions = useCashiersActions();

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
    ctx.dispatch(actions.setApplyFilters(true));
    handleClose();
  };

  const handleClose = (isClearing: boolean = false) => {
    if (isClearing) {
      if (ctx.cashierFilterType === "cashier_name") {
        ctx.dispatch(actions.setCashierFilterType(""));
      }

      if (ctx.cashierFilterType === "store_name") {
        ctx.dispatch(actions.setStoreNameFilter(""));
      }

      if (ctx.cashierFilterType === "total_sales") {
        ctx.dispatch(actions.setTotalSalesFilter({ operator: "", value: 0 }));
        ctx.dispatch(actions.setExceptionSalesTypes([]));
      }

      if (ctx.cashierFilterType === "total_qty") {
        ctx.dispatch(actions.setTotalQtyFilter({ operator: "", value: 0 }));
        ctx.dispatch(actions.setExceptionQtyTypes([]));
      }

      if (ctx.cashierFilterType === "risk_level") {
        ctx.dispatch(actions.setRiskLevelFilter(""));
      }

      if (ctx.cashierFilterType === "exception_tier") {
        ctx.dispatch(actions.setExceptionTierFilter(""));
      }
    }

    ctx.dispatch(actions.setCashierFilterModalOpen(false));
    ctx.dispatch(actions.setCashierFilterType(""));
    ctx.dispatch(actions.setApplyFilters(true));
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
