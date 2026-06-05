import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Store,
  ForecastItem,
  PriceHistoryResult,
  SimListItem,
  SimReplayItem,
} from "../interfaces";
import { calcFcstQty, estimateDaysActive, forecastUnits } from "../pages/forecast/utils";

export interface SelectedHistory {
  upc: string;
  desc: string;
  type: string;
  activePrice: number;
  retailPrice: number;
  qty: number;
  lift: number;
}

export interface HistoryData {
  outliers: number;
  upc: string;
  desc: string;
  forecastQty: number;
  daysActive: number;
  forecast: number;
  futureForecast: number;
  forecastPrice: number;
  futureForecastTotal: number;
}

export interface AdListData {
  pageName: string;
  featureDescription: string;
  pack: string;
  size: string;
  cost: number;
  costPlusFrt: number;
  amap: number;
  eba: number;
  dsdOI: number;
  edlcBB: number;
  netUnitCost: number;
  adCount: number;
  adRetail: number;
  unitAdRetail: number;
  regularRetail: number;
  mvmt: number;
  grossProfit: number;
  featureNotes: string;
  tprDates: string;
}

export type ForecastOutlierRow = {
  upc: string;
  description: string;
  qtySold: number;
  daysActive: number;
  adFcst: number;
  fcstPrice: number;
  calcNow: 0 | 1;
  fcstTotal: number;
  forecastWindow: number;
  daysAtPrice: number;
  adDays: number;
  markdownDollars: number;
  singlePrice?: boolean;
  notes?: string;
  adListData?: AdListData;
};

export interface SimBtns {
  sim1: 0 | 1;
  sim2: 0 | 1;
  sim3: 0 | 1;
  sim4: 0 | 1;
}

export interface SimTitles {
  sim1: string;
  sim2: string;
  sim3: string;
  sim4: string;
}

interface ForecastState {
  isLoading: boolean;
  isLoadingMore: boolean;
  notFoundUpcs: string[];
  selectedStores: Store[];
  storeids: string;
  radioId: number;
  items: ForecastItem[];
  selectedUpcs: string[];
  files: string[];
  lastUpdatedHistory: HistoryData[];
  exportModalOpen: boolean;
  selectedUpc: string;
  forecastResults: PriceHistoryResult[];
  singlePriceResults: PriceHistoryResult[];
  initialRowData: ForecastOutlierRow[];
  simOneRowData: ForecastOutlierRow[];
  simTwoRowData: ForecastOutlierRow[];
  simThreeRowData: ForecastOutlierRow[];
  simFourRowData: ForecastOutlierRow[];
  rowData: ForecastOutlierRow[];
  simBtns: SimBtns;
  simTitles: SimTitles;
  selectedSim: "sim1" | "sim2" | "sim3" | "sim4" | "";
  globalFcstPrice: string;
  globalAdDays: string;
  selectedRow?: ForecastOutlierRow | null;
  noResults: boolean;
  simList: SimListItem[];
  simReplayPast: SimReplayItem[];
  simReplayFuture: SimReplayItem[];
}

const initialState: ForecastState = {
  isLoading: false,
  isLoadingMore: false,
  notFoundUpcs: [],
  selectedStores: [],
  singlePriceResults: [],
  storeids: "", // needed for backend API calls
  radioId: 0,
  items: [],
  selectedUpcs: [],
  files: [],
  lastUpdatedHistory: [],
  exportModalOpen: false,
  selectedUpc: "",
  forecastResults: [],
  initialRowData: [],
  simOneRowData: [],
  simTwoRowData: [],
  simThreeRowData: [],
  simFourRowData: [],
  rowData: [],
  simBtns: { sim1: 0, sim2: 0, sim3: 0, sim4: 0 },
  simTitles: {
    sim1: "Forecast Simulation 1",
    sim2: "Forecast Simulation 2",
    sim3: "Forecast Simulation 3",
    sim4: "Forecast Simulation 4",
  },
  selectedSim: "",
  globalFcstPrice: "",
  globalAdDays: "",
  noResults: false,
  simList: [],
  simReplayPast: [],
  simReplayFuture: [],
};

