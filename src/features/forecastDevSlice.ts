import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ForecastItem, PriceHistoryResult } from "../interfaces";
import type { AdListRow } from "./adListSlice";
import type { Tier } from "../pages/forecast/dev/forecastRanking";
import type { ForecastOutlierRow } from "./forecastSlice";
import { calcFcstQty, estimateDaysActive } from "../pages/forecast/utils";
import { forecastUnits } from "../pages/forecast/utils";

/**
 * Forecast (dev).
 *
 * A deliberately smaller slice than `forecastSlice`. The legacy page keeps four
 * saved-simulation slots, their titles and buttons, a replay list and an S3 file
 * list; none of that exists in dev, so none of it is carried here. Legacy still
 * owns its own slice untouched — the two run side by side.
 *
 * **The row-mutation reducers below are ported verbatim from the legacy slice.**
 * Every forecast number this page shows comes out of them, and the calculations
 * are frozen: the only edit made while porting was dropping the tail that
 * copied the result into whichever of the four sim arrays was active. Those
 * tails assigned a value that had already been written to `rowData`, so their
 * removal changes which arrays get updated and nothing else.
 *
 * `rowData` and `forecastResults` keep their legacy names for the same reason —
 * so the ported bodies transfer without a single edit to their arithmetic.
 */

interface ForecastDevState {
  /** Comma-joined storeids the last search ran against — one for a store, the
   *  group's active stores for a group. The picker itself lives in the shared
   *  search slice, same as every other dev page. */
  storeids: string;

  /** The item list this page is working from. Deliberately NOT the shared
   *  `upcUploadSlice` / `adListSlice` the legacy page writes to — a dev upload
   *  must not change what legacy (or the UPC List page) is holding, and a
   *  legacy upload must not leak into a dev search. Same shape UPC List's dev
   *  slice uses, so the card behaves the same way. */
  upcs: string[];
  upcText: string;
  adListRows: Record<string, AdListRow>;
  adListFileName: string;

  isLoading: boolean;
  /** A second batch is in flight — the first 500 are already on screen. */
  isLoadingMore: boolean;
  noResults: boolean;
  /** UPCs the API returned nothing for, surfaced rather than silently dropped. */
  notFoundUpcs: string[];

  items: ForecastItem[];
  /** Full price history per UPC. The calculator reads this, not the rows. */
  forecastResults: PriceHistoryResult[];
  singlePriceResults: PriceHistoryResult[];
  /** The editable grid. */
  rowData: ForecastOutlierRow[];
  /** The rows exactly as the search produced them. Kept only so a price or
   *  ad-days edit can be undone — nothing renders from it. */
  initialRowData: ForecastOutlierRow[];
  /** Ticked in the item panel — what the grid and the KPI strip cover. Every
   *  row starts ticked, so the page opens on the whole search. */
  checkedUpcs: string[];
  listFilter: string;
  /** Contribution tiers on show. Empty means all of them — the grid and the
   *  export read the same field so a download matches what's on screen. */
  tierFilter: Tier[];

  /** UPC whose calculator is open; "" is closed. Replaces legacy's per-row
   *  `calcNow` flag — a modal has one subject, so one field says which. */
  selectedUpc: string;
  globalFcstPrice: string;
  globalAdDays: string;
}

const initialState: ForecastDevState = {
  storeids: "",
  upcs: [],
  upcText: "",
  adListRows: {},
  adListFileName: "",
  isLoading: false,
  isLoadingMore: false,
  noResults: false,
  notFoundUpcs: [],
  items: [],
  forecastResults: [],
  singlePriceResults: [],
  rowData: [],
  initialRowData: [],
  checkedUpcs: [],
  listFilter: "",
  tierFilter: [],
  selectedUpc: "",
  globalFcstPrice: "",
  globalAdDays: "",
};

