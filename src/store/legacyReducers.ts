import { combineReducers, type Reducer } from "@reduxjs/toolkit";
import { resetAppSlice } from "../features/appSlice";

/**
 * The legacy tree's own copy of every page slice a restored page reads.
 *
 * Keys are the page key — `state.legacy.sales`, the same path as
 * `state.prod.sales` with one segment changed — not the old `salesLegacy`
 * names the slices had before the separation.
 *
 * Every slice added here MUST have a `name` that differs from its prod and dev
 * counterparts, conventionally `legacySales` for `sales`. Redux hands every
 * action to every reducer and each matches on `action.type` alone, so two
 * slices sharing a `name` answer to the same action string and stay in
 * lockstep whichever key they are mounted under. `sliceIsolation.test.ts`
 * fails the build if a rename is missed.
 *
 * Restored so far: none — the tree is mounted first so a page can land in one
 * commit.
 */
export const legacyReducers = {};

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
