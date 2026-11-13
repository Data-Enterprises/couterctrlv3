/**
 * Dev copy of `features/ordersSlice.ts`, mounted at `state.dev.orders` and read only
 * by `pages/orders/dev`. Edit this one while changing dev orders; when dev is
 * promoted, it replaces the prod slice. See src/store/devReducers.ts.
 */

// Utils
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Interfaces
import type { AllOrder, AvailableOrder, UpdateFileResp } from "../../interfaces";
import type {
  EditSearch,
  OrderDraft,
  SubDeptOption,
} from "../../pages/orders/dev/interfaces";

export type OrderStatus = "open" | "closed" | "";
export type UniqueSub = {
  desc: string;
  subId: number;
  count: number;
}

/**
 * The left panel's configuration, as six independent multi-selects.
 *
 * Every one of them is read off the line items that came back, so there is
 * nothing to pick that is not really in the result. Empty means all, the same
 * convention MultiSelectFilter uses: an untouched filter has to produce the
 * whole set or the panel silently empties the export before anyone has
 * touched it.
 *
 * Stores are keyed by storenumber rather than storeid — a few storeids cover
 * two physical locations, and those are separate stores.
 */
/**
 * The cost problems a line can carry.
 *
 * Derived from the line, never stored: they are a reading of the data rather
 * than a field in it, and a stored copy would be wrong the moment a cost is
 * edited.
 */
export const ORDER_FLAGS = ["missingCost", "noCaseSize", "highMargin"] as const;
export type OrderFlag = (typeof ORDER_FLAGS)[number];

export type OrdersFilters = {
  orderTypes: string[];
  storeNumbers: string[];
  dates: string[];
  subIds: number[];
  productCodes: string[];
  orderIds: number[];
  flags: OrderFlag[];
  /** Percent. What counts as a suspiciously high margin is the user's call,
   *  the same way the Performance pages ask. */
  marginOver: number | null;
};

export const EMPTY_ORDERS_FILTERS: OrdersFilters = {
  orderTypes: [],
  storeNumbers: [],
  dates: [],
  subIds: [],
  productCodes: [],
  orderIds: [],
  flags: [],
  marginOver: 60,
};

export type GroupedOrderStore = {
  storeid: number;
  // A few storeids cover two physical locations; storenumber is what tells
  // them apart, so it is part of this row's identity. See utils/storeIdentity.
  storenumber: string;
  store_name: string;
  frequency: number;
};

export type GroupedOrderDate = {
  order_date: string;
  stores: GroupedOrderStore[];
};

export type GroupedOrderCard = {
  order_type: string;
  dates: GroupedOrderDate[];
};

export type SelectedOrderKey = {
  order_date: string;
  order_date_end: string;
  order_type: string;
  storeids: number[];
  // Which locations within those storeids. null = every location (the
  // select-all-stores path, where both siblings are wanted anyway).
  storenumbers: string[] | null;
} | null;

export type SelectedOrder = {
  storeid: number;
  storenumber: string;
  orderId: number;
} | null;

/**
 * Edit mode's working state. Kept when the page is left, so unsent edits are
 * still there on return; a new search drops the drafts, whose lines are gone.
 */
export interface OrdersEdit {
  editing: boolean;
  /** A draft per order, by `OrderDoc.key`, and which one is open. */
  drafts: Record<string, OrderDraft>;
  openKey: string | null;
  /** The edit-mode picker's narrowing. An empty string is "any". */
  pickStore: string;
  pickDate: string;
  pickType: string;
  leftTab: "orders" | "problems";
  /** The Problems item open on the right, and the ones marked "looked, fine". */
  problemCode: string | null;
  skipped: string[];
  search: EditSearch;
  /** Each store's sub departments, asked for once per store. */
  subDeptsByStore: Record<number, SubDeptOption[]>;
  /** The last Submit's answer and what it sent, for the receipt. */
  receipt: UpdateFileResp | null;
  submittedCounts: { orders: number; edited: number; added: number };
}

export const EMPTY_EDIT_SEARCH: EditSearch = { code: "", desc: "", onlyChanged: false };

const initialEdit: OrdersEdit = {
  editing: false,
  drafts: {},
  openKey: null,
  pickStore: "",
  pickDate: "",
  pickType: "",
  leftTab: "orders",
  problemCode: null,
  skipped: [],
  search: EMPTY_EDIT_SEARCH,
  subDeptsByStore: {},
  receipt: null,
  submittedCounts: { orders: 0, edited: 0, added: 0 },
};

