import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { finishMarkdownsSearch, setMarkdownFilters, setMarkdowns } from "@/features/dev/devMarkdownsSlice";
import { setEndDate, setSelectedStore, setStartDate } from "@/features/searchSlice";
import Markdowns from "@/pages/markdowns/dev/Markdowns";

// Interfaces
import type { MarkdownItem } from "@/interfaces/markdowns";

vi.mock("@/api/markdowns", () => ({ getMarkdowns: vi.fn() }));
vi.mock("@/components/toasts/hooks/useToast", () => ({
  useToast: () => ({ warn: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }),
}));

const row = (over: Partial<MarkdownItem>): MarkdownItem => ({
  id: 1,
  storeid: 1301,
  storenumber: "301",
  storename: "Food Giant Hayti",
  userid: "jmartin",
  order_date: "2026-11-03T00:00:00",
  product_code: "0033383004012",
  original_price: 3.99,
  new_price: 2.99,
  markdown: 1,
  markdown_percent: 25.06,
  markdown_id: 88213,
  type: "Price",
  qty: 14,
  weight: null,
  retail: 41.86,
  description: "Strawberries 1lb",
  category: 12,
  category_description: "Fruit",
  sub_department: 5,
  sub_department_description: "Produce",
  case_size: 8,
  vendor_id: "V1021",
  vendor_name: "Driscoll",
  last_update_time: "2026-11-03T06:12:00",
  case_cost: 23.94,
  scalable: 0,
  ...over,
});

const rows = [
  row({ id: 1, description: "Strawberries 1lb", type: "Price", markdown_percent: 25 }),
  row({ id: 2, description: "Ground beef", type: "Waste", markdown_percent: 100, order_date: "2026-11-04T00:00:00" }),
  row({ id: 3, description: "Wheat bread", type: "Perc", markdown_percent: 10, order_date: "2026-11-05T00:00:00" }),
];

const setup = (seed = true) => {
  const store = setupStore();
  if (seed) store.dispatch(setMarkdowns(rows));
  const view = render(
    <Provider store={store}>
      <Markdowns />
    </Provider>,
  );
  return { store, view };
};

/** The descriptions in the grid, top to bottom. */
const gridOrder = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((tr) => within(tr).queryByText(/Strawberries|Ground beef|Wheat bread/)?.textContent);

