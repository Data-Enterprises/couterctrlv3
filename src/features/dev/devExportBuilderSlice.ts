import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ExportColumn,
  ExportFile,
  ExportRow,
  ExportStore,
  ExportSubDepartment,
  ExportVendor,
} from "../../api/salesExport";

/** What the export endpoint takes that the preview knows nothing about:
 *  switches, not data. */
export interface ExportFlags {
  excludeVoids: boolean;
  fileFormat: string;
  filePrefix: string;
  ordered: boolean;
}

export interface ExportBuilderState {
  loadingConfig: boolean;
  /** Null until a config has been loaded; the page shows its search card. */
  stores: ExportStore[];
  saleTypes: string[];
  itemRingTypes: string[];
  subDepartments: ExportSubDepartment[];
  vendors: ExportVendor[];
  columns: ExportColumn[];
  rows: ExportRow[];
  hasData: boolean;
  message: string | null;
  loaded: boolean;

  /** The picks, made against what came back and nothing else. */
  selectedStoreIds: number[];
  selectedSaleTypes: string[];
  /**
   * All four filters reach `/sales/export`, so what narrows the sample narrows
   * the file. Each is matched there the way the endpoint matches it: sale_type
   * lower-cased on both sides, the other three as stored.
   */
  selectedRingTypes: string[];
  selectedSubDepartments: string[];
  selectedVendors: string[];
  selectedColumns: string[];
  /**
   * Product codes the user supplied, rather than picked.
   *
   * Empty means no filter, unlike the four lists that come back from the
   * preview: those describe what the window holds, so emptying one is a
   * contradiction. This one starts empty and only ever narrows.
   */
  productCodes: string[];
  /** What they typed, kept as typed, so the box does not fight them. */
  productCodeText: string;
  /**
   * Every column name in the order the file will write them.
   *
   * Starts as the table order the preview returned and moves when someone
   * drags a header. Selection is a separate question — a column keeps its
   * place in the order whether or not it is ticked, so unticking and ticking
   * again puts it back where it was rather than at the end.
   */
  columnOrder: string[];
  columnFilter: string;
  /** Typing in a long list narrows what is shown, never what is selected. */
  vendorFilter: string;
  subDepartmentFilter: string;
  flags: ExportFlags;

  building: boolean;
  /** The statement the export would run, from a dry run. Null when closed. */
  sql: {
    query: string;
    bucket: string;
    filePath: string;
    copyOptions: string;
  } | null;
  loadingSql: boolean;
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
  itemRingTypes: [],
  subDepartments: [],
  vendors: [],
  columns: [],
  rows: [],
  hasData: false,
  message: null,
  loaded: false,

  selectedStoreIds: [],
  selectedSaleTypes: [],
  selectedRingTypes: [],
  selectedSubDepartments: [],
  selectedVendors: [],
  selectedColumns: [],
  productCodes: [],
  productCodeText: "",
  columnOrder: [],
  columnFilter: "",
  vendorFilter: "",
  subDepartmentFilter: "",
  flags: {
    excludeVoids: false,
    fileFormat: "csv",
    filePrefix: "sales",
    ordered: false,
  },

  building: false,
  sql: null,
  loadingSql: false,
  files: [],
  rowsUploaded: 0,
  elapsedSeconds: 0,
  urlExpiresInMinutes: 60,
  builtAt: null,
  slow: false,
  exportError: null,
};

/** The distinct pairs, folded to one entry per sub department number. */
const mergeSubDepartments = (
  rows: ExportSubDepartment[],
): ExportSubDepartment[] => {
  const names = new Map<string, string[]>();
  for (const row of rows) {
    const id = String(row.sub_department);
    const label = String(row.sub_department_description ?? "").trim();
    const seen = names.get(id) ?? [];
    if (label && !seen.includes(label)) seen.push(label);
    names.set(id, seen);
  }
  // Insertion order, so the endpoint's sort by number survives.
  return [...names].map(([sub_department, labels]) => ({
    sub_department,
    sub_department_description: labels.join(" / "),
  }));
};

/** The same fold for vendors: one row per id, names gathered. */
const mergeVendors = (rows: ExportVendor[]): ExportVendor[] => {
  const names = new Map<string, string[]>();
  for (const row of rows) {
    const id = String(row.vendor_id);
    const label = String(row.vendor_name ?? "").trim();
    const seen = names.get(id) ?? [];
    if (label && !seen.includes(label)) seen.push(label);
    names.set(id, seen);
  }
  return [...names].map(([vendor_id, labels]) => ({
    vendor_id,
    vendor_name: labels.join(" / ") || null,
  }));
};

