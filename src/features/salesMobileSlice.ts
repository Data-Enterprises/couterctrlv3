import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  HourlySale,
  SubSale,
  TopTenItem,
  WeeklySale,
  AggTotals,
  AggCoupons,
  SelectedSalesPanel,
} from "../interfaces";

import type { TopSub } from "../pages/sales/components";
import type { PieData } from "../pages/sales/mobile";
import type {
  DashboardOption,
  WeekTotal,
  TrackerKpis,
  SubTracker,
} from "./salesSlice";
export type SalesMobileView = "main" | "stores" | "sales" | "subdept" | "tracker";
export type SalesTrackerView= "period" | "weeks" | "days"

export const defaultSelectedSalesPanel: SelectedSalesPanel = {
  sale_date: "",
  storeid: 0,
  store_name: "",
};

export type PanelSortOption =
  | "total_sales"
  | "total_tax"
  | "qty"
  | "weight"
  | "";

type SortDir = "asc" | "desc" | "";

interface SalesMobileState {
  topTenItems: TopTenItem[];
  salesPanels: WeeklySale[];
  weeklySales: WeeklySale[];
  weeklySalesLastYear: WeeklySale[];
  hourlySales: HourlySale[];
  hourlySalesLastYear: HourlySale[];
  subSales: SubSale[];
  subSalesWk1: SubSale[];
  subSalesWk2: SubSale[];
  subSalesWk3: SubSale[];
  subSalesWk4: SubSale[];
  topSubDept: TopSub | null;
  panelsLoading: boolean;
  view: SalesMobileView;
  aggTotals: AggTotals;
  aggCoupons: AggCoupons;
  selectedStore: SelectedSalesPanel;
  storesViewLoaded: boolean;
  panelSortOption: PanelSortOption;
  sortDir: SortDir;

  // Sales View Data (for rendering)
  selectedHour: number;
  hours: number[];
  hourlyKey: "hour" | "sale_date";
  salesViewWeekly: PieData[];
  salesViewHourly: HourlySale[];
  salesViewHourlyLastYear: HourlySale[];
  salesViewTopTen: TopTenItem[];

  selectedSubDept: number;

  // Tracker specific state
  loadingTYTrackerMobile: boolean;
  loadingLYTrackerMobile: boolean;
  thisYrSubTrackerMobile: SubSale[];
  lastYrSubTrackerMobile: SubSale[];
  tyWeekCardsMobile: SubSale[];
  lyWeekCardsMobile: SubSale[];
  tyCollapsedSubSalesMobile: SubSale[][];
  lyCollapsedSubSalesMobile: SubSale[][];
  tyReducedTotalsMobile: WeekTotal[][][];
  uniqueSubsMobile: SubTracker[];
  trackerKpis: TrackerKpis;
  refreshOverviewData: boolean;
  dashboardOption: DashboardOption;
  salesTrackerSelectedSubDept: number;
  salesTrackerView: SalesTrackerView;
}

const defaultAggTotals: AggTotals = {
  total_sales: 0,
  total_tax: 0,
  total_cpn_dollars: 0,
  basket_size_sales: 0,
  transactions: 0,
  avg_basket_amount: 0,
};

const defaultAggCoupons: AggCoupons = {
  digital_coupons: 0,
  elec_instore_coupons: 0,
  elect_store_coupons: 0,
  store_coupon: 0,
};

