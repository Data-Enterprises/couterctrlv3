import { describe, expect, it } from "vitest";
import type { DuplicateSource } from "../../../../../features/dev/devUsersSlice";
import { NO_PICKS, type AccessPicks } from "../access/accessSets";
import {
  createBlockReason,
  duplicateCompanies,
  editBlockReason,
  needsSingleStoreTrim,
  passwordOk,
  passwordRules,
  reachableLimit,
  readiness,
  singleStoreNote,
  trimToSingleStore,
} from "./wizardRules";

const store = (storeid: number, store_number: string, store_name: string) => ({
  storeid,
  store_number,
  store_name,
  company: 1,
  company_name: "Houchens",
  base_group: 10,
});

describe("which steps are ready", () => {
  const ready = (over: Partial<Parameters<typeof readiness>[0]> = {}) =>
    readiness({ identity: true, switching: false, hasAccess: true, emptyGroups: 0, ...over });

  it("marks Review ready only when every step it reviews is", () => {
    expect(ready().review).toBe(true);
    expect(ready({ identity: false }).review).toBe(false);
    expect(ready({ hasAccess: false }).review).toBe(false);
    expect(ready({ emptyGroups: 1 }).review).toBe(false);
    expect(ready({ switching: true }).review).toBe(false);
  });

  it("lets the step bar reach the first unready step, and no further", () => {
    expect(reachableLimit(ready())).toBe(3);
    expect(reachableLimit(ready({ hasAccess: false }))).toBe(2);
    expect(reachableLimit(ready({ identity: false }))).toBe(0);
  });

  it("says why Create is off", () => {
    expect(createBlockReason(ready(), { hasAccess: true })).toBeNull();
    expect(createBlockReason(ready({ identity: false }), { hasAccess: true })).toBe(
      "Finish User info first.",
    );
    expect(createBlockReason(ready({ hasAccess: false }), { hasAccess: false })).toMatch(
      /at least one company or group/,
    );
    expect(createBlockReason(ready({ emptyGroups: 1 }), { hasAccess: true })).toMatch(
      /no stores picked/,
    );
  });
});

describe("a duplicate's companies", () => {
  it("keeps a company the source holds with no group in it", () => {
    const source: DuplicateSource = {
      role: 2,
      user_level: 5,
      companyIds: [1, 4],
      baseGroupIds: [10],
      groups: [{ id: 10, name: "East", company: 1 }],
      mode: "all",
      stores: [],
    };
    expect(duplicateCompanies(source).sort()).toEqual([1, 4]);
  });

  it("adds a company only a group names", () => {
    const source: DuplicateSource = {
      role: 2,
      user_level: 5,
      companyIds: [],
      baseGroupIds: [10],
      groups: [{ id: 10, name: "East", company: 6 }],
      mode: "all",
      stores: [],
    };
    expect(duplicateCompanies(source)).toEqual([6]);
  });
});

describe("Single Store", () => {
  const byStore: AccessPicks = {
    ...NO_PICKS,
    companies: [1],
    baseGroups: [10],
    mode: "selected",
    stores: [store(301, "301", "Food Giant"), store(302, "302", "IGA"), store(303, "303", "Piggly")],
  };

  it("keeps the first store, and says which and how many went", () => {
    const after = trimToSingleStore(byStore);
    expect(after.stores.map((s) => s.storeid)).toEqual([301]);
    expect(singleStoreNote(byStore, after)).toBe(
      "Single Store keeps only 301 · Food Giant; the other 2 stores are unpicked. Change the role back to restore them.",
    );
  });

  it("says a By group person is now By store with nothing picked", () => {
    const byGroup: AccessPicks = { ...byStore, mode: "all", stores: [] };
    const after = trimToSingleStore(byGroup);
    expect(after.mode).toBe("selected");
    expect(singleStoreNote(byGroup, after)).toMatch(/no store is picked yet/);
  });

  it("leaves one store By store alone", () => {
    expect(needsSingleStoreTrim({ ...byStore, stores: byStore.stores.slice(0, 1) })).toBe(false);
    expect(needsSingleStoreTrim(byStore)).toBe(true);
  });
});

describe("Save changes in Edit", () => {
  const base = { identity: true, switching: false, hasAccess: true, emptyGroups: 0 };
  const reason = (
    over: Partial<typeof base>,
    dirty: { identityDirty: boolean; accessDirty: boolean },
  ) =>
    editBlockReason({
      ready: readiness({ ...base, ...over }),
      hasAccess: over.hasAccess ?? true,
      ...dirty,
    });

  it("saves a name or email change for someone with no access", () => {
    expect(reason({ hasAccess: false }, { identityDirty: true, accessDirty: false })).toBeNull();
  });

  it("needs Assignments ready only when access changed", () => {
    expect(reason({ hasAccess: false }, { identityDirty: false, accessDirty: true })).toMatch(
      /at least one company or group/,
    );
    expect(reason({ emptyGroups: 1 }, { identityDirty: false, accessDirty: true })).toMatch(
      /no stores picked/,
    );
  });

  it("needs valid details only when the details changed", () => {
    expect(reason({ identity: false }, { identityDirty: true, accessDirty: false })).toBe(
      "Finish User info first.",
    );
    expect(reason({ identity: false }, { identityDirty: false, accessDirty: true })).toBeNull();
  });

  it("says so when nothing has changed", () => {
    expect(reason({}, { identityDirty: false, accessDirty: false })).toBe("Nothing has changed yet.");
  });
});

describe("Save changes before what they hold has loaded", () => {
  const ready = readiness({ identity: true, switching: false, hasAccess: true, emptyGroups: 0 });
  const dirty = { identityDirty: true, accessDirty: false, hasAccess: true, ready };

  it("waits while it is read, and says so", () => {
    expect(editBlockReason({ ...dirty, held: "loading" })).toBe("Still reading what they hold.");
  });

  it("stays off after a failed read", () => {
    expect(editBlockReason({ ...dirty, held: "failed" })).toMatch(/didn't load/);
  });
});

describe("the password rules", () => {
  it("are enforced, not just listed", () => {
    expect(passwordOk("a")).toBe(false);
    expect(passwordOk("alllowercase123!")).toBe(false);
    expect(passwordOk("Short1!")).toBe(false);
    expect(passwordOk("Long-enough-Pass1")).toBe(true);
  });

  it("say which are met, for the list beside the field", () => {
    expect(passwordRules("abcdefghijkl").map((r) => r.met)).toEqual([true, false, false, false]);
  });
});