describe("the Markdowns page", () => {
  it("shows the search card until markdowns are loaded", () => {
    setup(false);
    expect(screen.getByText("Select a store or group and date range to load its markdowns.")).toBeTruthy();
    expect(screen.queryByText("Configuration")).toBeNull();
  });

  it("shows the filters and every loaded markdown once loaded, dates dd/mm/yyyy", () => {
    setup();
    expect(screen.getByText("Configuration")).toBeTruthy();
    expect(screen.getByText("3 of 3 lines")).toBeTruthy();
    expect(gridOrder()).toEqual(["Strawberries 1lb", "Ground beef", "Wheat bread"]);
    expect(screen.getByText("04/11/2026")).toBeTruthy();
  });

  it("headings are plain names, without the sub department and category numbers", () => {
    setup();
    const headings = screen.getAllByRole("columnheader").map((th) => th.textContent);
    expect(headings.slice(0, 5)).toEqual(["Date", "Store", "Type", "UPC", "Description"]);
    expect(headings).toHaveLength(23);
    expect(headings).not.toContain("Sub Dept #");
    expect(headings).not.toContain("Category #");
  });

  it("shows the strip's figures for the rows on screen, and follows the filters", () => {
    const { store, view } = setup();
    const kpi = (label: string) => {
      const strip = view.container.querySelector<HTMLElement>('[data-help="kpis"]')!;
      return within(strip).getByText(label).nextElementSibling?.textContent;
    };
    // Each row: $1 off a unit, 14 units.
    expect(kpi("Markdowns")).toBe("3");
    expect(kpi("Items")).toBe("1");
    expect(kpi("Markdown $")).toBe("$42.00");
    expect(kpi("Waste $")).toBe("$14.00");
    act(() => {
      store.dispatch(setMarkdownFilters({ types: ["Price"] }));
    });
    expect(kpi("Markdowns")).toBe("1");
    expect(kpi("Waste $")).toBe("$0.00");
  });

  it("narrows the grid and the counts when a filter is set", () => {
    const { store } = setup();
    act(() => {
      store.dispatch(setMarkdownFilters({ types: ["Waste"] }));
    });
    expect(gridOrder()).toEqual(["Ground beef"]);
    expect(screen.getByText("1 of 3 lines")).toBeTruthy();
    expect(screen.getByText("Clear (1)")).toBeTruthy();
    fireEvent.click(screen.getByText("Clear (1)"));
    expect(gridOrder()).toHaveLength(3);
  });

  it("sorts by a heading: descending, ascending, then back to the backend's order", () => {
    setup();
    const pct = screen.getByRole("button", { name: /MD %/ });
    fireEvent.click(pct);
    expect(gridOrder()).toEqual(["Ground beef", "Strawberries 1lb", "Wheat bread"]);
    fireEvent.click(pct);
    expect(gridOrder()).toEqual(["Wheat bread", "Strawberries 1lb", "Ground beef"]);
    fireEvent.click(pct);
    expect(gridOrder()).toEqual(["Strawberries 1lb", "Ground beef", "Wheat bread"]);
  });

  it("keeps the rows, the filters and the sort after leaving the page and coming back", () => {
    const { store, view } = setup();
    act(() => {
      store.dispatch(setMarkdownFilters({ types: ["Price", "Waste"] }));
    });
    fireEvent.click(screen.getByRole("button", { name: /MD %/ }));
    view.unmount();

    render(
      <Provider store={store}>
        <Markdowns />
      </Provider>,
    );
    expect(screen.getByText("2 of 3 lines")).toBeTruthy();
    expect(gridOrder()).toEqual(["Ground beef", "Strawberries 1lb"]);
  });

  it("keeps naming the search the rows came from after the search bar changes", () => {
    const { store } = setup(false);
    act(() => {
      store.dispatch(finishMarkdownsSearch({ rows, searched: { scope: "Food Giant Hayti", startDate: "11/03/2026", endDate: "11/05/2026" } }));
      // Another page picks a different store and week.
      store.dispatch(setSelectedStore({ store_name: "Tupelo Market" } as never));
      store.dispatch(setStartDate("10/01/2026"));
      store.dispatch(setEndDate("10/07/2026"));
    });
    expect(screen.getAllByText(/Food Giant Hayti/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/11\/03\/2026 – 11\/05\/2026/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Tupelo Market/)).toBeNull();
    expect(screen.queryByText(/10\/01\/2026/)).toBeNull();
  });

  it("draws rows that share an id across stores without mixing them up", () => {
    // The table's key is (storeid, id, order_date): an id repeats across stores.
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const store = setupStore();
    store.dispatch(
      setMarkdowns([
        row({ id: 7, storeid: 1301, storename: "Food Giant Hayti", description: "Strawberries 1lb", markdown_percent: 10 }),
        row({ id: 7, storeid: 1302, storename: "Food Giant Kennett", description: "Ground beef", markdown_percent: 90 }),
      ]),
    );
    render(
      <Provider store={store}>
        <Markdowns />
      </Provider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /MD %/ }));
    expect(gridOrder()).toEqual(["Ground beef", "Strawberries 1lb"]);
    const dupes = errors.mock.calls.filter((c) => String(c[0]).includes("same key"));
    errors.mockRestore();
    expect(dupes).toEqual([]);
  });

  it("opens the re-search over the page from Back, and the export from the download icon", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Back to the search" }));
    expect(screen.getByText("Select a store or group and date range to load its markdowns.")).toBeTruthy();
    fireEvent.click(screen.getByTitle("Export CSV"));
    expect(screen.getByText("3 rows, as filtered and sorted on screen")).toBeTruthy();
    expect(screen.getByText("Columns · 25 of 25")).toBeTruthy();
  });
});
