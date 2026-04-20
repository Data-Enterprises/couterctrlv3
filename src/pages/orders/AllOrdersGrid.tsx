import { useOrdersCtx } from "./hooks";
import { theme, ordersCols } from ".";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
ModuleRegistry.registerModules([AllCommunityModule]);

const AllOrdersGrid = () => {
  const ctx = useOrdersCtx();

  if (ctx.loadingAllOrders) {
    return (
      <div className="relative h-full">
        <LoadingIndicator message="Loading orders" />
      </div>
    );
  }

  if (!ctx.allOrders.length) return null;

  return (
    <div className="bg-custom-white p-2 rounded-lg shadow-lg h-full relative">
      <AgGridReact
        rowData={ctx.filteredOrders}
        columnDefs={ordersCols}
        theme={theme}
        pagination={true}
        paginationAutoPageSize={true}
      />
    </div>
  );
};

export default AllOrdersGrid;
