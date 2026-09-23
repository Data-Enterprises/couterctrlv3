import { describe, expect, it } from "vitest";
import { filterSampleRows } from "./sampleRows";

const rows = [
  { sale_id: 1, sale_type: "Sale", void_flag: 0 },
  { sale_id: 2, sale_type: "Tender", void_flag: 0 },
  { sale_id: 3, sale_type: "Voided", void_flag: 1 },
  { sale_id: 4, sale_type: "sale", void_flag: null },
];

describe("the sample rows a preview shows", () => {
  it("drops a row type that has been unticked", () => {
    // The bug this covers: unticking Tender left tender lines on screen, in a
    // preview of a file that would not have them.
    const kept = filterSampleRows(rows, ["Sale", "Voided"], false);
    expect(kept.map((r) => r.sale_id)).toEqual([1, 3, 4]);
  });

  it("matches sale types case-insensitively, as the endpoint does", () => {
    const kept = filterSampleRows(rows, ["SALE"], false);
    expect(kept.map((r) => r.sale_id)).toEqual([1, 4]);
  });

  it("drops voided lines when the switch is on, null flags included", () => {
    const kept = filterSampleRows(rows, ["Sale", "Tender", "Voided"], true);
    expect(kept.map((r) => r.sale_id)).toEqual([1, 2, 4]);
  });

  it("keeps a row whose type the response never offered", () => {
    const odd = [{ sale_id: 9, sale_type: "", void_flag: 0 }];
    expect(filterSampleRows(odd, ["Sale"], false)).toHaveLength(1);
  });

  it("shows nothing when every type is unticked", () => {
    expect(filterSampleRows(rows, [], false)).toEqual([]);
  });
});
