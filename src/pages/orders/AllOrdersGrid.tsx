import { useOrdersCtx } from "./hooks";
import { theme, ordersCols } from ".";
import { setSubIdsFilter } from "../../features/ordersLegacySlice";

import { AgGridReact } from "ag-grid-react";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
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
    <div className="rounded-lg h-full grid grid-rows-[auto_1fr]">
      <div className="pb-1 pt-1.5 text-[11.5px] flex gap-4">
        <div className="w-full select-none">
          <div className="flex gap-1 flex-wrap">
            {ctx.uniqueSubs.map((s, i) => (
              <div
                key={i}
                className={`flex gap-1 rounded-full border border-content/40 shadow px-2 cursor-pointer hover:shadow-inner ${ctx.subIdsFilter.includes(s.subId) ? "bg-orange-200" : "bg-custom-white"} transition-all duration-200`}
                onClick={() => hadleSubIdClick(s.subId)}
              >
                <div>{s.desc}</div>
                <div className="font-medium">{currentCount(s.subId)}</div>
              </div>
            ))}
            <div
              className={`flex gap-1 rounded-full border border-content/40 shadow px-2 ${ctx.subIdsFilter.length === 0 ? "bg-orange-200" : "bg-custom-white"} cursor-pointer hover:shadow-inner transition-all duration-200`}
              onClick={() => hadleSubIdClick(0)}
            >
              <div>All</div>
              <div className="font-medium">{ctx.filteredOrders.length}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-lg shadow-lg">
        <AgGridReact
          rowData={currentOrders()}
          columnDefs={ordersCols}
          theme={theme}
          pagination={true}
          paginationAutoPageSize={true}
        />
      </div>
    </div>
  );
};

export default AllOrdersGrid;
