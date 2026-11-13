import { describe, expect, it } from "vitest";
import reducer, {
  clearSavedNotes,
  clearSelections,
  markSavedLoaded,
  dismissBuild,
  finishExport,
  relabelBuild,
  setBuilds,
  setSaved,
  stashSource,
  restoreSource,
  setSearchSource,
  startConfigLoad,
  initialState,
  moveColumn,
  setConfig,
  failConfigLoad,
  setFlag,
  setProductCodes,
  setRowFlag,
  toggleColumn,
  togglePick,
  upsertSaved,
  removeSaved,
  failSavedWork,
  failQueriesLoad,
  startSavedWork,
  startBuildsLoad,
  failBuildsLoad,
} from "@/features/dev/devExportBuilderSlice";
import type { ExportBuild } from "@/api/exportBuilds";
import type { SavedConfig } from "@/api/savedConfigs";
import { SALES } from "@/pages/exportBuilder/dev/sources";

/** A preview's facets, turned into the slice's lists the way the page does. */
const salesLists = (facets: Record<string, unknown>) =>
  Object.fromEntries(SALES.lists.map((l) => [l.filter, l.toItems(facets[l.facet])]));

const columns = ["sale_id", "sale_date", "qty", "price"].map((name) => ({
  name,
  data_type: "text",
}));

const configPayload = () => ({
      source: "sales" as const,
      stores: [{ storeid: 1, store_number: "945", store_name: "BG" }],
      lists: salesLists({
        saleTypes: ["Sale", "Refunded"],
        itemRingTypes: ["ITEM"],
        subDepartments: [{ sub_department: "10", sub_department_description: "Grocery" }],
        vendors: [{ vendor_id: "50", vendor_name: "AWG" }],
        cashiers: [
          { cashier_number: 7, cashier_name: "D HALL" },
          { cashier_number: 12, cashier_name: null },
        ],
        priceTypes: [],
      }),
      dateFormats: [],
      days: ["2026-09-14", "2026-09-15"],
      columns,
      rows: [],
      hasData: true,
      message: null,
});

const loaded = () => reducer(initialState, setConfig(configPayload()));

/** What the file will hold: the order, narrowed to what is ticked. */
const fileColumns = (s: ReturnType<typeof loaded>) =>
  s.columnOrder.filter((n) => s.selectedColumns.includes(n));

describe("the export config", () => {
  it("arrives with everything selected, in the order it came back", () => {
    const s = loaded();
    expect(s.columnOrder).toEqual(["sale_id", "sale_date", "qty", "price"]);
    expect(s.selectedColumns).toEqual(s.columnOrder);
    expect(s.picks.saleTypes).toEqual(["Sale", "Refunded"]);
    expect(s.picks.itemRingTypes).toEqual(["ITEM"]);
    expect(s.picks.subDepartments).toEqual(["10"]);
    expect(s.picks.vendorIds).toEqual(["50"]);
    // Held as strings; they become numbers on the way out.
    expect(s.picks.cashierNumbers).toEqual(["7", "12"]);
    expect(s.selectedDays).toEqual(["2026-09-14", "2026-09-15"]);
    expect(s.selectedStoreIds).toEqual([1]);
  });
});

describe("the output switches", () => {
  it("changes the one that was sent and leaves the rest alone", () => {
    const s = reducer(loaded(), setRowFlag({ filter: "voidFlag", value: 1 }));
    expect(s.rowFlags.voidFlag).toBe(1);
    expect(s.rowFlags.refundFlag ?? null).toBeNull();
    expect(s.flags.fileFormat).toBe("csv");
    // Empty is the table's own name, so no source can inherit another's.
    expect(s.flags.filePrefix).toBe("");
  });

  it("can put a flag back to leaving the column alone", () => {
    const off = reducer(loaded(), setRowFlag({ filter: "refundFlag", value: 0 }));
    expect(
      reducer(off, setRowFlag({ filter: "refundFlag", value: null })).rowFlags.refundFlag,
    ).toBeNull();
  });

  it("leaves the row switches alone when a file setting changes", () => {
    const on = reducer(loaded(), setRowFlag({ filter: "voidFlag", value: 0 }));
    expect(reducer(on, setFlag({ fileFormat: "text" })).rowFlags.voidFlag).toBe(0);
  });
});