interface OrdersState {
  availableOrders: AvailableOrder[];
  groupedAvailableOrders: GroupedOrderCard[];
  selectedOrderKey: SelectedOrderKey;
  selectedOrder: SelectedOrder;
  allOrders: AllOrder[];
  orderTypeFilter: string[];
  subDeptFilter: number;
  filteredOrders: AllOrder[];
  selectedStoreIds: number[];
  loadingAvailableOrders: boolean;
  loadingAllOrders: boolean;
  availableOrderTypes: string[];
  selectedAvailableOrder: AvailableOrder | null;
  ordersExportModalOpen: boolean;
  orderFilters: AvailableOrder[];
  filteredAvailableOrders: AvailableOrder[];
  typeFilterArr: string[];
  orderStatusFilter: OrderStatus;
  subIdsFilter: number[];
  uniqueSubs: UniqueSub[];
  filters: OrdersFilters;
  edit: OrdersEdit;
}

const initialState: OrdersState = {
  availableOrders: [],
  groupedAvailableOrders: [],
  selectedOrderKey: null,
  selectedOrder: null,
  allOrders: [],
  orderTypeFilter: [],
  subDeptFilter: 0,
  filteredOrders: [],
  selectedStoreIds: [],
  loadingAvailableOrders: false,
  loadingAllOrders: false,
  availableOrderTypes: [],
  selectedAvailableOrder: null,
  ordersExportModalOpen: false,
  orderFilters: [],
  filteredAvailableOrders: [],
  typeFilterArr: [],
  orderStatusFilter: "",
  subIdsFilter: [],
  uniqueSubs: [],
  filters: EMPTY_ORDERS_FILTERS,
  edit: initialEdit,
};

