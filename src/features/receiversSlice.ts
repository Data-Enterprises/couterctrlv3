import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ReceiverListItem, ReceiverDetailsItem, ReceiverDetailsTotals } from "../interfaces";

interface ReceiversState {
  storeid: number;
  list: ReceiverListItem[];
  details: ReceiverDetailsItem[];
  vendorIdFilter: string;
  vendorNameFilter: string;
  invoiceIdFilter: string;
  filterListGrid: boolean;
  totals: ReceiverDetailsTotals[];
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
      }
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
  reQuery,
  setTotals,
  resetReceiverState,
} = receiversSlice.actions;
export default receiversSlice.reducer;
