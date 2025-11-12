import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Store } from "../interfaces";

interface StoreState {
  allAvailableStores: Store[];
}

export const initialState: StoreState = {
  allAvailableStores: [],
};

export const storeSlice = createSlice({
  name: "stores",
  initialState,
  reducers: {
    setAllAvailableStores: (state, action: PayloadAction<Store[]>) => {
      state.allAvailableStores = action.payload;
    },
    resetStoreSlice: () => initialState,
  },
});

export const { setAllAvailableStores, resetStoreSlice } = storeSlice.actions;

export default storeSlice.reducer;