const ordersSlice = createSlice({
  // Distinct from the prod slice's "orders": Redux matches actions on this
  // string alone, so sharing it would move prod and dev together.
  name: "devOrders",
  initialState,
  reducers: {
    setAvailableOrders: (state, action: PayloadAction<AvailableOrder[]>) => {
      state.availableOrders = action.payload;
      state.filteredAvailableOrders = action.payload;
    },
    setGroupedAvailableOrders: (state, action: PayloadAction<GroupedOrderCard[]>) => {
      state.groupedAvailableOrders = action.payload;
    },
    setSelectedOrderKey: (state, action: PayloadAction<SelectedOrderKey>) => {
      state.selectedOrderKey = action.payload;
    },
    setSelectedOrder: (state, action: PayloadAction<SelectedOrder>) => {
      state.selectedOrder = action.payload;
    },
    setFilteredAvailableOrders: (state, action: PayloadAction<AvailableOrder[]>) => {
      state.filteredAvailableOrders = action.payload;
    },
    setAllOrders: (state, action: PayloadAction<AllOrder[]>) => {
      state.allOrders = action.payload;
      state.filteredOrders = action.payload;
    },
    setFilteredOrders: (state, action: PayloadAction<AllOrder[]>) => {
      state.filteredOrders = action.payload;
    },
    setOrderTypeFilter: (state, action: PayloadAction<string[]>) => {
      if (action.payload.length === 0) {
        state.filteredOrders = state.allOrders;
        state.orderTypeFilter = [];
        return;
      }
      state.orderTypeFilter = action.payload;
      state.filteredOrders = [...state.allOrders].filter((o) =>
        action.payload.includes(o.order_type),
      );
    },
    setSubDeptFilter: (state, action: PayloadAction<number>) => {
      state.subDeptFilter = action.payload;
    },
    setSelectedStoreIds: (state, action: PayloadAction<number[]>) => {
      state.selectedStoreIds = action.payload;
    },
    setLoadingAvailableOrders: (state, action: PayloadAction<boolean>) => {
      state.loadingAvailableOrders = action.payload;
    },
    setLoadingAllOrders: (state, action: PayloadAction<boolean>) => {
      state.loadingAllOrders = action.payload;
    },
    setAvailableOrderTypes: (state, action: PayloadAction<string[]>) => {
      state.availableOrderTypes = action.payload;
    },
    setSelectedAvailableOrder: (state, action: PayloadAction<AvailableOrder | null>) => {
      state.selectedAvailableOrder = action.payload;
    },
    setOrdersExportModalOpen: (state, action: PayloadAction<boolean>) => {
      state.ordersExportModalOpen = action.payload;
    },
    setTypeFilterArr: (state, action: PayloadAction<string[]>) => {
      state.typeFilterArr = action.payload;
    },
    setOrderFilters: (state, action: PayloadAction<AvailableOrder[]>) => {
      if (action.payload.length === 0) {
        state.filteredOrders = state.allOrders;
        state.orderFilters = [];
        return;
      }

      state.orderFilters = action.payload;
      state.filteredOrders = [...state.allOrders].filter((o) => {
        const matchesDate= action.payload.some((f) => f.order_date === o.order_date);
        const matchesStore = action.payload.some((f) => f.storeid === o.storeid);
        const matchesType = action.payload.some((f) => f.order_type === o.order_type);
        return matchesDate && matchesStore && matchesType;
      });
    },
    setOrderStatusFilter: (state, action: PayloadAction<OrderStatus>) => {
      state.orderStatusFilter = action.payload;
    },
    setSubIdsFilter: (state, action: PayloadAction<number[]>) => {
      state.subIdsFilter = action.payload;
    },
    setUniqueSubs: (state, action: PayloadAction<UniqueSub[]>) => {
      state.uniqueSubs = action.payload;
    },
    /** One filter at a time; the panel owns which. */
    setOrdersFilter: (
      state,
      action: PayloadAction<{ key: keyof OrdersFilters; values: (string | number)[] }>,
    ) => {
      // The cast is the price of one setter for six arrays. The key decides
      // the element type and the panel only ever sends the matching one.
      (state.filters[action.payload.key] as (string | number)[]) =
        action.payload.values;
    },
    setOrdersMarginOver: (state, action: PayloadAction<number | null>) => {
      state.filters.marginOver = action.payload;
    },
    clearOrdersFilters: (state) => {
      state.filters = EMPTY_ORDERS_FILTERS;
    },
    /** Any of edit mode's plain fields. */
    patchOrdersEdit: (state, action: PayloadAction<Partial<OrdersEdit>>) => {
      state.edit = { ...state.edit, ...action.payload };
    },
    setOrderDrafts: (state, action: PayloadAction<Record<string, OrderDraft>>) => {
      state.edit.drafts = action.payload;
    },
    /** Writes one order's draft without changing which one is open. */
    storeOrderDraft: (state, action: PayloadAction<OrderDraft>) => {
      state.edit.drafts[action.payload.doc.key] = action.payload;
    },
    /** Writes one order's draft and opens it. */
    openOrderDraft: (state, action: PayloadAction<OrderDraft>) => {
      state.edit.drafts[action.payload.doc.key] = action.payload;
      state.edit.openKey = action.payload.doc.key;
    },
    /** A sent order is no longer waiting to go; the one open when Submit was
     *  pressed stays, for the receipt. */
    dropSentDraft: (
      state,
      action: PayloadAction<{ key: string; openKey: string | null }>,
    ) => {
      const { key, openKey } = action.payload;
      if (key !== openKey) delete state.edit.drafts[key];
    },
    clearOrderDrafts: (state) => {
      state.edit.drafts = {};
      state.edit.openKey = null;
    },
    addStoreSubDepts: (
      state,
      action: PayloadAction<{ storeid: number; options: SubDeptOption[] }>,
    ) => {
      state.edit.subDeptsByStore[action.payload.storeid] = action.payload.options;
    },
    resetOrdersState: () => initialState,
  },
});

export const {
  setAvailableOrders,
  setGroupedAvailableOrders,
  setSelectedOrderKey,
  setSelectedOrder,
  setAllOrders,
  setFilteredOrders,
  setOrderTypeFilter,
  setSubDeptFilter,
  setSelectedStoreIds,
  resetOrdersState,
  setLoadingAvailableOrders,
  setLoadingAllOrders,
  setAvailableOrderTypes,
  setSelectedAvailableOrder,
  setOrdersExportModalOpen,
  setOrderFilters,
  setFilteredAvailableOrders,
  setTypeFilterArr,
  setOrderStatusFilter,
  setSubIdsFilter,
  setUniqueSubs,
  setOrdersFilter,
  setOrdersMarginOver,
  clearOrdersFilters,
  patchOrdersEdit,
  setOrderDrafts,
  storeOrderDraft,
  openOrderDraft,
  dropSentDraft,
  clearOrderDrafts,
  addStoreSubDepts,
} = ordersSlice.actions;
export default ordersSlice.reducer;
