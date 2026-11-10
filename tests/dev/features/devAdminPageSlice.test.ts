import { describe, expect, it } from "vitest";
import reducer, {
  setSubExclCatalog,
  setSubExclCompanyId,
  setSubExclHashOnly,
  setSubExclSearch,
  setSubExclStoreKey,
  SUB_EXCL_ALL_STORES,
} from "@/features/dev/devAdminPageSlice";
import { setupStore } from "@/store";
import { resetAppSlice } from "@/features/appSlice";

// Utils
import { ALL_STORES } from "@/pages/admin/dev/subExclusions/utils";

// Interfaces
import type { SubDeptCatalogRow } from "@/api/subDeptExclusions";

const fresh = () => reducer(undefined, { type: "@@init" });

describe("Admin's Sub dept exclusions state", () => {
  it("starts on every store, the 120-day window and no catalogue", () => {
    const s = fresh();
    expect(s.subExclStoreKey).toBe(ALL_STORES);
    expect(SUB_EXCL_ALL_STORES).toBe(ALL_STORES);
    expect(s.subExclDays).toBe("120");
    expect(s.subExclStores).toBeNull();
    expect(s.subExclCatalog).toBeNull();
    expect(s.subExclLoadedFor).toBeNull();
  });

  it("goes back to every store when the company changes", () => {
    let s = reducer(fresh(), setSubExclCompanyId("4"));
    s = reducer(s, setSubExclStoreKey("1201"));
    expect(s.subExclStoreKey).toBe("1201");
    s = reducer(s, setSubExclCompanyId("6"));
    expect(s.subExclCompanyId).toBe("6");
    expect(s.subExclStoreKey).toBe(ALL_STORES);
  });

  it("remembers what the catalogue was read for", () => {
    const rows = [{ storeid: 1201 }] as unknown as SubDeptCatalogRow[];
    const s = reducer(
      fresh(),
      setSubExclCatalog({ rows, loadedFor: "1201,1202|120" }),
    );
    expect(s.subExclCatalog).toEqual(rows);
    expect(s.subExclLoadedFor).toBe("1201,1202|120");
  });

  it("is cleared on sign-out", () => {
    const store = setupStore();
    store.dispatch(setSubExclCompanyId("4"));
    store.dispatch(setSubExclSearch("lottery"));
    store.dispatch(setSubExclHashOnly(true));
    store.dispatch(
      setSubExclCatalog({ rows: [], loadedFor: "1201|120" }),
    );
    store.dispatch(resetAppSlice());
    const s = store.getState().dev.adminPage;
    expect(s.subExclCompanyId).toBe("");
    expect(s.subExclSearch).toBe("");
    expect(s.subExclHashOnly).toBe(false);
    expect(s.subExclLoadedFor).toBeNull();
  });
});
