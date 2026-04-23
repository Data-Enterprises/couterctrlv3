import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AllOrder, AvailableOrder } from "../interfaces";

export type OrderStatus = "open" | "closed" | "";
export type UniqueSub = {
  desc: string;
  subId: number;
  count: number;
}

interface OrdersState {
  availableOrders: AvailableOrder[];
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
}

const initialState: OrdersState = {
  availableOrders: [],
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
};

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setAvailableOrders: (state, action: PayloadAction<AvailableOrder[]>) => {
      state.availableOrders = action.payload;
      state.filteredAvailableOrders = action.payload;
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
    resetOrdersState: () => initialState,
  },
});

export const {
  setAvailableOrders,
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
} = ordersSlice.actions;
export default ordersSlice.reducer;
