/**
 * Dev copy of `features/upcDevSlice.ts`, mounted at `state.dev.upcDev` and read only
 * by `pages/upc/dev`. Edit this one while changing dev upc; when dev is
 * promoted, it replaces the prod slice. See src/store/devReducers.ts.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  UpcItem,
  UpcSalesComp,
  UpcForecastData,
  UpcInfo,
  ForecastExport,
  ForecastMetrics,
  UpcPriceOpt,
  UpcTrend,
} from "../../interfaces";

export type UpcDevTab = "salesComp" | "forecast" | "priceOpt" | "trend" | "association";

// Forecast excluded — still inert, not a selectable landing tab.
export const UPC_DEV_TABS: { id: UpcDevTab; label: string }[] = [
  { id: "salesComp", label: "Sales Comp" },
  { id: "priceOpt", label: "Price Opt" },
  { id: "trend", label: "Trend" },
  { id: "association", label: "Association" },
];

export type UpcDevDisplayMode = "code" | "desc";
export type UpcDevShowMode = "all" | "selected";

export type AssociationItem = {
  product_code: string;
  product_description: string;
  sub_department: number;
  sub_department_description: string;
  qty: number;
  basket_count: number;
  revenue: number;
  avg_price: number;
  attach_rate: number;
  is_seed: boolean;
};

export type AssociationResult = {
  totalBaskets: number;
  items: AssociationItem[];
};

/** Which backend the loaded data came from. Mirrors `app.apiEnv`, but held
 *  here so the data can say which environment it belongs to. */
export type UpcDevEnv = "dev" | "prod";

interface UpcDevState {
  /**
   * The environment the data below was fetched from.
   *
   * Switching the API switches the backend but not what is already on screen,
   * and none of it is labelled — so prod rows sat under a DEV badge, and
   * because `searchedScopeKey` knows nothing about the environment, the next
   * re-search took the incremental path and merged a call to one backend into
   * rows from the other. A removal-only re-search skipped the network
   * entirely, leaving a page of dev data under a PROD badge.
   *
   * Rather than throw the data away on every switch, each environment keeps
   * its own: see `stash` and `setUpcDevEnv`.
   */
  env: UpcDevEnv;
  /**
   * The other environment's data, parked.
   *
   * Two full answers to the same question is the point — load a search on
   * prod, switch to dev, and flipping between them is a click rather than two
   * re-searches, which is the only way to see the same UPCs read both ways.
   *
   * Same park-and-restore shape as `itemPerfSlice`'s per-page stash, and for
   * the same reason: the alternative is keying all forty-odd fields by
   * environment and rewriting every reducer that touches them.
   */
  stash: Partial<Record<UpcDevEnv, UpcDevSnapshot>>;
  upcs: string[];
  upcText: string;
  storeids: string;
  trendPeriods: number;
  activeTab: UpcDevTab;
  dataLoaded: boolean;
  // Bumped whenever the loaded data set changes shape — a new search
  // (clearDevUpcData) or a prune (removeDevUpcs). Every tab keys its
  // initial-fetch effect on this, so the change reliably triggers a refetch
  // even when it wouldn't otherwise move any of that effect's own dependencies
  // (e.g. same store, same UPCs, just re-run). Tabs that already hold valid
  // data are stopped by their own loaded/loading guard and cost nothing, so
  // bumping this is cheap for everything except what actually needs refetching.
  searchVersion: number;
  // The UPC set the currently-loaded module data actually covers, and the
  // store/date scope it was fetched under. `upcs` is the search card's working
  // list and drifts ahead of the data as the user edits chips; these two are
  // what the data on screen is true for. The difference between them is what
  // lets a re-search that only *removed* UPCs be answered by pruning state
  // instead of re-fetching every module.
  searchedUpcs: string[];
  searchedScopeKey: string;
  upcItems: UpcItem[];
  selectedUpcs: string[];
  filterText: string;
  displayMode: UpcDevDisplayMode;
  showMode: UpcDevShowMode;
  // Every module tracks *which UPCs its data covers* rather than a loaded
  // yes/no. That's what lets an added UPC be fetched on its own and merged in:
  // a tab's fetch asks for `upcs − coverage` and skips the call entirely when
  // that's empty. Coverage records what was *asked for*, not what came back —
  // a UPC with no sales in the window returns no rows but is still covered,
  // and recording only responders would re-request it forever.
  //
  // Sales Comp
  salesCompCoverage: string[];
  salesCompLoading: boolean;
  salesComp: UpcSalesComp[];
  // Last year is the Sales Comp tab's own second call, tracked separately so
  // it can be fetched lazily like every other module's data rather than fired
  // alongside the search. Until it lands, `hasLY` leaves the vs-LY figures
  // null rather than reporting a comparison against nothing.
  salesCompLY: UpcSalesComp[];
  salesCompLYCoverage: string[];
  salesCompLYLoading: boolean;
  // Forecast
  forecastLoaded: boolean;
  forecastLoading: boolean;
  forecastQtyData: UpcForecastData[];
  upcList: UpcInfo[];
  forecastExport: ForecastExport[];
  forecastMetricExport: ForecastMetrics[];
  // Price Opt
  priceOptCoverage: string[];
  priceOptLoading: boolean;
  optBestPrices: UpcPriceOpt[];
  optBestPricesByUpc: UpcPriceOpt[];
  // Trend
  trendCoverage: string[];
  trendLoading: boolean;
  upcTrends: UpcTrend[];
  // Association — one re-rootable panel over the seed UPC set (upcs/
  // selectedUpcs), keyed on the seed set itself so revisiting a re-rooted
  // item under an unchanged seed set never refetches. associationSeedKey is
  // a sorted/joined snapshot of whichever UPCs fed the last seed fetch.
  associationSeedKey: string;
  associationSeedLoaded: boolean;
  associationSeedLoading: boolean;
  associationSeedData: AssociationResult | null;
  associationRerootUpc: string | null;
  associationRerootCache: Record<string, AssociationResult>;
  associationRerootLoading: boolean;
}

