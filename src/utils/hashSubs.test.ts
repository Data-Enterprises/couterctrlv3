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

/**
 * Where the rule has to be applied, and why each one.
 *
 * `sales/weekly` and `sales/daily` drop hash rows server-side. Anything that
 * SUMS the sub-department or item endpoints and sets the result beside one of
 * those store figures has to drop them too, or the two describe different
 * stores -- $79,943 of fuel apart on Brooks Tupelo.
 */
describe("what the rule protects", () => {
  const row = (is_hash?: boolean, net = 100) => ({ is_hash, net });

  it("leaves a store with no hash departments exactly as it was", () => {
    // Most stores. The filter has to be free for them, or every page moves
    // the day the flag ships.
    const rows = [row(false, 10), row(false, 20)];
    expect(countedRows(rows)).toHaveLength(2);
    expect(countedRows(rows).reduce((t, r) => t + r.net, 0)).toBe(30);
  });

  it("takes out only the flagged rows, whatever they are worth", () => {
    // Tupelo's fuel is five departments and $79,943; Chapel Hill's are four
    // and MINUS $2,334.95. A filter that assumed hash rows were small, or
    // positive, would be wrong on both.
    const rows = [row(false, 100), row(true, 79943), row(true, -2334.95)];
    expect(countedRows(rows)).toHaveLength(1);
    expect(countedRows(rows)[0].net).toBe(100);
    expect(hashRows(rows).reduce((t, r) => t + r.net, 0)).toBeCloseTo(
      77608.05,
      2,
    );
  });

  it("keeps everything when no row carries the flag", () => {
    // A response from a deploy older than the flag. The page has to behave
    // as it did rather than silently dropping every row it has.
    const rows = [row(undefined, 10), row(undefined, 20)];
    expect(countedRows(rows)).toHaveLength(2);
    expect(splitHash(rows).known).toBe(false);
  });
});
