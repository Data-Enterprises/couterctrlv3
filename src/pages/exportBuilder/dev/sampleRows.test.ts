import { describe, expect, it } from "vitest";
import { filterSampleRows, type RowFilters } from "./sampleRows";
import type { ExportRow } from "../../../api/salesExport";

const rows: ExportRow[] = [
  { sale_id: 1, sale_type: "Sale", item_ring_type: "ITEM", sub_department: "10", vendor_id: "50", void_flag: 0 },
  { sale_id: 2, sale_type: "Tender", item_ring_type: "TENDER", sub_department: "10", vendor_id: "50", void_flag: 0 },
  { sale_id: 3, sale_type: "Voided", item_ring_type: "ITEM", sub_department: "20", vendor_id: "C0021", void_flag: 1 },
  { sale_id: 4, sale_type: "sale", item_ring_type: "WIC", sub_department: "20", vendor_id: "F0007", void_flag: null },
];

const all: RowFilters = {
  saleTypes: ["Sale", "Tender", "Voided"],
  ringTypes: ["ITEM", "TENDER", "WIC"],
  subDepartments: ["10", "20"],
  vendors: ["50", "C0021", "F0007"],
  excludeVoids: false,
};

const ids = (rs: ExportRow[]) => rs.map((r) => r.sale_id);

describe("the sample rows a preview shows", () => {
  it("keeps everything when nothing has been narrowed", () => {
    expect(ids(filterSampleRows(rows, all))).toEqual([1, 2, 3, 4]);
  });

  it("drops a sale type that has been unticked", () => {
    // The bug this covers: unticking Tender left tender lines on screen, in a
    // preview of a file that would not have them.
    const kept = filterSampleRows(rows, { ...all, saleTypes: ["Sale", "Voided"] });
    expect(ids(kept)).toEqual([1, 3, 4]);
  });

  it("matches case-insensitively, as the endpoint does", () => {
    expect(ids(filterSampleRows(rows, { ...all, saleTypes: ["SALE"] }))).toEqual([1, 4]);
  });

  it("narrows by ring type, sub department and vendor", () => {
    expect(ids(filterSampleRows(rows, { ...all, ringTypes: ["ITEM"] }))).toEqual([1, 3]);
    expect(ids(filterSampleRows(rows, { ...all, subDepartments: ["20"] }))).toEqual([3, 4]);
    expect(ids(filterSampleRows(rows, { ...all, vendors: ["50"] }))).toEqual([1, 2]);
  });

  it("drops voided lines when the switch is on, null flags included", () => {
    expect(ids(filterSampleRows(rows, { ...all, excludeVoids: true }))).toEqual([1, 2, 4]);
  });

  it("keeps a row whose value the response never offered", () => {
    const odd: ExportRow[] = [{ sale_id: 9, sale_type: "", item_ring_type: "", sub_department: "", vendor_id: "", void_flag: 0 }];
    expect(filterSampleRows(odd, all)).toHaveLength(1);
  });

  it("shows nothing when every sale type is unticked", () => {
    expect(filterSampleRows(rows, { ...all, saleTypes: [] })).toEqual([]);
  });
});
