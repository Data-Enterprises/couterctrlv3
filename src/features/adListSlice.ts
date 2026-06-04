import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type AdListData } from "./forecastSlice";

export interface AdListRow extends AdListData {
  upc: string;
}

interface AdListState {
  rows: Record<string, AdListRow>;
  fileName: string;
}

const initialState: AdListState = {
  rows: {},
  fileName: "",
};

const adListSlice = createSlice({
  name: "adList",
  initialState,
  reducers: {
    setAdListData: (
      state,
      action: PayloadAction<{ rows: AdListRow[]; fileName: string }>,
    ) => {
      const map: Record<string, AdListRow> = {};
      for (const row of action.payload.rows) {
        map[row.upc] = row;
      }
      state.rows = map;
      state.fileName = action.payload.fileName;
    },
    clearAdListData: (state) => {
      state.rows = {};
      state.fileName = "";
    },
  },
});

export const { setAdListData, clearAdListData } = adListSlice.actions;
export default adListSlice.reducer;
