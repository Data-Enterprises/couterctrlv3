import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { setHasSearched } from "./devSalesLedgerSlice";
import type { SubSale } from "../../interfaces";
import type {
  OrdersWave,
  ReceiptsWave,
  SalesWave,
} from "../../pages/sales/dev/shared/investigationData";

/**
 * What the Sales comparison has already asked for.
 *
 * The comparison is a drill-down four levels deep — group, store, department,
 * items — and every level held its payload in component state. Walking back up
 * unmounted the level you left, so walking down again re-ran every request:
 * going Back from an investigation and opening the same department asked for
 * all nine again, and returning to Sub depts re-fetched the counterpart's
 * three weeks. None of it had changed in the meantime.
 *
 * Keyed by everything that identifies the data — the stores, the dates, the
 * department. A key that does not exist is a fetch; a key that does is not.
 *
 * WHEN IT GOES is the whole question, and the answer is: when a new search
 * runs. `setHasSearched` fires at the top of `fetchLedger` and on the way back
 * to the entry screen, so both clear the lot. Nothing here survives a search,
 * which means nobody can be shown last search's figures under this search's
 * heading. There is deliberately no clock: a cache that expires on its own
 * would refetch while somebody is reading, and a store's week does not change
 * under them.
 */

/** The counterpart store's three weeks of departments. */
export interface CounterpartWeeks {
  tw: SubSale[];
  lw: SubSale[];
  ly: SubSale[];
}

/** One department's investigation, all three waves, complete. Only a finished
 *  set is kept: a half-filled one would restore a screen that says it is still
 *  reading deliveries and then never reads any. */
export interface InvestigationWaves {
  sales: SalesWave;
  orders: OrdersWave;
  receipts: ReceiptsWave;
}

interface SalesCacheState {
  counterpart: Record<string, CounterpartWeeks>;
  counterpartOrder: string[];
  investigation: Record<string, InvestigationWaves>;
  investigationOrder: string[];
}

/**
 * How many of each to keep.
 *
 * Small on purpose. An investigation is six periods of item rows across two
 * stores — Soft Drinks alone was 805 items — so these are the largest objects
 * the dev store holds, and they show up in every devtools snapshot. Four
 * covers the real pattern, which is going back and forth between two or three
 * departments; a counterpart's departments are far smaller, so more fit.
 */
const INVESTIGATION_CAP = 4;
const COUNTERPART_CAP = 8;

const initialState: SalesCacheState = {
  counterpart: {},
  counterpartOrder: [],
  investigation: {},
  investigationOrder: [],
};

/**
 * Write, move to the front, drop whatever falls off the end.
 *
 * Insertion order rather than true LRU: a read does not promote its entry.
 * Promoting on read would mean dispatching from a selector's consumer on every
 * render that hit the cache, which is a render loop waiting to happen, and at
 * these sizes the difference is one extra fetch in a pathological order.
 */
const remember = <T>(
  store: Record<string, T>,
  order: string[],
  key: string,
  value: T,
  cap: number,
) => {
  store[key] = value;
  const at = order.indexOf(key);
  if (at >= 0) order.splice(at, 1);
  order.unshift(key);
  while (order.length > cap) {
    const dropped = order.pop();
    if (dropped !== undefined) delete store[dropped];
  }
};

const devSalesCacheSlice = createSlice({
  name: "devSalesCache",
  initialState,
  reducers: {
    rememberCounterpart: (
      state,
      action: PayloadAction<{ key: string; value: CounterpartWeeks }>,
    ) =>
      void remember(
        state.counterpart,
        state.counterpartOrder,
        action.payload.key,
        action.payload.value,
        COUNTERPART_CAP,
      ),

    rememberInvestigation: (
      state,
      action: PayloadAction<{ key: string; value: InvestigationWaves }>,
    ) =>
      void remember(
        state.investigation,
        state.investigationOrder,
        action.payload.key,
        action.payload.value,
        INVESTIGATION_CAP,
      ),

    forgetSalesCache: () => initialState,
  },
  extraReducers: (builder) => {
    // A new search, or the way back to the entry screen. Either way what is
    // held belongs to a question nobody is asking any more.
    builder.addCase(setHasSearched, () => initialState);
  },
});

export const { rememberCounterpart, rememberInvestigation, forgetSalesCache } =
  devSalesCacheSlice.actions;

export default devSalesCacheSlice.reducer;
