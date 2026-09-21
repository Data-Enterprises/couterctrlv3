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
 * Page code reads `state.prod.<slice>` or `state.dev.<slice>` for its tree —
 * never a bare `state.<slice>`: page slices are not mounted at the root. (They
 * were, twice over, while the pages moved to their trees one at a time.)
 */
export const setupStore = () =>
  configureStore({
    reducer: combineReducers({
      ...sessionReducers,
      prod: combineReducers(pageReducers),
      dev: devReducer,
    }),
  });

export type RootState = ReturnType<ReturnType<typeof setupStore>["getState"]>;
export type AppDispatch = ReturnType<typeof setupStore>["dispatch"];

export const store = setupStore(); // singleton for app usage
