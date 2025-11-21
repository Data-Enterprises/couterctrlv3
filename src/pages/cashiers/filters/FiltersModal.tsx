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
  setRefreshTransTable,
} from "../../../features/cashierSlice";

// Modal and filter components
import Modal from "../../../components/Modal";
import PriceTypeFilter from "./PriceTypeFilter";
import TextFilter from "./TextFilter";
import TotalSalesFilter from "./TotalSalesFilter";

const FiltersModal = () => {
  const dispatch = useAppDispatch();
  const { filterType, filterModalOpen, availablePriceTypes } = useAppSelector(
    (state) => state.cashier
  );
  const [text, setText] = useState<string>("");
  const [threshold, setThreshold] = useState<number>(0);
  const [priceTypes, setPriceTypes] = useState<string[]>([]);
  const [threshComp, setThreshComp] = useState<{ gt: boolean; lt: boolean }>({
    gt: false,
    lt: false,
  });

  const handleClose = () => {
    dispatch(setFilterModalOpen(false));
    setText("");
    setThreshold(0);
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

  const setTotalSales = (value: number) => {
    setThreshold(value);
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
    if (filterType !== "Total Sales" && filterType !== "Price Type") {
      return <TextFilter type={filterType} text={text} setText={setText} />;
    } else if (filterType === "Price Type") {
      return (
        <PriceTypeFilter
          priceTypes={priceTypes}
          handleSelection={handlePriceTypeSelection}
          availablePriceTypes={availablePriceTypes}
        />
      );
    } else if (filterType === "Total Sales") {
      return (
        <TotalSalesFilter
          threshold={threshold}
          setThreshold={setTotalSales}
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
        dispatch(setTotalSalesFilter(threshold));
        break;
      default:
        break;
    }

    // Dispatch refresh to true to trigger filtering in table
    dispatch(setRefreshTransTable(true));
    handleClose();
  };

  return (
    <Modal
      isOpen={filterModalOpen}
      onClose={handleClose}
      modalClassName="bg-custom-white w-1/5"
    >
      <div className="font-medium text-center text-lg">
        Set {filterType} Filter
      </div>
      {renderFilter()}
      <div className="flex gap-4">
        <button className="btn-themeGreen w-full" onClick={handleSubmit}>
          Filter
        </button>
        <button className="btn-themeOrange w-full" onClick={handleClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default FiltersModal;
