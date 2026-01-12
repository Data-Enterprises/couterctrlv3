import { useState, useEffect } from "react";
import { useAppSelector } from "../../hooks";
import type { ReceiverListItem } from "../../interfaces";
import { AgGridReact } from "ag-grid-react";
import { theme } from ".";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ColGroupDef,
} from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

const ReceiversListGrid = () => {
  const state = useAppSelector((state) => state.receivers);
  const [filtered, setFiltered] = useState<ReceiverListItem[]>([]);

  useEffect(() => {
    if (state.filterListGrid) {
      const filteredData = state.list.filter((item) => {
        const idMatch = state.vendorIdFilter;
        const nameMatch = state.vendorNameFilter;
        const invoiceMatch = state.invoiceIdFilter;

        return (
          item.vendorid.toString().includes(idMatch) &&
          item.vendor_name.toLowerCase().includes(nameMatch.toLowerCase()) &&
          item.reference_number.toString().includes(invoiceMatch)
        );
      });
      setFiltered(filteredData);
    } else {
      setFiltered(state.list);
    }
  }, [state.filterListGrid]);

  const cols: (ColDef<ReceiverListItem> | ColGroupDef<ReceiverListItem>)[] = [
    {
      headerName: "Date",
      field: "invoice_date",
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Date",
      field: "invoice_date",
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Store",
      field: "store_number",
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
      valueFormatter: () => `${state.storeid}`,
    },
    {
      headerName: "Trans",
      field: "invoiceid",
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Name",
      field: "vendor_name",
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Invoice #",
      field: "reference_number",
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Items",
      field: "items",
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
  ];

  return (
    <div>
      <div>Select Receiver</div>
      <AgGridReact rowData={filtered} columnDefs={cols} theme={theme} />
    </div>
  );
};

export default ReceiversListGrid;
