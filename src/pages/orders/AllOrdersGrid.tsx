import { useOrdersCtx } from "./hooks";
import { theme, ordersCols } from ".";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import {
  setOrderStatusFilter,
  type OrderStatus,
} from "../../features/ordersSlice";
ModuleRegistry.registerModules([AllCommunityModule]);

const AllOrdersGrid = () => {
  const ctx = useOrdersCtx();

  if (ctx.loadingAllOrders) {
    return (
      <div className="relative h-[calc(100vh-5rem)]">
        <LoadingIndicator message="Loading orders" />
      </div>
    );
  }

  if (!ctx.allOrders.length) return null;

  const showOpenCloseAll = (status: OrderStatus) => {
    const currentStatus = ctx.orderStatusFilter;
    if (currentStatus === status) {
      ctx.dispatch(setOrderStatusFilter(""));
    } else {
      ctx.dispatch(setOrderStatusFilter(status));
    }
  };

  const currentOrders = () => {
    const copy = [...ctx.filteredOrders];
    if (ctx.orderStatusFilter) {
      return copy.filter(
        (o) => o.status.toLowerCase() === ctx.orderStatusFilter,
      );
    }
    return copy;
  };

  return (
    <div className="bg-custom-white px-2 pb-2 rounded-lg shadow-lg h-full grid grid-rows-[auto_1fr] relative">
      <div className="py-2 text-xs">
        <div className="flex gap-2">
          <div
            className={`rounded-full shadow-md px-2 bg-bkg cursor-pointer ${ctx.orderStatusFilter === "open" ? "bg-orange-200" : ""} transition-all duration-200`}
            onClick={() => showOpenCloseAll("open")}
          >
            Open
          </div>
          <div
            className={`rounded-full shadow-md px-2 bg-bkg cursor-pointer ${ctx.orderStatusFilter === "closed" ? "bg-orange-200" : ""} transition-all duration-200`}
            onClick={() => showOpenCloseAll("closed")}
          >
            Closed
          </div>
        </div>
      </div>
      <AgGridReact
        rowData={currentOrders()}
        columnDefs={ordersCols}
        theme={theme}
        pagination={true}
        paginationAutoPageSize={true}
      />
    </div>
  );
};

export default AllOrdersGrid;
