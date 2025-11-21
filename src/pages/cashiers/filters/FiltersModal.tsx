import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setCashierTableThreshComp,
  setFilterModalOpen,
  setFilterType,
  setSaleDateFilter,
} from "../../../features/cashierSlice";

// The respective filter setters
import {
  setUpcFilter,
  setDescFilter,
  setPriceTypeFilter,
  setTotalSalesFilter,
} from "../../../features/cashierSlice";

// Modal and filter components
import Modal from "../../../components/Modal";
import PriceTypeFilter from "./PriceTypeFilter";
import TextFilter from "./TextFilter";
import TotalSalesFilter from "./TotalSalesFilter";

const FiltersModal = () => {
  const dispatch = useAppDispatch();
  const { filterType, filterModalOpen, cashierTableThreshComp } =
    useAppSelector((state) => state.cashier);
  const [text, setText] = useState<string>("");
  const [threshold, setThreshold] = useState<number>(0);

  const handleClose = () => {
    dispatch(setFilterModalOpen(false));
    setText("");
    setThreshold(0);
    dispatch(setFilterType(""));
  };

  const handleSelection = (value: string) => {
    if (value === "gt") {
      dispatch(
        setCashierTableThreshComp({
          gt: !cashierTableThreshComp.gt,
          lt: false,
        })
      );
    } else if (value === "lt") {
      dispatch(
        setCashierTableThreshComp({
          gt: false,
          lt: !cashierTableThreshComp.lt,
        })
      );
    }
  };

  const setTotalSales = (value: number) => {
    setThreshold(value);
  };

  const renderFilter = () => {
    if (filterType !== "Total Sales" && filterType !== "Price Type") {
      return <TextFilter text={text} setText={setText} />;
    } else if (filterType === "Price Type") {
      return <PriceTypeFilter />;
    } else if (filterType === "Total Sales") {
      return (
        <TotalSalesFilter
          threshold={threshold}
          setThreshold={setTotalSales}
          handleSelection={handleSelection}
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
        dispatch(setPriceTypeFilter(text));
        break;
      case "Total Sales":
        dispatch(setTotalSalesFilter(threshold));
        break;
      default:
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