interface ConfigPayload {
  stores: ExportStore[];
  saleTypes: string[];
  itemRingTypes: string[];
  subDepartments: ExportSubDepartment[];
  vendors: ExportVendor[];
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
      const {
        stores,
        saleTypes,
        itemRingTypes,
        subDepartments,
        vendors,
        columns,
        rows,
        hasData,
        message,
      } = action.payload;
      state.loadingConfig = false;
      state.loaded = true;
      state.stores = stores;
      state.saleTypes = saleTypes;
      state.itemRingTypes = itemRingTypes;
      // One row per number, not per (number, description) pair.
      //
      // The endpoint returns the distinct pairs it finds, and stores disagree
      // about what a number is called — 5 is Cigarettes in one and Tobacco in
      // another, 30 is Beer in one and Money Orders in another. The filter is
      // the number, so two rows for one number would be two ticks that mean
      // the same thing; the names are gathered into one label instead.
      state.subDepartments = mergeSubDepartments(subDepartments);
      // Distinct pairs again: an id whose name differs between stores would
      // otherwise be two ticks for one vendor.
      state.vendors = mergeVendors(vendors);
      state.columns = columns;
      state.rows = rows;
      state.hasData = hasData;
      state.message = message;
      state.selectedStoreIds = stores.map((s) => s.storeid);
      state.selectedSaleTypes = [...saleTypes];
      state.selectedRingTypes = [...itemRingTypes];
      // Held as strings whatever the endpoint sent, so a selection is one
      // type everywhere and only becomes a number on the way back out.
      state.selectedSubDepartments = state.subDepartments.map((s) =>
        String(s.sub_department),
      );
      state.selectedVendors = state.vendors.map((v) => v.vendor_id);
      state.selectedColumns = columns.map((c) => c.name);
      state.columnOrder = columns.map((c) => c.name);
      state.columnFilter = "";
      state.vendorFilter = "";
      state.subDepartmentFilter = "";
      // A new scope is a new question; the codes belonged to the old one.
      state.productCodes = [];
      state.productCodeText = "";
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
      // Only membership: where the column sits is `columnOrder`'s business.
      state.selectedColumns = state.selectedColumns.includes(c)
        ? state.selectedColumns.filter((x) => x !== c)
        : [...state.selectedColumns, c];
    },
    /**
     * Drag one column to another slot.
     *
     * Moves it within the full order, selected or not, so a hidden column
     * keeps a sensible place for when it comes back. `to` is the index the
     * column should end up at once it has been lifted out.
     */
    moveColumn: (
      state,
      action: PayloadAction<{ name: string; to: number }>,
    ) => {
      const { name, to } = action.payload;
      const from = state.columnOrder.indexOf(name);
      if (from === -1 || to === from) return;
      const next = [...state.columnOrder];
      next.splice(from, 1);
      next.splice(Math.max(0, Math.min(to, next.length)), 0, name);
      state.columnOrder = next;
    },
    setSelectedSaleTypes: (state, action: PayloadAction<string[]>) => {
      state.selectedSaleTypes = action.payload;
    },
    toggleRingType: (state, action: PayloadAction<string>) => {
      const v = action.payload;
      state.selectedRingTypes = state.selectedRingTypes.includes(v)
        ? state.selectedRingTypes.filter((x) => x !== v)
        : [...state.selectedRingTypes, v];
    },
    setSelectedRingTypes: (state, action: PayloadAction<string[]>) => {
      state.selectedRingTypes = action.payload;
    },
    toggleSubDepartment: (state, action: PayloadAction<string>) => {
      const v = action.payload;
      state.selectedSubDepartments = state.selectedSubDepartments.includes(v)
        ? state.selectedSubDepartments.filter((x) => x !== v)
        : [...state.selectedSubDepartments, v];
    },
    setSelectedSubDepartments: (state, action: PayloadAction<string[]>) => {
      state.selectedSubDepartments = action.payload;
    },
    toggleVendor: (state, action: PayloadAction<string>) => {
      const v = action.payload;
      state.selectedVendors = state.selectedVendors.includes(v)
        ? state.selectedVendors.filter((x) => x !== v)
        : [...state.selectedVendors, v];
    },
    setSelectedVendors: (state, action: PayloadAction<string[]>) => {
      state.selectedVendors = action.payload;
    },
    setSelectedColumns: (state, action: PayloadAction<string[]>) => {
      state.selectedColumns = action.payload;
    },
    setProductCodeText: (state, action: PayloadAction<string>) => {
      state.productCodeText = action.payload;
    },
    setProductCodes: (state, action: PayloadAction<string[]>) => {
      state.productCodes = action.payload;
    },
    setColumnFilter: (state, action: PayloadAction<string>) => {
      state.columnFilter = action.payload;
    },
    setVendorFilter: (state, action: PayloadAction<string>) => {
      state.vendorFilter = action.payload;
    },
    setSubDepartmentFilter: (state, action: PayloadAction<string>) => {
      state.subDepartmentFilter = action.payload;
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
    startSqlLoad: (state) => {
      state.loadingSql = true;
      state.exportError = null;
    },
    setSql: (
      state,
      action: PayloadAction<ExportBuilderState["sql"]>,
    ) => {
      state.loadingSql = false;
      state.sql = action.payload;
    },
    closeSql: (state) => {
      state.sql = null;
      state.loadingSql = false;
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
  setSelectedSaleTypes,
  toggleRingType,
  setSelectedRingTypes,
  toggleSubDepartment,
  setSelectedSubDepartments,
  toggleVendor,
  setSelectedVendors,
  toggleColumn,
  moveColumn,
  setSelectedColumns,
  setColumnFilter,
  setVendorFilter,
  setSubDepartmentFilter,
  setProductCodeText,
  setProductCodes,
  setFlag,
  startSqlLoad,
  setSql,
  closeSql,
  startExport,
  markExportSlow,
  finishExport,
  failExport,
  resetExportBuilder,
} = devExportBuilderSlice.actions;
export default devExportBuilderSlice.reducer;
