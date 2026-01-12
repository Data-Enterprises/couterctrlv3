import { useState, useEffect } from "react";
import { useAppSelector } from "../../hooks";
import type { ReceiverListItem } from "../../interfaces";
import { AgGridReact } from "ag-grid-react";
import { cols, theme } from ".";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

const ReceiversListGrid = () => {
  const state = useAppSelector((state) => state.receivers);
  const [filtered, setFiltered] = useState<ReceiverListItem[]>([]);

  useEffect(() => {
    if (state.list.length === 0) return;

    if (state.filterListGrid) {
      const filteredData = state.list.filter((item) => {
        const idMatch = state.vendorIdFilter.toLowerCase();
        const nameMatch = state.vendorNameFilter.toLowerCase();
        const invoiceMatch = state.invoiceIdFilter;

        return (
          item.vendorid.toString().toLowerCase().includes(idMatch) &&
          item.vendor_name.toLowerCase().includes(nameMatch.toLowerCase()) &&
          item.reference_number.toString().includes(invoiceMatch)
        );
      });
      setFiltered(filteredData);
    } else {
      setFiltered(state.list);
    }
  }, [state.filterListGrid, state.list]);

  return (
    <div className="bg-custom-white rounded-lg shadow-lg h-full w-3/4 p-2">
      <div className="text-sm font-medium pl-0.5">Select Receiver</div>
      <div className="h-[87%]">
        <AgGridReact
          rowData={filtered}
          columnDefs={cols}
          theme={theme}
          pagination={true}
          paginationAutoPageSize={true}
        />
      </div>
    </div>
  );
};

export default ReceiversListGrid;
