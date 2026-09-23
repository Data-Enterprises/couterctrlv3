import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ExportAggregate,
  ExportCashier,
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
  /**
   * Null leaves the flag alone, 0 excludes flagged lines, 1 keeps only them.
   *
   * Three states rather than a tick because "only the voids" is a real
   * question — the line someone is hunting for is usually the voided one.
   * The endpoint tests COALESCE(flag, 0) against zero, so 1 means every
   * marker it finds, not the literal 1.
   */
  voidFlag: number | null;
  refundFlag: number | null;
  fileFormat: string;
  filePrefix: string;
  ordered: boolean;
}

/**
 * What the file is: every line, or a rollup of them.
 *
 * Not a filter — it decides the file's shape, so the column picker and the
 * group/measure pickers are alternatives rather than two halves of one
 * question. The endpoint refuses a request carrying both.
 */
export type ExportMode = "lines" | "summary";

/**
 * A file that was built, kept for as long as its link lives.
 *
 * The link is a presigned URL with an hour on it, so a built file is not a
 * moment in the page's life — it is a thing you still have. Building a second
 * one must not take the first one away: a week of stores is often four files,
 * and losing the first three because the fourth finished is an hour of
 * rebuilding.
 */
export interface ExportBuild {
  id: string;
  files: ExportFile[];
  rowsUploaded: number;
  elapsedSeconds: number;
  urlExpiresInMinutes: number;
  builtAt: number;
  /** What this one was, in one line, so three files are not three riddles. */
  label: string;
}

export interface ExportBuilderState {
  loadingConfig: boolean;
  /** Null until a config has been loaded; the page shows its search card. */
  stores: ExportStore[];
  saleTypes: string[];
  itemRingTypes: string[];
  subDepartments: ExportSubDepartment[];
  vendors: ExportVendor[];
  cashiers: ExportCashier[];
  /**
   * Every day the loaded range covers, as `YYYY-MM-DD`.
   *
   * Worked out from the search dates when the config loads rather than read
   * off the response — the endpoint returns no day list, and a day with no
   * sales is still a day someone can ask about. Frozen at load time so it
   * describes the config on screen and not whatever the search card says now.
   */
  saleDates: string[];
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
  selectedCashiers: number[];
  selectedSaleDates: string[];
  selectedColumns: string[];
  /**
   * Product codes the user supplied, rather than picked.
   *
   * Empty means no filter, unlike the four lists that come back from the
   * preview: those describe what the window holds, so emptying one is a
   * contradiction. This one starts empty and only ever narrows.
   */
  productCodes: string[];
  /** Words to find in product_description. Empty means every product, the
   *  same as the codes. */
  productDescriptions: string[];
  /**
   * Every column name in the order the file will write them.
   *
   * Starts as the table order the preview returned and moves when someone
   * drags a header. Selection is a separate question — a column keeps its
   * place in the order whether or not it is ticked, so unticking and ticking
   * again puts it back where it was rather than at the end.
   */
  columnOrder: string[];

  mode: ExportMode;
  /** Column names, in the order they are grouped and written. */
  groupBy: string[];
  /** `{ column, fn }`, where column may be `*` for count(*). */
  aggregates: ExportAggregate[];

  flags: ExportFlags;

  /** The query scratchpad: open, and the last thing typed into it. */
  queryOpen: boolean;
  querySql: string;
  /** The list of built files, open. */
  downloadsOpen: boolean;

  building: boolean;
  /** The statement the export would run, from a dry run. Null when closed. */
  sql: {
    query: string;
    bucket: string;
    filePath: string;
    copyOptions: string;
  } | null;
  loadingSql: boolean;
  /** The build just finished, shown in the bar until it is dismissed. */
  files: ExportFile[];
  /** Every build of this session, newest first. */
  builds: ExportBuild[];
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
  cashiers: [],
  saleDates: [],
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
  selectedCashiers: [],
  selectedSaleDates: [],
  selectedColumns: [],
  productCodes: [],
  productDescriptions: [],
  columnOrder: [],

  mode: "lines",
  groupBy: [],
  aggregates: [],

