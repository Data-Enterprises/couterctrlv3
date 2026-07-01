import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import type { ItemFilterType } from "../../../../features/subMarginSlice";
import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../../utils";

const CostGridFilters = () => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const sm = useAppSelector((state) => state.subMarginLegacy);

  const divStyle =
    "py-2 flex justify-center items-center rounded-lg shadow-md hover:bg-blue-200 transition-all duration-200 cursor-pointer";

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
      dispatch(actions.setItemFilterType(""));
      dispatch(actions.resetFilters());
    } else {
      dispatch(actions.setItemFilterType(filter));
      dispatch(actions.setFilterModalOpen(true));
    }
  };

  return (
    <div className="">
      <div className="bg-custom-white text-[13px] font-medium px-2 py-0.5 rounded-t-lg">
        Item Filters
      </div>
      <div className="grid grid-cols-2 h-[1.5px]">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white"></div>
      </div>
      <div className="bg-custom-white text-[13px] rounded-b-lg shadow-lg">
        <div className="p-2 grid grid-rows-7 h-[94%] gap-3">
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
    </div>
  );
};

export default CostGridFilters;
