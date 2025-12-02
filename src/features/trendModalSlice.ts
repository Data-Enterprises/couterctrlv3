import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface TrendModalState {
  openModal: boolean;
  upc: string;
}

const initialState: TrendModalState = {
  openModal: false,
  upc: "",
};

export const trendModalSlice = createSlice({
  name: "trendModal",
  initialState,
  reducers: {
    setOpenModal: (state, action: PayloadAction<boolean>) => {
      state.openModal = action.payload;
    },
    setUpc: (state, action: PayloadAction<string>) => {
      state.upc = action.payload;
    },
    resetTrendModal: (state) => {
      state.openModal = false;
      state.upc = "";
    },
  },
});

export const { setOpenModal, setUpc, resetTrendModal } =
  trendModalSlice.actions;
export default trendModalSlice.reducer;
