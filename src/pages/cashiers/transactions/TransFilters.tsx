import { useEffect } from "react";
import { useCashierCtx } from "..";
import {
  resetAllTransFilters,
  setFilteredTransList,
  setFilteredTransOverviews,
  setSelectedTransFilter,
  setTransFilterModalOpen,
} from "../../../features/cashiersSlice";

const TransFilters = () => {
  const ctx = useCashierCtx();

  const handleClick = (filter: string) => {
    ctx.dispatch(setSelectedTransFilter(filter));
    ctx.dispatch(setTransFilterModalOpen(true));
  };

  useEffect(() => {
    if (ctx.applyTransFilters) {
      const date = ctx.transDateFilter;
      const cashierName = ctx.transCashNameFilter.toLowerCase();
      const totalSales = ctx.transTotalSalesFilter;
      const totalQty = ctx.transTotalQtyFilter;

      const filtered = [...ctx.transOverviews].filter((item) => {
        const matchesDate = date.length
          ? new Date(item.sale_date).toDateString() ===
            new Date(date).toDateString()
          : true;
        const matchesCashierName = cashierName.length
          ? item.cashier_name.toLowerCase().includes(cashierName)
          : true;
        const matchesTotalSales = totalSales.operator.length
          ? eval(
              `${item.total_sales} ${totalSales.operator} ${totalSales.value}`,
            )
          : true;
        const matchesTotalQty = totalQty.operator.length
          ? eval(`${item.qty} ${totalQty.operator} ${totalQty.value}`)
          : true;

        return (
          matchesDate &&
          matchesCashierName &&
          matchesTotalQty &&
          matchesTotalSales
        );
      });
      ctx.dispatch(setFilteredTransOverviews(filtered));
    }
  }, [
    ctx.applyTransFilters,
    ctx.transCashNameFilter,
    ctx.transDateFilter,
    ctx.transTotalSalesFilter,
    ctx.transTotalQtyFilter,
  ]);

  const activeFilter = (filter: string) => {
    if (ctx.applyTransFilters) {
      if (filter === "date" && ctx.transDateFilter.length) return true;
      if (filter === "upc" && ctx.transUpcFilter.length) return true;
      if (filter === "cashier_name" && ctx.transCashNameFilter.length)
        return true;
      if (filter === "description" && ctx.transDescFilter.length) return true;
      if (filter === "total_sales" && ctx.transTotalSalesFilter.operator.length)
        return true;
      if (filter === "total_qty" && ctx.transTotalQtyFilter.operator.length)
        return true;
    }
    return false;
  };

  const renderText = (filter: string, label: string) => {
    if (ctx.applyTransFilters) {
      if (filter === "date" && ctx.transDateFilter.length)
        return `Date: ${ctx.transDateFilter}`;
      if (filter === "cashier_name" && ctx.transCashNameFilter.length)
        return `Cashier Name: ${ctx.transCashNameFilter}`;
      if (filter === "total_sales" && ctx.transTotalSalesFilter.operator.length)
        return `Total Sales: ${ctx.transTotalSalesFilter.operator} ${ctx.transTotalSalesFilter.value}`;
      if (filter === "total_qty" && ctx.transTotalQtyFilter.operator.length)
        return `Total Qty: ${ctx.transTotalQtyFilter.operator} ${ctx.transTotalQtyFilter.value}`;
    }
    return label;
  };

  const handleRefresh = () => {
    ctx.dispatch(resetAllTransFilters());
    ctx.dispatch(setFilteredTransList(ctx.transList));
    ctx.dispatch(setFilteredTransOverviews(ctx.transOverviews));
  };

  if (!ctx.transList.length) return null;

  return (
    <div className="shadow-lg">
      <div className="bg-blue-500 text-custom-white rounded-t-lg py-0.5 px-2 font-medium">
        Filter By
      </div>
      <div className="bg-custom-white grid p-2 gap-2 rounded-b-lg">
        <button
          className={`hover:bg-blue-200 shadow-md rounded-lg py-2 transition-all duration-200 ${
            activeFilter("date") ? "bg-orange-200" : ""
          }`}
          onClick={() => handleClick("date")}
        >
          {renderText("date", "Date")}
        </button>
        <button
          className={`hover:bg-blue-200 shadow-md rounded-lg py-2 transition-all duration-200 ${
            activeFilter("cashier_name") ? "bg-orange-200" : ""
          }`}
          onClick={() => handleClick("cashier_name")}
        >
          {renderText("cashier_name", "Cashier Name")}
        </button>
        <button
          className={`hover:bg-blue-200 shadow-md rounded-lg py-2 transition-all duration-200 ${
            activeFilter("total_qty") ? "bg-orange-200" : ""
          }`}
          onClick={() => handleClick("total_qty")}
        >
          {renderText("total_qty", "Total Qty")}
        </button>
        <button
          className={`hover:bg-blue-200 shadow-md rounded-lg py-2 transition-all duration-200 ${
            activeFilter("total_sales") ? "bg-orange-200" : ""
          }`}
          onClick={() => handleClick("total_sales")}
        >
          {renderText("total_sales", "Total Sales")}
        </button>
        <button
          className={`hover:bg-blue-200 shadow-md rounded-lg py-2 transition-all duration-200`}
          onClick={handleRefresh}
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default TransFilters;
