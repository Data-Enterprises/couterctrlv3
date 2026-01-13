import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import Modal from "../../../components/Modal";
import {
  applyFilters,
  setFilter,
  setFilterModalOpen,
  setFilterType,
} from "../../../features/couponSlice";
import TextFilter from "./TextFilter";

const FiltersModal = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.coupons);
  const [text, setText] = useState<string>("");
  // const [threshold, setThreshold] = useState<string>("");

  const handleClose = () => {
    dispatch(setFilterModalOpen(false));
    setText("");
    dispatch(setFilterType(""));
  };

  const setFilterValue = () => {
    dispatch(setFilter({ type: state.filterType, value: text }));
    dispatch(applyFilters());
    handleClose();
  };

  const renderFilter = () => {
    if (
      state.filterType === "Store" ||
      state.filterType === "UPC" ||
      state.filterType === "Desc" ||
      state.filterType === "CustomerID"
    ) {
      return <TextFilter text={text} setText={setText} />;
    } else if (state.filterType === "CpnAmount") {
      return (
        <div className="mb-2">
          <input
            type="number"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="basic-input focus:border bg-custom-white"
          />
        </div>
      );
    }
  };

  return (
    <Modal
      isOpen={state.filterModalOpen}
      onClose={handleClose}
      modalClassName="bg-custom-white w-1/5"
    >
      <div
        data-testid="cashier-table-filter-modal"
        className="font-medium text-center text-lg"
      >
        Set {state.filterType} Filter
      </div>
      {renderFilter()}
      <div className="flex gap-4">
        <button
          data-testid="cashier-table-filter-modal-submit-btn"
          className="btn-themeGreen w-full"
          onClick={setFilterValue}
        >
          Filter
        </button>
        <button
          data-testid="cashier-table-filter-modal-cancel-btn"
          className="btn-themeOrange w-full"
          onClick={handleClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default FiltersModal;
