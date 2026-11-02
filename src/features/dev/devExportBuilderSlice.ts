import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SavedConfig } from "../../api/savedConfigs";
import type { ExportBuild } from "../../api/exportBuilds";
import type { SavedQuery } from "../../api/savedQueries";
import type {
  ExportAggregate,
  ExportComputed,
  ExportDateFormat,
  ExportSort,
  ExportColumn,
  ExportFile,
  ExportRow,
  ExportStore,
  ExportTableKey,
} from "../../api/salesExport";

/**
 * One choice in a filter list: what goes to the router, and what is shown.
 *
 * Every list is held this way whatever shape the preview sent it in (bare
 * values, `{value, label}`, or id/name pairs) -- see the source descriptions
 * in pages/exportBuilder/dev/sources.ts, which do the turning. The value is a
 * string everywhere and only becomes a number on the way out, for the lists
 * whose column is one.
 */
export interface ExportListItem {
  value: string;
  label: string;
}

/** What the export endpoint takes that the preview knows nothing about:
 *  switches, not data. */
export interface ExportFlags {
  /** A key from the preview's `dateFormats`, or "" for as-stored. */
  dateFormat: string;
  fileFormat: string;
  filePrefix: string;
  ordered: boolean;
}

/**
 * What the file is: every line, or a rollup of them.
 *
 * Nothing stores this. It is read off the configuration — group keys or
 * measures mean a summary, and their absence means the lines — because a
 * switch for it was one more thing to flip before you could see the section
 * you wanted. Asking for a rollup IS asking for a rollup.
 *
 * The endpoint still refuses a request carrying both shapes, which is why
 * this is decided in one place: `aggregating` in the page's hook.
 */
export type ExportMode = "lines" | "summary";

/**
 * The configuration as it stood, for one step back.
 *
 * Only the picks: the loaded data and the built files are not something an
 * undo should reach. Apply is the one action in the query window that changes
 * the page behind it, so it is the one that needs taking back.
 */
export type ConfigSnapshot = Pick<
  ExportBuilderState,
  | "groupBy"
  | "aggregates"
  | "computed"
  | "orderBy"
  | "selectedStoreIds"
  | "picks"
  | "selectedDays"
  | "rowFlags"
  | "selectedColumns"
  | "columnOrder"
  | "productCodes"
  | "productDescriptions"
  | "flags"
>;

export interface ExportBuilderState {
  loadingConfig: boolean;
  /** The table the loaded configuration exports. */
  source: ExportTableKey;
  /**
   * The filter names the router takes, by table, from `GET export/tables`;
   * null until that has answered. A build whose request names one the router
   * does not list is stopped on screen. Null is no check, not a refusal: the
   * request is still built from the source's own names.
   */
  routerFilters: Record<string, string[]> | null;
  /** Null until a config has been loaded; the page shows its search card. */
  stores: ExportStore[];
  /**
   * The source's filter lists, keyed by the router's filter name.
   *
   * Each holds only what this window actually contains, so no choice can come
   * back empty. Which lists there are, and what they are called, is the
   * source description's business, not the slice's.
   */
  lists: Record<string, ExportListItem[]>;
  /** The ways the endpoint will spell dates, as it offers them. */
  dateFormats: ExportDateFormat[];
  /**
   * Every day the loaded range covers, as `YYYY-MM-DD`.
   *
   * Worked out from the search dates when the config loads rather than read
   * off the response — the endpoint returns no day list, and a day with no
   * rows is still a day someone can ask about. Frozen at load time so it
   * describes the config on screen and not whatever the search card says now.
   */
  days: string[];
  columns: ExportColumn[];
  rows: ExportRow[];
  hasData: boolean;
  message: string | null;
  loaded: boolean;

  /** The picks, made against what came back and nothing else. */
  selectedStoreIds: number[];
  /**
   * What is ticked in each list, by filter name, as values.
   *
   * Every one reaches the export, so what narrows the sample narrows the file;
   * the sample is matched the way the router matches each one.
   */
  picks: Record<string, string[]>;
  selectedDays: string[];
  /**
   * The source's switches, by filter name: null leaves the flag alone, 0
   * excludes flagged rows, 1 keeps only them.
   *
   * Three states rather than a tick because "only the voids" is a real
   * question — the line someone is hunting for is usually the voided one. The
   * router tests COALESCE(flag, 0) against zero, so 1 means every marker it
   * finds, not the literal 1. A flag not here is null.
   */
  rowFlags: Record<string, number | null>;
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

