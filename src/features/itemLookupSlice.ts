import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ItemLookup {
  casecost: number;
  category_description: string;
  extended_cost: number;
  price: number;
  product_code: string;
  product_description: string;
  qty: number;
  store_name: string;
  store_number: string;
  total_sales: number;
}

// missing sale_date after product_description, and total_sales at the end
export interface ItemLookupHistory {
  casecost: number;
  category_description: string;
  extended_cost: number;
  price: number;
  product_code: string;
  product_description: string;
  qty: number;
  sale_date: string; // split at T [0]
  store_name: string;
  store_number: string;
  storeid: number;
  total_sales: number;
  /** Pounds sold on a scale item, 0 on an each-priced one. This — not `qty`,
   *  which counts rings — is what COGS multiplies by. */
  weight: number;
  /** Cost after vendor allowance, per CASE. `casecost` is per unit, so the two
   *  are in different units and must not be compared directly. See
   *  `rowUnitCost` for how it gets brought down to a unit. */
  net_cost: number;
  /** List/invoice cost, per CASE. Optional until the endpoint adds it — with
   *  it, `net_cost` can be converted to a per-unit figure without `case_size`
   *  (see `rowUnitCost`). */
  cost?: number;
  /** Cost of one unit after vendor allowance, falling back to list cost when
   *  there's no allowance — the figure Sub Dept Margins costs against.
   *
   *  Optional because it lands with the next endpoint deploy; `rowCogs` falls
   *  back to `casecost` until then, so the two releases don't have to be
   *  coordinated. Once it's live this can lose the `?`. */
  unit_cost?: number;
  /** Server-side COGS: `unit_cost` x weight-or-qty. Not consumed — we compute
   *  our own so the figure survives this field being absent — but typed so the
   *  payload is documented in one place. */
  cogs?: number;
}

export interface RecentLookup {
  productCode: string;
  description: string;
  marginPct: number | null;
  /** The window's totals and unit cost as of the lookup, so the recent list
   *  can carry the same columns as the item's own breakdown rather than just
   *  asserting a margin. */
  qty: number;
  revenue: number;
  unitCost: number;
}

export type QueueItemStatus = "queued" | "loading" | "loaded" | "error";

export interface QueueItem {
  upc: string;
  status: QueueItemStatus;
  productCode?: string;
  description?: string;
  categoryDescription?: string;
  // Full unscoped history as returned. Kept intact so switching between
  // co-located locations can re-derive the totals below without refetching.
  history?: ItemLookupHistory[];
  totalSales?: number;
  totalQty?: number;
  daysSold?: number;
  marginPct?: number | null;
  errorMessage?: string;
}

interface ItemLookupState {
  upcCode: string;
  mode: "Sales" | "Qty" | "Price";
  recentLookups: RecentLookup[];
  topStoreSales: ItemLookup | null;
  lowestStoreSales: ItemLookup | null;
  topStoreQty: ItemLookup | null;
  lowestStoreQty: ItemLookup | null;
  highestPriceStore: ItemLookup | null;
  lowestPriceStore: ItemLookup | null;
  totalStores: number;
  productCode: string;
  description: string;
  categoryDescription: string;
  totalSales: number;
  totalQty: number;
  avgPrice: number;
  itemsLoaded: boolean;
  selectedStore: number;
  itemLookupHistory: ItemLookupHistory[];
  daysSold: number;
  pause: boolean;
  viewSearch: boolean;
  viewHistory: boolean;
  viewDaily: boolean;
  lookupQueue: QueueItem[];
  lookupSelectedUpc: string | null;
  // Co-located stores: one storeid, two physical locations. The lookup is by
  // storeid, so its history covers both. See utils/storeIdentity.
  availableStoreNumbers: string[];
  /** null = every location combined. */
  selectedStoreNumber: string | null;
}

const initialState: ItemLookupState = {
  upcCode: "",
  mode: "Sales",
  recentLookups: [],
  topStoreSales: null,
  lowestStoreSales: null,
  topStoreQty: null,
  lowestStoreQty: null,
  highestPriceStore: null,
  lowestPriceStore: null,
  totalStores: 0,
  productCode: "",
  description: "",
  categoryDescription: "",
  totalSales: 0,
  totalQty: 0,
  avgPrice: 0,
  itemsLoaded: false,
  selectedStore: 0,
  itemLookupHistory: [],
  daysSold: 0,
  pause: true,
  viewSearch: true,
  viewHistory: false,
  viewDaily: false,
  lookupQueue: [],
  lookupSelectedUpc: null,
  availableStoreNumbers: [],
  selectedStoreNumber: null,
};

interface ItemsPayload {
  top_store_sales: ItemLookup;
  lowest_store_sales: ItemLookup;
  top_store_qty: ItemLookup;
  lowest_store_qty: ItemLookup;
  highest_price_store: ItemLookup;
  lowest_price_store: ItemLookup;
}

interface HistoryMetrics {
  totalSales: number;
  totalQty: number;
  avgPrice: number;
  daysSold: number;
}

