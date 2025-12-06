import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UpcModalState {
  openModal: boolean;
  fileName: string;
  type: "forecast" | "priceOpt" | "comp" | "trend";
  radioOption: { dates: boolean; metrics: boolean };
  trendOption: { all: boolean; top: boolean; bottom: boolean };
  priceOptOption: { list: string; data: string };
}

const emptyState: UpcModalState = {
  openModal: false,
  fileName: "",
  type: "forecast",
  radioOption: { dates: true, metrics: false },
  trendOption: { all: true, top: false, bottom: false },
  priceOptOption: { list: "", data: "" },
};

const initialState: UpcModalState = emptyState;

export const upcModalSlice = createSlice({
  name: "upcModal",
  initialState,
  reducers: {
    setOpenModal: (state, action: PayloadAction<boolean>) => {
      state.openModal = action.payload;
    },
    setFileName: (state, action: PayloadAction<string>) => {
      state.fileName = action.payload;
    },
    setRadioOption: (state, action: PayloadAction<string>) => {
      state.radioOption =
        action.payload === "dates"
          ? { dates: true, metrics: false }
          : { dates: false, metrics: true };
    },
    setTrendOption: (state, action: PayloadAction<string>) => {
      if (action.payload === "all") {
        state.trendOption = { all: true, top: false, bottom: false };
      } else if (action.payload === "top") {
        state.trendOption = { all: false, top: true, bottom: false };
      } else if (action.payload === "bottom") {
        state.trendOption = { all: false, top: false, bottom: true };
      }
    },
    setPriceOptOption: (
      state,
      action: PayloadAction<{ option: string; value: string }>
    ) => {
      state.priceOptOption = {
        ...state.priceOptOption,
        [action.payload.option]: action.payload.value,
      };
    },
    setModalType: (state, action: PayloadAction<number>) => {
      if (action.payload === 1) state.type = "comp";
      if (action.payload === 2) state.type = "forecast";
      if (action.payload === 3) state.type = "priceOpt";
      if (action.payload === 4) state.type = "trend";
    },
    reset: () => emptyState,
  },
});

export const {
  setOpenModal,
  setFileName,
  setRadioOption,
  setTrendOption,
  setPriceOptOption,
  setModalType,
  reset,
} = upcModalSlice.actions;
export default upcModalSlice.reducer;