  /** Column names, in the order they are grouped and written. */
  groupBy: string[];
  /** `{ column, fn }`, where column may be `*` for count(*), plus a name of
   *  its own when someone has given it one. */
  aggregates: ExportAggregate[];
  /**
   * Measures with arithmetic in them.
   *
   * Kept apart from the plain ones because they are a different thing to the
   * endpoint — a tree it walks rather than a column and a function — and
   * because only these can be built from a query rather than picked.
   */
  computed: ExportComputed[];
  /** What the file is sorted by; empty means the endpoint's own order. */
  orderBy: ExportSort[];

  flags: ExportFlags;

  /** The query scratchpad: open, and the last thing typed into it. */
  queryOpen: boolean;
  querySql: string;
  /**
   * The user's saved queries, fetched beside the preview.
   *
   * Beside it rather than when the window opens: the scope search is the one
   * moment someone is already waiting, and a list that is there before it is
   * asked for is the difference between a feature people use and one they
   * discover.
   */
  queries: SavedQuery[];
  queriesLoading: boolean;
  queriesError: string | null;
  /** The saved query the scratchpad is holding, so Save can mean replace. */
  currentQueryId: number | null;
  /** The last row deleted, kept whole so an undo can post it back. */
  deletedQuery: SavedQuery | null;
  /** The configuration before the last Apply, or null when there is
   *  nothing to take back. */
  preApply: ConfigSnapshot | null;
  /**
   * Bumped whenever the whole configuration is replaced rather than nudged.
   *
   * The query box follows the ticks unless someone has typed in it, and a
   * wholesale replacement has to win over that — the text they were part way
   * through describes a configuration that is gone.
   */
  configStamp: number;
  /**
   * Saved configurations — the questions, as rows of `user_queries`.
   *
   * Fetched beside the preview, because the scope search is the one moment
   * someone is already waiting.
   */
  saved: SavedConfig[];
  savedLoaded: boolean;
  savedBusy: boolean;
  savedOpen: boolean;
  savedError: string | null;
  /**
   * The configuration currently loaded.
   *
   * It rides with the build as `userQueryId`, which is what puts a name on
   * that build in Previous Builds a week later. Null is ad-hoc, and normal.
   */
  savedCurrentId: number | null;
  /** What the last load could not honour, shown until something changes. */
  savedNotes: string[];
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
  buildsLoading: boolean;
  buildsError: string | null;
  buildsOpen: boolean;
  /** How long the links in that listing last, from the listing itself. */
  buildsExpireMinutes: number;
  /** The build just finished, beyond the files themselves. */
  buildId: string | null;
  /**
   * The request that produced the file on screen.
   *
   * Kept so the card can tell whether it still describes what is configured.
   * A file built from two days, left on screen while the days are ticked back
   * on, is a file that looks like the answer and is not.
   */
  builtRequest: string | null;
  builtQueryId: number | null;
  builtQueryName: string | null;
  /** False means the file is there and its manifest is not, so this build
   *  will not appear in Previous Builds. */
  manifestWritten: boolean;
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
  source: "sales",
  routerFilters: null,
  stores: [],
  lists: {},
  dateFormats: [],
  days: [],
  columns: [],
  rows: [],
  hasData: false,
  message: null,
  loaded: false,

  selectedStoreIds: [],
  picks: {},
  selectedDays: [],
  rowFlags: {},
  selectedColumns: [],
  productCodes: [],
  productDescriptions: [],
  columnOrder: [],

  groupBy: [],
  aggregates: [],
  computed: [],
  orderBy: [],

  flags: {
    dateFormat: "",
    fileFormat: "csv",
    filePrefix: "sales",
    ordered: false,
  },

  queryOpen: false,
  querySql: "",
  queries: [],
  queriesLoading: false,
  queriesError: null,
  currentQueryId: null,
  deletedQuery: null,
  preApply: null,
  configStamp: 0,
  saved: [],
  savedLoaded: false,
  savedBusy: false,
  savedOpen: false,
  savedError: null,
  savedCurrentId: null,
  savedNotes: [],
  downloadsOpen: false,

  building: false,
  sql: null,
  loadingSql: false,
  files: [],
  builds: [],
  buildsLoading: false,
  buildsError: null,
  buildsOpen: false,
  buildsExpireMinutes: 60,
  buildId: null,
  builtRequest: null,
  builtQueryId: null,
  builtQueryName: null,
  manifestWritten: true,
  rowsUploaded: 0,
  elapsedSeconds: 0,
  urlExpiresInMinutes: 60,
  builtAt: null,
  slow: false,
  exportError: null,
};

