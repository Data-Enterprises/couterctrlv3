import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupStore } from "../../../store";
import {
  addAggregate,
  setConfig,
  toggleGroupBy,
} from "../../../features/dev/devExportBuilderSlice";
import ExportBar from "./ExportBar";

vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: () => {},
    success: () => {},
    info: () => {},
    warning: () => {},
    warn: () => {},
  }),
}));

const renderBar = (setup: (dispatch: (a: unknown) => void) => void) => {
  const store = setupStore();
  const dispatch = store.dispatch as unknown as (a: unknown) => void;
  dispatch(
    setConfig({
      stores: [{ storeid: 36, store_number: "036", store_name: "036 - IGA" }],
      saleTypes: ["Sale"],
      itemRingTypes: ["ITEM"],
      subDepartments: [],
      vendors: [],
      cashiers: [],
      priceTypes: [],
      dateFormats: [],
      saleDates: [],
      columns: [
        { name: "storeid", data_type: "bigint" },
        { name: "total_sales", data_type: "numeric" },
      ],
      rows: [],
      hasData: true,
      message: null,
    }),
  );
  setup(dispatch);
  return render(
    <Provider store={store}>
      <ExportBar />
    </Provider>,
  );
};

const buildButton = () =>
  screen.getByRole("button", { name: "Build export" }) as HTMLButtonElement;

describe("a summary the endpoint would refuse", () => {
  it("will not send one with no keys", () => {
    // A measure alone makes it a summary, and a summary needs a key.
    renderBar((dispatch) =>
      dispatch(addAggregate({ column: "*", fn: "count" })),
    );
    expect(screen.getByText(/at least one column to group by/)).toBeTruthy();
    expect(buildButton().disabled).toBe(true);
  });

  it("will not send one with no measures", () => {
    renderBar((dispatch) => dispatch(toggleGroupBy("storeid")));
    expect(screen.getByText(/at least one measure/)).toBeTruthy();
    expect(buildButton().disabled).toBe(true);
  });

  it("will not send two measures that would share a column name", () => {
    // The endpoint answers 400 for a duplicate output column, which is a
    // wasted round trip for something visible here.
    renderBar((dispatch) => {
      dispatch(toggleGroupBy("storeid"));
      dispatch(addAggregate({ column: "total_sales", fn: "sum" }));
      dispatch(addAggregate({ column: "total_sales", fn: "sum" }));
    });
    expect(screen.getByText(/both be written as total_sales_sum/)).toBeTruthy();
    expect(buildButton().disabled).toBe(true);
  });

  it("will not let a measure take a group key's name", () => {
    // Grouping by qty and also asking for qty_sum is fine; grouping by
    // total_sales_sum is not a thing anyone does, but the endpoint counts the
    // keys as taken and so does this.
    renderBar((dispatch) => {
      dispatch(toggleGroupBy("total_sales_sum"));
      dispatch(addAggregate({ column: "total_sales", fn: "sum" }));
    });
    expect(screen.getByText(/both be written as total_sales_sum/)).toBeTruthy();
  });

  it("sends a summary that answers both halves", () => {
    renderBar((dispatch) => {
      dispatch(toggleGroupBy("storeid"));
      dispatch(addAggregate({ column: "*", fn: "count" }));
    });
    expect(buildButton().disabled).toBe(false);
    expect(screen.getByText(/grouped by storeid/)).toBeTruthy();
    expect(screen.getByText("row_count")).toBeTruthy();
  });
});
