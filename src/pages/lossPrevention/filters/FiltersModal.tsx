import { useState } from "react";
import { useAppDispatch } from "../../../hooks";
import { useLPState } from "../hooks/useLPState";
import { useLPActions } from "../hooks/useLPActions";

// Modal and filter components
import Modal from "../../../components/Modal";
// import PriceTypeFilter from "./PriceTypeFilter";
import TextFilter from "./TextFilter";
import TotalSalesFilter from "./TotalSalesFilter";

const FiltersModal = () => {
  const dispatch = useAppDispatch();
  const { filterType, filterModalOpen,
    // availablePriceTypes
  } = useLPState();
  const actions = useLPActions();
  const [text, setText] = useState<string>("");
  const [threshold, setThreshold] = useState<string>("");
  // const [priceTypes, setPriceTypes] = useState<string[]>([]);
  const [threshComp, setThreshComp] = useState<{ gt: boolean; lt: boolean }>({
    gt: false,
    lt: false,
  });

  const handleClose = () => {
    dispatch(actions.setFilterModalOpen(false));
    setText("");
    setThreshold("");
    dispatch(actions.setFilterType(""));
    // setPriceTypes([]);
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

  // const handlePriceTypeSelection = (type: string) => {
  //   setPriceTypes((prev) => {
  //     if (prev.includes(type)) {
  //       return prev.filter((t) => t !== type);
  //     } else {
  //       return [...prev, type];
  //     }
  //   });
  // };

  const renderFilter = () => {
    if (
      filterType !== "Total Sales" &&
      filterType !== "Price Type" &&
      filterType !== "Total Qty"
    ) {
      return <TextFilter type={filterType} text={text} setText={setText} />;
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
    // else if (filterType === "Price Type") {
    //   return (
    //     <PriceTypeFilter
    //       priceTypes={priceTypes}
    //       handleSelection={handlePriceTypeSelection}
    //       availablePriceTypes={availablePriceTypes}
    //     />
    //   );
    // } 
  };

  const handleSubmit = () => {
    switch (filterType) {
      case "Sale Date":
        dispatch(actions.setSaleDateFilter(text));
        break;
      // case "UPC":
      //   dispatch(actions.setUpcFilter(text));
      //   break;
      // case "Description":
      //   dispatch(actions.setDescFilter(text));
      //   break;
      // case "Price Type":
      //   dispatch(actions.setSelectedPriceTypes(priceTypes));
      //   break;
      case "Total Sales":
        dispatch(actions.setSalesThreshold(threshold ? { op: threshComp.gt ? "gt" : "lt", amount: parseFloat(threshold) } : null));
        break;
      case "Total Qty":
        dispatch(actions.setQtyThreshold(threshold ? { op: threshComp.gt ? "gt" : "lt", amount: parseFloat(threshold) } : null));
        break;
      case "Transaction ID":
        dispatch(actions.setTransIdFilter(text));
        break;
    }

    handleClose();
  };

  return (
    <Modal
      isOpen={filterModalOpen}
      onClose={handleClose}
      modalClassName="bg-custom-white w-1/3 xl:w-1/5"
    >
      <div
        data-testid="cashier-table-filter-modal"
        className="font-medium text-center"
      >
        Set {filterType} Filter
      </div>
      {renderFilter()}
      <div className="flex gap-4 text-sm">
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