const initialState: SalesMobileState = {
  topTenItems: [],
  salesPanels: [],
  weeklySales: [],
  weeklySalesLastYear: [],
  hourlySales: [],
  hourlySalesLastYear: [],
  subSales: [],
  subSalesWk1: [],
  subSalesWk2: [],
  subSalesWk3: [],
  subSalesWk4: [],
  topSubDept: null,
  panelsLoading: false,
  view: "main",
  aggTotals: defaultAggTotals,
  aggCoupons: defaultAggCoupons,
  selectedStore: defaultSelectedSalesPanel,
  storesViewLoaded: false,
  panelSortOption: "",
  sortDir: "",
  hours: [],
  hourlyKey: "sale_date",
  selectedHour: 0,
  salesViewWeekly: [],
  salesViewHourly: [],
  salesViewHourlyLastYear: [],
  salesViewTopTen: [],
  selectedSubDept: 0,
  loadingTYTrackerMobile: false,
  loadingLYTrackerMobile: false,
  thisYrSubTrackerMobile: [],
  lastYrSubTrackerMobile: [],
  tyWeekCardsMobile: [],
  lyWeekCardsMobile: [],
  tyCollapsedSubSalesMobile: [],
  lyCollapsedSubSalesMobile: [],
  tyReducedTotalsMobile: [],
  uniqueSubsMobile: [],
  trackerKpis: {
    tyTotalSales: 0,
    lyTotalSales: 0,
    percentChange: 0,
    dollarChange: 0,
    dateRange: "",
  },
  refreshOverviewData: false,
  dashboardOption: "weekly",
  salesTrackerSelectedSubDept: 0,
  salesTrackerView: "period",
};

const formatDate = (dte: string) => {
  const split = dte.split("T")[0].split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};

