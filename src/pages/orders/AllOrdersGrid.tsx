import { useOrdersCtx } from "./hooks";
import { theme, ordersCols } from ".";
import { setSubKeysFilter } from "../../features/ordersLegacySlice";

import { AgGridReact } from "ag-grid-react";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { subDeptKeyMode, subDeptKeyOf } from "../../utils/subDeptIdentity";
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

  // The department a row belongs to. Keyed by id where the company numbers its
  // departments, by description where it doesn't — taken from allOrders so it
  // matches the chips, which are built from the same set.
  const subMode = subDeptKeyMode(ctx.allOrders);
  const subKey = (o: { sub_department: number; sub_department_description: string }) =>
    subDeptKeyOf(o, subMode);

  // "All" is its own action rather than a magic key — 0 used to mean it, which
  // is both a real department id and the only id every row has at a company
  // that doesn't number them.
  const clearSubFilter = () => ctx.dispatch(setSubKeysFilter([]));

  const hadleSubIdClick = (key: string) => {
    const current = ctx.subKeysFilter;
    ctx.dispatch(
      setSubKeysFilter(
        current.includes(key)
          ? current.filter((k) => k !== key)
          : [...current, key],
      ),
    );
  };

  const currentOrders = () => {
    const result = [...ctx.filteredOrders].filter((o) => {
      const statusCheck = o.status
        .toLowerCase()
        .includes(ctx.orderStatusFilter);
      const subIdCheck =
        ctx.subKeysFilter.length === 0 ||
        ctx.subKeysFilter.includes(subKey(o));
      return statusCheck && subIdCheck;
    });
    return result;
  };

  const currentCount = (key: string) => {
    const result = [...ctx.filteredOrders].filter((o) => {
      const statusCheck = o.status
        .toLowerCase()
        .includes(ctx.orderStatusFilter);
      const subIdCheck = subKey(o) === key;
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
                className={`flex gap-1 rounded-full border border-content/40 shadow px-2 cursor-pointer hover:shadow-inner ${ctx.subKeysFilter.includes(s.key) ? "bg-orange-200" : "bg-custom-white"} transition-all duration-200`}
                onClick={() => hadleSubIdClick(s.key)}
              >
                <div>{s.desc}</div>
                <div className="font-medium">{currentCount(s.key)}</div>
              </div>
            ))}
            <div
              className={`flex gap-1 rounded-full border border-content/40 shadow px-2 ${ctx.subKeysFilter.length === 0 ? "bg-orange-200" : "bg-custom-white"} cursor-pointer hover:shadow-inner transition-all duration-200`}
              onClick={clearSubFilter}
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
