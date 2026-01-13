import { useCouponContext } from ".";
import { cols, theme } from ".";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

const CouponsGrid = () => {
  const context = useCouponContext();

  return (
    <div
      className={`bg-custom-white w-full h-full rounded-lg shadow-lg p-2`}
    >
      <AgGridReact
        rowData={context.gridCoupons}
        columnDefs={cols}
        theme={theme}
        pagination={true}
        paginationAutoPageSize={true}
      />
    </div>
  );
};

export default CouponsGrid;