/** One module's answer for a set of UPCs. `codes` is what was *asked for*;
 *  `rows` is what came back, which may cover fewer of them. */
type MergePayload<T> = { rows: T[]; codes: string[] };

/** Replace every row belonging to the requested UPCs with the fresh answer,
 *  leaving the rest of the module's data alone.
 *
 *  Written as replace-then-append rather than a plain concat so it's
 *  idempotent: re-fetching a UPC already present (a retry, a StrictMode
 *  double-invoke that slipped the queue's dedupe) updates its rows instead of
 *  doubling them, which would quietly double that UPC's contribution to every
 *  total on the page. */
const mergeRows = <T extends { product_code: string }>(
  current: T[],
  { rows, codes }: MergePayload<T>,
): T[] => {
  const incoming = new Set(codes);
  return [...current.filter((r) => !incoming.has(r.product_code)), ...rows];
};

/** Coverage is what was asked for, not what came back — see the note on the
 *  coverage fields. Order doesn't matter; uniqueness does. */
const extendCoverage = (current: string[], codes: string[]): string[] =>
  Array.from(new Set([...current, ...codes]));

/**
 * What follows you between environments instead of being parked with the data.
 *
 * The split is "the question" vs "the answer". A UPC list, a trend window and
 * which tab you are reading are what you are asking, and retyping them to look
 * at the same items on the other backend is the friction this whole change
 * exists to remove — switching envs drops you on the search card with your
 * chips still in it. `searchVersion` is shared because it is a counter that
 * must only ever climb; restoring an older value would hand two different
 * datasets the same version.
 *
 * `storeids` is deliberately NOT here. It is a resolved answer — for a group
 * search it is that group's member stores as one backend listed them — so it
 * belongs with the rows it fetched.
 */
const SHARED_KEYS = [
  "env",
  "stash",
  "upcs",
  "upcText",
  "trendPeriods",
  "activeTab",
  "displayMode",
  "showMode",
  "searchVersion",
] as const;

type SharedKey = (typeof SHARED_KEYS)[number];

/** One environment's data, and where it was left. */
export type UpcDevSnapshot = Omit<UpcDevState, SharedKey>;

/**
 * Cleared on the way into the stash.
 *
 * A module parked mid-fetch would come back with its flag still set and no
 * request behind it, so the tab would sit on "Loading…" forever — the fetch
 * that would have cleared it was abandoned by `upcQueue.startRun()` when the
 * environment changed. Coverage is untouched, so the restored tab simply asks
 * again on its next visit.
 */
const LOADING_KEYS = [
  "salesCompLoading",
  "salesCompLYLoading",
  "forecastLoading",
  "priceOptLoading",
  "trendLoading",
  "associationSeedLoading",
  "associationRerootLoading",
] as const;

