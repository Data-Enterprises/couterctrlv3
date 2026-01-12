import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ReceiverListItem, ReceiverDetailsItem } from "../interfaces";

interface ReceiversState {
  storeid: number;
  list: ReceiverListItem[];
  details: ReceiverDetailsItem[];
  vendorIdFilter: string;
  vendorNameFilter: string;
  invoiceIdFilter: string;
  filterListGrid: boolean;
}

export const initialState: ReceiversState = {
  storeid: 0,
  list: [],
  details: [],
  vendorIdFilter: "",
  vendorNameFilter: "",
  invoiceIdFilter: "",
  filterListGrid: false,
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
    setListGridFilters: (state, action: PayloadAction<boolean>) => {
      state.filterListGrid = action.payload;
    },
    clearFilters: (state) => {
      state.vendorIdFilter = "";
      state.vendorNameFilter = "";
      state.invoiceIdFilter = "";
      state.filterListGrid = false;
    },
    reQuery: (state) => {
      state.list = [];
      state.details = [];
      state.vendorIdFilter = "";
      state.vendorNameFilter = "";
      state.invoiceIdFilter = "";
      state.filterListGrid = false;
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
  clearFilters,
  reQuery,
  resetReceiverState,
} = receiversSlice.actions;
export default receiversSlice.reducer;