/** Everything about all of every list: what "nothing narrowed" means. */
const allPicks = (lists: Record<string, ExportListItem[]>) =>
  Object.fromEntries(
    Object.entries(lists).map(([filter, items]) => [filter, items.map((i) => i.value)]),
  );

interface ConfigPayload {
  source: ExportTableKey;
  stores: ExportStore[];
  /** The source's lists, already turned into choices by its description. */
  lists: Record<string, ExportListItem[]>;
  dateFormats: ExportDateFormat[];
  /** The days in the range, from the caller — not from the response. */
  days: string[];
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
      const { source, stores, lists, dateFormats, days, columns, rows, hasData, message } =
        action.payload;
      state.loadingConfig = false;
      state.loaded = true;
      state.source = source;
      state.stores = stores;
      state.lists = lists;
      state.dateFormats = dateFormats;
      state.days = days;
      state.columns = columns;
      state.rows = rows;
      state.hasData = hasData;
      state.message = message;
      state.selectedStoreIds = stores.map((s) => s.storeid);
      state.picks = allPicks(lists);
      state.configStamp += 1;
      state.selectedDays = [...days];
      state.selectedColumns = columns.map((c) => c.name);
      state.columnOrder = columns.map((c) => c.name);
      // A new scope is a new question; the codes belonged to the old one.
      state.productCodes = [];
      state.productDescriptions = [];
      // And the step back belonged to the old one too.
      state.preApply = null;
      // As did whatever the last load said it could not carry over.
      state.savedNotes = [];
      // A new scope means the last file describes a question nobody asked.
      state.files = [];
      state.builtAt = null;
    },
    setRouterFilters: (state, action: PayloadAction<Record<string, string[]>>) => {
      state.routerFilters = action.payload;
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
    /** One choice in one list, on or off. */
    togglePick: (state, action: PayloadAction<{ filter: string; value: string }>) => {
      const { filter, value } = action.payload;
      const picked = state.picks[filter] ?? [];
      state.picks[filter] = picked.includes(value)
        ? picked.filter((v) => v !== value)
        : [...picked, value];
    },
    /** A whole list's picks at once: all, none, or what a load or a query
     *  says. */
    setPicks: (state, action: PayloadAction<{ filter: string; values: string[] }>) => {
      state.picks[action.payload.filter] = action.payload.values;
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
    toggleDay: (state, action: PayloadAction<string>) => {
      const v = action.payload;
      state.selectedDays = state.selectedDays.includes(v)
        ? state.selectedDays.filter((x) => x !== v)
        : [...state.selectedDays, v];
    },
    setSelectedDays: (state, action: PayloadAction<string[]>) => {
      state.selectedDays = action.payload;
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
    setComputed: (state, action: PayloadAction<ExportComputed[]>) => {
      state.computed = action.payload;
    },
    setOrderBy: (state, action: PayloadAction<ExportSort[]>) => {
      state.orderBy = action.payload;
    },
    /** Add a key, or turn the one that is already there around. */
    toggleSortKey: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      const at = state.orderBy.findIndex((s) => s.key === key);
      if (at === -1) {
        state.orderBy = [...state.orderBy, { key, desc: false }];
        return;
      }
      // Ascending, then descending, then gone: three clicks and back to
      // where it started, which is what a sort control usually does.
      state.orderBy = state.orderBy[at].desc
        ? state.orderBy.filter((s) => s.key !== key)
        : state.orderBy.map((s) => (s.key === key ? { key, desc: true } : s));
    },
    removeComputed: (state, action: PayloadAction<number>) => {
      state.computed = state.computed.filter((_, i) => i !== action.payload);
    },
    /** The name a measure carries into the file, or none to let the endpoint
     *  derive one. */
    setAggregateAlias: (
      state,
      action: PayloadAction<{ at: number; alias: string }>,
    ) => {
      const { at, alias } = action.payload;
      state.aggregates = state.aggregates.map((m, i) =>
        i === at ? { column: m.column, fn: m.fn, ...(alias ? { alias } : {}) } : m,
      );
    },
    setComputedAlias: (
      state,
      action: PayloadAction<{ at: number; alias: string }>,
    ) => {
      const { at, alias } = action.payload;
      state.computed = state.computed.map((m, i) =>
        i === at ? { ...m, alias } : m,
      );
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
    /** One of the source's row switches, by filter name. */
    setRowFlag: (
      state,
      action: PayloadAction<{ filter: string; value: number | null }>,
    ) => {
      state.rowFlags[action.payload.filter] = action.payload.value;
    },
    openQuery: (state, action: PayloadAction<boolean>) => {
      state.queryOpen = action.payload;
    },
    openDownloads: (state, action: PayloadAction<boolean>) => {
      state.downloadsOpen = action.payload;
    },
    openSaved: (state, action: PayloadAction<boolean>) => {
      state.savedOpen = action.payload;
      if (action.payload) state.savedError = null;
    },
    startSavedWork: (state) => {
      state.savedBusy = true;
      state.savedError = null;
    },
    setSaved: (state, action: PayloadAction<SavedConfig[]>) => {
      state.savedBusy = false;
      state.savedLoaded = true;
      state.saved = action.payload;
    },
    /** One saved configuration back from a save: new or replacing its twin. */
    upsertSaved: (state, action: PayloadAction<SavedConfig>) => {
      state.savedBusy = false;
      const next = action.payload;
      const at = state.saved.findIndex((s) => s.id === next.id);
      state.saved =
        at === -1
          ? [next, ...state.saved]
          : state.saved.map((s) => (s.id === next.id ? next : s));
      state.savedCurrentId = next.id;
    },
    removeSaved: (state, action: PayloadAction<number>) => {
      state.savedBusy = false;
      state.saved = state.saved.filter((s) => s.id !== action.payload);
      if (state.savedCurrentId === action.payload) state.savedCurrentId = null;
    },
    failSavedWork: (state, action: PayloadAction<string>) => {
      state.savedBusy = false;
      state.savedError = action.payload;
    },
    /** A saved configuration has just been applied, with what it could not do. */
    /**
     * A whole configuration has just been put on screen, with whatever the
     * open range could not honour.
     *
     * `id` is null for a build that was run ad-hoc: there is no saved
     * configuration behind it, and claiming one would put the wrong name on
     * the next build.
     */
    markSavedLoaded: (
      state,
      action: PayloadAction<{ id: number | null; notes: string[] }>,
    ) => {
      state.savedCurrentId = action.payload.id;
      state.savedNotes = action.payload.notes;
      state.configStamp += 1;
    },
    /** The load notes, read and put away. */
    clearSavedNotes: (state) => {
      state.savedNotes = [];
    },
    /** Kept so closing the window is not the same as losing the query. */
    setQuerySql: (state, action: PayloadAction<string>) => {
      state.querySql = action.payload;
    },
    startQueriesLoad: (state) => {
      state.queriesLoading = true;
      state.queriesError = null;
    },
    setQueries: (state, action: PayloadAction<SavedQuery[]>) => {
      state.queriesLoading = false;
      state.queries = action.payload;
    },
    failQueriesLoad: (state, action: PayloadAction<string>) => {
      state.queriesLoading = false;
      state.queriesError = action.payload;
    },
    /** A row back from a create or an update: new ones go on top, an edited
     *  one stays where it was. */
    upsertQuery: (state, action: PayloadAction<SavedQuery>) => {
      const row = action.payload;
      state.deletedQuery = null;
      const at = state.queries.findIndex((q) => q.id === row.id);
      state.queries =
        at === -1
          ? [row, ...state.queries]
          : state.queries.map((q) => (q.id === row.id ? row : q));
      state.currentQueryId = row.id;
      state.queriesError = null;
    },
    /** The row is held, not dropped: the undo posts this very object back. */
    forgetQuery: (state, action: PayloadAction<SavedQuery>) => {
      const row = action.payload;
      state.queries = state.queries.filter((q) => q.id !== row.id);
      state.deletedQuery = row;
      if (state.currentQueryId === row.id) state.currentQueryId = null;
    },
    clearDeletedQuery: (state) => {
      state.deletedQuery = null;
    },
    /** Which saved query the scratchpad is holding; null once it is edited
     *  into something else, or for text nobody has saved. */
    setCurrentQuery: (state, action: PayloadAction<number | null>) => {
      state.currentQueryId = action.payload;
      state.deletedQuery = null;
    },
    /**
     * Keep the picks as they stand, before a query is applied over them.
     *
     * Taken from the state rather than passed in, so there is no way for the
     * caller to snapshot something other than what is actually there. A
     * second apply replaces the first: this is one step back, not a history.
     */
    rememberBeforeApply: (state) => {
      state.preApply = {
        groupBy: state.groupBy,
        aggregates: state.aggregates,
        computed: state.computed,
        orderBy: state.orderBy,
        selectedStoreIds: state.selectedStoreIds,
        picks: state.picks,
        selectedDays: state.selectedDays,
        rowFlags: state.rowFlags,
        selectedColumns: state.selectedColumns,
        columnOrder: state.columnOrder,
        productCodes: state.productCodes,
        productDescriptions: state.productDescriptions,
        flags: state.flags,
      };
    },
    undoApply: (state) => {
      if (!state.preApply) return;
      Object.assign(state, state.preApply);
      state.preApply = null;
      state.configStamp += 1;
    },
    forgetPreApply: (state) => {
      state.preApply = null;
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
        buildId: string;
        userQueryId: number | null;
        userQueryName: string | null;
        manifestWritten: boolean;
        request: string;
      }>,
    ) => {
      state.building = false;
      state.slow = false;
      state.files = action.payload.files;
      state.rowsUploaded = action.payload.rowsUploaded;
      state.elapsedSeconds = action.payload.elapsedSeconds;
      state.urlExpiresInMinutes = action.payload.urlExpiresInMinutes;
      state.builtAt = Date.now();
      state.buildId = action.payload.buildId;
      state.builtRequest = action.payload.request;
      state.builtQueryId = action.payload.userQueryId;
      state.builtQueryName = action.payload.userQueryName;
      state.manifestWritten = action.payload.manifestWritten;
    },
    startBuildsLoad: (state) => {
      state.buildsLoading = true;
      state.buildsError = null;
    },
    setBuilds: (
      state,
      action: PayloadAction<{ builds: ExportBuild[]; expireMinutes: number }>,
    ) => {
      state.buildsLoading = false;
      state.builds = action.payload.builds;
      state.buildsExpireMinutes = action.payload.expireMinutes;
    },
    failBuildsLoad: (state, action: PayloadAction<string>) => {
      state.buildsLoading = false;
      state.buildsError = action.payload;
    },
    openBuilds: (state, action: PayloadAction<boolean>) => {
      state.buildsOpen = action.payload;
      if (action.payload) state.buildsError = null;
    },
    /** A build that has just been labelled, or had its label cleared. */
    relabelBuild: (
      state,
      action: PayloadAction<{
        buildId: string;
        userQueryId: number | null;
        userQueryName: string | null;
      }>,
    ) => {
      const { buildId, userQueryId, userQueryName } = action.payload;
      state.builds = state.builds.map((b) =>
        b.buildId === buildId ? { ...b, userQueryId, userQueryName } : b,
      );
      if (state.buildId === buildId) {
        state.builtQueryId = userQueryId;
        state.builtQueryName = userQueryName;
      }
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
      state.builtRequest = null;
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
      state.picks = allPicks(state.lists);
      state.selectedDays = [...state.days];
      state.rowFlags = {};
      state.selectedColumns = state.columns.map((c) => c.name);
      state.columnOrder = state.columns.map((c) => c.name);
      state.productCodes = [];
      state.productDescriptions = [];
      state.groupBy = [];
      state.aggregates = [];
      state.computed = [];
      state.orderBy = [];
      state.flags = { ...initialState.flags };
      state.preApply = null;
      state.configStamp += 1;
      state.files = [];
      state.exportError = null;
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
  setRouterFilters,
  failConfigLoad,
  toggleStore,
  setSelectedStoreIds,
  togglePick,
  setPicks,
  toggleDay,
  setSelectedDays,
  toggleColumn,
  moveColumn,
  setSelectedColumns,
  setProductCodes,
  setProductDescriptions,
  toggleGroupBy,
  setGroupBy,
  addAggregate,
  setAggregate,
  setAggregates,
  setAggregateAlias,
  setComputed,
  setComputedAlias,
  removeComputed,
  setOrderBy,
  clearSavedNotes,
  toggleSortKey,
  removeAggregate,
  setColumnOrder,
  openQuery,
  openDownloads,
  openSaved,
  startQueriesLoad,
  setQueries,
  failQueriesLoad,
  upsertQuery,
  forgetQuery,
  clearDeletedQuery,
  setCurrentQuery,
  rememberBeforeApply,
  undoApply,
  forgetPreApply,
  startSavedWork,
  setSaved,
  upsertSaved,
  removeSaved,
  failSavedWork,
  markSavedLoaded,
  setQuerySql,
  setFlag,
  setRowFlag,
  startSqlLoad,
  setSql,
  closeSql,
  startExport,
  markExportSlow,
  finishExport,
  failExport,
  dismissBuild,
  clearSelections,
  startBuildsLoad,
  setBuilds,
  failBuildsLoad,
  openBuilds,
  relabelBuild,
  resetExportBuilder,
} = devExportBuilderSlice.actions;
export default devExportBuilderSlice.reducer;
