import { combineReducers, type Reducer } from "@reduxjs/toolkit";

/**
 * The dev tree's own copy of any page slice that has been forked.
 *
 * Empty until the first page is forked, which is the point — a page only gains
 * a dev slice while someone is changing it, and promoting the dev version back
 * to prod removes the entry again.
 *
 * Every slice added here MUST have a `name` that differs from its prod
 * counterpart, conventionally `devSalesPerf` for `salesPerf`. Redux hands every
 * action to every reducer and each one matches on `action.type` alone — so two
 * slices sharing a `name` answer to the same action string and stay in
 * lockstep no matter which module the action creator was imported from, and no
 * matter which key they are mounted under. `sliceIsolation.test.ts` fails the
 * build if a rename is missed, because nothing else would: the symptom is prod
 * quietly remembering a date you set in dev.
 */
export const devReducers = {} satisfies Record<string, Reducer>;

type DevState = { [K in keyof typeof devReducers]: ReturnType<(typeof devReducers)[K]> };

/**
 * `combineReducers` logs "Store does not have a valid reducer" for an empty
 * map, and an empty dev namespace is the correct state of affairs today — so
 * the namespace is an identity reducer until it has something in it. Adding
 * the first slice switches it over with no other change.
 */
export const devReducer = (
  Object.keys(devReducers).length
    ? combineReducers(devReducers)
    : (state: DevState = {} as DevState) => state
) as Reducer<DevState>;
