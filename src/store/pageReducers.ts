import type { Reducer } from "@reduxjs/toolkit";

import salesReducer from "../features/salesSlice";
import salesPerfReducer from "../features/salesPerfSlice";
import itemPerfReducer from "../features/itemPerfSlice";
import eventPerfReducer from "../features/eventPerfSlice";
import usersReducer from "../features/usersSlice";
import lossPreventionReducer from "../features/lossPreventionSlice";
import lpActionsReducer from "../features/lpActionsSlice";
import upcReducer from "../features/upcSlice";
import itemLookupReducer from "../features/itemLookupSlice";
import trendModalReducer from "../features/trendModalSlice";
import upcModalReducer from "../features/upcModalSlice";
import quickSightReducer from "../features/qsSlice";
import forecastReducer from "../features/forecastSlice";
import forecastDevReducer from "../features/forecastDevSlice";
import priceSimReducer from "../features/priceSimSlice";
import upcUploadReducer from "../features/upcUploadSlice";
import receiversReducer from "../features/receiversSlice";
import receiversLegacyReducer from "../features/receiversLegacySlice";
import couponReducer from "../features/couponSlice";
import couponSalesReducer from "../features/couponSalesSlice";
import categoriesReducer from "../features/categoriesSlice";
import vendorsReducer from "../features/vendorsSlice";
import itemReportReducer from "../features/itemReportSlice";
import invoicesReducer from "../features/invoicesSlice";
import suggestedReducer from "../features/suggestedSlice";
import couponLegacyReducer from "../features/couponLegacySlice";
import reportBuilderReducer from "../features/reportBuilderSlice";
import adminReducer from "../features/adminSlice";
import adminPageReducer from "../features/adminPageSlice";
import baseGroupReducer from "../features/baseGroupSlice";
import companyReducer from "../features/companySlice";
import organizationReducer from "../features/organizationSlice";
import subMarginReducer from "../features/subMarginSlice";
import subMarginLegacyReducer from "../features/subMarginLegacySlice";
import cashiersReducer from "../features/cashiersSlice";
import cashiersLegacyReducer from "../features/cashiersLegacySlice";
import ordersReducer from "../features/ordersSlice";
import ordersLegacyReducer from "../features/ordersLegacySlice";
import adListReducer from "../features/adListSlice";
import salesLedgerReducer from "../features/salesLedgerSlice";
import salesTrackerReducer from "../features/salesTrackerSlice";
import upcDevReducer from "../features/upcDevSlice";
import ticketsReducer from "../pages/tickets/ticketsSlice";

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
  trendModal: trendModalReducer,
  upcModal: upcModalReducer,
  quicksight: quickSightReducer,
  forecast: forecastReducer,
  forecastDev: forecastDevReducer,
  priceSim: priceSimReducer,
  upcs: upcUploadReducer,
  receivers: receiversReducer,
  receiversLegacy: receiversLegacyReducer,
  coupons: couponReducer,
  couponSales: couponSalesReducer,
  categories: categoriesReducer,
  vendors: vendorsReducer,
  itemReport: itemReportReducer,
  invoices: invoicesReducer,
  suggested: suggestedReducer,
  couponLegacy: couponLegacyReducer,
  reportBuilder: reportBuilderReducer,
  admin: adminReducer,
  adminPage: adminPageReducer,
  baseGroup: baseGroupReducer,
  company: companyReducer,
  organization: organizationReducer,
  subMargin: subMarginReducer,
  subMarginLegacy: subMarginLegacyReducer,
  cashier: cashiersReducer,
  cashierLegacy: cashiersLegacyReducer,
  orders: ordersReducer,
  ordersLegacy: ordersLegacyReducer,
  adList: adListReducer,
  salesLedger: salesLedgerReducer,
  salesTracker: salesTrackerReducer,
  upcDev: upcDevReducer,
  tickets: ticketsReducer,
} satisfies Record<string, Reducer>;
