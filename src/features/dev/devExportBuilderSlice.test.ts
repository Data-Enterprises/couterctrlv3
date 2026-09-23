import { describe, expect, it } from "vitest";
import reducer, {
  initialState,
  moveColumn,
  setConfig,
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
    expect(s.selectedStoreIds).toEqual([1]);
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
