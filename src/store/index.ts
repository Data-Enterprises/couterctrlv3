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
import cashierReducer from "../features/cashierSlice";
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
      cashier: cashierReducer,
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
      coupons: couponReducer,
    },
  });

export type RootState = ReturnType<ReturnType<typeof setupStore>["getState"]>;
export type AppDispatch = ReturnType<typeof setupStore>["dispatch"];

export const store = setupStore(); // singleton for app usage
