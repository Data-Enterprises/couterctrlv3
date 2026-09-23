import { describe, expect, it } from "vitest";
import { normalizeProductCode, parseProductCodes } from "./productCodes";

describe("parsing pasted product codes", () => {
  it("takes whatever separator the source used", () => {
    expect(parseProductCodes("1200000088, 2100004411\n0490000112\t7770001234")).toEqual([
      "1200000088",
      "2100004411",
      "0490000112",
      "7770001234",
    ]);
  });

  it("drops duplicates, which a pasted column is full of", () => {
    expect(parseProductCodes("111\n222\n111")).toEqual(["111", "222"]);
  });

  it("drops anything that is not a code", () => {
    // A pasted spreadsheet column brings its header with it. Sent as a filter
    // it would match nothing and empty the file.
    expect(parseProductCodes("UPC\n1200000088\n-\n")).toEqual(["1200000088"]);
  });

  it("finds nothing in empty text", () => {
    expect(parseProductCodes("   \n\n")).toEqual([]);
  });
});

describe("matching a stored code", () => {
  it("strips the trailing .0 storage sometimes carries", () => {
    // The top-ten query does the same inline, which is how we know it happens.
    expect(normalizeProductCode("1200000088.0")).toBe("1200000088");
    expect(normalizeProductCode("1200000088")).toBe("1200000088");
  });

  it("survives a null", () => {
    expect(normalizeProductCode(null)).toBe("");
  });
});