const SHARED = new Set<string>(SHARED_KEYS);

const snapshotOf = (s: UpcDevState): UpcDevSnapshot => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(s)) {
    if (!SHARED.has(k)) out[k] = v;
  }
  for (const k of LOADING_KEYS) out[k] = false;
  return out as UpcDevSnapshot;
};

const initialState: UpcDevState = {
  // Prod on load, in step with `app.apiEnv`'s own default.
  env: "prod",
  stash: {},
  upcs: [],
  upcText: "",
  storeids: "",
  trendPeriods: 90,
  activeTab: "salesComp",
  dataLoaded: false,
  searchVersion: 0,
  searchedUpcs: [],
  searchedScopeKey: "",
  upcItems: [],
  selectedUpcs: [],
  filterText: "",
  displayMode: "code",
  showMode: "all",
  // Sales Comp
  salesCompCoverage: [],
  salesCompLoading: false,
  salesComp: [],
  salesCompLY: [],
  salesCompLYCoverage: [],
  salesCompLYLoading: false,
  // Forecast
  forecastLoaded: false,
  forecastLoading: false,
  forecastQtyData: [],
  upcList: [],
  forecastExport: [],
  forecastMetricExport: [],
  // Price Opt
  priceOptCoverage: [],
  priceOptLoading: false,
  optBestPrices: [],
  optBestPricesByUpc: [],
  // Trend
  trendCoverage: [],
  trendLoading: false,
  upcTrends: [],
  // Association
  associationSeedKey: "",
  associationSeedLoaded: false,
  associationSeedLoading: false,
  associationSeedData: null,
  associationRerootUpc: null,
  associationRerootCache: {},
  associationRerootLoading: false,
};

