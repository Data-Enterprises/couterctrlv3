import { useAppDispatch } from "../../../../hooks";
import Modal from "../../../../components/Modal";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { useSubMarginState } from "../../hooks/useSubMarginState";
import TextFilter from "./TextFilter";
import ThresholdFilter from "./TresholdFilter";

const ItemFilterModal = () => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const subMargin = useSubMarginState();

  const handleClose = () => {
    dispatch(actions.setFilterModalOpen(false));
    dispatch(actions.setItemFilterType(""));
    dispatch(actions.setFilterTextInput(""));
    dispatch(actions.setThreshOperator(""));
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
      case "unitCost":
        thresholdLabel = "Unit Cost";
        break;
      case "caseCost":
        thresholdLabel = "Case Cost";
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
      modalClassName="bg-custom-white w-[35%] xl:w-1/4"
    >
      {renderForm()}
    </Modal>
  );
};

export default ItemFilterModal;
