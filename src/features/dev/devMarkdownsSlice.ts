import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MarkdownItem, MarkdownType } from "../../interfaces/markdowns";

interface DevMarkdownsState {
  markdowns: MarkdownItem[];
  type: MarkdownType | null;
  loading: boolean;
  progress: { page: number; total: number };
}

const initialState: DevMarkdownsState = {
  markdowns: [],
  type: null,
  loading: false,
  progress: { page: 0, total: 0 },
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
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setProgress: (
      state,
      action: PayloadAction<{ page: number; total: number }>,
    ) => {
      state.progress = action.payload;
    },
    resetMarkdownsSlice: () => initialState,
  },
});

export const {
  setMarkdowns,
  setType,
  setLoading,
  setProgress,
  resetMarkdownsSlice,
} = devMarkdownsSlice.actions;
export default devMarkdownsSlice.reducer;
