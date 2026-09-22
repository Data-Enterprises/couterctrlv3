import type { ColDef } from "ag-grid-community";
import type { MissingStore } from "../../../interfaces";

export const adminMissingSalesColumns: ColDef<MissingStore>[] = [
  { headerName: "Store ID", field: "storeid" },
  { headerName: "Store Name", field: "store_name" },
  { headerName: "Store Number", field: "store_number" },
];
