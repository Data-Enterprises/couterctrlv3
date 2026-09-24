import { describe, expect, it } from "vitest";
import reducer, {
  clearSelections,
  dismissBuild,
  finishExport,
  relabelBuild,
  setBuilds,
  initialState,
  moveColumn,
  setConfig,
  setFlag,
  setProductCodes,
  toggleColumn,
  toggleSaleType,
} from "./devExportBuilderSlice";
import type { ExportBuild } from "../../api/exportBuilds";

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
      priceTypes: [],
      dateFormats: [],
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
        priceTypes: [],
        dateFormats: [],
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

describe("a build that has just finished", () => {
  const built = (over: Partial<Parameters<typeof finishExport>[0]> = {}) => ({
    files: [{ key: "sales/517/b1/sales.csv", bytes: 1024, url: "https://s3/b1" }],
    rowsUploaded: 978,
    elapsedSeconds: 0.9,
    urlExpiresInMinutes: 60,
    buildId: "sales_2026-09-13_2026-09-21_20260924_183012",
    userQueryId: 30,
    userQueryName: "Shrink by vendor",
    manifestWritten: true,
    ...over,
  });

  it("keeps what names it later", () => {
    const s = reducer(loaded(), finishExport(built()));
    expect(s.buildId).toBe("sales_2026-09-13_2026-09-21_20260924_183012");
    expect(s.builtQueryName).toBe("Shrink by vendor");
    expect(s.manifestWritten).toBe(true);
  });

  it("notices a build that will not list", () => {
    // The file is there and its manifest is not, so the link in hand is the
    // only way back to it — worth saying rather than swallowing.
    const s = reducer(loaded(), finishExport(built({ manifestWritten: false })));
    expect(s.manifestWritten).toBe(false);
  });

  it("puts the bar back without touching the list", () => {
    const after = reducer(
      reducer(loaded(), finishExport(built())),
      dismissBuild(),
    );
    expect(after.files).toEqual([]);
    // The builds list is the server's, not a shelf this page keeps.
    expect(after.builds).toEqual([]);
  });
});

describe("the list of past builds", () => {
  const build = (over: Partial<ExportBuild> = {}): ExportBuild => ({
    buildId: "b1",
    createdAt: "2026-09-24T18:30:12.190345+00:00",
    startDate: "2026-09-13",
    endDate: "2026-09-21",
    storeids: [100080],
    storeCount: 1,
    userQueryId: null,
    userQueryName: null,
    rowsUploaded: 91432,
    bytesUploaded: 38014192,
    elapsedSeconds: 12.4,
    fileFormat: "csv",
    request: {},
    expired: false,
    files: [],
    ...over,
  });

  it("takes the link window from the listing that minted the links", () => {
    const s = reducer(
      initialState,
      setBuilds({ builds: [build()], expireMinutes: 15 }),
    );
    expect(s.buildsExpireMinutes).toBe(15);
  });

  it("relabels one build and leaves the others alone", () => {
    const listed = reducer(
      initialState,
      setBuilds({
        builds: [build({ buildId: "b1" }), build({ buildId: "b2" })],
        expireMinutes: 60,
      }),
    );
    const named = reducer(
      listed,
      relabelBuild({ buildId: "b2", userQueryId: 30, userQueryName: "Shrink" }),
    );
    expect(named.builds[0].userQueryName).toBeNull();
    expect(named.builds[1].userQueryName).toBe("Shrink");
  });

  it("renames the build on screen when that is the one relabelled", () => {
    const after = reducer(
      reducer(
        loaded(),
        finishExport({
          files: [],
          rowsUploaded: 1,
          elapsedSeconds: 1,
          urlExpiresInMinutes: 60,
          buildId: "b9",
          userQueryId: null,
          userQueryName: null,
          manifestWritten: true,
        }),
      ),
      relabelBuild({ buildId: "b9", userQueryId: 4, userQueryName: "Monthly" }),
    );
    expect(after.builtQueryName).toBe("Monthly");
  });
});

describe("clearing the picks", () => {
  it("puts every list back to all of it and empties what was typed", () => {
    const narrowed = reducer(
      reducer(reducer(loaded(), toggleSaleType("Sale")), setProductCodes(["12"])),
      setFlag({ voidFlag: 1 }),
    );
    expect(narrowed.selectedSaleTypes).toEqual(["Refunded"]);

    const cleared = reducer(narrowed, clearSelections());
    expect(cleared.selectedSaleTypes).toEqual(["Sale", "Refunded"]);
    expect(cleared.productCodes).toEqual([]);
    expect(cleared.flags.voidFlag).toBeNull();
    expect(cleared.groupBy).toEqual([]);
  });

  it("leaves the loaded range alone, unlike a new search", () => {
    // The magnifier is the one that throws the scope away; this is for asking
    // a different question of the same data.
    const cleared = reducer(loaded(), clearSelections());
    expect(cleared.stores).toHaveLength(1);
    expect(cleared.columns).toHaveLength(4);
    expect(cleared.loaded).toBe(true);
  });
});
