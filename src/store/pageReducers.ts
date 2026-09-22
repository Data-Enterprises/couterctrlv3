import { combineReducers, type Reducer } from "@reduxjs/toolkit";
import { resetAppSlice } from "../features/appSlice";

import salesReducer from "../features/salesSlice";
import salesPerfReducer from "../features/salesPerfSlice";
import itemPerfReducer from "../features/itemPerfSlice";
import eventPerfReducer from "../features/eventPerfSlice";
import usersReducer from "../features/usersSlice";
import lossPreventionReducer from "../features/lossPreventionSlice";
import lpActionsReducer from "../features/lpActionsSlice";
import upcReducer from "../features/upcSlice";
import itemLookupReducer from "../features/itemLookupSlice";
import quickSightReducer from "../features/qsSlice";
import forecastReducer from "../features/forecastSlice";
import forecastDevReducer from "../features/forecastDevSlice";
import upcUploadReducer from "../features/upcUploadSlice";
import receiversReducer from "../features/receiversSlice";
import couponReducer from "../features/couponSlice";
import groupsPageReducer from "../features/groupsPageSlice";
import couponSalesReducer from "../features/couponSalesSlice";
import categoriesReducer from "../features/categoriesSlice";
import vendorsReducer from "../features/vendorsSlice";
import itemReportReducer from "../features/itemReportSlice";
import invoicesReducer from "../features/invoicesSlice";
import suggestedReducer from "../features/suggestedSlice";
import adminPageReducer from "../features/adminPageSlice";
import baseGroupReducer from "../features/baseGroupSlice";
import companyReducer from "../features/companySlice";
import organizationReducer from "../features/organizationSlice";
import subMarginReducer from "../features/subMarginSlice";
import cashiersReducer from "../features/cashiersSlice";
import ordersReducer from "../features/ordersSlice";
import salesLedgerReducer from "../features/salesLedgerSlice";
import salesTrackerReducer from "../features/salesTrackerSlice";
import upcDevReducer from "../features/upcDevSlice";
import ticketsReducer from "../features/ticketsSlice";

/**
 * State that holds an answer from an API.
 *
 * Everything here is mounted under `prod`, and a forked copy of any of it is
 * mounted under `dev`. They have to be separate because the rows in them came
 * from different backends, and merging one environment's answer into the
 * other's is the failure this whole separation exists to prevent.
 *
 * Each entry is also still mounted at the root of the store while pages are
 * migrated from `state.salesPerf` to `state.prod.salesPerf` — see the note in
 * `index.ts`. The root copies are deleted once nothing reads them.
 */
export const pageReducers = {
  sales: salesReducer,
  salesPerf: salesPerfReducer,
  itemPerf: itemPerfReducer,
  eventPerf: eventPerfReducer,
  users: usersReducer,
  lossPrevention: lossPreventionReducer,
  lpActions: lpActionsReducer,
  upc: upcReducer,
  item: itemLookupReducer,
  quicksight: quickSightReducer,
  forecast: forecastReducer,
  forecastDev: forecastDevReducer,
  upcs: upcUploadReducer,
  receivers: receiversReducer,
  coupons: couponReducer,
  groupsPage: groupsPageReducer,
  couponSales: couponSalesReducer,
  categories: categoriesReducer,
  vendors: vendorsReducer,
  itemReport: itemReportReducer,
  invoices: invoicesReducer,
  suggested: suggestedReducer,
  adminPage: adminPageReducer,
  baseGroup: baseGroupReducer,
  company: companyReducer,
  organization: organizationReducer,
  subMargin: subMarginReducer,
  cashier: cashiersReducer,
  orders: ordersReducer,
  salesLedger: salesLedgerReducer,
  salesTracker: salesTrackerReducer,
  upcDev: upcDevReducer,
  tickets: ticketsReducer,
} satisfies Record<string, Reducer>;

const combinedProd = combineReducers(pageReducers);
type ProdState = ReturnType<typeof combinedProd>;

/**
 * The whole prod namespace resets on sign-out, as the dev one does.
 *
 * Sign-out used to reset prod one slice at a time from a hand-kept list in
 * TitleBar, and every page added since it was written was missing from it —
 * Loss Prevention, Categories, Vendors, Sub Dept Margins, Admin and more kept
 * the last user's results for whoever signed in next without a reload.
 * `resetAppSlice` is dispatched on every sign-out, so keying the namespace to
 * it clears every page slice there is now and every one added later.
 */
export const prodReducer: Reducer<ProdState> = (state, action) =>
  combinedProd(action.type === resetAppSlice.type ? undefined : state, action);
