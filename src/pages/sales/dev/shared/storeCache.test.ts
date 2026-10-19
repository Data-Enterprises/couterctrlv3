import { describe, it, expect } from "vitest";
import { lruPut, lruTouch, STORE_CACHE_MAX } from "./storeCache";

describe("lruPut", () => {
  it("puts a new key at the front", () => {
    expect(lruPut(["b", "c"], "a").order).toEqual(["a", "b", "c"]);
  });

  it("moves an existing key rather than duplicating it", () => {
    expect(lruPut(["a", "b", "c"], "c").order).toEqual(["c", "a", "b"]);
  });

  it("evicts past the bound, oldest first", () => {
    const got = lruPut(["b", "c", "d"], "a", 3);
    expect(got.order).toEqual(["a", "b", "c"]);
    expect(got.evicted).toEqual(["d"]);
  });

  it("evicts nothing while there is room", () => {
    expect(lruPut(["b"], "a", 3).evicted).toEqual([]);
  });

  it("re-putting a held key evicts nothing — it is already paid for", () => {
    const got = lruPut(["a", "b", "c", "d"], "d", 4);
    expect(got.order).toEqual(["d", "a", "b", "c"]);
    expect(got.evicted).toEqual([]);
  });

  it("holds four by default", () => {
    const order = ["a", "b", "c", "d"];
    expect(lruPut(order, "e").order).toHaveLength(STORE_CACHE_MAX);
    expect(lruPut(order, "e").evicted).toEqual(["d"]);
  });

  it("leaves the caller's array alone", () => {
    const order = ["a", "b"];
    lruPut(order, "c");
    expect(order).toEqual(["a", "b"]);
  });
});

describe("lruTouch", () => {
  it("promotes a key that is held", () => {
    // Reading a store is using it: the one you just looked at should not be
    // the next one thrown away.
    expect(lruTouch(["a", "b", "c"], "c")).toEqual(["c", "a", "b"]);
  });

  it("adds nothing for a key that is not held", () => {
    expect(lruTouch(["a", "b"], "z")).toEqual(["a", "b"]);
  });
});