const salesMobileSlice = createSlice({
  name: "salesMobile",
  initialState,
  reducers: {
    setMobileSalesPanels: (state, action: PayloadAction<WeeklySale[]>) => {
      state.salesPanels = action.payload;
    },
    setMobileTopTenItems: (state, action: PayloadAction<TopTenItem[]>) => {
      // If single store was searched, then only 10 items show up
      // otherwise, group was searched and everything needs to be reduced to top 10 by sales for the grouped stores
      const data =
        action.payload.length < 11
          ? action.payload
          : [...action.payload].reduce((acc: TopTenItem[], val: TopTenItem) => {
              const found = acc.find(
                (i) => i.product_code === val.product_code,
              );

              if (found) {
                found.qty += val.qty;
                found.total_sales += val.total_sales;
                found.cost += val.cost;
              } else {
                acc.push({ ...val });
              }

              return acc;
            }, []);

      state.topTenItems = action.payload;
      state.salesViewTopTen = data
        .sort((a, b) => b.total_sales - a.total_sales)
        .slice(0, 10);
    },
    setSortedSalesViewTopTen: (
      state,
      action: PayloadAction<{ topTen: TopTenItem[]; isResetting: boolean }>,
    ) => {
      const { topTen, isResetting } = action.payload;
      if (isResetting) {
        // Do what we did in setMobileTopTenItems to reset to the default top ten based on the current data
        const data =
          state.topTenItems.length < 11
            ? state.topTenItems
            : [...state.topTenItems].reduce(
                (acc: TopTenItem[], val: TopTenItem) => {
                  const found = acc.find(
                    (i) => i.product_code === val.product_code,
                  );
                  if (found) {
                    found.qty += val.qty;
                    found.total_sales += val.total_sales;
                    found.cost += val.cost;
                  } else {
                    acc.push({ ...val });
                  }
                  return acc;
                },
                [],
              );
        state.salesViewTopTen = data
          .sort((a, b) => b.total_sales - a.total_sales)
          .slice(0, 10);
      } else {
        state.salesViewTopTen = topTen
          .sort((a, b) => b.total_sales - a.total_sales)
          .slice(0, 10);
      }
    },
    setMobileHourlySales: (state, action: PayloadAction<HourlySale[]>) => {
      state.hourlySales = action.payload;

      // if it never changed, then don't do anything => less operations
      if (state.hourlyKey === "hour") {
        state.hourlyKey = "sale_date";
      }

      // We are looking for the days of the selected hour across all stores/store
      const reduced = [...action.payload].reduce((acc: HourlySale[], val) => {
        const found = acc.find(
          (h) => h.sale_date === val.sale_date && h.hour === val.hour,
        );
        if (found) {
          // add the sales, transactions
          found.total_sales += val.total_sales - val.total_tax;
          found.transactions += val.transactions;
          found.qty += val.qty;
        } else {
          const newSales = val.total_sales - val.total_tax;
          acc.push({ ...val, total_sales: newSales });
        }

        return acc;
      }, []);

      state.salesViewHourly = reduced;
      state.selectedHour = reduced[0].hour;
      state.hours = Array.from(new Set(reduced.map((r) => r.hour))).sort(
        (a, b) => a - b,
      );
    },
    setMobileHourlyLastYearSales: (
      state,
      action: PayloadAction<HourlySale[]>,
    ) => {
      const reduced = [...action.payload].reduce((acc: HourlySale[], val) => {
        const found = acc.find(
          (h) => h.sale_date === val.sale_date && h.hour === val.hour,
        );
        if (found) {
          // add the sales, transactions
          found.total_sales += val.total_sales - val.total_tax;
          found.transactions += val.transactions;
          found.qty += val.qty;
        } else {
          const newSales = val.total_sales - val.total_tax;
          acc.push({ ...val, total_sales: newSales });
        }

        return acc;
      }, []);

      const hours = Array.from(new Set(reduced.map((r) => r.hour))).sort(
        (a, b) => a - b,
      );
      const concatHrs = Array.from(new Set([...state.hours, ...hours])).sort(
        (a, b) => a - b,
      );
      state.hours = concatHrs;
      state.hourlySalesLastYear = reduced;
    },
    setSalesViewHourly: (
      state,
      action: PayloadAction<{ hourly: HourlySale[]; isResetting: boolean }>,
    ) => {
      const { hourly, isResetting } = action.payload;

      const data = isResetting
        ? [...state.hourlySales].reduce((acc: HourlySale[], val) => {
            const found = acc.find(
              (h) => h.sale_date === val.sale_date && h.hour === val.hour,
            );
            if (found) {
              // add the sales, transactions
              found.total_sales += val.total_sales - val.total_tax;
              found.transactions += val.transactions;
              found.qty += val.qty;
            } else {
              const newSales = val.total_sales - val.total_tax;
              acc.push({ ...val, total_sales: newSales });
            }

            return acc;
          }, [])
        : hourly;

      state.hourlyKey = isResetting ? "sale_date" : "hour";
      state.salesViewHourly = data;
      state.selectedHour = data[0].hour;
      state.hours = Array.from(new Set(data.map((r) => r.hour))).sort(
        (a, b) => a - b,
      );
    },
    setSalesViewHourlyLastYear: (
      state,
      action: PayloadAction<{ hourly: HourlySale[]; isResetting: boolean }>,
    ) => {
      const { hourly, isResetting } = action.payload;

      const data = isResetting
        ? [...state.hourlySalesLastYear].reduce((acc: HourlySale[], val) => {
            const found = acc.find(
              (h) => h.sale_date === val.sale_date && h.hour === val.hour,
            );
            if (found) {
              // add the sales, transactions
              found.total_sales += val.total_sales - val.total_tax;
              found.transactions += val.transactions;
              found.qty += val.qty;
            } else {
              const newSales = val.total_sales - val.total_tax;
              acc.push({ ...val, total_sales: newSales });
            }

            return acc;
          }, [])
        : hourly;

      state.hourlyKey = isResetting ? "sale_date" : "hour";
      state.salesViewHourlyLastYear = data;
      const hours = Array.from(new Set(data.map((r) => r.hour))).sort(
        (a, b) => a - b,
      );
      const concatHrs = Array.from(new Set([...state.hours, ...hours])).sort(
        (a, b) => a - b,
      );
      state.hours = concatHrs;
    },
    setSelectedHour: (state, action: PayloadAction<number>) => {
      state.selectedHour = action.payload;
    },
    setMobileSubSales: (state, action: PayloadAction<SubSale[]>) => {
      state.subSales = action.payload;
    },
    setMobileSubSalesWk1: (state, action: PayloadAction<SubSale[]>) => {
      state.subSalesWk1 = action.payload;
    },
    setMobileSubSalesWk2: (state, action: PayloadAction<SubSale[]>) => {
      state.subSalesWk2 = action.payload;
    },
    setMobileSubSalesWk3: (state, action: PayloadAction<SubSale[]>) => {
      state.subSalesWk3 = action.payload;
    },
    setMobileSubSalesWk4: (state, action: PayloadAction<SubSale[]>) => {
      state.subSalesWk4 = action.payload;
    },
    setMobileTopSubDept: (state, action: PayloadAction<TopSub | null>) => {
      state.topSubDept = action.payload;
    },
    setMobilePanelsLoading: (state, action: PayloadAction<boolean>) => {
      state.panelsLoading = action.payload;
    },
    setView: (state, action: PayloadAction<SalesMobileView>) => {
      state.view = action.payload;
    },
    setMobileDashboardOption: (
      state,
      action: PayloadAction<DashboardOption>,
    ) => {
      state.dashboardOption = action.payload;
    },
    setMobileWeeklySales: (state, action: PayloadAction<WeeklySale[]>) => {
      state.weeklySales = action.payload;

      const pieChartData: PieData[] = action.payload.reduce(
        (acc: PieData[], curr) => {
          const found = acc.find((d) => d.id === formatDate(curr.sale_date));
          if (found) {
            found.value += curr.total_sales - curr.total_tax;
          } else {
            acc.push({
              id: formatDate(curr.sale_date),
              value: curr.total_sales - curr.total_tax,
            });
          }
          return acc;
        },
        [],
      );

      state.salesViewWeekly = pieChartData;
    },
    setMobileWeeklySalesLastYear: (
      state,
      action: PayloadAction<WeeklySale[]>,
    ) => {
      state.weeklySalesLastYear = action.payload;
    },
    setSalesViewWeekly: (
      state,
      action: PayloadAction<{ weekly: WeeklySale[]; isResetting: boolean }>,
    ) => {
      const { weekly, isResetting } = action.payload;
      const data = isResetting ? state.salesPanels : weekly;

      const pieChartData: PieData[] = [...data].reduce(
        (acc: PieData[], curr) => {
          const found = acc.find((d) => d.id === formatDate(curr.sale_date));
          if (found) {
            found.value += curr.total_sales - curr.total_tax;
          } else {
            acc.push({
              id: formatDate(curr.sale_date),
              value: curr.total_sales - curr.total_tax,
            });
          }
          return acc;
        },
        [],
      );

      state.salesViewWeekly = pieChartData;
    },
    setAggTotals: (state, action: PayloadAction<AggTotals>) => {
      state.aggTotals = action.payload;
    },
    setAggCouponTotals: (state, action: PayloadAction<AggCoupons>) => {
      state.aggCoupons = action.payload;
    },
    setSelectedStore: (state, action: PayloadAction<SelectedSalesPanel>) => {
      if (
        state.selectedStore.sale_date === action.payload.sale_date &&
        state.selectedStore.storeid === action.payload.storeid &&
        state.selectedStore.store_name === action.payload.store_name
      ) {
        state.selectedStore = defaultSelectedSalesPanel;
        state.hourlyKey = "sale_date";
        return;
      }
      state.hourlyKey = "hour";
      state.selectedStore = action.payload;
    },
    setHourlyKey: (state, action: PayloadAction<"hour" | "sale_date">) => {
      state.hourlyKey = action.payload;
    },
    setSPSort: (state, action: PayloadAction<PanelSortOption>) => {
      // if already sorted and pressing Reset => reset sort
      if (action.payload === "" && state.panelSortOption.length > 0) {
        state.panelSortOption = "";
        state.sortDir = "";
        return;
      }

      // if selecting the same option => toggle sort direction
      if (state.panelSortOption === action.payload) {
        const newSortDir: SortDir = state.sortDir === "asc" ? "desc" : "";
        state.sortDir = newSortDir;
        if (state.sortDir === "") {
          state.panelSortOption = "";
        }
        return;
      }
      // if switching or initially selecting
      state.panelSortOption = action.payload;
      state.sortDir = "asc";
    },
    setSelectedSubDept: (state, action: PayloadAction<number>) => {
      state.selectedSubDept = action.payload;
    },

    setLoadingTYTrackerData: (state, action: PayloadAction<boolean>) => {
      state.loadingTYTrackerMobile = action.payload;
    },
    setLoadingLYTrackerData: (state, action: PayloadAction<boolean>) => {
      state.loadingLYTrackerMobile = action.payload;
    },
    setTyWeekCardsMobile: (state, action: PayloadAction<SubSale[]>) => {
      state.tyWeekCardsMobile = action.payload;
    },
    setLyWeekCardsMobile: (state, action: PayloadAction<SubSale[]>) => {
      state.lyWeekCardsMobile = action.payload;
    },
    setTyCollapsedSubSalesMobile: (
      state,
      action: PayloadAction<SubSale[][]>,
    ) => {
      state.tyCollapsedSubSalesMobile = action.payload;
    },
    setTyReducedTotalsMobile: (
      state,
      action: PayloadAction<WeekTotal[][][]>,
    ) => {
      state.tyReducedTotalsMobile = action.payload;
    },
    setLyCollapsedSubSalesMobile: (
      state,
      action: PayloadAction<SubSale[][]>,
    ) => {
      state.lyCollapsedSubSalesMobile = action.payload;
    },
    setUniqueSubsMobile: (state, action: PayloadAction<SubTracker[]>) => {
      state.uniqueSubsMobile = action.payload;
    },
    setTrackerKpisMobile: (state, action: PayloadAction<TrackerKpis>) => {
      state.trackerKpis = action.payload;
    },
    setSalesTrackerSelectedSubDept: (state, action: PayloadAction<number>) => {
      state.salesTrackerSelectedSubDept = action.payload;
    },
    concatTYSubTrackerMobile: (state, action: PayloadAction<SubSale[]>) => {
      state.thisYrSubTrackerMobile = state.thisYrSubTrackerMobile.concat(action.payload);
    },
    concatLYSubTrackerMobile: (state, action: PayloadAction<SubSale[]>) => {
      state.lastYrSubTrackerMobile = state.lastYrSubTrackerMobile.concat(action.payload);
    },
    setSalesTrackerView: (state, action: PayloadAction<SalesTrackerView>) => {
      state.salesTrackerView = action.payload;
    },

    resetMobileSalesState: (state) => {
      return { ...initialState, dashboardOption: state.dashboardOption };
    },
  },
});

