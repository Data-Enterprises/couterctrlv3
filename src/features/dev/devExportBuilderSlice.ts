import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ExportColumn,
  ExportFile,
  ExportRow,
  ExportStore,
} from "../../api/salesExport";

/** What the export endpoint takes that the preview knows nothing about:
 *  switches, not data. */
export interface ExportFlags {
  excludeVoids: boolean;
  fileFormat: string;
  filePrefix: string;
  ordered: boolean;
  dryRun: boolean;
}

export interface ExportBuilderState {
  loadingConfig: boolean;
  /** Null until a config has been loaded; the page shows its search card. */
  stores: ExportStore[];
  saleTypes: string[];
  columns: ExportColumn[];
  rows: ExportRow[];
  hasData: boolean;
  message: string | null;
  loaded: boolean;

  /** The picks, made against what came back and nothing else. */
  selectedStoreIds: number[];
  selectedSaleTypes: string[];
  selectedColumns: string[];
  columnFilter: string;
  flags: ExportFlags;

  building: boolean;
  files: ExportFile[];
  rowsUploaded: number;
  elapsedSeconds: number;
  urlExpiresInMinutes: number;
  builtAt: number | null;
  /** True once the wait has outlived what the load balancer will hold open. */
  slow: boolean;
  exportError: string | null;
}

export const initialState: ExportBuilderState = {
  loadingConfig: false,
  stores: [],
  saleTypes: [],
  columns: [],
  rows: [],
  hasData: false,
  message: null,
  loaded: false,

  selectedStoreIds: [],
  selectedSaleTypes: [],
  selectedColumns: [],
  columnFilter: "",
  flags: {
    excludeVoids: false,
    fileFormat: "csv",
    filePrefix: "sales",
    ordered: false,
    dryRun: false,
  },

  building: false,
  files: [],
  rowsUploaded: 0,
  elapsedSeconds: 0,
  urlExpiresInMinutes: 60,
  builtAt: null,
  slow: false,
  exportError: null,
};

interface ConfigPayload {
  stores: ExportStore[];
  saleTypes: string[];
  columns: ExportColumn[];
  rows: ExportRow[];
  hasData: boolean;
  message: string | null;
}

const devExportBuilderSlice = createSlice({
  name: "devExportBuilder",
  initialState,
  reducers: {
    startConfigLoad: (state) => {
      state.loadingConfig = true;
      state.exportError = null;
    },
    /**
     * Everything selectable arrives here, and everything arrives selected:
     * the file is the whole table until someone narrows it.
     */
    setConfig: (state, action: PayloadAction<ConfigPayload>) => {
      const { stores, saleTypes, columns, rows, hasData, message } =
        action.payload;
      state.loadingConfig = false;
      state.loaded = true;
      state.stores = stores;
      state.saleTypes = saleTypes;
      state.columns = columns;
      state.rows = rows;
      state.hasData = hasData;
      state.message = message;
      state.selectedStoreIds = stores.map((s) => s.storeid);
      state.selectedSaleTypes = [...saleTypes];
      state.selectedColumns = columns.map((c) => c.name);
      state.columnFilter = "";
      // A new scope means the last file describes a question nobody asked.
      state.files = [];
      state.builtAt = null;
    },
    failConfigLoad: (state) => {
      state.loadingConfig = false;
    },
    toggleStore: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      state.selectedStoreIds = state.selectedStoreIds.includes(id)
        ? state.selectedStoreIds.filter((s) => s !== id)
        : [...state.selectedStoreIds, id];
    },
    setSelectedStoreIds: (state, action: PayloadAction<number[]>) => {
      state.selectedStoreIds = action.payload;
    },
    toggleSaleType: (state, action: PayloadAction<string>) => {
      const t = action.payload;
      state.selectedSaleTypes = state.selectedSaleTypes.includes(t)
        ? state.selectedSaleTypes.filter((s) => s !== t)
        : [...state.selectedSaleTypes, t];
    },
    toggleColumn: (state, action: PayloadAction<string>) => {
      const c = action.payload;
      if (state.selectedColumns.includes(c)) {
        state.selectedColumns = state.selectedColumns.filter((x) => x !== c);
      } else {
        // Kept in table order rather than click order: the file writes its
        // columns where the table puts them, and this preview is the file.
        const picked = new Set([...state.selectedColumns, c]);
        state.selectedColumns = state.columns
          .map((col) => col.name)
          .filter((n) => picked.has(n));
      }
    },
    setSelectedColumns: (state, action: PayloadAction<string[]>) => {
      state.selectedColumns = action.payload;
    },
    setColumnFilter: (state, action: PayloadAction<string>) => {
      state.columnFilter = action.payload;
    },
    setFlag: (
      state,
      action: PayloadAction<{
        key: keyof ExportFlags;
        value: boolean | string;
      }>,
    ) => {
      const { key, value } = action.payload;
      if (key === "fileFormat" || key === "filePrefix") {
        state.flags[key] = value as string;
      } else {
        state.flags[key] = value as boolean;
      }
    },
    startExport: (state) => {
      state.building = true;
      state.slow = false;
      state.exportError = null;
      state.files = [];
    },
    /** The request has outlived the load balancer's patience; the file is
     *  still being written, so this is a warning rather than a failure. */
    markExportSlow: (state) => {
      state.slow = true;
    },
    finishExport: (
      state,
      action: PayloadAction<{
        files: ExportFile[];
        rowsUploaded: number;
        elapsedSeconds: number;
        urlExpiresInMinutes: number;
      }>,
    ) => {
      state.building = false;
      state.slow = false;
      state.files = action.payload.files;
      state.rowsUploaded = action.payload.rowsUploaded;
      state.elapsedSeconds = action.payload.elapsedSeconds;
      state.urlExpiresInMinutes = action.payload.urlExpiresInMinutes;
      state.builtAt = Date.now();
    },
    failExport: (state, action: PayloadAction<string>) => {
      state.building = false;
      state.exportError = action.payload;
    },
    resetExportBuilder: () => initialState,
  },
});

export const {
  startConfigLoad,
  setConfig,
  failConfigLoad,
  toggleStore,
  setSelectedStoreIds,
  toggleSaleType,
  toggleColumn,
  setSelectedColumns,
  setColumnFilter,
  setFlag,
  startExport,
  markExportSlow,
  finishExport,
  failExport,
  resetExportBuilder,
} = devExportBuilderSlice.actions;
export default devExportBuilderSlice.reducer;
