import { describe, it, expect } from "vitest";
import { parseUpload } from "./parseUpload";

describe("parseUpload — pasted lists", () => {
  it("keeps every code on a comma-separated line", () => {
    // The reported bug: only the first code survived, so most of a pasted
    // list went missing with no error.
    expect(parseUpload("1200000088, 1200000017").upcs).toEqual([
      "1200000088",
      "1200000017",
    ]);
  });

  it("reads one code per row", () => {
    expect(parseUpload("1200000088\n1200000017").upcs).toEqual([
      "1200000088",
      "1200000017",
    ]);
  });

  it("reads a mix of both", () => {
    expect(parseUpload("1200000088, 1200000017\n4011").upcs).toEqual([
      "1200000088",
      "1200000017",
      "4011",
    ]);
  });

  it("keeps four-digit PLUs", () => {
    expect(parseUpload("4011, 4225").upcs).toEqual(["4011", "4225"]);
  });

  it("de-duplicates across the whole paste", () => {
    expect(parseUpload("1200000088, 1200000088\n1200000088").upcs).toEqual([
      "1200000088",
    ]);
  });
});

describe("parseUpload — exported reports", () => {
  it("takes only the product code from a report row, not its figures", () => {
    // 10 is a unit count and 123.45 is money; neither is a product.
    const csv = 'Grocery,1200000088,"COKE 12PK",123.45,10';
    expect(parseUpload(csv).upcs).toEqual(["1200000088"]);
  });

  it("still ignores quantity columns on an all-integer row", () => {
    // No description and no decimal, so the length floor is the only guard.
    expect(parseUpload("1200000088,10,5").upcs).toEqual(["1200000088"]);
  });

  it("reads the department column and its header", () => {
    const csv = [
      "Sub Department,UPC,Description,Sales",
      'Grocery,1200000088,"COKE 12PK",123.45',
      'Dairy,1200000017,"MILK 1GAL",98.10',
    ].join("\n");
    const out = parseUpload(csv);
    expect(out.upcs).toEqual(["1200000088", "1200000017"]);
    expect(out.departments).toEqual(["Grocery", "Dairy"]);
  });

  it("handles descriptions containing commas", () => {
    const csv = 'Grocery,1200000088,"COKE, 12 PK",123.45';
    expect(parseUpload(csv).upcs).toEqual(["1200000088"]);
  });

  it("normalises codes exported through a float", () => {
    expect(parseUpload("7203096070.0").upcs).toEqual(
      parseUpload("7203096070").upcs,
    );
  });

  it("survives a BOM on the first cell", () => {
    expect(parseUpload("\uFEFF1200000088, 1200000017").upcs).toEqual([
      "1200000088",
      "1200000017",
    ]);
  });
});

describe("parseUpload — skipped lines", () => {
  it("reports nothing skipped for a clean comma list", () => {
    expect(parseUpload("1200000088, 1200000017").skippedLines).toBe(0);
  });

  it("flags a space-separated line, which is what drives the warning", () => {
    // Commas are the separator the card advertises. A space-separated paste
    // parses to nothing, and used to do so in silence.
    const out = parseUpload("1200000088 1200000017");
    expect(out.upcs).toEqual([]);
    expect(out.skippedLines).toBe(1);
  });

  it("flags a semicolon-separated line the same way", () => {
    const out = parseUpload("1200000088; 1200000017");
    expect(out.upcs).toEqual([]);
    expect(out.skippedLines).toBe(1);
  });

  it("counts only the bad lines in a partly-good paste", () => {
    const out = parseUpload(`1200000088, 1200000017
4011 4225
7203096070`);
    expect(out.upcs).toEqual(["1200000088", "1200000017", "7203096070"]);
    expect(out.skippedLines).toBe(1);
  });

  it("does not count blank lines or the department header", () => {
    const csv = [
      "Sub Department,UPC,Description,Sales",
      "",
      'Grocery,1200000088,"COKE 12PK",123.45',
    ].join(`
`);
    expect(parseUpload(csv).skippedLines).toBe(0);
  });
});
