import { combineReducers, configureStore } from "@reduxjs/toolkit";

import { sessionReducers } from "./sessionReducers";
import { pageReducers } from "./pageReducers";
import { devReducer } from "./devReducers";

/**
 * The store, in three parts.
 *
 *   session  — who you are and what you are asking about, at the root.
 *   prod     — every page slice, holding answers from the prod API.
 *   dev      — forked copies of the page slices a dev page has changed.
 *
 * Both trees are registered once, at load. Nothing is swapped at runtime and
 * `replaceReducer` is never called: flipping the environment changes which
 * branch a page reads, not which reducers exist.
 *
 * MIGRATION — the page slices are currently mounted TWICE, once under `prod`
 * and once at the root where they have always been. That is deliberate and
 * temporary. A reducer is a pure function, so the two copies receive the same
 * actions from the same initial state and hold identical values at all times;
 * a page can read `state.salesPerf` or `state.prod.salesPerf` and get the same
 * answer. That is what lets the 524 call sites move one page per commit
 * instead of all at once. When the last one has moved, delete the spread
 * marked below and the compiler will point at anything left behind.
 */
export const setupStore = () =>
  configureStore({
    reducer: combineReducers({
      ...sessionReducers,
      prod: combineReducers(pageReducers),
      dev: devReducer,
      // Delete this line when no page reads a bare `state.<pageSlice>` — see
      // the migration note above.
      ...pageReducers,
    }),
  });

export type RootState = ReturnType<ReturnType<typeof setupStore>["getState"]>;
export type AppDispatch = ReturnType<typeof setupStore>["dispatch"];

export const store = setupStore(); // singleton for app usage
