import { type ItemFilterType } from "../../../features/subMarginSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useSubMarginActions } from "../hooks/useSubMarginActions";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

const ItemsGridFiltersTablet = () => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const sm = useAppSelector((state) => state.subMargin);

  const divStyle =
    "bg-bkg/75 py-1.5 text-[11px] text-center rounded-full shadow-md transition-all duration-200";

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
  );
};

export default ItemsGridFiltersTablet;
