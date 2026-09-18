import { combineReducers, type Reducer } from "@reduxjs/toolkit";
import { resetAppSlice } from "../features/appSlice";

import devSalesReducer from "../features/dev/devSalesSlice";
import devSalesLedgerReducer from "../features/dev/devSalesLedgerSlice";
import devSalesPerfReducer from "../features/dev/devSalesPerfSlice";
import devEventPerfReducer from "../features/dev/devEventPerfSlice";
import devLossPreventionReducer from "../features/dev/devLossPreventionSlice";
import devCouponSalesReducer from "../features/dev/devCouponSalesSlice";
import devItemPerfReducer from "../features/dev/devItemPerfSlice";
import devSubMarginReducer from "../features/dev/devSubMarginSlice";
import devCategoriesReducer from "../features/dev/devCategoriesSlice";
import devVendorsReducer from "../features/dev/devVendorsSlice";
import devCashiersReducer from "../features/dev/devCashiersSlice";
import devUpcDevReducer from "../features/dev/devUpcDevSlice";
import devForecastReducer from "../features/dev/devForecastSlice";
import devForecastDevReducer from "../features/dev/devForecastDevSlice";
import devItemLookupReducer from "../features/dev/devItemLookupSlice";
import devOrdersReducer from "../features/dev/devOrdersSlice";
import devReceiversReducer from "../features/dev/devReceiversSlice";
import devCouponReducer from "../features/dev/devCouponSlice";
import devUsersReducer from "../features/dev/devUsersSlice";
import devBaseGroupReducer from "../features/dev/devBaseGroupSlice";
import devOrganizationReducer from "../features/dev/devOrganizationSlice";
import devAdminPageReducer from "../features/dev/devAdminPageSlice";
import devGroupsPageReducer from "../features/dev/devGroupsPageSlice";
import devQsReducer from "../features/dev/devQsSlice";
import devLpActionsReducer from "../features/dev/devLpActionsSlice";

/**
 * The dev tree's own copy of every page slice that has been forked.
 *
 * Keys match the prod keys in `pageReducers` — `state.dev.salesLedger` is the
 * dev twin of `state.prod.salesLedger` — so a page moving between trees reads
 * the same path with one segment changed.
 *
 * Every slice added here MUST have a `name` that differs from its prod
 * counterpart, conventionally `devSalesPerf` for `salesPerf`. Redux hands every
 * action to every reducer and each one matches on `action.type` alone — so two
 * slices sharing a `name` answer to the same action string and stay in
 * lockstep no matter which module the action creator was imported from, and no
 * matter which key they are mounted under. `sliceIsolation.test.ts` fails the
 * build if a rename is missed, because nothing else would: the symptom is prod
 * quietly remembering a date you set in dev.
 *
 * Forked so far: Sales (desktop ledger + mobile performance).
 */
export const devReducers = {
  sales: devSalesReducer,
  salesLedger: devSalesLedgerReducer,
  salesPerf: devSalesPerfReducer,
  eventPerf: devEventPerfReducer,
  lossPrevention: devLossPreventionReducer,
  couponSales: devCouponSalesReducer,
  itemPerf: devItemPerfReducer,
  subMargin: devSubMarginReducer,
  categories: devCategoriesReducer,
  vendors: devVendorsReducer,
  cashier: devCashiersReducer,
  upcDev: devUpcDevReducer,
  forecast: devForecastReducer,
  forecastDev: devForecastDevReducer,
  item: devItemLookupReducer,
  orders: devOrdersReducer,
  receivers: devReceiversReducer,
  coupons: devCouponReducer,
  users: devUsersReducer,
  baseGroup: devBaseGroupReducer,
  organization: devOrganizationReducer,
  adminPage: devAdminPageReducer,
  groupsPage: devGroupsPageReducer,
  quicksight: devQsReducer,
  lpActions: devLpActionsReducer,
} satisfies Record<string, Reducer>;

type DevState = { [K in keyof typeof devReducers]: ReturnType<(typeof devReducers)[K]> };

/**
 * `combineReducers` logs "Store does not have a valid reducer" for an empty
 * map, so an empty dev namespace — the state after every page has been
 * promoted — falls back to an identity reducer.
 */
const combined = (
  Object.keys(devReducers).length
    ? combineReducers(devReducers)
    : (state: DevState = {} as DevState) => state
) as Reducer<DevState>;

/**
 * The whole dev namespace resets on sign-out.
 *
 * Sign-out resets each prod slice by name, one dispatch per slice in TitleBar.
 * Relying on the same for dev would mean every forked page adding its own
 * resets there, and a fork that forgot would hand the next person to sign in
 * on this device the last one's dev Sales. `resetAppSlice` is dispatched on
 * every sign-out, so keying the dev tree to it clears every dev slice there
 * is now and every one added later, with nothing to remember.
 */
export const devReducer: Reducer<DevState> = (state, action) =>
  combined(action.type === resetAppSlice.type ? undefined : state, action);