const itemLookupSlice = createSlice({
  name: "itemLookup",
  initialState,
  reducers: {
    setUpcCode: (state, action: PayloadAction<string>) => {
      state.upcCode = action.payload;
    },
    setItems: (state, action: PayloadAction<ItemsPayload>) => {
      state.topStoreSales = action.payload.top_store_sales;
      state.lowestStoreSales = action.payload.lowest_store_sales;
      state.topStoreQty = action.payload.top_store_qty;
      state.lowestStoreQty = action.payload.lowest_store_qty;
      state.highestPriceStore = action.payload.highest_price_store;
      state.lowestPriceStore = action.payload.lowest_price_store;
    },
    setMode: (state, action: PayloadAction<"Sales" | "Qty" | "Price">) => {
      state.mode = action.payload;
    },
    setItemsLoaded: (state, action: PayloadAction<boolean>) => {
      state.itemsLoaded = action.payload;
    },
    setProductCode: (state, action: PayloadAction<string>) => {
      state.productCode = action.payload;
    },
    setDescription: (state, action: PayloadAction<string>) => {
      state.description = action.payload;
    },
    setCategoryDescription: (state, action: PayloadAction<string>) => {
      state.categoryDescription = action.payload;
    },
    setMetrics: (
      state,
      action: PayloadAction<{
        totalStores: number;
        totalSales: number;
        totalQty: number;
        avgPrice: number;
      }>,
    ) => {
      state.totalStores = action.payload.totalStores;
      state.totalSales = action.payload.totalSales;
      state.totalQty = action.payload.totalQty;
      state.avgPrice = action.payload.avgPrice;
    },
    setSelectedStore: (state, action: PayloadAction<number>) => {
      if (state.selectedStore === action.payload) {
        state.selectedStore = 0;
      } else {
        state.selectedStore = action.payload;
      }
    },
    setItemLookupHistory: (
      state,
      action: PayloadAction<ItemLookupHistory[]>,
    ) => {
      state.itemLookupHistory = action.payload;
    },
    setHistoryMetrics: (state, action: PayloadAction<HistoryMetrics>) => {
      state.totalSales = action.payload.totalSales;
      state.totalQty = action.payload.totalQty;
      state.avgPrice = action.payload.avgPrice;
      state.daysSold = action.payload.daysSold;
    },
    setPause: (state, action: PayloadAction<boolean>) => {
      state.pause = action.payload;
    },
    addRecentLookup: (state, action: PayloadAction<RecentLookup>) => {
      const filtered = state.recentLookups.filter(
        (r) => r.productCode !== action.payload.productCode,
      );
      state.recentLookups = [action.payload, ...filtered].slice(0, 8);
    },
    setILView: (
      state,
      action: PayloadAction<"search" | "history" | "daily">,
    ) => {
      state.viewSearch = action.payload === "search";
      state.viewHistory = action.payload === "history";
      state.viewDaily = action.payload === "daily";
    },
    reQueryUpc: (
      state,
      action: PayloadAction<{ isResettingUpcCode: boolean }>,
    ) => {
      const { isResettingUpcCode } = action.payload;
      if (isResettingUpcCode) {
        state.upcCode = "";
      }
      state.mode = "Sales";
      state.topStoreSales = null;
      state.lowestStoreSales = null;
      state.topStoreQty = null;
      state.lowestStoreQty = null;
      state.highestPriceStore = null;
      state.lowestPriceStore = null;
      state.totalStores = 0;
      state.productCode = "";
      state.description = "";
      state.categoryDescription = "";
      state.totalSales = 0;
      state.totalQty = 0;
      state.avgPrice = 0;
      state.itemsLoaded = false;
      // state.selectedStore = 0;
      state.itemLookupHistory = [];
      state.daysSold = 0;
      state.pause = true;
      state.viewHistory = false;
      state.viewDaily = false;
    },
    resetLookupSlice: () => initialState,
    setLookupQueue: (state, action: PayloadAction<QueueItem[]>) => {
      state.lookupQueue = action.payload;
    },
    updateLookupQueueItem: (
      state,
      action: PayloadAction<{ upc: string; patch: Partial<QueueItem> }>,
    ) => {
      const { upc, patch } = action.payload;
      state.lookupQueue = state.lookupQueue.map((q) =>
        q.upc === upc ? { ...q, ...patch } : q,
      );
    },
    setLookupSelectedUpc: (state, action: PayloadAction<string | null>) => {
      state.lookupSelectedUpc = action.payload;
    },
    setLookupStoreNumbers: (state, action: PayloadAction<string[]>) => {
      state.availableStoreNumbers = action.payload;
    },
    setLookupSelectedStoreNumber: (
      state,
      action: PayloadAction<string | null>,
    ) => {
      state.selectedStoreNumber = action.payload;
    },
  },
});

export const {
  setUpcCode,
  setItems,
  setMode,
  resetLookupSlice,
  setItemsLoaded,
  setProductCode,
  setDescription,
  setCategoryDescription,
  setMetrics,
  setSelectedStore,
  setItemLookupHistory,
  setHistoryMetrics,
  setPause,
  reQueryUpc,
  setILView,
  addRecentLookup,
  setLookupQueue,
  updateLookupQueueItem,
  setLookupSelectedUpc,
  setLookupStoreNumbers,
  setLookupSelectedStoreNumber,
} = itemLookupSlice.actions;

export default itemLookupSlice.reducer;
