import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ReceiverListItem, ReceiverDetailsItem } from "../interfaces";

interface ReceiversState {
  storeid: number;
  list: ReceiverListItem[];
  details: ReceiverDetailsItem[];
  vendorIdFilter: number;
  vendorNameFilter: string;
  invoiceIdFilter: number;
}

export const initialState: ReceiversState = {
  storeid: 0,
  list: [],
  details: [],
  vendorIdFilter: 0,
  vendorNameFilter: "",
  invoiceIdFilter: 0,
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
    setVendorIdFilter: (state, action: PayloadAction<number>) => {
      state.vendorIdFilter = action.payload;
    },
    setVendorNameFilter: (state, action: PayloadAction<string>) => {
      state.vendorNameFilter = action.payload;
    },
    setInvoiceIdFilter: (state, action: PayloadAction<number>) => {
      state.invoiceIdFilter = action.payload;
    },
    clearFilters: (state) => {
      state.vendorIdFilter = 0;
      state.vendorNameFilter = "";
      state.invoiceIdFilter = 0;
    },
    reQuery: (state) => {
      state.list = [];
      state.details = [];
      state.vendorIdFilter = 0;
      state.vendorNameFilter = "";
      state.invoiceIdFilter = 0;
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
  clearFilters,
  reQuery,
  resetReceiverState,
} = receiversSlice.actions;
export default receiversSlice.reducer;
