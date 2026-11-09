import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MarkdownItem, MarkdownType } from "../../interfaces/markdowns";

interface DevMarkdownsState {
  markdowns: MarkdownItem[];
  type: MarkdownType | null;
}

const initialState: DevMarkdownsState = {
  markdowns: [],
  type: null,
};

const devMarkdownsSlice = createSlice({
  name: "devMarkdowns",
  initialState,
  reducers: {
    setMarkdowns: (state, action: PayloadAction<MarkdownItem[]>) => {
      state.markdowns = action.payload;
    },
    setType: (state, action: PayloadAction<MarkdownType | null>) => {
      state.type = action.payload;
    },
    resetMarkdownsSlice: () => initialState,
  },
});

export const { setMarkdowns, setType, resetMarkdownsSlice } =
  devMarkdownsSlice.actions;
export default devMarkdownsSlice.reducer;
