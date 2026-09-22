import type { AdminOption, StoreWithActivity } from "../../interfaces";
import type { ColDef } from "ag-grid-community";

export const adminOptions: AdminOption[] = [
  {
    label: "User",
    option: 1,
  },
  {
    label: "Company",
    option: 2,
  },
  {
    label: "Store",
    option: 3,
  },
  {
    label: "Vendor",
    option: 4,
  },
];

export const storeActivityColumns: ColDef<StoreWithActivity>[] = [
  {
    field: "storeid",
    headerName: "Store ID",
  },
  {
    field: "store_name",
    headerName: "Store Name",
  },
  {
    field: "total_days_in_range",
    headerName: "Total Days",
  },
  {
    field: "active_days",
    headerName: "Days Active",
  },
  {
    field: "inactive_or_missing_days",
    headerName: "Days Missing",
  },
];
