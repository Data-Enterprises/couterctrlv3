/**
 * Dev copy of `features/receiversSlice.ts`, mounted at `state.dev.receivers` and read only
 * by `pages/receivers/dev`. Edit this one while changing dev receivers; when dev is
 * promoted, it replaces the prod slice. See src/store/devReducers.ts.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ReceiverListItem,
  ReceiverDetailsItem,
  ReceiverDetailsTotals,
} from "../../interfaces";

export type FilterType =
  | "VendorID"
  | "VendorName"
  | "InvoiceID"
  | "TransactionID"
  | "";

export type ReducedVendor = {
  vendorid: string;
  vendor_name: string;
  items: number;
  cashiers: number[];
  store_number: string;
};

export type RecMobileStage = 1 | 2 | 3;
export type Operator = { cashier_name: string; cashier_number: number };

interface ReceiversState {
  storeid: number;
  // Co-located stores: one storeid, two physical locations. The list is fetched
  // by storeid and comes back with both mixed together, so the page discovers
  // the numbers and lets the user scope to one. See utils/storeIdentity.
  availableStoreNumbers: string[];
  /** null = every location combined. */
  selectedStoreNumber: string | null;
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
  filterModalOpen: boolean;
  filterType: FilterType;
  noReceivers: boolean;
  selectedInvoice: string;
  selectedVendor: ReducedVendor | null;
}

export const initialState: ReceiversState = {
  storeid: 0,
  availableStoreNumbers: [],
  selectedStoreNumber: null,
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
  listGridData: [],
  filterModalOpen: false,
  filterType: "",
  noReceivers: false,
  selectedInvoice: "",
  selectedVendor: null,
};

export const receiversSlice = createSlice({
  // Distinct from the prod slice's "receivers": Redux matches actions on this
  // string alone, so sharing it would move prod and dev together.
  name: "devReceivers",
  initialState,
  reducers: {
    setStoreId: (state, action: PayloadAction<number>) => {
      state.storeid = action.payload;
    },
    setAvailableStoreNumbers: (state, action: PayloadAction<string[]>) => {
      state.availableStoreNumbers = action.payload;
    },
    setSelectedStoreNumber: (state, action: PayloadAction<string | null>) => {
      state.selectedStoreNumber = action.payload;
    },
    setReceiversList: (state, action: PayloadAction<ReceiverListItem[]>) => {
      state.list = action.payload;
    },
    setReceiverDetails: (
      state,
      action: PayloadAction<ReceiverDetailsItem[]>,
    ) => {
      state.details = action.payload;
    },
    setFilter: (
      state,
      action: PayloadAction<{ type: FilterType; value: string }>,
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
        // The properties needed from each individual item to apply the filters to
        const vId = item.vendorid.toString().toLowerCase();
        const vName = item.vendor_name.toLowerCase();
        const invId = item.invoiceid.toString();
        const transId = item.reference_number.toLowerCase();

        // Using the filters in the state to check for matches,
        // if the filter has no value, then it's not being used, so we consider it a match by default
        const vIdMatch = state.vendorIdFilter.length
          ? vId.includes(state.vendorIdFilter.toLowerCase())
          : true;

        const vNameMatch = state.vendorNameFilter.length
          ? vName.includes(state.vendorNameFilter.toLowerCase())
          : true;

        const invIdMatch = state.invoiceIdFilter.length
          ? transId.includes(state.invoiceIdFilter.toLowerCase())
          : true;

        const transIdMatch = state.transIDFilter.length
          ? invId.includes(state.transIDFilter.toLowerCase())
          : true;

        return vIdMatch && vNameMatch && invIdMatch && transIdMatch;
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
      state.selectedVendor = null;
    },
    setSelectedVendor: (state, action: PayloadAction<ReducedVendor | null>) => {
      state.selectedVendor = action.payload;
    },
    resetReceiverSlice: () => initialState,
  },
});

export const {
  setStoreId,
  setReceiversList,
  setAvailableStoreNumbers,
  setSelectedStoreNumber,
  setReceiverDetails,
  setIsFetchingList,
  setIsFetchingDetails,
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
  setSelectedVendor,
} = receiversSlice.actions;
export default receiversSlice.reducer;
