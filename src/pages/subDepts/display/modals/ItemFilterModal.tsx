import { useAppSelector, useAppDispatch } from "../../../../hooks";
import Modal from "../../../../components/Modal";
import {
  setFilterModalOpen,
  setFilterTextInput,
  setItemFilterType,
  setThreshOperator,
} from "../../../../features/subMarginSlice";
import TextFilter from "./TextFilter";
import ThresholdFilter from "./TresholdFilter";

const ItemFilterModal = () => {
  const dispatch = useAppDispatch();
  const subMargin = useAppSelector((state) => state.subMargin);

  const handleClose = () => {
    dispatch(setFilterModalOpen(false));
    dispatch(setItemFilterType(""));
    dispatch(setFilterTextInput(""));
    dispatch(setThreshOperator(""));
  };

  const renderForm = () => {
    if (
      subMargin.itemFilterType === "upc" ||
      subMargin.itemFilterType === "description"
    ) {
      return (
        <TextFilter
          label={subMargin.itemFilterType === "upc" ? "UPC" : "Description"}
          type={subMargin.itemFilterType}
          handleClose={handleClose}
        />
      );
    }

    let thresholdLabel = "";
    switch (subMargin.itemFilterType) {
      case "sales":
        thresholdLabel = "Sales";
        break;
      case "qty":
        thresholdLabel = "Quantity";
        break;
      case "cogs":
        thresholdLabel = "COGS";
        break;
      case "margin":
        thresholdLabel = "Margin";
        break;
    }

    return (
      <ThresholdFilter
        label={thresholdLabel}
        type={subMargin.itemFilterType}
        handleClose={handleClose}
      />
    );
  };

  return (
    <Modal
      isOpen={subMargin.filterModalOpen}
      onClose={handleClose}
      modalClassName="bg-custom-white w-1/4"
    >
      {renderForm()}
    </Modal>
  );
};

export default ItemFilterModal;
