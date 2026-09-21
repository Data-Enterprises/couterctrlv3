import type { Reducer } from "@reduxjs/toolkit";

import appReducer from "../features/appSlice";
import navReducer from "../features/navSlice";
import userReducer from "../features/userSlice";
import searchReducer from "../features/searchSlice";
import groupReducer from "../features/groupSlice";
import storeReducer from "../features/storeSlice";
import forgotPasswordReducer from "../features/forgotPasswordSlice";
import ctxMenuReducer from "../features/ctxMenuSlice";
import itemScanReducer from "../features/itemScanSlice";

/**
 * State that describes who you are and what you are asking about.
 *
 * These live at the root of the store and are NEVER forked, because both UI
 * trees are one signed-in session. Duplicating them would mean logging in
 * twice, and duplicating `search` in particular would drop your store and date
 * range every time you flipped the environment — which would break the one
 * thing the switch is for, reading the same query against both backends.
 *
 * Safe to share only because both APIs read the same RDS: `user.assignedStores`,
 * `group` and `stores` are API-derived, and would be wrong in one environment
 * if dev ever got its own database. That is a real dependency of this design,
 * not an incidental fact.
 *
 * `itemScan` is the judgement call in this list. It is read by `UpcScanner`,
 * which is shared by both trees, and it holds a scanner buffer rather than
 * rows from an endpoint — so it is session state. Moving it to `pageReducers`
 * is a one-line change if a forked page ever needs its own.
 */
export const sessionReducers = {
  app: appReducer,
  nav: navReducer,
  user: userReducer,
  search: searchReducer,
  group: groupReducer,
  stores: storeReducer,
  forgotPassword: forgotPasswordReducer,
  ctxMenu: ctxMenuReducer,
  itemScan: itemScanReducer,
} satisfies Record<string, Reducer>;
