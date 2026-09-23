import { combineReducers, type Reducer } from "@reduxjs/toolkit";
import { resetAppSlice } from "../features/appSlice";

import legacyAdListReducer from "../legacy/features/adListSlice";
import legacyAdminReducer from "../legacy/features/adminSlice";
import legacyBaseGroupReducer from "../legacy/features/baseGroupSlice";
import legacyCashierLegacyReducer from "../legacy/features/cashiersLegacySlice";
import legacyCompanyReducer from "../legacy/features/companySlice";
import legacyCouponLegacyReducer from "../legacy/features/couponLegacySlice";
import legacyCouponsReducer from "../legacy/features/couponSlice";
import legacyForecastReducer from "../legacy/features/forecastSlice";
import legacyGroupReducer from "../legacy/features/groupSlice";
import legacyItemReducer from "../legacy/features/itemLookupSlice";
import legacyLossPreventionReducer from "../legacy/features/lossPreventionSlice";
import legacyLossPreventionLegacyReducer from "../legacy/features/lossPreventionLegacySlice";
import legacyOrdersReducer from "../legacy/features/ordersSlice";
import legacyOrdersLegacyReducer from "../legacy/features/ordersLegacySlice";
import legacyQuicksightReducer from "../legacy/features/qsSlice";
import legacyReceiversReducer from "../legacy/features/receiversSlice";
import legacyReceiversLegacyReducer from "../legacy/features/receiversLegacySlice";
import legacySalesReducer from "../legacy/features/salesSlice";
import legacySalesLegacyReducer from "../legacy/features/salesLegacySlice";
import legacySalesMobileReducer from "../legacy/features/salesMobileSlice";
import legacySubMarginReducer from "../legacy/features/subMarginSlice";
import legacySubMarginLegacyReducer from "../legacy/features/subMarginLegacySlice";
import legacyTrendModalReducer from "../legacy/features/trendModalSlice";
import legacyUpcReducer from "../legacy/features/upcSlice";
import legacyUpcModalReducer from "../legacy/features/upcModalSlice";
import legacyUpcsReducer from "../legacy/features/upcUploadSlice";
import legacyUsersReducer from "../legacy/features/usersSlice";

/**
 * The legacy tree's own copy of every page slice a restored page reads.
 *
 * Every slice added here MUST have a `name` that differs from its prod and dev
 * counterparts, conventionally `legacySales` for `sales`. Redux hands every
 * action to every reducer and each matches on `action.type` alone, so two
 * slices sharing a `name` answer to the same action string and stay in
 * lockstep whichever key they are mounted under. `sliceIsolation.test.ts`
 * fails the build if a rename is missed.
 *
 * Keys are the ones the pre-separation store used at the root, so a vendored
 * page still asks for the shape it was written against — `state.sales` reads
 * as `state.legacy.sales` through `useLegacySelector`, and nothing in five
 * hundred files has to learn a new name.
 */
export const legacyReducers = {
  adList: legacyAdListReducer,
  admin: legacyAdminReducer,
  baseGroup: legacyBaseGroupReducer,
  cashierLegacy: legacyCashierLegacyReducer,
  company: legacyCompanyReducer,
  couponLegacy: legacyCouponLegacyReducer,
  coupons: legacyCouponsReducer,
  forecast: legacyForecastReducer,
  group: legacyGroupReducer,
  item: legacyItemReducer,
  lossPrevention: legacyLossPreventionReducer,
  lossPreventionLegacy: legacyLossPreventionLegacyReducer,
  orders: legacyOrdersReducer,
  ordersLegacy: legacyOrdersLegacyReducer,
  quicksight: legacyQuicksightReducer,
  receivers: legacyReceiversReducer,
  receiversLegacy: legacyReceiversLegacyReducer,
  sales: legacySalesReducer,
  salesLegacy: legacySalesLegacyReducer,
  salesMobile: legacySalesMobileReducer,
  subMargin: legacySubMarginReducer,
  subMarginLegacy: legacySubMarginLegacyReducer,
  trendModal: legacyTrendModalReducer,
  upc: legacyUpcReducer,
  upcModal: legacyUpcModalReducer,
  upcs: legacyUpcsReducer,
  users: legacyUsersReducer,
};

type LegacyState = {
  [K in keyof typeof legacyReducers]: ReturnType<(typeof legacyReducers)[K]>;
};

/**
 * `combineReducers` logs "Store does not have a valid reducer" for an empty
 * map, so the legacy namespace falls back to an identity reducer until the
 * first page is restored — the same fallback devReducers uses for the state
 * after every page has been promoted.
 */
const combined = (
  Object.keys(legacyReducers).length
    ? combineReducers(legacyReducers)
    : (state: LegacyState = {} as LegacyState) => state
) as Reducer<LegacyState>;

/**
 * The whole legacy namespace resets on sign-out, as prod and dev do.
 *
 * Legacy pages read the prod API by construction (`useProdApi`), so what is
 * held here is one user's prod data and has no business outliving their
 * session on a shared machine.
 */
export const legacyReducer: Reducer<LegacyState> = (state, action) =>
  combined(action.type === resetAppSlice.type ? undefined : state, action);
