import { describe, expect, it } from "vitest";
import { setupStore } from "./index";
import { pageReducers } from "./pageReducers";
import { sessionReducers } from "./sessionReducers";
import { devReducers } from "./devReducers";
import { resetAppSlice } from "../features/appSlice";
import { setThreshold as prodSetLedgerThreshold } from "../features/salesLedgerSlice";
import { setThreshold as devSetLedgerThreshold } from "../features/dev/devSalesLedgerSlice";

/** Every RTK action creator a module exports, by its action type.
 *
 *  Action creators are functions carrying a string `.type`, which is what
 *  makes them findable without each slice having to register itself. */
const actionTypesOf = (mods: Record<string, unknown>) => {
  const found = new Map<string, string>();
  for (const [path, mod] of Object.entries(mods)) {
    for (const value of Object.values(mod as Record<string, unknown>)) {
      const type = (value as { type?: unknown })?.type;
      if (typeof value === "function" && typeof type === "string") {
        found.set(type, path);
      }
    }
  }
  return found;
};

const prodModules = import.meta.glob("../features/*Slice.{ts,tsx}", { eager: true });
const devModules = import.meta.glob("../features/dev/*Slice.{ts,tsx}", { eager: true });

describe("dev and prod slices stay isolated", () => {
  /**
   * The failure this exists for.
   *
   * Redux hands every action to every reducer, and each one matches on
   * `action.type` alone — not on the module the creator was imported from, and
   * not on where the reducer is mounted. So a dev slice that kept its prod
   * counterpart's `name` answers to the same action string, and the two trees
   * move together: you set a week on dev Sales and prod remembers it.
   *
   * Nothing throws when that happens, which is why it needs a test rather than
   * a convention.
   */
  it("shares no action type between the two trees", () => {
    const prod = actionTypesOf(prodModules);
    const dev = actionTypesOf(devModules);

    const shared = [...dev.keys()]
      .filter((t) => prod.has(t))
      .map((t) => `${t}  (${dev.get(t)} vs ${prod.get(t)})`);

    expect(
      shared,
      "a dev slice kept its prod counterpart's `name` — rename it to dev*",
    ).toEqual([]);
  });

  it("names every dev action type so it reads as one", () => {
    const offenders = [...actionTypesOf(devModules).entries()]
      .filter(([type]) => !type.startsWith("dev"))
      .map(([type, path]) => `${type}  (${path})`);

    expect(offenders).toEqual([]);
  });

  it("mounts the same page slices under prod and dev", () => {
    // A forked slice that never made it into `devReducers` is mounted nowhere,
    // so its dev page silently reads undefined.
    const strays = Object.keys(devReducers).filter(
      (k) => !(k in pageReducers),
    );
    expect(strays, "dev slice with no prod counterpart").toEqual([]);
  });

  it("keeps session state out of both trees", () => {
    const overlap = Object.keys(sessionReducers).filter((k) => k in pageReducers);
    expect(
      overlap,
      "session state must not be forked — it would drop the signed-in store and dates on a flip",
    ).toEqual([]);
  });
});

describe("the store layout", () => {
  it("mounts page slices under prod only, never at the root", () => {
    // Page code reads state.prod.<slice> or state.dev.<slice>; a bare
    // state.<slice> would be a page reading neither tree.
    const state = setupStore().getState() as unknown as Record<string, unknown> & {
      prod: Record<string, unknown>;
    };
    for (const key of Object.keys(pageReducers)) {
      expect(state[key], `${key} at the root`).toBeUndefined();
      expect(state.prod[key], `prod.${key}`).toBeDefined();
    }
  });

  it("starts every field a dev slice shares with its prod twin the same", () => {
    // A fork begins identical, and dev work is allowed to add or drop fields
    // (dev User Management dropped the base-group sharing state, for one). What
    // must not happen is a field both copies still carry starting differently —
    // that is drift nobody chose.
    const state = setupStore().getState() as unknown as {
      prod: Record<string, Record<string, unknown>>;
      dev: Record<string, Record<string, unknown>>;
    };
    for (const key of Object.keys(devReducers)) {
      const dev = state.dev[key];
      const prod = state.prod[key];
      expect(prod, `prod.${key}`).toBeDefined();
      for (const field of Object.keys(dev)) {
        if (!(field in prod)) continue;
        expect(dev[field], `dev.${key}.${field} vs prod.${key}.${field}`).toEqual(
          prod[field],
        );
      }
    }
  });
});

describe("the Sales fork", () => {
  /** A threshold neither tree starts on, so any movement is visible. */
  const CHANGED = { op: "lt", amount: 3 } as const;

  it("moves dev Sales without moving prod Sales", () => {
    const store = setupStore();
    const before = store.getState().prod.salesLedger.threshold;
    store.dispatch(devSetLedgerThreshold(CHANGED));

    expect(store.getState().dev.salesLedger.threshold).toEqual(CHANGED);
    expect(store.getState().prod.salesLedger.threshold).toEqual(before);
  });

  it("leaves dev Sales alone when prod Sales moves", () => {
    const store = setupStore();
    const before = store.getState().dev.salesLedger.threshold;
    store.dispatch(prodSetLedgerThreshold(CHANGED));

    expect(store.getState().prod.salesLedger.threshold).toEqual(CHANGED);
    expect(store.getState().dev.salesLedger.threshold).toEqual(before);
  });

  it("clears the whole dev tree on sign-out", () => {
    // Sign-out resets prod slice by slice; the dev tree resets on the one
    // action every sign-out dispatches, so no fork can be forgotten.
    const store = setupStore();
    const initial = store.getState().dev.salesLedger.threshold;
    store.dispatch(devSetLedgerThreshold(CHANGED));
    expect(store.getState().dev.salesLedger.threshold).toEqual(CHANGED);
    store.dispatch(resetAppSlice());
    expect(store.getState().dev.salesLedger.threshold).toEqual(initial);
  });
});
