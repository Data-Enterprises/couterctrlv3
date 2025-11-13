import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Store } from "../interfaces";

interface StoreState {
  allAvailableStores: Store[];
  allStores: Store[];
}

export const initialState: StoreState = {
  allAvailableStores: [],
  allStores: [],
};

export const storeSlice = createSlice({
  name: "stores",
  initialState,
  reducers: {
    setAllAvailableStores: (state, action: PayloadAction<Store[]>) => {
      state.allAvailableStores = action.payload;
    },
    setAllStores: (state, action: PayloadAction<Store[]>) => {
      state.allStores = action.payload;
    },
    resetStoreSlice: () => initialState,
  },
});

export const { setAllAvailableStores, setAllStores, resetStoreSlice } =
  storeSlice.actions;

export default storeSlice.reducer;
