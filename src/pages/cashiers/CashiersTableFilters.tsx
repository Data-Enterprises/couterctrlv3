import {
  setCashierTableThreshComp,
  setDescFilter,
  setFilterModalOpen,
  setFilterType,
  setPriceTypeFilter,
  setSaleDateFilter,
  setTotalSalesFilter,
  setUpcFilter,
} from "../../features/cashierSlice";
import { useAppSelector, useAppDispatch } from "../../hooks";
import FiltersModal from "./FiltersModal";

const filterOptions = [
  "Sale Date",
  "UPC",
  "Description",
  "Total Sales",
  "Price Type",
  "Refresh",
];
const CashiersTableFilters = () => {
  const dispatch = useAppDispatch();
  const cashier = useAppSelector((state) => state.cashier);

  const panelStyle =
    "py-1.5 rounded-lg text-center shadow-md shadow-content/20 hover:bg-orange-200 cursor-pointer transition-all duration-200";

  const activePanelStyle = (option: string) => {
    const saleDate = cashier.saleDateFilter;
    const upc = cashier.upcFilter;
    const desc = cashier.descFilter;
    const priceType = cashier.priceTypeFilter;
    const totalSales = cashier.totalSalesFilter;

    const style = "bg-orange-500 text-white font-semibold shadow-inner";
    let result = false;
    if (option === "Sale Date" && saleDate) result = true;
    if (option === "UPC" && upc) result = true;
    if (option === "Description" && desc) result = true;
    if (option === "Price Type" && priceType) result = true;
    if (option === "Total Sales" && totalSales > 0) result = true;
    // if (
    //   option === "Refresh" &&
    //   (saleDate || upc || desc || priceType || totalSales)
    // ) {
    //   return style;
    // }

    return result ? style : "";
  };

  const setFilterModal = (type: string) => {
    if (type === "Refresh") {
      dispatch(setCashierTableThreshComp({ gt: false, lt: false }));
      dispatch(setSaleDateFilter(""));
      dispatch(setFilterType(""));
      dispatch(setUpcFilter(""));
      dispatch(setDescFilter(""));
      dispatch(setPriceTypeFilter(""));
      dispatch(setTotalSalesFilter(0));
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
      <div className="rounded-t-lg text-center py-0.5 bg-blue-500 text-custom-white font-medium">
        Filter By
      </div>
      <div className="grid grid-row-6 p-2 gap-2">
        {filterOptions.map((option, i) => (
          <div
            key={i}
            className={`${panelStyle} ${activePanelStyle(option)}`}
            onClick={() => setFilterModal(option)}
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CashiersTableFilters;
