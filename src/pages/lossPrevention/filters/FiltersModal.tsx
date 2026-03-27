import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
// The respective filter setters
import {
  setUpcFilter,
  setDescFilter,
  setTotalSalesFilter,
  setCashierTableThreshComp,
  setFilterModalOpen,
  setFilterType,
  setSaleDateFilter,
  setSelectedPriceTypes,
  setTransIdFilter,
  setTotalQtyFilter,
  setCashierTableQtyThreshComp,
} from "../../../features/lossPreventionSlice";

// Modal and filter components
import Modal from "../../../components/Modal";
import PriceTypeFilter from "./PriceTypeFilter";
import TextFilter from "./TextFilter";
import TotalSalesFilter from "./TotalSalesFilter";

const FiltersModal = () => {
  const dispatch = useAppDispatch();
  const { filterType, filterModalOpen, availablePriceTypes } = useAppSelector(
    (state) => state.lossPrevention,
  );
  const [text, setText] = useState<string>("");
  const [threshold, setThreshold] = useState<string>("");
  const [priceTypes, setPriceTypes] = useState<string[]>([]);
  const [threshComp, setThreshComp] = useState<{ gt: boolean; lt: boolean }>({
    gt: false,
    lt: false,
  });

  const handleClose = () => {
    dispatch(setFilterModalOpen(false));
    setText("");
    setThreshold("");
    dispatch(setFilterType(""));
    setPriceTypes([]);
  };

  const handleSelection = (value: string) => {
    if (value === "gt") {
      setThreshComp((prev) => {
        return { gt: !prev.gt, lt: false };
      });
    } else if (value === "lt") {
      setThreshComp((prev) => {
        return { gt: false, lt: !prev.lt };
      });
    }
  };

  const setNumberValue = (value: string) => {
    if (value === "-" || !isNaN(parseFloat(value))) {
      setThreshold(value);
    }
  };

  const handlePriceTypeSelection = (type: string) => {
    setPriceTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const renderFilter = () => {
    if (filterType !== "Total Sales" && filterType !== "Price Type" && filterType !== "Total Qty") {
      return <TextFilter type={filterType} text={text} setText={setText} />;
    } else if (filterType === "Price Type") {
      return (
        <PriceTypeFilter
          priceTypes={priceTypes}
          handleSelection={handlePriceTypeSelection}
          availablePriceTypes={availablePriceTypes}
        />
      );
    } else if (filterType === "Total Sales" || filterType === "Total Qty") {
      return (
        <TotalSalesFilter
          threshold={threshold}
          setThreshold={setNumberValue}
          handleSelection={handleSelection}
          threshComp={threshComp}
        />
      );
    }
  };

  const handleSubmit = () => {
    switch (filterType) {
      case "Sale Date":
        dispatch(setSaleDateFilter(text));
        break;
      case "UPC":
        dispatch(setUpcFilter(text));
        break;
      case "Description":
        dispatch(setDescFilter(text));
        break;
      case "Price Type":
        dispatch(setSelectedPriceTypes(priceTypes));
        break;
      case "Total Sales":
        dispatch(setCashierTableThreshComp(threshComp));
        dispatch(setTotalSalesFilter(parseFloat(threshold)));
        break;
      case "Total Qty":
        dispatch(setCashierTableQtyThreshComp(threshComp));
        dispatch(setTotalQtyFilter(parseFloat(threshold)));
        break;
      case "Transaction ID":
        dispatch(setTransIdFilter(text));
        break;
    }

    handleClose();
  };

  return (
    <Modal
      isOpen={filterModalOpen}
      onClose={handleClose}
      modalClassName="bg-custom-white w-1/5"
    >
      <div
        data-testid="cashier-table-filter-modal"
        className="font-medium text-center text-lg"
      >
        Set {filterType} Filter
      </div>
      {renderFilter()}
      <div className="flex gap-4">
        <button
          data-testid="cashier-table-filter-modal-submit-btn"
          className="btn-themeGreen w-full"
          onClick={handleSubmit}
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
