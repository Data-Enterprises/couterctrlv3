import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AllOrder, AvailableOrder } from "../interfaces";

interface OrdersState {
  availableOrders: AvailableOrder[];
  allOrders: AllOrder[];
  orderTypeFilter: string;
  subDeptFilter: number;
  filteredOrders: AllOrder[];
  selectedStoreIds: number[];
}

const initialState: OrdersState = {
  availableOrders: [],
  allOrders: [],
  orderTypeFilter: "All",
  subDeptFilter: 0,
  filteredOrders: [],
  selectedStoreIds: [],
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
    setOrderTypeFilter: (state, action: PayloadAction<string>) => {
      state.orderTypeFilter = action.payload;
    },
    setSubDeptFilter: (state, action: PayloadAction<number>) => {
      state.subDeptFilter = action.payload;
    },
    setSelectedStoreIds: (state, action: PayloadAction<number[]>) => {
      state.selectedStoreIds = action.payload;
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
} = ordersSlice.actions;
export default ordersSlice.reducer;
