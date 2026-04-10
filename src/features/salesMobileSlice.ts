import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { HourlySale, SubSale, TopTenItem, WeeklySale } from '../interfaces';
import type { TopSub } from '../pages/sales/components';

export type SalesMobileView = 'main' | 'sales' | 'subdept';

interface SalesMobileState {
  topTenItems: TopTenItem[];
  salesPanels: WeeklySale[];
  hourlySales: HourlySale[];
  subSales: SubSale[];
  subSalesWk1: SubSale[];
  subSalesWk2: SubSale[];
  subSalesWk3: SubSale[];
  subSalesWk4: SubSale[];
  topSubDept: TopSub | null;
  panelsLoading: boolean;
  view: SalesMobileView;
}

const initialState: SalesMobileState = {
  topTenItems: [],
  salesPanels: [],
  hourlySales: [],
  subSales: [],
  subSalesWk1: [],
  subSalesWk2: [],
  subSalesWk3: [],
  subSalesWk4: [],
  topSubDept: null,
  panelsLoading: false,
  view: 'main',
};

const salesMobileSlice = createSlice({
  name: 'salesMobile',
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
    resetMobileSalesState: () => initialState,
  }
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
} = salesMobileSlice.actions;
export default salesMobileSlice.reducer;