const upcDevSlice = createSlice({
  // Distinct from the prod slice's "upcDev": Redux matches actions on this
  // string alone, so sharing it would move prod and dev together.
  name: "devUpcDev",
  initialState,
  reducers: {
    setDevUpcs(state, action: PayloadAction<string[]>) {
      state.upcs = [...new Set([...state.upcs, ...action.payload])];
    },
    setDevUpcText(state, action: PayloadAction<string>) {
      state.upcText = action.payload;
    },
    removeDevUpc(state, action: PayloadAction<string>) {
      state.upcs = state.upcs.filter((u) => u !== action.payload);
    },
    clearDevUpcs(state) {
      state.upcs = [];
      state.upcText = "";
    },
    setDevStoreids(state, action: PayloadAction<string>) {
      state.storeids = action.payload;
    },
    setDevTrendPeriods(state, action: PayloadAction<number>) {
      state.trendPeriods = action.payload;
    },
    setDevActiveTab(state, action: PayloadAction<UpcDevTab>) {
      state.activeTab = action.payload;
    },
    setDevDataLoaded(state, action: PayloadAction<boolean>) {
      state.dataLoaded = action.payload;
    },
    setDevUpcItems(state, action: PayloadAction<UpcItem[]>) {
      const existing = new Map(state.upcItems.map((i) => [i.product_code, i]));
      for (const item of action.payload) {
        // A blank description never overwrites a real one. The roster is
        // seeded from the searched UPCs with empty descriptions, and modules
        // fill them in as they respond — a later module that happens not to
        // name an item must not blank out what an earlier one already knew.
        if (!item.description && existing.get(item.product_code)?.description) continue;
        existing.set(item.product_code, item);
      }
      state.upcItems = Array.from(existing.values());
    },

    /** Put every searched UPC on the roster, whether or not any module has
     *  data for it.
     *
     *  The left panel used to list whatever Sales Comp returned, which meant a
     *  UPC with no sales in the window silently vanished from a list the user
     *  typed themselves, and the list changed size as they moved between tabs.
     *  Seeding from the search keeps the roster stable and makes "no data"
     *  something the user can see rather than infer from an absence. */
    seedDevUpcItems(state, action: PayloadAction<string[]>) {
      const known = new Set(state.upcItems.map((i) => i.product_code));
      for (const code of action.payload) {
        if (!known.has(code)) state.upcItems.push({ product_code: code, description: "" });
      }
    },
    toggleDevSelectedUpc(state, action: PayloadAction<string>) {
      const pc = action.payload;
      if (state.selectedUpcs.includes(pc)) {
        state.selectedUpcs = state.selectedUpcs.filter((u) => u !== pc);
      } else {
        state.selectedUpcs = [...state.selectedUpcs, pc];
      }
    },
    setDevAllSelectedUpcs(state, action: PayloadAction<string[]>) {
      state.selectedUpcs = action.payload;
    },
    resetDevSelectedUpcs(state) {
      state.selectedUpcs = [];
    },
    setDevFilterText(state, action: PayloadAction<string>) {
      state.filterText = action.payload;
    },
    setDevDisplayMode(state, action: PayloadAction<UpcDevDisplayMode>) {
      state.displayMode = action.payload;
    },
    setDevShowMode(state, action: PayloadAction<UpcDevShowMode>) {
      state.showMode = action.payload;
    },
    // Sales Comp
    setDevSalesCompLoading(state, action: PayloadAction<boolean>) {
      state.salesCompLoading = action.payload;
    },
    mergeDevSalesComp(state, action: PayloadAction<MergePayload<UpcSalesComp>>) {
      state.salesComp = mergeRows(state.salesComp, action.payload);
      state.salesCompCoverage = extendCoverage(state.salesCompCoverage, action.payload.codes);
    },
    mergeDevSalesCompLY(state, action: PayloadAction<MergePayload<UpcSalesComp>>) {
      state.salesCompLY = mergeRows(state.salesCompLY, action.payload);
      state.salesCompLYCoverage = extendCoverage(state.salesCompLYCoverage, action.payload.codes);
    },
    setDevSalesCompLYLoading(state, action: PayloadAction<boolean>) {
      state.salesCompLYLoading = action.payload;
    },
    // Forecast
    setDevForecastLoaded(state, action: PayloadAction<boolean>) {
      state.forecastLoaded = action.payload;
    },
    setDevForecastLoading(state, action: PayloadAction<boolean>) {
      state.forecastLoading = action.payload;
    },
    setDevForecastQtyData(state, action: PayloadAction<UpcForecastData[]>) {
      state.forecastQtyData = action.payload;
    },
    setDevUpcList(state, action: PayloadAction<UpcInfo[]>) {
      state.upcList = action.payload;
    },
    setDevForecastExport(state, action: PayloadAction<ForecastExport[]>) {
      state.forecastExport = action.payload;
    },
    setDevForecastMetricExport(state, action: PayloadAction<ForecastMetrics[]>) {
      state.forecastMetricExport = action.payload;
    },
    // Price Opt
    setDevPriceOptLoading(state, action: PayloadAction<boolean>) {
      state.priceOptLoading = action.payload;
    },
    mergeDevPriceOpt(
      state,
      action: PayloadAction<{ bestPrices: UpcPriceOpt[]; byUpc: UpcPriceOpt[]; codes: string[] }>,
    ) {
      const { bestPrices, byUpc, codes } = action.payload;
      state.optBestPrices = mergeRows(state.optBestPrices, { rows: bestPrices, codes });
      state.optBestPricesByUpc = mergeRows(state.optBestPricesByUpc, { rows: byUpc, codes });
      state.priceOptCoverage = extendCoverage(state.priceOptCoverage, codes);
    },
    // Trend
    setDevTrendLoading(state, action: PayloadAction<boolean>) {
      state.trendLoading = action.payload;
    },
    mergeDevTrends(state, action: PayloadAction<MergePayload<UpcTrend>>) {
      state.upcTrends = mergeRows(state.upcTrends, action.payload);
      state.trendCoverage = extendCoverage(state.trendCoverage, action.payload.codes);
    },
    // Association
    setDevAssociationSeedKey(state, action: PayloadAction<string>) {
      state.associationSeedKey = action.payload;
    },
    setDevAssociationSeedLoaded(state, action: PayloadAction<boolean>) {
      state.associationSeedLoaded = action.payload;
    },
    setDevAssociationSeedLoading(state, action: PayloadAction<boolean>) {
      state.associationSeedLoading = action.payload;
    },
    setDevAssociationSeedData(state, action: PayloadAction<AssociationResult | null>) {
      state.associationSeedData = action.payload;
    },
    setDevAssociationRerootUpc(state, action: PayloadAction<string | null>) {
      state.associationRerootUpc = action.payload;
    },
    setDevAssociationRerootLoading(state, action: PayloadAction<boolean>) {
      state.associationRerootLoading = action.payload;
    },
    setDevAssociationRerootCacheEntry(
      state,
      action: PayloadAction<{ upc: string; result: AssociationResult }>,
    ) {
      state.associationRerootCache[action.payload.upc] = action.payload.result;
    },
    clearDevAssociationRerootCache(state) {
      state.associationRerootCache = {};
    },
    resetDevAssociations(state) {
      state.associationSeedKey = "";
      state.associationSeedLoaded = false;
      state.associationSeedLoading = false;
      state.associationSeedData = null;
      state.associationRerootUpc = null;
      state.associationRerootCache = {};
      state.associationRerootLoading = false;
    },
    /** Record what the freshly-loaded data actually covers. Dispatched on a
     *  completed search, once, so the next search can diff against it. */
    setDevSearchSnapshot(
      state,
      action: PayloadAction<{ upcs: string[]; scopeKey: string }>,
    ) {
      state.searchedUpcs = action.payload.upcs;
      state.searchedScopeKey = action.payload.scopeKey;
    },

    /** Drop UPCs from every place their data lives, without re-fetching.
     *
     *  A search that only removed UPCs asks for a strict subset of what's
     *  already loaded, so the answer is arithmetic rather than three heavy
     *  calls: every module's rows are keyed on product_code and carry only
     *  that UPC's own numbers, so filtering them produces exactly what a
     *  re-search would have returned. That equivalence is the whole point, and
     *  it's also the risk — a UPC left behind in one array would linger in that
     *  module's KPI denominators where nothing on screen would explain it. Any
     *  new per-UPC state must be pruned here too.
     *
     *  Association is the one thing that can't be filtered: `total_baskets` and
     *  every companion's numbers are computed across the whole seed set, so a
     *  seed that loses a UPC has to be re-fetched rather than adjusted. Its
     *  per-UPC re-root cache entries are independently valid and only need the
     *  removed codes dropped.
     */
    removeDevUpcs(state, action: PayloadAction<string[]>) {
      const drop = new Set(action.payload);
      if (drop.size === 0) return;

      // A module whose fetch was in flight when this ran had it aborted, which
      // leaves it unloaded. Bumping the version re-runs every tab's fetch
      // effect: the aborted one reloads against the reduced UPC set, and the
      // rest are stopped by their own loaded guard without making a call.
      state.searchVersion += 1;

      const keepRows = <T extends { product_code: string }>(rows: T[]) =>
        rows.filter((r) => !drop.has(r.product_code));
      const keepUpcKeyed = <T extends { upc: string }>(rows: T[]) =>
        rows.filter((r) => !drop.has(r.upc));

      state.upcs = state.upcs.filter((u) => !drop.has(u));
      state.searchedUpcs = state.searchedUpcs.filter((u) => !drop.has(u));
      state.upcItems = state.upcItems.filter((i) => !drop.has(i.product_code));
      state.selectedUpcs = state.selectedUpcs.filter((u) => !drop.has(u));

      state.salesComp = keepRows(state.salesComp);
      state.salesCompLY = keepRows(state.salesCompLY);
      state.optBestPrices = keepRows(state.optBestPrices);
      state.optBestPricesByUpc = keepRows(state.optBestPricesByUpc);
      state.upcTrends = keepRows(state.upcTrends);

      // Coverage has to shrink with the data. A removed UPC that stayed in a
      // coverage list would be treated as already-fetched if the user added it
      // back, leaving that module permanently missing rows for it.
      const keepCodes = (codes: string[]) => codes.filter((c) => !drop.has(c));
      state.salesCompCoverage = keepCodes(state.salesCompCoverage);
      state.salesCompLYCoverage = keepCodes(state.salesCompLYCoverage);
      state.priceOptCoverage = keepCodes(state.priceOptCoverage);
      state.trendCoverage = keepCodes(state.trendCoverage);

      // Forecast is parked rather than dead — the export modal still reads
      // these two — so it gets pruned like everything else.
      state.forecastQtyData = keepRows(state.forecastQtyData);
      state.forecastExport = keepUpcKeyed(state.forecastExport);
      state.forecastMetricExport = keepUpcKeyed(state.forecastMetricExport);
      // UpcInfo carries the code in `value` (`label` is the description).
      state.upcList = state.upcList.filter((i) => !drop.has(i.value));

      for (const code of drop) delete state.associationRerootCache[code];
      if (state.associationRerootUpc && drop.has(state.associationRerootUpc)) {
        state.associationRerootUpc = null;
      }

      // associationSeedKey is a sorted, comma-joined snapshot of the UPCs that
      // drove the last seed fetch. If any of them just left, the numbers on
      // screen were computed over a seed set that no longer exists — clear it
      // so the tab re-fetches on its next visit rather than showing stale
      // co-occurrence against a UPC the user removed.
      const seededOnRemoved = state.associationSeedKey
        .split(",")
        .some((code) => drop.has(code));
      if (seededOnRemoved) {
        state.associationSeedKey = "";
        state.associationSeedLoaded = false;
        state.associationSeedData = null;
        state.associationRerootUpc = null;
        state.associationRerootCache = {};
      }
    },

    /**
     * Put one environment's data away and bring the other's out.
     *
     * Dispatched from UpcListDev whenever `app.apiEnv` and this slice disagree
     * — on a switch made while the page is open, and on arriving at the page
     * after a switch made somewhere else. The queue is aborted by the caller
     * first: it is a module singleton rather than Redux state, and an
     * in-flight response from the outgoing backend must not land in the
     * incoming environment's freshly restored rows.
     */
    setUpcDevEnv(state, action: PayloadAction<UpcDevEnv>) {
      const next = action.payload;
      if (state.env === next) return;

      state.stash[state.env] = snapshotOf(state);
      const back = state.stash[next];
      // No stash entry means this environment has not been searched yet, so
      // it starts empty — which lands on the search card, with the UPC chips
      // and trend window carried over by SHARED_KEYS.
      Object.assign(state, back ?? snapshotOf(initialState));
      // Only ever two datasets alive: the one on screen and the one parked.
      delete state.stash[next];
      state.env = next;
    },

    clearDevUpcData(state) {
      state.searchVersion += 1;
      state.dataLoaded = false;
      state.searchedUpcs = [];
      state.searchedScopeKey = "";
      state.upcItems = [];
      state.selectedUpcs = [];
      state.filterText = "";
      state.salesCompCoverage = [];
      state.salesCompLoading = false;
      state.salesComp = [];
      state.salesCompLY = [];
      state.salesCompLYCoverage = [];
      state.salesCompLYLoading = false;
      state.forecastLoaded = false;
      state.forecastLoading = false;
      state.forecastQtyData = [];
      state.upcList = [];
      state.forecastExport = [];
      state.forecastMetricExport = [];
      state.priceOptCoverage = [];
      state.priceOptLoading = false;
      state.optBestPrices = [];
      state.optBestPricesByUpc = [];
      state.trendCoverage = [];
      state.trendLoading = false;
      state.upcTrends = [];
      state.associationSeedKey = "";
      state.associationSeedLoaded = false;
      state.associationSeedLoading = false;
      state.associationSeedData = null;
      state.associationRerootUpc = null;
      state.associationRerootCache = {};
      state.associationRerootLoading = false;
    },
    resetDevUpcState: () => initialState,
  },
});

