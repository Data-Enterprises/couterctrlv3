import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ReceiverListItem,
  ReceiverDetailsItem,
  ReceiverDetailsTotals,
} from "../interfaces";

interface ReceiversState {
  storeid: number;
  list: ReceiverListItem[];
  listGridData: ReceiverListItem[];
  details: ReceiverDetailsItem[];
  vendorIdFilter: string;
  vendorNameFilter: string;
  invoiceIdFilter: string;
  filterListGrid: boolean;
  totals: ReceiverDetailsTotals[];
  isFetchingList: boolean;
  isFetchingDetails: boolean;
  isExportModalOpen: boolean;
}

export const initialState: ReceiversState = {
  storeid: 0,
  list: [],
  details: [],
  vendorIdFilter: "",
  vendorNameFilter: "",
  invoiceIdFilter: "",
  filterListGrid: false,
  totals: [],
  isFetchingList: false,
  isFetchingDetails: false,
  isExportModalOpen: false,
  listGridData: [],
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
    setVendorIdFilter: (state, action: PayloadAction<string>) => {
      state.vendorIdFilter = action.payload;
    },
    setVendorNameFilter: (state, action: PayloadAction<string>) => {
      state.vendorNameFilter = action.payload;
    },
    setInvoiceIdFilter: (state, action: PayloadAction<string>) => {
      state.invoiceIdFilter = action.payload;
    },
    setTotals: (state, action: PayloadAction<ReceiverDetailsTotals[]>) => {
      state.totals = action.payload;
    },
    setListGridFilters: (state, action: PayloadAction<boolean>) => {
      state.filterListGrid = action.payload;

      if (!action.payload) {
        state.vendorIdFilter = "";
        state.vendorNameFilter = "";
        state.invoiceIdFilter = "";
        state.listGridData = state.list;
      }
    },
    applyFilters: (state) => {
      const filteredData = state.list.filter((item) => {
        const idMatch = state.vendorIdFilter.toLowerCase();
        const nameMatch = state.vendorNameFilter.toLowerCase();
        const invoiceMatch = state.invoiceIdFilter;

        return (
          item.vendorid.toString().toLowerCase().includes(idMatch) &&
          item.vendor_name.toLowerCase().includes(nameMatch.toLowerCase()) &&
          item.reference_number.includes(invoiceMatch)
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
    reQuery: (state) => {
      state.list = [];
      state.details = [];
      state.vendorIdFilter = "";
      state.vendorNameFilter = "";
      state.invoiceIdFilter = "";
      state.filterListGrid = false;
      state.totals = [];
    },
    resetReceiverState: () => initialState,
  },
});

export const {
  setStoreId,
  setReceiversList,
  setReceiverDetails,
  setVendorIdFilter,
  setVendorNameFilter,
  setInvoiceIdFilter,
  setListGridFilters,
  setIsFetchingList,
  setIsFetchingDetails,
  setIsExportModalOpen,
  reQuery,
  setTotals,
  setListGridData,
  resetReceiverState,
  applyFilters,
} = receiversSlice.actions;
export default receiversSlice.reducer;
