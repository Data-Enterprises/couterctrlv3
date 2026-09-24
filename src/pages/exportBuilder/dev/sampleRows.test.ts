import { describe, expect, it } from "vitest";
import { filterSampleRows, type RowFilters } from "./sampleRows";
import type { ExportRow } from "../../../api/salesExport";

// refund_flag carries 2 and 9 as well as 1 in the real table, which is why
// row 4 is marked with a 2: an equality test on 1 would miss it.
const rows: ExportRow[] = [
  { sale_id: 1, sale_type: "Sale", item_ring_type: "ITEM", sub_department: 10, vendor_id: "50", cashier_number: 7, sale_date: "2026-09-14T08:12:00", product_code: "1200000088", product_description: "WHOLE MILK GAL", void_flag: 0, refund_flag: 0 },
  { sale_id: 2, sale_type: "Tender", item_ring_type: "TENDER", sub_department: 10, vendor_id: "50", cashier_number: 7, sale_date: "2026-09-15T11:40:00", product_code: "2100004411", product_description: null, void_flag: 0, refund_flag: null },
  { sale_id: 3, sale_type: "Voided", item_ring_type: "ITEM", sub_department: 20, vendor_id: "C0021", cashier_number: 12, sale_date: "2026-09-15T19:05:00", product_code: "0490000112.0", product_description: "MILK 2% 1/2GAL", void_flag: 1, refund_flag: 0 },
  { sale_id: 4, sale_type: "sale", item_ring_type: "WIC", sub_department: 20, vendor_id: "F0007", cashier_number: 12, sale_date: "2026-09-16T07:30:00", product_code: "7770001234", product_description: "BREAD WHITE", void_flag: null, refund_flag: 2 },
];

const all: RowFilters = {
  saleTypes: ["Sale", "Tender", "Voided"],
  ringTypes: ["ITEM", "TENDER", "WIC"],
  subDepartments: ["10", "20"],
  vendors: ["50", "C0021", "F0007"],
  cashiers: [7, 12],
  priceTypes: [],
  saleDates: ["2026-09-14", "2026-09-15", "2026-09-16"],
  productCodes: [],
  productDescriptions: [],
  voidFlag: null,
  refundFlag: null,
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

  it("matches ring type and vendor as stored, which is what the endpoint does", () => {
    // sale_type is lower-cased on both sides by the endpoint; the other three
    // are compared as they are. Folding them here would show rows the file
    // will not contain.
    expect(filterSampleRows(rows, { ...all, ringTypes: ["item"] })).toEqual([]);
    expect(filterSampleRows(rows, { ...all, vendors: ["f0007"] })).toEqual([]);
  });

  it("narrows by cashier", () => {
    expect(ids(filterSampleRows(rows, { ...all, cashiers: [12] }))).toEqual([3, 4]);
  });

  it("narrows to particular days inside the range", () => {
    // The point of the day list: particular days rather than everything
    // between them. sale_date is a timestamp, so only its day is compared.
    expect(
      ids(filterSampleRows(rows, { ...all, saleDates: ["2026-09-15"] })),
    ).toEqual([2, 3]);
  });

  it("drops voided lines when the flag excludes them, null flags included", () => {
    expect(ids(filterSampleRows(rows, { ...all, voidFlag: 0 }))).toEqual([1, 2, 4]);
  });

  it("keeps only voided lines when the flag asks for them", () => {
    expect(ids(filterSampleRows(rows, { ...all, voidFlag: 1 }))).toEqual([3]);
  });

  it("counts any refund marker, not just a literal 1", () => {
    // The column holds 1, 2 and 9, with 2 the most common. `refund_flag = 1`
    // is why a store with eighteen refunds reported none.
    expect(ids(filterSampleRows(rows, { ...all, refundFlag: 1 }))).toEqual([4]);
    expect(ids(filterSampleRows(rows, { ...all, refundFlag: 0 }))).toEqual([
      1, 2, 3,
    ]);
  });

  it("narrows to the product codes given, and to all of them when none are", () => {
    expect(ids(filterSampleRows(rows, { ...all, productCodes: [] }))).toEqual([
      1, 2, 3, 4,
    ]);
    expect(
      ids(filterSampleRows(rows, { ...all, productCodes: ["1200000088"] })),
    ).toEqual([1]);
  });

  it("finds a description anywhere in it, whatever the case", () => {
    // Descriptions are written the way a till writes them, so a contains is
    // the only match anyone can use — and a blank description is not a match.
    expect(
      ids(filterSampleRows(rows, { ...all, productDescriptions: ["milk"] })),
    ).toEqual([1, 3]);
    expect(
      ids(filterSampleRows(rows, { ...all, productDescriptions: ["BREAD", "whole"] })),
    ).toEqual([1, 4]);
  });

  it("narrows by code and description together, not either one", () => {
    expect(
      ids(
        filterSampleRows(rows, {
          ...all,
          productCodes: ["1200000088"],
          productDescriptions: ["bread"],
        }),
      ),
    ).toEqual([]);
  });

  it("matches a code the table stored with a trailing .0", () => {
    expect(
      ids(filterSampleRows(rows, { ...all, productCodes: ["0490000112"] })),
    ).toEqual([3]);
  });

  it("keeps a row whose value the response never offered", () => {
    const odd: ExportRow[] = [{ sale_id: 9, sale_type: "", item_ring_type: "", sub_department: "", vendor_id: "", cashier_number: null, sale_date: "", product_code: "1", void_flag: 0, refund_flag: 0 }];
    expect(filterSampleRows(odd, all)).toHaveLength(1);
  });

  it("shows nothing when every sale type is unticked", () => {
    expect(filterSampleRows(rows, { ...all, saleTypes: [] })).toEqual([]);
  });
});