export const forecastSlice = createSlice({
  name: "forecast",
  initialState,
  reducers: {
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setSelectedStores: (state, action: PayloadAction<Store[]>) => {
      state.selectedStores = action.payload;
      state.storeids = action.payload.map((store) => store.storeid).join(",");
    },
    setRadioId: (state, action: PayloadAction<number>) => {
      state.radioId = action.payload;
    },
    setItems: (state, action: PayloadAction<ForecastItem[]>) => {
      state.items = action.payload;
    },
    setSelectedUpcs: (state, action: PayloadAction<string>) => {
      const upc = action.payload;
      if (state.selectedUpcs.includes(upc)) {
        state.selectedUpcs = state.selectedUpcs.filter((item) => item !== upc);
      } else {
        state.selectedUpcs.push(upc);
      }
    },
    resetRows: (state) => {
      state.selectedUpcs = [];
      state.rowData = [];
      const sim = state.selectedSim;
      if (sim === "sim1") {
        state.simOneRowData = state.rowData;
      } else if (sim === "sim2") {
        state.simTwoRowData = state.rowData;
      } else if (sim === "sim3") {
        state.simThreeRowData = state.rowData;
      } else if (sim === "sim4") {
        state.simFourRowData = state.rowData;
      }
    },
    setFiles: (state, action: PayloadAction<string[]>) => {
      state.files = action.payload;
    },
    setInitialRowData: (state, action: PayloadAction<ForecastOutlierRow[]>) => {
      state.initialRowData = action.payload;
      state.noResults = false;
    },
    setIsLoadingMore: (state, action: PayloadAction<boolean>) => {
      state.isLoadingMore = action.payload;
    },
    setNotFoundUpcs: (state, action: PayloadAction<string[]>) => {
      state.notFoundUpcs = action.payload;
    },
    appendNotFoundUpcs: (state, action: PayloadAction<string[]>) => {
      state.notFoundUpcs = [...state.notFoundUpcs, ...action.payload];
    },
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
      state.initialRowData = [...state.initialRowData, ...rows];
      state.forecastResults = [...state.forecastResults, ...results];
      state.singlePriceResults = [...state.singlePriceResults, ...singleResults];
      state.items = [...state.items, ...items];
      state.isLoadingMore = false;
    },
    setRowData: (state, action: PayloadAction<ForecastOutlierRow>) => {
      const upc = action.payload.upc;
      const row = state.rowData.find((r) => r.upc === upc);
      const sim = state.selectedSim;

      if (row) {
        state.rowData = state.rowData.filter((r) => r.upc !== upc);
      } else {
        state.rowData.push(action.payload);
      }

      if (sim === "sim1") {
        state.simOneRowData = state.rowData;
      } else if (sim === "sim2") {
        state.simTwoRowData = state.rowData;
      } else if (sim === "sim3") {
        state.simThreeRowData = state.rowData;
      } else if (sim === "sim4") {
        state.simFourRowData = state.rowData;
      }
    },
    setAllRows: (state) => {
      const initialRows = state.initialRowData;
      const currentRows = state.rowData;
      initialRows.forEach((initRow) => {
        const exists = currentRows.find((r) => r.upc === initRow.upc);
        if (!exists) {
          state.rowData.push(initRow);
        }
      });

      const upcs = state.rowData.map((row) => row.upc);
      state.selectedUpcs = upcs;

      const sim = state.selectedSim;
      if (sim === "sim1") {
        state.simOneRowData = state.rowData;
      } else if (sim === "sim2") {
        state.simTwoRowData = state.rowData;
      } else if (sim === "sim3") {
        state.simThreeRowData = state.rowData;
      } else if (sim === "sim4") {
        state.simFourRowData = state.rowData;
      }
    },
    setSimRowData: (
      state,
      action: PayloadAction<{ sim: keyof SimBtns; rows: ForecastOutlierRow[] }>
    ) => {
      const { sim, rows } = action.payload;
      if (sim === "sim1") {
        state.simBtns.sim1 = 1;
        state.simOneRowData = rows;
      } else if (sim === "sim2") {
        state.simBtns.sim2 = 1;
        state.simTwoRowData = rows;
      } else if (sim === "sim3") {
        state.simBtns.sim3 = 1;
        state.simThreeRowData = rows;
      } else if (sim === "sim4") {
        state.simBtns.sim4 = 1;
        state.simFourRowData = rows;
      }
    },
    loadSimRowData: (state, action: PayloadAction<keyof SimBtns>) => {
      const sim = action.payload;
      const rows = () => {
        if (sim === "sim1") {
          return state.simOneRowData;
        } else if (sim === "sim2") {
          return state.simTwoRowData;
        } else if (sim === "sim3") {
          return state.simThreeRowData;
        } else if (sim === "sim4") {
          return state.simFourRowData;
        }
      };

      const upcs = rows()!.map((row) => row.upc);
      state.rowData = state.rowData = rows()!;
      state.selectedUpcs = upcs;
    },
    reloadRowData: (state) => {
      state.rowData = [];
      state.selectedSim = "";
      state.selectedUpcs = [];
      state.globalFcstPrice = "";
      state.globalAdDays = "";
    },
    resetSimulations: (state) => {
      state.simOneRowData = [];
      state.simTwoRowData = [];
      state.simThreeRowData = [];
      state.simFourRowData = [];
      state.simBtns = { sim1: 0, sim2: 0, sim3: 0, sim4: 0 };
      state.selectedSim = "";
      state.simTitles = {
        sim1: "Forecast Simulation 1",
        sim2: "Forecast Simulation 2",
        sim3: "Forecast Simulation 3",
        sim4: "Forecast Simulation 4",
      };
      state.globalFcstPrice = "";
      state.globalAdDays = "";
    },
    setForecastResults: (
      state,
      action: PayloadAction<PriceHistoryResult[]>
    ) => {
      state.forecastResults = action.payload; // using this for value change references
    },
    setSingleForecastResults: (
      state,
      action: PayloadAction<PriceHistoryResult[]>
    ) => {
      state.singlePriceResults = action.payload;
    },
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
          const sim = state.selectedSim;
          if (sim === "sim1") state.simOneRowData = state.rowData;
          else if (sim === "sim2") state.simTwoRowData = state.rowData;
          else if (sim === "sim3") state.simThreeRowData = state.rowData;
          else if (sim === "sim4") state.simFourRowData = state.rowData;
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

        const sim = state.selectedSim;
        if (sim === "sim1") {
          state.simOneRowData = state.rowData;
        } else if (sim === "sim2") {
          state.simTwoRowData = state.rowData;
        } else if (sim === "sim3") {
          state.simThreeRowData = state.rowData;
        } else if (sim === "sim4") {
          state.simFourRowData = state.rowData;
        }
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

        const sim = state.selectedSim;
        if (sim === "sim1") {
          state.simOneRowData = state.rowData;
        } else if (sim === "sim2") {
          state.simTwoRowData = state.rowData;
        } else if (sim === "sim3") {
          state.simThreeRowData = state.rowData;
        } else if (sim === "sim4") {
          state.simFourRowData = state.rowData;
        }
      }
    },
    setGlobalFcstPrice: (state, action: PayloadAction<string>) => {
      state.globalFcstPrice = action.payload;
    },
    setGlobalAdDays: (state, action: PayloadAction<string>) => {
      state.globalAdDays = action.payload;
    },
    updateGlobalFcstRows: (state) => {
      const price = parseFloat(state.globalFcstPrice);

      const globalRows = state.rowData.map((row) => {
        if (row.singlePrice) return row; // price is fixed — skip global price for single-price items

        const upc = row.upc;
        const prices = state.forecastResults.find(
          (item) => item.upc === row.upc
        );
        const upcPrices = prices!.price_history.map((ph) => [
          parseFloat(ph.price),
          ph.qty,
        ]);

        const priceHistory = state.forecastResults.find(
          (item) => item.upc === upc
        )?.price_history;

        const daysActive =
          priceHistory!.find((ph) => parseFloat(ph.price) === price)
            ?.days_active || estimateDaysActive(priceHistory!, price);

        const fcstQty = calcFcstQty(upcPrices, price);
        const overallUnits = upcPrices.reduce((acc, curr) => acc + curr[1], 0);

        const units = forecastUnits(
          price,
          overallUnits,
          fcstQty,
          row.daysActive, // total selling days
          90, // total days
          daysActive, // days at price
          row.forecastWindow, // forecast window => 7 now but can be configurable
          upcPrices, // all prices with qty recorded for the item
          row.adDays // from user input => the sale date range
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
          qtySold: existingPrice ? existingPrice.qty : 0, // qty sold at that price point historically
          fcstTotal: price * units,
          markdownDollars: (regRetail - price) * units,
          daysAtPrice: daysActive,
        };
      });

      const sim = state.selectedSim;
      if (sim === "sim1") {
        state.simOneRowData = globalRows;
      } else if (sim === "sim2") {
        state.simTwoRowData = globalRows;
      } else if (sim === "sim3") {
        state.simThreeRowData = globalRows;
      } else if (sim === "sim4") {
        state.simFourRowData = globalRows;
      }
      state.rowData = globalRows;
    },
    updateGlobalAdDaysRows: (state) => {
      const adDays = parseInt(state.globalAdDays);
      if (isNaN(adDays) || adDays <= 0) return;

      const globalRows = state.rowData.map((row) => {
        if (row.singlePrice) return row;

        const upc = row.upc;
        const prices = state.forecastResults.find((item) => item.upc === upc);
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
          (item) => item.upc === upc
        )!.regular_retail_price;

        return {
          ...row,
          adDays,
          adFcst: units,
          fcstTotal: row.fcstPrice * units,
          markdownDollars: (regRetail - row.fcstPrice) * units,
        };
      });

      const sim = state.selectedSim;
      if (sim === "sim1") state.simOneRowData = globalRows;
      else if (sim === "sim2") state.simTwoRowData = globalRows;
      else if (sim === "sim3") state.simThreeRowData = globalRows;
      else if (sim === "sim4") state.simFourRowData = globalRows;
      state.rowData = globalRows;
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

      const sim = state.selectedSim;
      if (sim === "sim1") state.simOneRowData = updated;
      else if (sim === "sim2") state.simTwoRowData = updated;
      else if (sim === "sim3") state.simThreeRowData = updated;
      else if (sim === "sim4") state.simFourRowData = updated;
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

      const sim = state.selectedSim;
      if (sim === "sim1") state.simOneRowData = updated;
      else if (sim === "sim2") state.simTwoRowData = updated;
      else if (sim === "sim3") state.simThreeRowData = updated;
      else if (sim === "sim4") state.simFourRowData = updated;
      state.rowData = updated;
    },
    // setReplayData: (state, action: PayloadAction<{ past: SimReplayItem[]; future: SimReplayItem[] }>) => {
    //   state.simReplayPast = action.payload.past;
    //   state.simReplayFuture = action.payload.future;
    // },
    reQuery: (state) => {
      state.selectedUpc = "";
      state.lastUpdatedHistory = [];
      state.items = [];
      state.selectedUpcs = [];
      state.simOneRowData = [];
      state.simTwoRowData = [];
      state.simThreeRowData = [];
      state.simFourRowData = [];
      state.rowData = [];
      state.initialRowData = [];
      state.simBtns = { sim1: 0, sim2: 0, sim3: 0, sim4: 0 };
      state.simTitles = {
        sim1: "Forecast Simulation 1",
        sim2: "Forecast Simulation 2",
        sim3: "Forecast Simulation 3",
        sim4: "Forecast Simulation 4",
      };
      state.selectedSim = "";
      state.globalFcstPrice = "";
      state.globalAdDays = "";
      state.singlePriceResults = [];
      state.forecastResults = [];
      state.noResults = false;
      state.notFoundUpcs = [];
    },
    reset: (state) => {
      state.selectedUpc = "";
      state.lastUpdatedHistory = [];
      state.items = [];
      state.selectedStores = [];
      state.storeids = "";
      state.radioId = 0;
      state.selectedUpcs = [];
      state.simOneRowData = [];
      state.simTwoRowData = [];
      state.simThreeRowData = [];
      state.simFourRowData = [];
      state.rowData = [];
      state.initialRowData = [];
      state.simBtns = { sim1: 0, sim2: 0, sim3: 0, sim4: 0 };
      state.simTitles = {
        sim1: "Forecast Simulation 1",
        sim2: "Forecast Simulation 2",
        sim3: "Forecast Simulation 3",
        sim4: "Forecast Simulation 4",
      };
      state.selectedSim = "";
      state.globalFcstPrice = "";
      state.globalAdDays = "";
      state.singlePriceResults = [];
      state.forecastResults = [];
      state.noResults = false;
    },
    setExportModalOpen: (state, action: PayloadAction<boolean>) => {
      state.exportModalOpen = action.payload;
    },
    setSelectedSim: (
      state,
      action: PayloadAction<"sim1" | "sim2" | "sim3" | "sim4" | "">
    ) => {
      state.selectedSim = action.payload;
    },
    setCalcNow: (
      state,
      action: PayloadAction<{ upc: string; calcNow: 0 | 1 }>
    ) => {
      const { upc } = action.payload;

      state.rowData = state.rowData.map((row) => {
        if (row.upc === upc) {
          state.selectedRow =
            state.selectedRow && state.selectedRow.upc === upc ? null : row;
          return { ...row, calcNow: action.payload.calcNow };
        } else {
          return { ...row, calcNow: 0 };
        }
      });
    },
    setItemNotes: (
      state,
      action: PayloadAction<{ upc: string; notes: string }>
    ) => {
      const { upc, notes } = action.payload;
      const row = state.rowData.find((r) => r.upc === upc);
      if (row) {
        row.notes = notes;
        const sim = state.selectedSim;
        if (sim === "sim1") state.simOneRowData = state.rowData;
        else if (sim === "sim2") state.simTwoRowData = state.rowData;
        else if (sim === "sim3") state.simThreeRowData = state.rowData;
        else if (sim === "sim4") state.simFourRowData = state.rowData;
      }
    },
    setBatchNotesRows: (
      state,
      action: PayloadAction<{ upcs: string[]; notes: string }>
    ) => {
      const { upcs, notes } = action.payload;
      state.rowData.forEach((row) => {
        if (!row.singlePrice && upcs.includes(row.upc)) {
          row.notes = notes;
        }
      });
      const sim = state.selectedSim;
      if (sim === "sim1") state.simOneRowData = state.rowData;
      else if (sim === "sim2") state.simTwoRowData = state.rowData;
      else if (sim === "sim3") state.simThreeRowData = state.rowData;
      else if (sim === "sim4") state.simFourRowData = state.rowData;
    },
    setNoResults: (state, action: PayloadAction<boolean>) => {
      state.noResults = action.payload;
    },
    setSimTitle: (
      state,
      action: PayloadAction<{ sim: keyof SimBtns; title: string }>
    ) => {
      const { sim, title } = action.payload;
      state.simTitles[sim] = title;
    },
    setSimList: (state, action: PayloadAction<SimListItem[]>) => {
      state.simList = action.payload;
    },
    resetForecastSlice: () => initialState,
  },
});

export const {
  setIsLoading,
  setSelectedStores,
  setRadioId,
  setItems,
  setSelectedUpcs,
  setFiles,
  reQuery,
  reset,
  setExportModalOpen,
  setForecastResults,
  setInitialRowData,
  setNewRowPriceValue,
  setNewRowAdDaysValue,
  setSelectedSim,
  setSimRowData,
  loadSimRowData,
  reloadRowData,
  setRowData,
  setAllRows,
  resetRows,
  setGlobalFcstPrice,
  updateGlobalFcstRows,
  setGlobalAdDays,
  updateGlobalAdDaysRows,
  setBatchAdDaysRows,
  setBatchPriceRows,
  setBatchNotesRows,
  resetSimulations,
  setCalcNow,
  setItemNotes,
  setSingleForecastResults,
  setNoResults,
  setSimTitle,
  setSimList,
  resetForecastSlice,
  setIsLoadingMore,
  appendBatchResults,
  setNotFoundUpcs,
  appendNotFoundUpcs,
} = forecastSlice.actions;
export default forecastSlice.reducer;
