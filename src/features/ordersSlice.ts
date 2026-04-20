import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AllOrder, AvailableOrder } from "../interfaces";

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
};

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setAvailableOrders: (state, action: PayloadAction<AvailableOrder[]>) => {
      state.availableOrders = action.payload;
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
} = ordersSlice.actions;
export default ordersSlice.reducer;
