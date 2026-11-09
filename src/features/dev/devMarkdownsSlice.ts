import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MarkdownItem, MarkdownFilters } from "../../interfaces/markdowns";

interface DevMarkdownsState {
  markdowns: MarkdownItem[];
  loading: boolean;
  progress: { page: number; total: number } | null;
  notice: string | null;
  filters: MarkdownFilters;
}

const emptyFilters: MarkdownFilters = {
  types: null,
  storeNumbers: [],
  dates: [],
  subIds: [],
  categories: [],
  vendorIds: [],
  search: "",
  minPercent: null,
};

const initialState: DevMarkdownsState = {
  markdowns: [],
  loading: false,
  progress: null,
  notice: null,
  filters: emptyFilters,
};

const devMarkdownsSlice = createSlice({
  name: "devMarkdowns",
  initialState,
  reducers: {
    setMarkdowns: (state, action: PayloadAction<MarkdownItem[]>) => {
      state.markdowns = action.payload;
    },
    /** Any of the filters; the rest stay as they are. */
    setMarkdownFilters: (
      state,
      action: PayloadAction<Partial<MarkdownFilters>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearMarkdownFilters: (state) => {
      state.filters = emptyFilters;
    },
    setProgress: (
      state,
      action: PayloadAction<{ page: number; total: number } | null>,
    ) => {
      state.progress = action.payload;
    },
    setNotice: (state, action: PayloadAction<string | null>) => {
      state.notice = action.payload;
    },
    resetMarkdownsSlice: () => initialState,
  },
});

export const {
  setMarkdowns,
  setMarkdownFilters,
  setLoading,
  setProgress,
  resetMarkdownsSlice,
  setNotice,
  clearMarkdownFilters,
} = devMarkdownsSlice.actions;
export default devMarkdownsSlice.reducer;
