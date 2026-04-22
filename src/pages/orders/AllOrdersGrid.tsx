import { useOrdersCtx } from "./hooks";
import { theme, ordersCols } from ".";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import {
  // setOrderStatusFilter,
  setSubIdsFilter,
  // type OrderStatus,
} from "../../features/ordersSlice";
// import { useEffect } from "react";
ModuleRegistry.registerModules([AllCommunityModule]);

const AllOrdersGrid = () => {
  const ctx = useOrdersCtx();

  // useEffect(() => {
  //   if (ctx.filteredOrders.length) {
  //     const subIds = Array.from(new Set(ctx.filteredOrders.map((o) => o.sub_department)));

  //   }
  // }, [ctx.filteredOrders]);

  if (ctx.loadingAllOrders) {
    return (
      <div className="relative h-[calc(100vh-5rem)]">
        <LoadingIndicator message="Loading orders" />
      </div>
    );
  }

  if (!ctx.allOrders.length) return null;

  // const showOpenCloseAll = (status: OrderStatus) => {
  //   const currentStatus = ctx.orderStatusFilter;
  //   if (currentStatus === status) {
  //     ctx.dispatch(setOrderStatusFilter(""));
  //   } else {
  //     ctx.dispatch(setOrderStatusFilter(status));
  //   }
  // };

  const hadleSubIdClick = (subId: number) => {
    const currentSubIds = ctx.subIdsFilter;
    if (subId === 0) {
      ctx.dispatch(setSubIdsFilter([]));
    } else if (currentSubIds.includes(subId)) {
      ctx.dispatch(setSubIdsFilter(currentSubIds.filter((id) => id !== subId)));
    } else {
      ctx.dispatch(setSubIdsFilter([...currentSubIds, subId]));
    }
  };

  const currentOrders = () => {
    const result = [...ctx.filteredOrders].filter((o) => {
      const statusCheck = o.status
        .toLowerCase()
        .includes(ctx.orderStatusFilter);
      const subIdCheck =
        ctx.subIdsFilter.length === 0 ||
        ctx.subIdsFilter.includes(o.sub_department);
      return statusCheck && subIdCheck;
    });
    return result;
  };

  const currentCount = (subId: number) => {
    const result = [...ctx.filteredOrders].filter((o) => {
      const statusCheck = o.status
        .toLowerCase()
        .includes(ctx.orderStatusFilter);
      const subIdCheck = o.sub_department === subId;
      return statusCheck && subIdCheck;
    });
    return result.length;
  };

  return (
    <div className="bg-custom-white px-2 rounded-lg shadow-lg h-full grid grid-rows-[auto_1fr] relative">
      <div className="pb-1 pt-1.5 text-[11.5px] flex gap-4">
        {/* Sub Departments */}
        <div className="w-full">
          <div className="flex gap-2 flex-wrap">
            {ctx.uniqueSubs.map((s, i) => (
              <div
                key={i}
                className={`flex gap-1 rounded-full border border-content/40 shadow px-2 bg-bkg cursor-pointer hover:shadow-inner ${ctx.subIdsFilter.includes(s.subId) ? "bg-orange-200" : ""} transition-all duration-200`}
                onClick={() => hadleSubIdClick(s.subId)}
              >
                <div>{s.desc}</div>
                <div className="font-medium">{currentCount(s.subId)}</div>
              </div>
            ))}
            <div
              className={`flex gap-1 rounded-full border border-content/40 shadow px-2 bg-orange-500 text-custom-white cursor-pointer hover:shadow-inner transition-all duration-200`}
              onClick={() => hadleSubIdClick(0)}
            >
              <div>All</div>
              <div>{currentOrders().length}</div>
            </div>
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