export const {
  setMobileSalesPanels,
  setMobileTopTenItems,
  setMobileHourlySales,
  setMobileSubSales,
  setMobileSubSalesWk1,
  setMobileSubSalesWk2,
  setMobileSubSalesWk3,
  setMobileSubSalesWk4,
  setMobileTopSubDept,
  setMobilePanelsLoading,
  resetMobileSalesState,
  setView,
  setMobileWeeklySales,
  setAggTotals,
  setAggCouponTotals,
  setSelectedStore,
  setSPSort,
  setSortedSalesViewTopTen,
  setSalesViewHourly,
  setSelectedHour,
  setSalesViewWeekly,
  setMobileWeeklySalesLastYear,
  setMobileHourlyLastYearSales,
  setSalesViewHourlyLastYear,
  setHourlyKey,
  setSelectedSubDept,
  setMobileDashboardOption,
  setLoadingTYTrackerData,
  setLoadingLYTrackerData,
  setTyWeekCardsMobile,
  setLyWeekCardsMobile,
  setTyCollapsedSubSalesMobile,
  setLyCollapsedSubSalesMobile,
  setTyReducedTotalsMobile,
  setUniqueSubsMobile,
  setTrackerKpisMobile,
  setSalesTrackerSelectedSubDept,
  concatLYSubTrackerMobile,
  concatTYSubTrackerMobile,
  setSalesTrackerView,
} = salesMobileSlice.actions;
export default salesMobileSlice.reducer;