const forecastDevSlice = createSlice({
  name: "forecastDev",
  initialState,
  reducers: {
    setStoreids: (state, action: PayloadAction<string>) => {
      state.storeids = action.payload;
    },
    /** Pasted or uploaded UPCs accumulate, deduped — same as UPC List. */
    addUpcs: (state, action: PayloadAction<string[]>) => {
      state.upcs = [...new Set([...state.upcs, ...action.payload])];
    },
    setUpcText: (state, action: PayloadAction<string>) => {
      state.upcText = action.payload;
    },
    removeUpc: (state, action: PayloadAction<string>) => {
      state.upcs = state.upcs.filter((u) => u !== action.payload);
      // Its AD row goes with it, or the forecast would still be priced off an
      // ad for an item that is no longer in the list.
      delete state.adListRows[action.payload];
    },
    /** Back to an empty list — pasted, uploaded and AD-list alike. */
    clearUpcs: (state) => {
      state.upcs = [];
      state.upcText = "";
      state.adListRows = {};
      state.adListFileName = "";
    },
    /** An AD list carries its own UPC list, so it fills both. */
    setUploadedAdList: (
      state,
      action: PayloadAction<{ rows: AdListRow[]; fileName: string }>,
    ) => {
      const map: Record<string, AdListRow> = { ...state.adListRows };
      for (const row of action.payload.rows) map[row.upc] = row;
      state.adListRows = map;
      state.adListFileName = action.payload.fileName;
      state.upcs = [
        ...new Set([...state.upcs, ...action.payload.rows.map((r) => r.upc)]),
      ];
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setIsLoadingMore: (state, action: PayloadAction<boolean>) => {
      state.isLoadingMore = action.payload;
    },
    setNoResults: (state, action: PayloadAction<boolean>) => {
      state.noResults = action.payload;
    },
    setNotFoundUpcs: (state, action: PayloadAction<string[]>) => {
      state.notFoundUpcs = action.payload;
    },
    appendNotFoundUpcs: (state, action: PayloadAction<string[]>) => {
      state.notFoundUpcs = [...state.notFoundUpcs, ...action.payload];
    },
    setItems: (state, action: PayloadAction<ForecastItem[]>) => {
      state.items = action.payload;
    },
    setForecastResults: (state, action: PayloadAction<PriceHistoryResult[]>) => {
      state.forecastResults = action.payload;
    },
    setSingleResults: (state, action: PayloadAction<PriceHistoryResult[]>) => {
      state.singlePriceResults = action.payload;
    },
    setRowData: (state, action: PayloadAction<ForecastOutlierRow[]>) => {
      state.rowData = action.payload;
      state.initialRowData = action.payload;
      state.checkedUpcs = action.payload.map((r) => r.upc);
    },
    /**
     * Put the given rows back to the price and ad days the search returned,
     * along with everything derived from them.
     *
     * Notes are deliberately left alone — they're the user's own writing, not
     * an edit to the forecast, and losing them to a price undo would be its
     * own small disaster.
     */
    resetRowValues: (state, action: PayloadAction<string[]>) => {
      const upcs = new Set(action.payload);
      state.rowData = state.rowData.map((row) => {
        if (!upcs.has(row.upc)) return row;
        const original = state.initialRowData.find((r) => r.upc === row.upc);
        return original ? { ...original, notes: row.notes } : row;
      });
    },
    toggleCheckedUpc: (state, action: PayloadAction<string>) => {
      state.checkedUpcs = state.checkedUpcs.includes(action.payload)
        ? state.checkedUpcs.filter((u) => u !== action.payload)
        : [...state.checkedUpcs, action.payload];
    },
    setCheckedUpcs: (state, action: PayloadAction<string[]>) => {
      state.checkedUpcs = action.payload;
    },
    setListFilter: (state, action: PayloadAction<string>) => {
      state.listFilter = action.payload;
    },
    toggleTierFilter: (state, action: PayloadAction<Tier>) => {
      state.tierFilter = state.tierFilter.includes(action.payload)
        ? state.tierFilter.filter((t) => t !== action.payload)
        : [...state.tierFilter, action.payload];
    },
    clearTierFilter: (state) => {
      state.tierFilter = [];
    },
    /** Second batch of 500 lands on top of the first rather than replacing it. */
    appendBatchResults: (
      state,
      action: PayloadAction<{
        rows: ForecastOutlierRow[];
        results: PriceHistoryResult[];
        singleResults: PriceHistoryResult[];
        items: ForecastItem[];
      }>,
    ) => {
      const { rows, results, singleResults, items } = action.payload;
      state.rowData = [...state.rowData, ...rows];
      state.initialRowData = [...state.initialRowData, ...rows];
      // The second batch arrives ticked too — it's part of the same search.
      state.checkedUpcs = [
        ...state.checkedUpcs,
        ...rows.map((r) => r.upc),
      ];
      state.forecastResults = [...state.forecastResults, ...results];
      state.singlePriceResults = [...state.singlePriceResults, ...singleResults];
      state.items = [...state.items, ...items];
      state.isLoadingMore = false;
    },
    /** Double-clicking a row opens the calculator on it; "" closes. */
    setSelectedUpc: (state, action: PayloadAction<string>) => {
      state.selectedUpc = action.payload;
    },

    /* ── Ported verbatim from forecastSlice — see the note above ─────────── */
    setNewRowAdDaysValue: (
      state,
      action: PayloadAction<{ upc: string; newAdDays: number }>
    ) => {
      const { upc, newAdDays } = action.payload;
      const row = state.rowData.find((r) => r.upc === upc);

      const prices = state.forecastResults.find((item) => item.upc === upc);
      const upcPrices = prices!.price_history.map((ph) => [
        parseFloat(ph.price),
        ph.qty,
      ]);

      if (row) {
        const regRetail = state.forecastResults.find(
          (item) => item.upc === upc
        )!.regular_retail_price;

        if (row.singlePrice) {
          // Single-price: use the known data point directly — no demand curve needed
          const ph = prices!.price_history[0];
          const units = forecastUnits(
            row.fcstPrice, ph.qty, ph.qty,
            row.daysActive, 90, ph.days_active,
            row.forecastWindow, upcPrices, newAdDays
          );
          row.adDays = newAdDays;
          row.adFcst = units;
          row.fcstTotal = row.fcstPrice * units;
          row.markdownDollars = (regRetail - row.fcstPrice) * units;
          return;
        }

        // Finding the qty over last 90 days at the current fcstPrice
        // or just predicting if data point doesn't exist
        const fcstQty = calcFcstQty(upcPrices, row.fcstPrice); //90 days
        const overallUnits = upcPrices.reduce((acc, curr) => acc + curr[1], 0);

        const units = forecastUnits(
          row.fcstPrice,
          overallUnits,
          fcstQty,
          row.daysActive, // total selling days
          90, // total days
          row.daysAtPrice, // days at price
          row.forecastWindow, // forecast window => 7 now but can be configurable
          upcPrices, // all prices with qty recorded for the item
          newAdDays // from user input => the sale date range
        );

        // The directly updated cell
        row.adDays = newAdDays;

        // The two updated cells by calculation
        row.adFcst = units;
        row.fcstTotal = row.fcstPrice * units;
        row.markdownDollars = (regRetail - row.fcstPrice) * units;

      }
    },
    setNewRowPriceValue: (
      state,
      action: PayloadAction<{ upc: string; newPrice: number }>
    ) => {
      // newPrice is the newly changed fcstPrice
      const { upc, newPrice } = action.payload;
      const row = state.rowData.find((r) => r.upc === upc);

      const prices = state.forecastResults.find((item) => item.upc === upc);
      const upcPrices = prices!.price_history.map((ph) => [
        parseFloat(ph.price),
        ph.qty,
      ]);

      // only change => fcstPrice, fcstQty, fcstDollars, markdownDollars, lift
      if (row) {
        if (row.singlePrice) return; // price is fixed for single-price items

        // Finding the qty over last 90 days at the current fcstPrice
        // or just predicting if data point doesn't exist
        const fcstQty = calcFcstQty(upcPrices, newPrice);
        const overallUnits = upcPrices.reduce((acc, curr) => acc + curr[1], 0);

        const priceHistory = state.forecastResults.find(
          (item) => item.upc === row.upc
        )?.price_history;

        const daysActive =
          priceHistory!.find((ph) => parseFloat(ph.price) === newPrice)
            ?.days_active || estimateDaysActive(priceHistory!, newPrice);

        const units = forecastUnits(
          newPrice,
          overallUnits,
          fcstQty,
          row.daysActive, // total selling days
          90, // total days (90)
          daysActive, // days at price
          row.forecastWindow, // forecast window => 7 now but can be configurable
          upcPrices, // all prices with qty recorded for the item
          row.adDays // from user input => the sale date range
        );

        const regRetail = state.forecastResults.find(
          (item) => item.upc === upc
        )!.regular_retail_price;

        // The directly updated cell
        row.fcstPrice = newPrice;

        // The two updated cells by calculation
        row.adFcst = units; // units over ad days
        row.fcstTotal = newPrice * units; // forecasted dollars

        const existingPrice = prices!.price_history.find(
          (ph) => parseFloat(ph.price) === newPrice
        );
        row.qtySold = existingPrice ? existingPrice.qty : 0; // qty sold at that price point historically

        row.markdownDollars = (regRetail - newPrice) * units;
        row.daysAtPrice = daysActive; // days at the new price point based on history

      }
    },
    /** A note is an annotation, not a figure — so unlike the price and ad-day
     *  batch reducers this one does NOT skip single-price rows. Those rows
     *  can't open the calculator (one price point is nothing to model), so
     *  excluding them here would leave them with no way to be annotated at
     *  all. Legacy skipped them; that was a copy of its sibling reducers
     *  rather than a decision. */
    setBatchNotesRows: (
      state,
      action: PayloadAction<{ upcs: string[]; notes: string }>,
    ) => {
      const { upcs, notes } = action.payload;
      state.rowData.forEach((row) => {
        if (upcs.includes(row.upc)) row.notes = notes;
      });
    },
    setItemNotes: (
      state,
      action: PayloadAction<{ upc: string; notes: string }>,
    ) => {
      const { upc, notes } = action.payload;
      const row = state.rowData.find((r) => r.upc === upc);
      if (row) row.notes = notes;
    },
    setGlobalFcstPrice: (state, action: PayloadAction<string>) => {
      state.globalFcstPrice = action.payload;
    },
    setGlobalAdDays: (state, action: PayloadAction<string>) => {
      state.globalAdDays = action.payload;
    },
    setBatchAdDaysRows: (
      state,
      action: PayloadAction<{ upcs: string[]; adDays: number }>
    ) => {
      const { upcs, adDays } = action.payload;
      if (isNaN(adDays) || adDays <= 0) return;

      const updated = state.rowData.map((row) => {
        if (row.singlePrice || !upcs.includes(row.upc)) return row;

        const prices = state.forecastResults.find((item) => item.upc === row.upc);
        const upcPrices = prices!.price_history.map((ph) => [
          parseFloat(ph.price),
          ph.qty,
        ]);
        const fcstQty = calcFcstQty(upcPrices, row.fcstPrice);
        const overallUnits = upcPrices.reduce((acc, curr) => acc + curr[1], 0);
        const units = forecastUnits(
          row.fcstPrice,
          overallUnits,
          fcstQty,
          row.daysActive,
          90,
          row.daysAtPrice,
          row.forecastWindow,
          upcPrices,
          adDays
        );
        const regRetail = state.forecastResults.find(
          (item) => item.upc === row.upc
        )!.regular_retail_price;

        return {
          ...row,
          adDays,
          adFcst: units,
          fcstTotal: row.fcstPrice * units,
          markdownDollars: (regRetail - row.fcstPrice) * units,
        };
      });

      state.rowData = updated;
    },
    setBatchPriceRows: (
      state,
      action: PayloadAction<{ upcs: string[]; price: number }>
    ) => {
      const { upcs, price } = action.payload;

      const updated = state.rowData.map((row) => {
        if (row.singlePrice || !upcs.includes(row.upc)) return row;

        const upc = row.upc;
        const prices = state.forecastResults.find((item) => item.upc === upc);
        const upcPrices = prices!.price_history.map((ph) => [
          parseFloat(ph.price),
          ph.qty,
        ]);
        const priceHistory = prices?.price_history;
        const daysActive =
          priceHistory!.find((ph) => parseFloat(ph.price) === price)
            ?.days_active || estimateDaysActive(priceHistory!, price);
        const fcstQty = calcFcstQty(upcPrices, price);
        const overallUnits = upcPrices.reduce((acc, curr) => acc + curr[1], 0);
        const units = forecastUnits(
          price,
          overallUnits,
          fcstQty,
          row.daysActive,
          90,
          daysActive,
          row.forecastWindow,
          upcPrices,
          row.adDays
        );
        const regRetail = state.forecastResults.find(
          (item) => item.upc === upc
        )!.regular_retail_price;
        const existingPrice = prices!.price_history.find(
          (ph) => parseFloat(ph.price) === price
        );

        return {
          ...row,
          fcstPrice: price,
          adFcst: units,
          qtySold: existingPrice ? existingPrice.qty : 0,
          fcstTotal: price * units,
          markdownDollars: (regRetail - price) * units,
          daysAtPrice: daysActive,
        };
      });

      state.rowData = updated;
    },

    /** New search — clear results and selection, keep the store scope so a
     *  re-run against the same stores doesn't mean re-picking them. */
    reQuery: (state) => {
      state.rowData = [];
      state.initialRowData = [];
      state.checkedUpcs = [];
      state.listFilter = "";
      state.tierFilter = [];
      state.forecastResults = [];
      state.singlePriceResults = [];
      state.items = [];
      state.notFoundUpcs = [];
      state.noResults = false;
      state.selectedUpc = "";
    },
  },
});

export const {
  setStoreids,
  addUpcs,
  setUpcText,
  removeUpc,
  clearUpcs,
  setUploadedAdList,
  setIsLoading,
  setIsLoadingMore,
  setNoResults,
  setNotFoundUpcs,
  appendNotFoundUpcs,
  setItems,
  setForecastResults,
  setSingleResults,
  setRowData,
  resetRowValues,
  toggleCheckedUpc,
  setCheckedUpcs,
  setListFilter,
  toggleTierFilter,
  clearTierFilter,
  appendBatchResults,
  setSelectedUpc,
  setNewRowAdDaysValue,
  setNewRowPriceValue,
  setGlobalFcstPrice,
  setGlobalAdDays,
  setBatchAdDaysRows,
  setBatchPriceRows,
  setBatchNotesRows,
  setItemNotes,
  reQuery,
} = forecastDevSlice.actions;

export default forecastDevSlice.reducer;
