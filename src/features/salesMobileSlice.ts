import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  HourlySale,
  SubSale,
  TopTenItem,
  WeeklySale,
  AggTotals,
  AggCoupons,
} from "../interfaces";
import type { TopSub } from "../pages/sales/components";

export type SalesMobileView = "main" | "stores" | "sales" | "subdept";

interface SalesMobileState {
  topTenItems: TopTenItem[];
  salesPanels: WeeklySale[];
  weeklySales: WeeklySale[];
  hourlySales: HourlySale[];
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
  hourlySales: [],
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
};

const salesMobileSlice = createSlice({
  name: "salesMobile",
  initialState,
  reducers: {
    setMobileSalesPanels: (state, action: PayloadAction<WeeklySale[]>) => {
      state.salesPanels = action.payload;
    },
    setMobileTopTenItems: (state, action: PayloadAction<TopTenItem[]>) => {
      state.topTenItems = action.payload;
    },
    setMobileHourlySales: (state, action: PayloadAction<HourlySale[]>) => {
      state.hourlySales = action.payload;
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
    setMobileWeeklySales: (state, action: PayloadAction<WeeklySale[]>) => {
      state.weeklySales = action.payload;
    },
    setAggTotals: (state, action: PayloadAction<AggTotals>) => {
      state.aggTotals = action.payload;
    },
    setAggCouponTotals: (state, action: PayloadAction<AggCoupons>) => {
      state.aggCoupons = action.payload;
    },
    resetMobileSalesState: () => initialState,
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
} = salesMobileSlice.actions;
export default salesMobileSlice.reducer;
