import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Store } from "../interfaces";

interface ForecastState {
  selectedStores: Store[];
  storeids: string;
  radioId: number;
}

const initialState: ForecastState = {
  selectedStores: [],
  storeids: "", // needed for backend API calls
  radioId: 0,
};
export const forecastSlice = createSlice({
  name: "forecast",
  initialState,
  reducers: {
    setSelectedStores: (state, action: PayloadAction<Store[]>) => {
      state.selectedStores = action.payload;
      state.storeids = action.payload.map((store) => store.storeid).join(",");
    },
    setRadioId: (state, action: PayloadAction<number>) => {
      state.radioId = action.payload;
    },
    resetForecast: () => initialState,
  },
});

export const { setSelectedStores, setRadioId, resetForecast } =
  forecastSlice.actions;
export default forecastSlice.reducer;