  flags: {
    voidFlag: null,
    refundFlag: null,
    fileFormat: "csv",
    filePrefix: "sales",
    ordered: false,
  },

  queryOpen: false,
  querySql: "",
  downloadsOpen: false,

  building: false,
  sql: null,
  loadingSql: false,
  files: [],
  builds: [],
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
  cashiers: ExportCashier[];
  /** The days in the range, from the caller — not from the response. */
  saleDates: string[];
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
        cashiers,
        saleDates,
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
      // No fold here: the endpoint already keys these on cashier_number and
      // keeps the first name it finds, because the spellings vary far more
      // than the sub department and vendor names do.
      state.cashiers = cashiers;
      state.saleDates = saleDates;
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
      state.selectedCashiers = cashiers.map((c) => c.cashier_number);
      state.selectedSaleDates = [...saleDates];
      state.selectedColumns = columns.map((c) => c.name);
      state.columnOrder = columns.map((c) => c.name);
      // A new scope is a new question; the codes belonged to the old one.
      state.productCodes = [];
      state.productDescriptions = [];
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
    toggleCashier: (state, action: PayloadAction<number>) => {
      const v = action.payload;
      state.selectedCashiers = state.selectedCashiers.includes(v)
        ? state.selectedCashiers.filter((x) => x !== v)
        : [...state.selectedCashiers, v];
    },
    setSelectedCashiers: (state, action: PayloadAction<number[]>) => {
      state.selectedCashiers = action.payload;
    },
    toggleSaleDate: (state, action: PayloadAction<string>) => {
      const v = action.payload;
      state.selectedSaleDates = state.selectedSaleDates.includes(v)
        ? state.selectedSaleDates.filter((x) => x !== v)
        : [...state.selectedSaleDates, v];
    },
    setSelectedSaleDates: (state, action: PayloadAction<string[]>) => {
      state.selectedSaleDates = action.payload;
    },
    setSelectedColumns: (state, action: PayloadAction<string[]>) => {
      state.selectedColumns = action.payload;
    },
    /**
     * The whole order at once, for a query being applied.
     *
     * Dragging moves one column; this replaces the order outright, and any
     * column the caller leaves out keeps its place behind the ones given.
     */
    setColumnOrder: (state, action: PayloadAction<string[]>) => {
      const given = action.payload.filter((n) =>
        state.columns.some((c) => c.name === n),
      );
      state.columnOrder = [
        ...given,
        ...state.columnOrder.filter((n) => !given.includes(n)),
      ];
    },
    setProductCodes: (state, action: PayloadAction<string[]>) => {
      state.productCodes = action.payload;
    },
    setProductDescriptions: (state, action: PayloadAction<string[]>) => {
      state.productDescriptions = action.payload;
    },
    setMode: (state, action: PayloadAction<ExportMode>) => {
      state.mode = action.payload;
    },
    /**
     * Group keys are ordered, so a tick appends rather than sorting.
     *
     * That order is the file's column order and the endpoint's GROUP BY
     * positions — storeid then sale_date reads differently from the reverse,
     * and someone who ticked them in that order meant it.
     */
    toggleGroupBy: (state, action: PayloadAction<string>) => {
      const c = action.payload;
      state.groupBy = state.groupBy.includes(c)
        ? state.groupBy.filter((x) => x !== c)
        : [...state.groupBy, c];
    },
    setGroupBy: (state, action: PayloadAction<string[]>) => {
      state.groupBy = action.payload;
    },
    setAggregates: (state, action: PayloadAction<ExportAggregate[]>) => {
      state.aggregates = action.payload;
    },
    addAggregate: (state, action: PayloadAction<ExportAggregate>) => {
      state.aggregates = [...state.aggregates, action.payload];
    },
    setAggregate: (
      state,
      action: PayloadAction<{ at: number; measure: ExportAggregate }>,
    ) => {
      const { at, measure } = action.payload;
      if (at < 0 || at >= state.aggregates.length) return;
      state.aggregates = state.aggregates.map((m, i) =>
        i === at ? measure : m,
      );
    },
    removeAggregate: (state, action: PayloadAction<number>) => {
      state.aggregates = state.aggregates.filter((_, i) => i !== action.payload);
    },
    /**
     * The switches that changed, as a patch.
     *
     * A patch rather than a key/value pair: the flags are four different types
     * now, and `{ key, value }` can only be typed as the cross product of
     * every key with every value — which lets `ordered: 0` and
     * `voidFlag: true` through. `Partial<ExportFlags>` types each switch as
     * itself.
     */
    setFlag: (state, action: PayloadAction<Partial<ExportFlags>>) => {
      Object.assign(state.flags, action.payload);
    },
    openQuery: (state, action: PayloadAction<boolean>) => {
      state.queryOpen = action.payload;
    },
    openDownloads: (state, action: PayloadAction<boolean>) => {
      state.downloadsOpen = action.payload;
    },
    /** Kept so closing the window is not the same as losing the query. */
    setQuerySql: (state, action: PayloadAction<string>) => {
      state.querySql = action.payload;
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
        label: string;
      }>,
    ) => {
      state.building = false;
      state.slow = false;
      state.files = action.payload.files;
      state.rowsUploaded = action.payload.rowsUploaded;
      state.elapsedSeconds = action.payload.elapsedSeconds;
      state.urlExpiresInMinutes = action.payload.urlExpiresInMinutes;
      state.builtAt = Date.now();
      state.builds = [
        {
          id: `${state.builtAt}-${state.builds.length}`,
          files: action.payload.files,
          rowsUploaded: action.payload.rowsUploaded,
          elapsedSeconds: action.payload.elapsedSeconds,
          urlExpiresInMinutes: action.payload.urlExpiresInMinutes,
          builtAt: state.builtAt,
          label: action.payload.label,
        },
        ...state.builds,
      ];
    },
    /**
     * Put the bar back to the configuration without losing the file.
     *
     * The file stays in `builds` — this only takes the finished card off the
     * screen, because the next thing after a download is usually the next
     * export rather than staring at the last one.
     */
    dismissBuild: (state) => {
      state.files = [];
      state.exportError = null;
    },
    /**
     * Every pick back to its default, with the loaded data left alone.
     *
     * Not the same as the magnifier, which throws away the scope too and
     * sends you back to the search. This is for asking a different question
     * of the same range, which is what people do after a download.
     */
    clearSelections: (state) => {
      state.selectedStoreIds = state.stores.map((s) => s.storeid);
      state.selectedSaleTypes = [...state.saleTypes];
      state.selectedRingTypes = [...state.itemRingTypes];
      state.selectedSubDepartments = state.subDepartments.map((s) =>
        String(s.sub_department),
      );
      state.selectedVendors = state.vendors.map((v) => v.vendor_id);
      state.selectedCashiers = state.cashiers.map((c) => c.cashier_number);
      state.selectedSaleDates = [...state.saleDates];
      state.selectedColumns = state.columns.map((c) => c.name);
      state.columnOrder = state.columns.map((c) => c.name);
      state.productCodes = [];
      state.productDescriptions = [];
      state.mode = "lines";
      state.groupBy = [];
      state.aggregates = [];
      state.flags = { ...initialState.flags };
      state.files = [];
      state.exportError = null;
    },
    /** The links are gone from the page, not from S3 — they simply expire. */
    clearBuilds: (state) => {
      state.builds = [];
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
  toggleCashier,
  setSelectedCashiers,
  toggleSaleDate,
  setSelectedSaleDates,
  toggleColumn,
  moveColumn,
  setSelectedColumns,
  setProductCodes,
  setProductDescriptions,
  setMode,
  toggleGroupBy,
  setGroupBy,
  addAggregate,
  setAggregate,
  setAggregates,
  removeAggregate,
  setColumnOrder,
  openQuery,
  openDownloads,
  setQuerySql,
  setFlag,
  startSqlLoad,
  setSql,
  closeSql,
  startExport,
  markExportSlow,
  finishExport,
  failExport,
  dismissBuild,
  clearSelections,
  clearBuilds,
  resetExportBuilder,
} = devExportBuilderSlice.actions;
export default devExportBuilderSlice.reducer;
