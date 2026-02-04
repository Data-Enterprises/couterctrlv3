import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ReceiverListItem,
  ReceiverDetailsItem,
  ReceiverDetailsTotals,
} from "../interfaces";

export type FilterType =
  | "VendorID"
  | "VendorName"
  | "InvoiceID"
  | "TransactionID"
  | "";

interface ReceiversState {
  storeid: number;
  list: ReceiverListItem[];
  listGridData: ReceiverListItem[];
  details: ReceiverDetailsItem[];
  vendorIdFilter: string;
  vendorNameFilter: string;
  invoiceIdFilter: string;
  transIDFilter: string;
  filterListGrid: boolean;
  totals: ReceiverDetailsTotals[];
  isFetchingList: boolean;
  isFetchingDetails: boolean;
  isExportModalOpen: boolean;
  filterModalOpen: boolean;
  filterType: FilterType;
  noReceivers: boolean;
  selectedInvoice: string;
}

export const initialState: ReceiversState = {
  storeid: 0,
  list: [],
  details: [],
  vendorIdFilter: "",
  vendorNameFilter: "",
  invoiceIdFilter: "",
  transIDFilter: "",
  filterListGrid: false,
  totals: [],
  isFetchingList: false,
  isFetchingDetails: false,
  isExportModalOpen: false,
  listGridData: [],
  filterModalOpen: false,
  filterType: "",
  noReceivers: false,
  selectedInvoice: "",
};

export const receiversSlice = createSlice({
  name: "receivers",
  initialState,
  reducers: {
    setStoreId: (state, action: PayloadAction<number>) => {
      state.storeid = action.payload;
    },
    setReceiversList: (state, action: PayloadAction<ReceiverListItem[]>) => {
      state.list = action.payload;
    },
    setReceiverDetails: (
      state,
      action: PayloadAction<ReceiverDetailsItem[]>
    ) => {
      state.details = action.payload;
    },
    setFilter: (
      state,
      action: PayloadAction<{ type: FilterType; value: string }>
    ) => {
      const { type, value } = action.payload;
      switch (type) {
        case "VendorID":
          state.vendorIdFilter = value;
          break;
        case "VendorName":
          state.vendorNameFilter = value;
          break;
        case "InvoiceID":
          state.invoiceIdFilter = value;
          break;
        case "TransactionID":
          state.transIDFilter = value;
          break;
      }
    },
    setTotals: (state, action: PayloadAction<ReceiverDetailsTotals[]>) => {
      state.totals = action.payload;
    },
    applyFilters: (state) => {
      const filteredData = state.list.filter((item) => {
        const idMatch = state.vendorIdFilter.toLowerCase();
        const nameMatch = state.vendorNameFilter.toLowerCase();
        const invoiceMatch = state.invoiceIdFilter;
        const transIDMatch = state.transIDFilter.toLowerCase();

        return (
          item.vendorid.toString().toLowerCase().includes(idMatch) &&
          item.vendor_name.toLowerCase().includes(nameMatch.toLowerCase()) &&
          item.invoiceid.toString().includes(invoiceMatch) &&
          item.reference_number.includes(transIDMatch)
        );
      });
      state.listGridData = filteredData;
    },
    setListGridData: (state, action: PayloadAction<ReceiverListItem[]>) => {
      state.listGridData = action.payload;
    },
    setIsFetchingList: (state, action: PayloadAction<boolean>) => {
      state.isFetchingList = action.payload;
    },
    setIsFetchingDetails: (state, action: PayloadAction<boolean>) => {
      state.isFetchingDetails = action.payload;
    },
    setIsExportModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isExportModalOpen = action.payload;
    },
    setFilterModalOpen: (state, action: PayloadAction<boolean>) => {
      state.filterModalOpen = action.payload;
    },
    setFilterType: (state, action: PayloadAction<FilterType>) => {
      state.filterType = action.payload;
    },
    setNoReceivers: (state, action: PayloadAction<boolean>) => {
      state.noReceivers = action.payload;
    },
    setSelectedInvoice: (state, action: PayloadAction<string>) => {
      state.selectedInvoice = action.payload;
    },
    resetFilters: (state) => {
      state.vendorIdFilter = "";
      state.vendorNameFilter = "";
      state.invoiceIdFilter = "";
      state.transIDFilter = "";
      state.listGridData = state.list;
      state.selectedInvoice = "";
    },
    reQuery: (state) => {
      state.list = [];
      state.listGridData = [];
      state.details = [];
      state.vendorIdFilter = "";
      state.vendorNameFilter = "";
      state.invoiceIdFilter = "";
      state.transIDFilter = "";
      state.filterListGrid = false;
      state.totals = [];
      state.noReceivers = false;
      state.selectedInvoice = "";
    },
    resetReceiverSlice: () => initialState,
  },
});

export const {
  setStoreId,
  setReceiversList,
  setReceiverDetails,
  setIsFetchingList,
  setIsFetchingDetails,
  setIsExportModalOpen,
  reQuery,
  setTotals,
  setListGridData,
  resetReceiverSlice,
  applyFilters,
  setFilter,
  setFilterType,
  setFilterModalOpen,
  resetFilters,
  setSelectedInvoice,
  setNoReceivers,
} = receiversSlice.actions;
export default receiversSlice.reducer;
