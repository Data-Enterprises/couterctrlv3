import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import Modal from "../../../components/Modal";
import {
  applyFilters,
  setFilter,
  setFilterType,
  setFilterModalOpen,
} from "../../../features/receiversSlice";
import TextFilter from "../../coupons/filters/TextFilter";
import { useToast } from "../../../components/toasts/hooks/useToast";

const FiltersModal = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.receivers);
  const [text, setText] = useState<string>("");

  const handleClose = () => {
    dispatch(setFilterModalOpen(false));
    setText("");
    dispatch(setFilterType(""));
  };

  const setFilterValue = () => {
    if (!text) {
      toast.warning("Filter value cannot be empty");
      return;
    }
    dispatch(setFilter({ type: state.filterType, value: text }));
    dispatch(applyFilters());
    handleClose();
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
      <TextFilter text={text} setText={setText} />;
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
