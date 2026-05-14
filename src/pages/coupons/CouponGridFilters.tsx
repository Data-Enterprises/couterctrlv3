import { useAppDispatch, useAppSelector } from "../../hooks";
import {
  resetFilters,
  setFilterModalOpen,
  setFilterType,
  type FilterType,
} from "../../features/couponSlice";

const filterOptions: (FilterType | "Refresh")[] = [
  "Store",
  "CpnAmount",
  "UPC",
  "Desc",
  "CustomerID",
  "Sub Department",
  "Refresh",
];

const CouponGridFilters = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.coupons);

  const activePanelStyle = (option: string) => {
    const storeNum = state.storeNum;
    const cpnAmount = state.cpnAmount;
    const productCode = state.productCode;
    const productDescription = state.productDescription;
    const customerId = state.customerId;

    // Declaring the active style and applying it to the matching conditions
    const style = "bg-orange-500 text-white font-semibold shadow-inner";
    let result = false;
    if (option === "Store" && storeNum) result = true;
    if (option === "UPC" && productCode) result = true;
    if (option === "Desc" && productDescription) result = true;
    if (option === "CpnAmount" && cpnAmount) result = true;
    if (option === "CustomerID" && customerId) result = true;
    if (option === "Sub Department" && state.subDept) result = true;
    return result ? style : "";
  };

  const renderFilterText = (type: FilterType) => {
    if (type === "Store") {
      return state.storeNum ? `${state.storeNum}` : "Store Number";
    } else if (type === "UPC") {
      return state.productCode ? `${state.productCode}` : "UPC";
    } else if (type === "Desc") {
      return state.productDescription
        ? `${state.productDescription}`
        : "Description";
    } else if (type === "CpnAmount") {
      return state.cpnAmount ? `${state.cpnAmount}` : "Coupon Amount";
    } else if (type === "CustomerID") {
      return state.customerId ? `${state.customerId}` : "Customer ID";
    } else if (type === "Sub Department") {
      return state.subDept ? `${state.subDept}` : "Sub Department";
    } else {
      return type;
    }
  };

  const setFilterModal = (option: FilterType | "Refresh") => {
    if (option === "Refresh") {
      dispatch(resetFilters());
    } else {
      dispatch(setFilterModalOpen(true));
      dispatch(setFilterType(option));
    }
  };

  const panelStyle =
    "py-1.5 text-[13px] xl:text-[13.5px] rounded-lg text-center shadow-md shadow-content/20 hover:bg-orange-200 cursor-pointer transition-all duration-200";

  return (
    <div className="bg-custom-white rounded-lg shadow-lg mt-4">
      <div className="font-medium rounded-t-lg px-2 py-0.5">
        Filter By
      </div>
      <div className="grid grid-cols-2 h-[1.5px]">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white"></div>
      </div>
      <div className="grid grid-row-6 p-2 gap-2">
        {filterOptions.map((option, i) => (
          <div
            key={i}
            data-testid={`coupons-table-filter-${option
              .split(" ")[0]
              .toLowerCase()}`}
            className={`${panelStyle} ${activePanelStyle(option)}`}
            onClick={() => setFilterModal(option)}
          >
            {renderFilterText(option as FilterType)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CouponGridFilters;
