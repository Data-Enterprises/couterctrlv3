import { useCashierCtx } from "..";
import Modal from "../../../components/Modal";
import {
  setApplyFilters,
  setCashierFilterModalOpen,
  setCashierFilterType,
} from "../../../features/cashiersSlice";
import CashierNumberFilter from "./CashierNumberFilter";

import CashierTextFilter from "./CashierTextFilter";

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
        return <div>Dropdown filter goes here</div>;
      default:
        return null;
    }
  };

  const handleSubmit = () => {
    ctx.dispatch(setApplyFilters(true));
    handleClose();
  };

  return (
    <Modal
      isOpen={ctx.cashierFilterModalOpen}
      onClose={handleClose}
      modalClassName="bg-custom-white w-1/4 space-y-4"
    >
      {renderFilter()}
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-themeBlue" onClick={handleSubmit}>
          Submit
        </button>
        <button className="btn-themeOrange" onClick={handleClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default CashierFiltersModal;
