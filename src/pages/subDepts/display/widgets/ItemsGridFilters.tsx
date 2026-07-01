import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import type { ItemFilterType } from "../../../../features/subMarginSlice";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../../utils";

const ItemsGridFilters = () => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const sm = useAppSelector((state) => state.subMargin);

  const divStyle =
    "py-1 text-sm flex justify-center items-center rounded-lg shadow-md hover:bg-blue-200 transition-all duration-200 cursor-pointer";

  const handleClick = (filter: ItemFilterType) => {
    if (filter === "") {
      dispatch(actions.setItemFilterType(""));
      dispatch(actions.resetFilters());
    } else {
      dispatch(actions.setItemFilterType(filter));
      dispatch(actions.setFilterModalOpen(true));
    }
  };

  const divText = (filter: ItemFilterType) => {
    if (filter === "upc") {
      return sm.upcFilter.length ? `Upc: ${sm.upcFilter}` : "Upc";
    } else if (filter === "description") {
      return sm.descFilter.length
        ? `Description: ${sm.descFilter}`
        : "Description";
    } else if (filter === "sales") {
      return sm.salesFilter.value
        ? `Sales ${sm.salesFilter.operator} ${formatCurrency2(sm.salesFilter.value)}`
        : "Sales";
    } else if (filter === "qty") {
      return sm.qtyFilter.value
        ? `Qty ${sm.qtyFilter.operator} ${formatBigNumber(sm.qtyFilter.value, 0)}`
        : "Qty";
    } else if (filter === "cogs") {
      return sm.cogsFilter.value
        ? `COGS ${sm.cogsFilter.operator} ${formatCurrency2(sm.cogsFilter.value)}`
        : "COGS";
    } else if (filter === "margin") {
      return sm.marginFilter.value
        ? `Margin ${sm.marginFilter.operator} ${formatBigNumber(sm.marginFilter.value, 2)}%`
        : "Margin";
    }

    // at this point, we're at the Refresh div => this is the default return
    return "Refresh";
  };

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
        <div className="p-2 grid h-[93%] gap-2">
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
            className={`${divStyle} ${sm.salesFilter.operator ? "bg-orange-200" : ""}`}
            onClick={() => handleClick("sales")}
          >
            {divText("sales")}
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
            className={`${divStyle} ${sm.marginFilter.operator ? "bg-orange-200" : ""}`}
            onClick={() => handleClick("margin")}
          >
            {divText("margin")}
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

export default ItemsGridFilters;
