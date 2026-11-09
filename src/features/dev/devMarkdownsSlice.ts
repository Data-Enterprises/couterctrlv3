/**
 * The Markdowns page's state, mounted at `state.dev.markdowns` and read only by
 * `pages/markdowns/dev`. Coming Soon: dev only, with no prod twin.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SortState } from "../../utils/useTriStateSort";
import type {
  MarkdownFilters,
  MarkdownItem,
  MarkdownSortKey,
} from "../../interfaces/markdowns";

interface DevMarkdownsState {
  markdowns: MarkdownItem[];
  loading: boolean;
  progress: { page: number; total: number } | null;
  notice: string | null;
  filters: MarkdownFilters;
  /** Null keeps the backend's order: order_date, storeid, markdown_id, id. */
  sort: SortState<MarkdownSortKey>;
}

const emptyFilters: MarkdownFilters = {
  types: [],
  storeNumbers: [],
  dates: [],
  subIds: [],
  categories: [],
  vendorIds: [],
  productCodes: [],
  userIds: [],
  minPercent: null,
};

const initialState: DevMarkdownsState = {
  markdowns: [],
  loading: false,
  progress: null,
  notice: null,
  filters: emptyFilters,
  sort: null,
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
    /** Descending, then ascending, then the backend's order again. */
    toggleMarkdownSort: (state, action: PayloadAction<MarkdownSortKey>) => {
      const col = action.payload;
      const prev = state.sort;
      state.sort =
        prev?.col !== col
          ? { col, dir: "desc" }
          : prev.dir === "desc"
            ? { col, dir: "asc" }
            : null;
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
  toggleMarkdownSort,
} = devMarkdownsSlice.actions;
export default devMarkdownsSlice.reducer;
