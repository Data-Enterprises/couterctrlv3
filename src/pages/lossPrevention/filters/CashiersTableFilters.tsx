import {
  setCashierTableQtyThreshComp,
  setCashierTableThreshComp,
  setDescFilter,
  setFilterModalOpen,
  setFilterType,
  setSaleDateFilter,
  setSelectedPriceTypes,
  setTotalQtyFilter,
  setTotalSalesFilter,
  setTransIdFilter,
  setUpcFilter,
} from "../../../features/lossPreventionSlice";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import FiltersModal from "./FiltersModal";

const filterOptions = [
  "Sale Date",
  "Total Sales",
  "Total Qty",
  "Transaction ID",
  "Refresh",
];

const CashiersTableFilters = () => {
  const dispatch = useAppDispatch();
  const cashier = useAppSelector((state) => state.lossPrevention);

  const panelStyle =
    "py-1.5 rounded-lg text-center shadow-md shadow-content/20 hover:bg-orange-200 cursor-pointer transition-all duration-200";

  const activePanelStyle = (option: string) => {
    // Grabbing the filters
    const saleDate = cashier.saleDateFilter;
    const totalSales = cashier.totalSalesFilter;
    const threshold = cashier.cashierTableThreshComp;
    const qtyThreshold = cashier.cashierTableQtyThreshComp;
    const totalQty = cashier.totalQtyFilter;
    const transId = cashier.transIdFilter;

    // Declaring the active style and applying it to the matching conditions
    const style = "bg-orange-500 text-white font-semibold shadow-inner";
    let result = false;
    if (option === "Sale Date" && saleDate) result = true;

    if (
      option === "Total Sales" &&
      totalSales !== 0 &&
      (threshold.gt || threshold.lt)
    )
      result = true;

    if (
      option === "Total Qty" &&
      totalQty !== 0 &&
      (qtyThreshold.gt || qtyThreshold.lt)
    )
      result = true;

    if (option === "Transaction ID" && transId) result = true;
    return result ? style : "";
  };

  const renderFilterText = (type: string) => {
    if (type === "Sale Date") {
      return cashier.saleDateFilter ? `${cashier.saleDateFilter}` : "Sale Date";
    } else if (type === "Total Sales") {
      const thresh = cashier.cashierTableThreshComp.gt
        ? "Over"
        : cashier.cashierTableThreshComp.lt
          ? "Under"
          : "";

      // This might change, but if no threshold is selected, just show "Total Sales"
      return thresh.length > 0
        ? `${thresh} ${formatCurrency2(cashier.totalSalesFilter)}`
        : "Total Sales";
    } else if (type === "Total Qty") {
      const thresh = cashier.cashierTableQtyThreshComp.gt
        ? "Over"
        : cashier.cashierTableQtyThreshComp.lt
          ? "Under"
          : "";

      return thresh.length > 0
        ? `${thresh} ${cashier.totalQtyFilter}`
        : "Total Qty";
    } else if (type === "Transaction ID") {
      return cashier.transIdFilter
        ? `${cashier.transIdFilter}`
        : "Transaction ID";
    } else {
      return type;
    }
  };

  const setFilterModal = (type: string) => {
    if (type === "Refresh") {
      dispatch(setCashierTableThreshComp({ gt: false, lt: false }));
      dispatch(setCashierTableQtyThreshComp({ gt: false, lt: false }));
      dispatch(setTotalQtyFilter(0));
      dispatch(setTotalSalesFilter(0));
      dispatch(setTransIdFilter(""));
      dispatch(setSaleDateFilter(""));
      dispatch(setFilterType(""));
      dispatch(setUpcFilter(""));
      dispatch(setDescFilter(""));
      dispatch(setSelectedPriceTypes([]));
      dispatch(setTotalSalesFilter(0));
      dispatch(setTransIdFilter(""));
      return;
    }

    dispatch(setFilterModalOpen(true));
    dispatch(setFilterType(type));
  };

  return (
    <div
      className={`bg-custom-white rounded-lg shadow-lg ${
        !cashier.transList.length && "hidden"
      }`}
    >
      <FiltersModal />
      <div className="rounded-t-lg text-center py-0.5 text-sm bg-blue-500 text-custom-white font-medium">
        Filter By
      </div>
      <div className="grid text-sm p-2 gap-2">
        {filterOptions.map((option, i) => (
          <div
            key={i}
            data-testid={`cashier-table-filter-${option
              .split(" ")
              .join("-")
              .toLowerCase()}`}
            className={`${panelStyle} ${activePanelStyle(option)}`}
            onClick={() => setFilterModal(option)}
          >
            {renderFilterText(option)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CashiersTableFilters;
