import { useEffect } from "react";
import { useCashierCtx } from "..";
import {
  resetAllTransFilters,
  setFilteredTransList,
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
      const upc = ctx.transUpcFilter;
      const desc = ctx.transDescFilter.toLowerCase();
      const cashierName = ctx.transCashNameFilter.toLowerCase();
      const totalSales = ctx.transTotalSalesFilter;

      const filtered = [...ctx.transList].filter((item) => {
        const matchesDate = date.length ? item.sale_date.includes(date) : true;
        const matchesUpc =
          upc.length && item.product_code
            ? item.product_code.includes(upc)
            : true;
        const matchesDesc =
          desc.length && item.product_description
            ? item.product_description.toLowerCase().includes(desc)
            : true;
        const matchesCashierName = cashierName.length
          ? item.cashier_name.toLowerCase().includes(cashierName)
          : true;
        const matchesTotalSales =
          totalSales.operator.length && totalSales.value
            ? eval(
                `${item.total_sales} ${totalSales.operator} ${totalSales.value}`,
              )
            : true;

        return (
          matchesDate &&
          matchesUpc &&
          matchesDesc &&
          matchesCashierName &&
          matchesTotalSales
        );
      });

      ctx.dispatch(setFilteredTransList(filtered));
    }
  }, [
    ctx.applyTransFilters,
    ctx.transCashNameFilter,
    ctx.transDateFilter,
    ctx.transDescFilter,
    ctx.transTotalSalesFilter,
    ctx.transUpcFilter,
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
    }
    return false;
  };

  const renderText = (filter: string, label: string) => {
    if (ctx.applyTransFilters) {
      if (filter === "date" && ctx.transDateFilter.length)
        return `Date: ${ctx.transDateFilter}`;
      if (filter === "upc" && ctx.transUpcFilter.length)
        return `UPC: ${ctx.transUpcFilter}`;
      if (filter === "cashier_name" && ctx.transCashNameFilter.length)
        return `Cashier Name: ${ctx.transCashNameFilter}`;
      if (filter === "description" && ctx.transDescFilter.length)
        return `Description: ${ctx.transDescFilter}`;
      if (filter === "total_sales" && ctx.transTotalSalesFilter.operator.length)
        return `Total Sales: ${ctx.transTotalSalesFilter.operator} ${ctx.transTotalSalesFilter.value}`;
    }
    return label;
  };

  const handleRefresh = () => {
    ctx.dispatch(resetAllTransFilters());
    ctx.dispatch(setFilteredTransList(ctx.transList));
  };

  return (
    <div className="shadow-lg">
      <div className="bg-blue-500 text-custom-white rounded-t-lg py-0.5 px-2 font-medium">
        Filter By
      </div>
      <div className="bg-custom-white grid p-2 gap-2 rounded-b-lg">
        <button
          className={`hover:shadow-inner shadow-md rounded-lg py-2 text-sm transition-all duration-200 ${
            activeFilter("date") ? "bg-orange-200" : ""
          }`}
          onClick={() => handleClick("date")}
        >
          {renderText("date", "Date")}
        </button>
        <button
          className={`hover:shadow-inner shadow-md rounded-lg py-2 text-sm transition-all duration-200 ${
            activeFilter("upc") ? "bg-orange-200" : ""
          }`}
          onClick={() => handleClick("upc")}
        >
          {renderText("upc", "UPC")}
        </button>
        <button
          className={`hover:shadow-inner shadow-md rounded-lg py-2 text-sm transition-all duration-200 ${
            activeFilter("cashier_name") ? "bg-orange-200" : ""
          }`}
          onClick={() => handleClick("cashier_name")}
        >
          {renderText("cashier_name", "Cashier Name")}
        </button>
        <button
          className={`hover:shadow-inner shadow-md rounded-lg py-2 text-sm transition-all duration-200 ${
            activeFilter("description") ? "bg-orange-200" : ""
          }`}
          onClick={() => handleClick("description")}
        >
          {renderText("description", "Description")}
        </button>
        <button
          className={`hover:shadow-inner shadow-md rounded-lg py-2 text-sm transition-all duration-200 ${
            activeFilter("total_sales") ? "bg-orange-200" : ""
          }`}
          onClick={() => handleClick("total_sales")}
        >
          {renderText("total_sales", "Total Sales")}
        </button>
        <button
          className={`hover:shadow-inner shadow-md rounded-lg py-2 text-sm transition-all duration-200`}
          onClick={handleRefresh}
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default TransFilters;
