import { useCashierCtx } from "..";
import Modal from "../../../components/Modal";
import {
  setTransCashNameFilter,
  setTransUpcFilter,
  setTransDateFilter,
  setTransDescFilter,
  setTransTotalSalesFilter,
  defaultNumberFilter,
  setTransFilterModalOpen,
  setSelectedTransFilter,
  setApplyTransFilters,
} from "../../../features/cashiersSlice";
import Input from "../../../components/inputs/Input";

const TransFilterModal = () => {
  const ctx = useCashierCtx();

  const handleClose = (isClearing: boolean = false) => {
    if (isClearing) {
      // reset all filters
      if (ctx.selectedTransFilter === "date") {
        ctx.dispatch(setTransDateFilter(""));
      } else if (ctx.selectedTransFilter === "cashier_name") {
        ctx.dispatch(setTransCashNameFilter(""));
      } else if (ctx.selectedTransFilter === "upc") {
        ctx.dispatch(setTransUpcFilter(""));
      } else if (ctx.selectedTransFilter === "description") {
        ctx.dispatch(setTransDescFilter(""));
      } else if (ctx.selectedTransFilter === "total_sales") {
        ctx.dispatch(setTransTotalSalesFilter(defaultNumberFilter));
      }
    }

    ctx.dispatch(setTransFilterModalOpen(false));
    ctx.dispatch(setSelectedTransFilter(""));
  };

  const handleSubmit = () => {
    ctx.dispatch(setApplyTransFilters(true));
    handleClose(false);
  };

  return (
    <Modal isOpen={ctx.transFilterModalOpen} onClose={handleClose}>
      {ctx.selectedTransFilter === "date" && (
        <Input
          label="Date Filter (mm/dd/yyyy)"
          value={ctx.transDateFilter}
          setValue={(x) => ctx.dispatch(setTransDateFilter(x))}
        />
      )}
      {ctx.selectedTransFilter === "upc" && (
        <Input
          label="UPC Filter"
          value={ctx.transUpcFilter}
          setValue={(x) => ctx.dispatch(setTransUpcFilter(x))}
        />
      )}
      {ctx.selectedTransFilter === "cashier_name" && (
        <Input
          label="Cashier Name Filter"
          value={ctx.transCashNameFilter}
          setValue={(x) => ctx.dispatch(setTransCashNameFilter(x))}
        />
      )}
      {ctx.selectedTransFilter === "description" && (
        <Input
          label="Description Filter"
          value={ctx.transDescFilter}
          setValue={(x) => ctx.dispatch(setTransDescFilter(x))}
        />
      )}
      {ctx.selectedTransFilter === "total_sales" && (
        <div></div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <button className="btn-themeGreen" onClick={handleSubmit}>
          Submit
        </button>
        <button className="btn-themeBlue" onClick={() => handleClose(true)}>
          Clear
        </button>
        <button className="btn-themeOrange" onClick={() => handleClose(false)}>
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default TransFilterModal;
