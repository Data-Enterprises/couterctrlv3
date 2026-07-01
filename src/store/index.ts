import { configureStore } from "@reduxjs/toolkit";

import appReducer from "../features/appSlice";
import navReducer from "../features/navSlice";
import userReducer from "../features/userSlice";
import searchReducer from "../features/searchSlice";
import salesReducer from "../features/salesSlice";
import groupReducer from "../features/groupSlice";
import storeReducer from "../features/storeSlice";
import usersReducer from "../features/usersSlice";
import forgotPasswordReducer from "../features/forgotPasswordSlice";
import lossPreventionReducer from "../features/lossPreventionSlice.ts";
import lossPreventionLegacyReducer from "../features/lossPreventionLegacySlice";
import upcReducer from "../features/upcSlice";
import itemLookupReducer from "../features/itemLookupSlice";
import trendModalReducer from "../features/trendModalSlice";
import upcModalReducer from "../features/upcModalSlice";
import ctxMenuReducer from "../features/ctxMenuSlice";
import quickSightReducer from "../features/qsSlice";
import forecastReducer from "../features/forecastSlice";
import priceSimReducer from "../features/priceSimSlice";
import upcUploadReducer from "../features/upcUploadSlice";
import receiversReducer from "../features/receiversSlice";
import couponReducer from "../features/couponSlice";
import couponLegacyReducer from "../features/couponLegacySlice";
import reportBuilderReducer from "../features/reportBuilderSlice";
import adminReducer from "../features/adminSlice.ts";
import baseGroupReducer from "../features/baseGroupSlice.ts";
import companyReducer from "../features/companySlice.ts";
import subMarginReducer from "../features/subMarginSlice.ts";
import subMarginLegacyReducer from "../features/subMarginLegacySlice";
import cashiersReducer from '../features/cashiersSlice.ts';
import itemScanReducer from "../features/itemScanSlice.ts";
import mobileSalesReducer from "../features/salesMobileSlice.ts";
import ordersReducer from '../features/ordersSlice.ts';
import receiversLegacyReducer from '../features/receiversLegacySlice';
import ordersLegacyReducer from '../features/ordersLegacySlice';
import adListReducer from '../features/adListSlice';
import salesLedgerReducer from '../features/salesLedgerSlice';
import salesLegacyReducer from '../features/salesLegacySlice';

export const setupStore = () =>
  configureStore({
    reducer: {
      app: appReducer,
      nav: navReducer,
      user: userReducer,
      search: searchReducer,
      sales: salesReducer,
      group: groupReducer,
      stores: storeReducer,
      users: usersReducer,
      forgotPassword: forgotPasswordReducer,
      lossPrevention: lossPreventionReducer,
      lossPreventionLegacy: lossPreventionLegacyReducer,
      upc: upcReducer,
      item: itemLookupReducer,
      trendModal: trendModalReducer,
      upcModal: upcModalReducer,
      ctxMenu: ctxMenuReducer,
      quicksight: quickSightReducer,
      forecast: forecastReducer,
      priceSim: priceSimReducer,
      upcs: upcUploadReducer,
      receivers: receiversReducer,
      receiversLegacy: receiversLegacyReducer,
      coupons: couponReducer,
      couponLegacy: couponLegacyReducer,
      reportBuilder: reportBuilderReducer,
      admin: adminReducer,
      baseGroup: baseGroupReducer,
      company: companyReducer,
      subMargin: subMarginReducer,
      subMarginLegacy: subMarginLegacyReducer,
      cashier: cashiersReducer,
      itemScan: itemScanReducer,
      salesMobile: mobileSalesReducer,
      orders: ordersReducer,
      ordersLegacy: ordersLegacyReducer,
      adList: adListReducer,
      salesLedger: salesLedgerReducer,
      salesLegacy: salesLegacyReducer,
    },
  });

export type RootState = ReturnType<ReturnType<typeof setupStore>["getState"]>;
export type AppDispatch = ReturnType<typeof setupStore>["dispatch"];

export const store = setupStore(); // singleton for app usage