export const {
  setDevUpcs,
  setDevUpcText,
  removeDevUpc,
  clearDevUpcs,
  setDevStoreids,
  setDevTrendPeriods,
  setDevActiveTab,
  setDevDataLoaded,
  setDevUpcItems,
  toggleDevSelectedUpc,
  setDevAllSelectedUpcs,
  resetDevSelectedUpcs,
  setDevFilterText,
  setDevDisplayMode,
  setDevShowMode,
  setDevSalesCompLoading,
  mergeDevSalesComp,
  setDevSearchSnapshot,
  removeDevUpcs,
  seedDevUpcItems,
  mergeDevSalesCompLY,
  setDevSalesCompLYLoading,
  setDevForecastLoaded,
  setDevForecastLoading,
  setDevForecastQtyData,
  setDevUpcList,
  setDevForecastExport,
  setDevForecastMetricExport,
  setDevPriceOptLoading,
  mergeDevPriceOpt,
  setDevTrendLoading,
  mergeDevTrends,
  setDevAssociationSeedKey,
  setDevAssociationSeedLoaded,
  setDevAssociationSeedLoading,
  setDevAssociationSeedData,
  setDevAssociationRerootUpc,
  setDevAssociationRerootLoading,
  setDevAssociationRerootCacheEntry,
  clearDevAssociationRerootCache,
  resetDevAssociations,
  setUpcDevEnv,
  clearDevUpcData,
  resetDevUpcState,
} = upcDevSlice.actions;

export default upcDevSlice.reducer;
