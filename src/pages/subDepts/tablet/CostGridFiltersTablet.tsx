import {
  resetFilters,
  setFilterModalOpen,
  setItemFilterType,
  type ItemFilterType,
} from "../../../features/subMarginSlice";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

const CostGridFiltersTablet = () => {
  const dispatch = useAppDispatch();
  const sm = useAppSelector((state) => state.subMargin);

  const divStyle =
    "bg-bkg/75 py-1.5 text-[11px] text-center rounded-full shadow-md transition-all duration-200";

  const canRefresh = () => {
    if (
      !sm.upcFilter &&
      !sm.descFilter &&
      !sm.salesFilter.operator &&
      !sm.qtyFilter.operator &&
      !sm.cogsFilter.operator &&
      !sm.marginFilter.operator
    ) {
      return false;
    }
    return true;
  };

  const divText = (filter: ItemFilterType) => {
    if (filter === "upc") {
      return sm.upcFilter.length ? `Upc: ${sm.upcFilter}` : "Upc";
    } else if (filter === "description") {
      return sm.descFilter.length
        ? `Description: ${sm.descFilter}`
        : "Description";
    } else if (filter === "unitCost") {
      return sm.unitCostFilter.value
        ? `Unit Cost ${sm.unitCostFilter.operator} ${formatCurrency2(sm.unitCostFilter.value)}`
        : "Unit Cost";
    } else if (filter === "qty") {
      return sm.qtyFilter.value
        ? `Qty ${sm.qtyFilter.operator} ${formatBigNumber(sm.qtyFilter.value, 0)}`
        : "Qty";
    } else if (filter === "cogs") {
      return sm.cogsFilter.value
        ? `COGS ${sm.cogsFilter.operator} ${formatCurrency2(sm.cogsFilter.value)}`
        : "COGS";
    } else if (filter === "caseCost") {
      return sm.caseCostFilter.value
        ? `Case Cost ${sm.caseCostFilter.operator} ${formatCurrency2(sm.caseCostFilter.value)}`
        : "Case Cost";
    }

    // at this point, we're at the Refresh div => this is the default return
    return "Refresh";
  };

  const handleClick = (filter: ItemFilterType) => {
    if (filter === "") {
      dispatch(setItemFilterType(""));
      dispatch(resetFilters());
    } else {
      dispatch(setItemFilterType(filter));
      dispatch(setFilterModalOpen(true));
    }
  };

  return (
    <div className="">
      <div className="bg-custom-white text-[13.5px] font-medium pb-0.5 rounded-t-lg">
        Item Filters
      </div>
      <div className="grid grid-cols-2 h-[1.5px]">
        <div className="bg-gradient-to-r from-[rgb(30,45,80)] to-custom-white"></div>
        <div className="bg-gradient-to-l from-[rgb(30,45,80)] to-custom-white"></div>
      </div>
      <div className="grid grid-cols-7 gap-3 mt-1.5">
        <div
          className={`${divStyle} ${sm.upcFilter.length ? "bg-orange-200" : ""}`}
          onClick={() => handleClick("upc")}
        >
          {divText("upc")}
        </div>
        <div
          className={`${divStyle} ${sm.descFilter.length ? "bg-orange-200" : ""}`}
          onClick={() => handleClick("description")}
        >
          {divText("description")}
        </div>
        <div
          className={`${divStyle} ${sm.unitCostFilter.operator ? "bg-orange-200" : ""}`}
          onClick={() => handleClick("unitCost")}
        >
          {divText("unitCost")}
        </div>
        <div
          className={`${divStyle} ${sm.caseCostFilter.operator ? "bg-orange-200" : ""}`}
          onClick={() => handleClick("caseCost")}
        >
          {divText("caseCost")}
        </div>
        <div
          className={`${divStyle} ${sm.qtyFilter.operator ? "bg-orange-200" : ""}`}
          onClick={() => handleClick("qty")}
        >
          {divText("qty")}
        </div>
        <div
          className={`${divStyle} ${sm.cogsFilter.operator ? "bg-orange-200" : ""}`}
          onClick={() => handleClick("cogs")}
        >
          {divText("cogs")}
        </div>
        <div
          className={`${divStyle} ${canRefresh() ? "bg-orange-200" : ""}`}
          onClick={() => handleClick("")}
        >
          {divText("")}
        </div>
      </div>
    </div>
  );
};

export default CostGridFiltersTablet;
