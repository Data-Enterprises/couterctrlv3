import { describe, expect, it } from "vitest";
import { countedRows, hashRows, isHashRow, splitHash } from "./hashSubs";

/**
 * The flag arrives from `excluded_sub_flag` as a SQL boolean, and it is
 * optional on the row type because it was added after the endpoints existed.
 * Both of those shapes have to be read correctly, because getting it wrong is
 * silent: a total that is $79,943 out looks like a total.
 */
describe("hash rows", () => {
  const row = (is_hash?: boolean) => ({ is_hash, id: String(is_hash) });

  it("counts only a true flag as hash", () => {
    expect(isHashRow(row(true))).toBe(true);
    expect(isHashRow(row(false))).toBe(false);
  });

  it("treats a missing flag as not hash", () => {
    // An endpoint that has not been updated, or a response from before the
    // flag existed. Reading undefined as hash would silently drop every row
    // on those pages.
    expect(isHashRow(row(undefined))).toBe(false);
    expect(isHashRow({})).toBe(false);
  });

  it("splits the two sides without losing a row", () => {
    const rows = [row(true), row(false), row(undefined), row(true)];
    expect(countedRows(rows)).toHaveLength(2);
    expect(hashRows(rows)).toHaveLength(2);
    expect(countedRows(rows).length + hashRows(rows).length).toBe(rows.length);
  });

  it("says whether the flag was there at all", () => {
    // "No hash departments here" and "nobody told me" are different answers.
    expect(splitHash([row(false), row(true)]).known).toBe(true);
    expect(splitHash([row(undefined), {}]).known).toBe(false);
    expect(splitHash([]).known).toBe(false);
  });
});