describe("lists that come back as distinct pairs", () => {
  // Real data: stores disagree about what a number is called, and the
  // endpoint's DISTINCT is over the pair, so the number repeats.
  const lists = () =>
    salesLists({
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
        // A name with no id: nothing can filter on it.
        { vendor_id: null, vendor_name: "DSD RETURNS" },
      ],
      cashiers: [
        { cashier_number: 7, cashier_name: "D HALL" },
        { cashier_number: null, cashier_name: "TRAINING" },
      ],
    });
  const withDuplicates = () =>
    reducer(initialState, setConfig({ ...configPayload(), lists: lists() }));

  it("keeps one row per sub department number, naming both", () => {
    const s = withDuplicates();
    expect(s.lists.subDepartments).toEqual([
      { value: "5", label: "Cigarettes / Tobacco" },
      { value: "30", label: "Beer / Money Orders" },
      { value: "45", label: "Soft Drinks" },
    ]);
    // One tick per number, not per name.
    expect(s.picks.subDepartments).toEqual(["5", "30", "45"]);
  });

  it("keeps one row per vendor id, and leaves a nameless one nameless", () => {
    const s = withDuplicates();
    expect(s.lists.vendorIds).toEqual([
      { value: "50", label: "AWG / Associated Wholesale" },
      { value: "148", label: "" },
    ]);
    expect(s.picks.vendorIds).toEqual(["50", "148"]);
  });

  it("leaves out a vendor or cashier with no id, which no filter can pick", () => {
    const s = withDuplicates();
    expect(s.lists.vendorIds.map((v) => v.value)).not.toContain("null");
    expect(s.lists.cashierNumbers).toEqual([{ value: "7", label: "D HALL" }]);
    expect(s.picks.cashierNumbers).toEqual(["7"]);
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
    request: '{"storeids":[36]}',
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
      setBuilds({ source: "sales", builds: [build()], expireMinutes: 15 }),
    );
    expect(s.buildsExpireMinutes).toBe(15);
  });

  it("relabels one build and leaves the others alone", () => {
    const listed = reducer(
      initialState,
      setBuilds({
        source: "sales",
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
          request: "{}",
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
      reducer(
        reducer(loaded(), togglePick({ filter: "saleTypes", value: "Sale" })),
        setProductCodes(["12"]),
      ),
      setRowFlag({ filter: "voidFlag", value: 1 }),
    );
    expect(narrowed.picks.saleTypes).toEqual(["Refunded"]);

    const cleared = reducer(narrowed, clearSelections());
    expect(cleared.picks.saleTypes).toEqual(["Sale", "Refunded"]);
    expect(cleared.productCodes).toEqual([]);
    expect(cleared.rowFlags.voidFlag ?? null).toBeNull();
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

describe("what a load could not carry over", () => {
  const withNotes = () =>
    reducer(
      loaded(),
      markSavedLoaded({ id: null, notes: ["Loaded from the build of 2026-10-01 to 2026-10-07."] }),
    );

  it("stays until it is dismissed", () => {
    expect(withNotes().savedNotes).toHaveLength(1);
    expect(reducer(withNotes(), clearSavedNotes()).savedNotes).toEqual([]);
  });

  it("goes with the scope it was about", () => {
    const fresh = reducer(withNotes(), setConfig({ ...configPayload() }));
    expect(fresh.savedNotes).toEqual([]);
  });
});

describe("switching sources", () => {
  const SCOPE = "store:1:2026-09-14:2026-09-15";
  /** Sales loaded for SCOPE, a vendor narrowed and a key grouped. */
  const salesOnScreen = () => {
    let s = reducer(initialState, startConfigLoad({ source: "sales", scope: SCOPE, startDate: "2026-09-14", endDate: "2026-09-15" }));
    s = reducer(s, setConfig(configPayload()));
    s = reducer(s, togglePick({ filter: "vendorIds", value: "50" }));
    return s;
  };
  const orders = () => ({
    ...configPayload(),
    source: "orders" as const,
    lists: { orderTypes: [{ value: "INV", label: "INV" }] },
  });

  it("keeps the source on screen when a search asks for another", () => {
    const s = reducer(salesOnScreen(), stashSource());
    expect(s.loaded).toBe(true);
    expect(s.cache.sales?.picks.vendorIds).toEqual([]);
  });

  it("goes back to the card while the next answer is on its way", () => {
    let s = reducer(salesOnScreen(), stashSource());
    s = reducer(s, startConfigLoad({ source: "orders", scope: SCOPE, startDate: "2026-09-14", endDate: "2026-09-15" }));
    expect(s.loaded).toBe(false);
    expect(s.loadingConfig).toBe(true);
  });

  it("records the dates the search asked for", () => {
    const s = reducer(
      initialState,
      startConfigLoad({ source: "sales", scope: SCOPE, startDate: "2026-09-14", endDate: "2026-09-20" }),
    );
    expect([s.rangeStart, s.rangeEnd]).toEqual(["2026-09-14", "2026-09-20"]);
  });

  it("starts another source from nothing, and keeps the first", () => {
    let s = reducer(salesOnScreen(), stashSource());
    s = reducer(s, setSearchSource("orders"));
    s = reducer(s, startConfigLoad({ source: "orders", scope: SCOPE, startDate: "2026-09-14", endDate: "2026-09-15" }));
    expect(s.source).toBe("orders");
    expect(s.picks).toEqual({});
    expect(s.cache.sales).toBeDefined();
    s = reducer(s, setConfig(orders()));
    expect(s.picks.orderTypes).toEqual(["INV"]);
  });

  it("brings a kept source back as it was left", () => {
    let s = reducer(salesOnScreen(), stashSource());
    s = reducer(s, startConfigLoad({ source: "orders", scope: SCOPE, startDate: "2026-09-14", endDate: "2026-09-15" }));
    s = reducer(s, setConfig(orders()));
    s = reducer(s, stashSource());
    s = reducer(s, restoreSource("sales"));
    expect(s.loaded).toBe(true);
    expect(s.source).toBe("sales");
    expect(s.picks.vendorIds).toEqual([]);
    expect(s.picks.saleTypes).toEqual(["Sale", "Refunded"]);
    // Orders is kept in its turn.
    expect(s.cache.orders?.picks.orderTypes).toEqual(["INV"]);
    expect(s.cache.sales).toBeUndefined();
  });

  it("drops every kept source on a new search", () => {
    let s = reducer(salesOnScreen(), stashSource());
    s = reducer(s, startConfigLoad({ source: "orders", scope: "store:1:2026-09-21:2026-09-22", startDate: "2026-09-14", endDate: "2026-09-15" }));
    expect(s.cache).toEqual({});
  });

  it("keeps the shape of the same source over a new range", () => {
    let s = reducer(salesOnScreen(), setFlag({ ordered: true }));
    s = reducer(s, stashSource());
    s = reducer(s, startConfigLoad({ source: "sales", scope: "store:1:2026-09-21:2026-09-22", startDate: "2026-09-14", endDate: "2026-09-15" }));
    expect(s.flags.ordered).toBe(true);
  });

  it("puts the page back when a search for new dates fails", () => {
    let s = reducer(salesOnScreen(), setFlag({ ordered: true }));
    s = reducer(s, stashSource());
    s = reducer(s, startConfigLoad({ source: "sales", scope: "store:1:2026-09-21:2026-09-22", startDate: "2026-09-21", endDate: "2026-09-22" }));
    expect(s.loaded).toBe(false);
    s = reducer(s, failConfigLoad());
    expect(s.loaded).toBe(true);
    expect(s.source).toBe("sales");
    expect(s.picks.vendorIds).toEqual([]);
    expect(s.flags.ordered).toBe(true);
    expect([s.cacheScope, s.rangeStart, s.rangeEnd]).toEqual([SCOPE, "2026-09-14", "2026-09-15"]);
    expect(s.cache.sales).toBeUndefined();
    expect(s.prior).toBeNull();
  });

  it("puts the page back, and keeps the others, when another table fails", () => {
    let s = reducer(salesOnScreen(), stashSource());
    s = reducer(s, startConfigLoad({ source: "orders", scope: SCOPE, startDate: "2026-09-14", endDate: "2026-09-15" }));
    s = reducer(s, setConfig(orders()));
    s = reducer(s, stashSource());
    s = reducer(s, setSearchSource("markdowns"));
    s = reducer(s, startConfigLoad({ source: "markdowns", scope: SCOPE, startDate: "2026-09-14", endDate: "2026-09-15" }));
    s = reducer(s, failConfigLoad());
    expect(s.source).toBe("orders");
    expect(s.searchSource).toBe("orders");
    expect(s.picks.orderTypes).toEqual(["INV"]);
    expect(s.cache.sales?.picks.vendorIds).toEqual([]);
    expect(s.cache.orders).toBeUndefined();
  });

  it("leaves the card up when the first search fails", () => {
    let s = reducer(initialState, startConfigLoad({ source: "sales", scope: SCOPE, startDate: "2026-09-14", endDate: "2026-09-15" }));
    s = reducer(s, failConfigLoad());
    expect(s.loaded).toBe(false);
    expect(s.loadingConfig).toBe(false);
  });

  it("lets go of the old page once the new answer lands", () => {
    let s = reducer(salesOnScreen(), stashSource());
    s = reducer(s, startConfigLoad({ source: "orders", scope: SCOPE, startDate: "2026-09-14", endDate: "2026-09-15" }));
    expect(s.prior?.source).toBe("sales");
    s = reducer(s, setConfig(orders()));
    expect(s.prior).toBeNull();
  });

  /** A saved export, as the list holds one. */
  const savedFor = (source: "sales" | "orders", id: number) =>
    ({ id, name: `#${id}`, payload: { source } }) as SavedConfig;

  it("files a save that lands after a switch nowhere but its own table", () => {
    let s = reducer(salesOnScreen(), stashSource());
    s = reducer(s, startConfigLoad({ source: "orders", scope: SCOPE, startDate: "2026-09-14", endDate: "2026-09-15" }));
    s = reducer(s, setConfig(orders()));
    s = reducer(s, upsertSaved(savedFor("sales", 3)));
    expect(s.saved).toEqual([]);
    expect(s.savedCurrentId).toBeNull();
    s = reducer(s, upsertSaved(savedFor("orders", 4)));
    expect(s.saved.map((c) => c.id)).toEqual([4]);
  });

  it("does not show one table's delete or failure on another", () => {
    let s = reducer(salesOnScreen(), setSaved({ source: "sales", saved: [savedFor("sales", 3)] }));
    s = reducer(s, removeSaved({ source: "orders", id: 3 }));
    expect(s.saved.map((c) => c.id)).toEqual([3]);
    s = reducer(s, failSavedWork({ source: "orders", message: "That did not delete." }));
    s = reducer(s, failQueriesLoad({ source: "orders", message: "That did not save." }));
    expect([s.savedError, s.queriesError]).toEqual([null, null]);
    s = reducer(s, removeSaved({ source: "sales", id: 3 }));
    expect(s.saved).toEqual([]);
  });

  it("reads a table's saved list again if it was left mid-call", () => {
    let s = reducer(salesOnScreen(), setSaved({ source: "sales", saved: [] }));
    s = reducer(s, startSavedWork());
    s = reducer(s, stashSource());
    s = reducer(s, startConfigLoad({ source: "orders", scope: SCOPE, startDate: "2026-09-14", endDate: "2026-09-15" }));
    s = reducer(s, setConfig(orders()));
    s = reducer(s, stashSource());
    s = reducer(s, restoreSource("sales"));
    expect(s.savedBusy).toBe(false);
    expect(s.savedLoaded).toBe(false);
  });

  it("does not leave Previous builds reading for another table's re-read", () => {
    let s = reducer(salesOnScreen(), stashSource());
    s = reducer(s, startConfigLoad({ source: "orders", scope: SCOPE, startDate: "2026-09-14", endDate: "2026-09-15" }));
    s = reducer(s, setConfig(orders()));
    s = reducer(s, setBuilds({ source: "orders", builds: [], expireMinutes: 60 }));
    // A Sales delete answering now re-reads Sales.
    s = reducer(s, startBuildsLoad({ source: "sales" }));
    expect(s.buildsLoading).toBe(false);
    s = reducer(s, failBuildsLoad({ source: "sales", message: "That build could not be deleted." }));
    expect(s.buildsError).toBeNull();
    s = reducer(s, startBuildsLoad({ source: "orders" }));
    expect(s.buildsLoading).toBe(true);
  });

  it("drops a list that answers for a source no longer on screen", () => {
    let s = reducer(salesOnScreen(), stashSource());
    s = reducer(s, startConfigLoad({ source: "orders", scope: SCOPE, startDate: "2026-09-14", endDate: "2026-09-15" }));
    s = reducer(s, setBuilds({ source: "sales", builds: [{} as ExportBuild], expireMinutes: 60 }));
    s = reducer(s, setSaved({ source: "sales", saved: [] }));
    expect(s.builds).toEqual([]);
    expect(s.savedLoaded).toBe(false);
  });

});
