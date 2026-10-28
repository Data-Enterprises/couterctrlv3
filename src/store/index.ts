import { combineReducers, configureStore } from "@reduxjs/toolkit";

import { sessionReducers } from "./sessionReducers";
import { prodReducer } from "./pageReducers";
import { devReducer } from "./devReducers";
import { legacyReducer } from "./legacyReducers";
import { resetAppSlice } from "../features/appSlice";

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
const combined = combineReducers({
  ...sessionReducers,
  prod: prodReducer,
  dev: devReducer,
  legacy: legacyReducer,
});

type State = ReturnType<typeof combined>;

/**
 * Sign-out empties the whole store, and keeps the username.
 *
 * The three page namespaces already reset whole, keyed to `resetAppSlice`.
 * The session slices did not: they were reset one at a time from a list in
 * `TitleBar`, which is the same arrangement that left prod's pages holding the
 * last user's rows until it was fixed the same way. A list like that is only
 * ever correct on the day it is written — every slice added afterwards is
 * missing from it, and nothing fails loudly when one is.
 *
 * So the reset happens here instead. `undefined` makes every reducer return
 * its own initial state, which covers every slice that exists now and every
 * one added later without anybody remembering to come back.
 *
 * The username survives on purpose: it is who just signed out, and the sign-in
 * screen and the account-setup modal both still want it. It is also the only
 * thing that survives — a token, a store list or a page of somebody's sales
 * outliving the session is exactly what this is for.
 */
export const rootReducer: typeof combined = (state, action) => {
  if (action.type !== resetAppSlice.type) return combined(state, action);

  const username = (state as State | undefined)?.user.username ?? "";
  const fresh = combined(undefined, action);
  return { ...fresh, user: { ...fresh.user, username } };
};

export const setupStore = () => configureStore({ reducer: rootReducer });

export type RootState = ReturnType<ReturnType<typeof setupStore>["getState"]>;
export type AppDispatch = ReturnType<typeof setupStore>["dispatch"];

export const store = setupStore(); // singleton for app usage
