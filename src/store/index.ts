import { combineReducers, configureStore } from "@reduxjs/toolkit";

import { sessionReducers } from "./sessionReducers";
import { prodReducer } from "./pageReducers";
import { devReducer } from "./devReducers";
import { legacyReducer } from "./legacyReducers";

/**
 * The store, in four parts.
 *
 *   session  — who you are and what you are asking about, at the root.
 *   prod     — every page slice, holding answers from the prod API.
 *   dev      — forked copies of the page slices a dev page has changed.
 *   legacy   — copies again, for the pages restored behind the Legacy toggle.
 *              Legacy only ever talks to prod, but it keeps its own branch:
 *              the old pages ask for different shapes than the ones that
 *              replaced them, and sharing prod's would mean two pages fighting
 *              over one slice.
 *
 * All three trees are registered once, at load, and all three reset whole on
 * sign-out (keyed to `resetAppSlice` — see pageReducers.ts / devReducers.ts /
 * legacyReducers.ts). Nothing
 * is swapped at runtime and
 * `replaceReducer` is never called: flipping the environment changes which
 * branch a page reads, not which reducers exist.
 *
 * Page code reads `state.prod.<slice>`, `state.dev.<slice>` or
 * `state.legacy.<slice>` for its tree — never a bare `state.<slice>`: page slices are not mounted at the root. (They
 * were, twice over, while the pages moved to their trees one at a time.)
 */
export const setupStore = () =>
  configureStore({
    reducer: combineReducers({
      ...sessionReducers,
      prod: prodReducer,
      dev: devReducer,
      legacy: legacyReducer,
    }),
  });

export type RootState = ReturnType<ReturnType<typeof setupStore>["getState"]>;
export type AppDispatch = ReturnType<typeof setupStore>["dispatch"];

export const store = setupStore(); // singleton for app usage
