import { describe, expect, it } from "vitest";
import { rootReducer, setupStore } from "./index";
import { resetAppSlice } from "../features/appSlice";
import { setUsername, setUserLevel } from "../features/userSlice";
import { setLastRoute } from "../features/navSlice";
import { setCouponSalesHasSearched } from "../features/couponSalesSlice";
import { setThreshold as devSetLedgerThreshold } from "../features/dev/devSalesLedgerSlice";

/**
 * Sign-out empties the store and keeps the username.
 *
 * This is pinned rather than trusted because the thing it replaced — a list
 * of per-slice resets in `TitleBar` — looked correct for as long as nobody
 * added a slice, and then quietly stopped being correct. A list cannot be
 * tested into correctness; a reducer that resets everything can.
 */
describe("sign-out", () => {
  it("resets session, prod and dev state in one action", () => {
    const store = setupStore();

    store.dispatch(setUserLevel(9));
    store.dispatch(setLastRoute("/sales"));
    store.dispatch(setCouponSalesHasSearched(true));
    store.dispatch(devSetLedgerThreshold({ amount: 42, op: "gt" }));

    store.dispatch(resetAppSlice());

    // Compared against a store that never signed in, rather than against
    // hand-written initial values — those are the slices' to decide, and a
    // test that restates them only pins the restatement.
    const pristine = setupStore().getState();
    const s = store.getState();
    expect(s.user.userLevel).toBe(pristine.user.userLevel);
    expect(s.nav.lastRoute).toBe(pristine.nav.lastRoute);
    expect(s.prod.couponSales.hasSearched).toBe(
      pristine.prod.couponSales.hasSearched,
    );
    expect(s.dev.salesLedger.threshold).toEqual(
      pristine.dev.salesLedger.threshold,
    );
  });

  it("keeps the username, and only the username", () => {
    const store = setupStore();

    store.dispatch(setUsername("snelson"));
    store.dispatch(setUserLevel(9));

    store.dispatch(resetAppSlice());

    const s = store.getState();
    expect(s.user.username).toBe("snelson");
    // Everything beside it in the same slice is back to initial — the
    // username is carried deliberately, not because `user` was skipped.
    expect(s.user.userLevel).toBe(0);
    expect(s.user.companies).toEqual([]);
    expect(s.user.assignedStores).toEqual([]);
  });

  it("leaves nothing of the last session in any slice, in any tree", () => {
    // Every slice in the store, not a sample: each one is given a marker the
    // last user "left behind", and after sign-out the whole state has to be a
    // never-signed-in store's, username aside. A slice added later is in this
    // check the day it is registered, with no change here.
    type Tree = Record<string, Record<string, unknown>>;
    const pristine = setupStore().getState() as unknown as Record<string, unknown>;
    const TREES = ["prod", "dev", "legacy"];
    let marked = 0;
    const leftBehind = (slice: unknown) => {
      marked += 1;
      return { ...(slice as object), __lastSession: "previous user's data" };
    };
    const dirty = Object.fromEntries(
      Object.entries(pristine).map(([key, value]) => [
        key,
        TREES.includes(key)
          ? Object.fromEntries(
              Object.entries(value as Tree).map(([k, v]) => [k, leftBehind(v)]),
            )
          : leftBehind(value),
      ]),
    ) as Record<string, Record<string, unknown>>;
    dirty.user = { ...dirty.user, username: "snelson" };

    const after = rootReducer(
      dirty as unknown as Parameters<typeof rootReducer>[0],
      resetAppSlice(),
    );

    expect(marked).toBeGreaterThan(40);
    expect(after).toEqual({
      ...pristine,
      user: { ...(pristine.user as object), username: "snelson" },
    });
  });

  it("covers a slice nobody remembered to name", () => {
    // The point of resetting at the root: this slice was never in the old
    // list, and no change here was needed to include it.
    const store = setupStore();
    store.dispatch(setCouponSalesHasSearched(true));
    store.dispatch(resetAppSlice());
    expect(store.getState().prod.couponSales.hasSearched).toBe(false);
  });
});
