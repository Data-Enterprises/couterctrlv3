import { describe, expect, it } from "vitest";
import reducer, {
  initialState,
  moveColumn,
  setConfig,
  setFlag,
  toggleColumn,
} from "./devExportBuilderSlice";

const columns = ["sale_id", "sale_date", "qty", "price"].map((name) => ({
  name,
  data_type: "text",
}));

const loaded = () =>
  reducer(
    initialState,
    setConfig({
      stores: [{ storeid: 1, store_number: "945", store_name: "BG" }],
      saleTypes: ["Sale", "Refunded"],
      itemRingTypes: ["ITEM"],
      subDepartments: [{ sub_department: "10", sub_department_description: "Grocery" }],
      vendors: [{ vendor_id: "50", vendor_name: "AWG" }],
      cashiers: [
        { cashier_number: 7, cashier_name: "D HALL" },
        { cashier_number: 12, cashier_name: null },
      ],
      saleDates: ["2026-09-14", "2026-09-15"],
      columns,
      rows: [],
      hasData: true,
      message: null,
    }),
  );

/** What the file will hold: the order, narrowed to what is ticked. */
const fileColumns = (s: ReturnType<typeof loaded>) =>
  s.columnOrder.filter((n) => s.selectedColumns.includes(n));

describe("the export config", () => {
  it("arrives with everything selected, in the order it came back", () => {
    const s = loaded();
    expect(s.columnOrder).toEqual(["sale_id", "sale_date", "qty", "price"]);
    expect(s.selectedColumns).toEqual(s.columnOrder);
    expect(s.selectedSaleTypes).toEqual(["Sale", "Refunded"]);
    expect(s.selectedRingTypes).toEqual(["ITEM"]);
    expect(s.selectedSubDepartments).toEqual(["10"]);
    expect(s.selectedVendors).toEqual(["50"]);
    expect(s.selectedCashiers).toEqual([7, 12]);
    expect(s.selectedSaleDates).toEqual(["2026-09-14", "2026-09-15"]);
    expect(s.selectedStoreIds).toEqual([1]);
  });
});

describe("the output switches", () => {
  it("changes the one that was sent and leaves the rest alone", () => {
    const s = reducer(loaded(), setFlag({ voidFlag: 1 }));
    expect(s.flags.voidFlag).toBe(1);
    expect(s.flags.refundFlag).toBeNull();
    expect(s.flags.fileFormat).toBe("csv");
    expect(s.flags.filePrefix).toBe("sales");
  });

  it("can put a flag back to leaving the column alone", () => {
    const off = reducer(loaded(), setFlag({ refundFlag: 0 }));
    expect(reducer(off, setFlag({ refundFlag: null })).flags.refundFlag).toBeNull();
  });
});

describe("lists that come back as distinct pairs", () => {
  const withDuplicates = () =>
    reducer(
      initialState,
      setConfig({
        stores: [],
        saleTypes: [],
        itemRingTypes: [],
        // Real data: stores disagree about what a number is called, and the
        // endpoint's DISTINCT is over the pair, so the number repeats.
        subDepartments: [
          { sub_department: 5, sub_department_description: "Cigarettes" },
          { sub_department: 5, sub_department_description: "Tobacco" },
          { sub_department: 30, sub_department_description: "Beer" },
          { sub_department: 30, sub_department_description: "Money Orders" },
          { sub_department: 45, sub_department_description: "Soft Drinks" },
        ],
        vendors: [
          { vendor_id: "50", vendor_name: "AWG" },
          { vendor_id: "50", vendor_name: "Associated Wholesale" },
          { vendor_id: "148", vendor_name: null },
        ],
        cashiers: [],
        saleDates: [],
        columns,
        rows: [],
        hasData: true,
        message: null,
      }),
    );

  it("keeps one row per sub department number, naming both", () => {
    const s = withDuplicates();
    expect(s.subDepartments).toEqual([
      { sub_department: "5", sub_department_description: "Cigarettes / Tobacco" },
      { sub_department: "30", sub_department_description: "Beer / Money Orders" },
      { sub_department: "45", sub_department_description: "Soft Drinks" },
    ]);
    // One tick per number, not per name.
    expect(s.selectedSubDepartments).toEqual(["5", "30", "45"]);
  });

  it("keeps one row per vendor id, and leaves a nameless one nameless", () => {
    const s = withDuplicates();
    expect(s.vendors).toEqual([
      { vendor_id: "50", vendor_name: "AWG / Associated Wholesale" },
      { vendor_id: "148", vendor_name: null },
    ]);
    expect(s.selectedVendors).toEqual(["50", "148"]);
  });
});

describe("reordering columns", () => {
  it("moves a column to the slot it was dropped on", () => {
    const s = reducer(loaded(), moveColumn({ name: "price", to: 0 }));
    expect(s.columnOrder).toEqual(["price", "sale_id", "sale_date", "qty"]);
  });

  it("moves one rightwards without losing the columns it passed", () => {
    const s = reducer(loaded(), moveColumn({ name: "sale_id", to: 2 }));
    expect(s.columnOrder).toEqual(["sale_date", "qty", "sale_id", "price"]);
  });

  it("leaves the order alone when a column is unticked and ticked again", () => {
    // The failure this guards: selection deciding position, so hiding a column
    // and bringing it back sent it to the end of the file.
    let s = reducer(loaded(), moveColumn({ name: "price", to: 0 }));
    s = reducer(s, toggleColumn("sale_date"));
    expect(fileColumns(s)).toEqual(["price", "sale_id", "qty"]);
    s = reducer(s, toggleColumn("sale_date"));
    expect(fileColumns(s)).toEqual(["price", "sale_id", "sale_date", "qty"]);
  });

  it("ignores a move for a column it does not have", () => {
    const s = reducer(loaded(), moveColumn({ name: "nope", to: 0 }));
    expect(s.columnOrder).toEqual(["sale_id", "sale_date", "qty", "price"]);
  });
});
