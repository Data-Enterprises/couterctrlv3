import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import SubDeptExclusions from "@/pages/admin/dev/subExclusions/SubDeptExclusions";

const getStores = vi.fn();
vi.mock("@/api/user", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/user")>()),
  getUserStores: (...args: unknown[]) => getStores(...args),
}));

const getCatalog = vi.fn();
const getExclusions = vi.fn();
vi.mock("@/api/subDeptExclusions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/subDeptExclusions")>()),
  getSubDeptCatalog: (...args: unknown[]) => getCatalog(...args),
  getSubDeptExclusions: (...args: unknown[]) => getExclusions(...args),
  addSubDeptExclusion: vi.fn(),
  removeSubDeptExclusion: vi.fn(),
}));

vi.mock("@/components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    warn: vi.fn(),
  }),
}));

const store = (
  storeid: number,
  company: number,
  company_name: string,
  name: string,
) => ({
  storeid,
  store_number: String(storeid),
  store_name: name,
  company,
  company_name,
});

const STORES = [
  store(10, 1, "Alpha Foods", "Alpha One"),
  store(11, 1, "Alpha Foods", "Alpha Two"),
  store(20, 2, "Beta Mart", "Beta One"),
];

const catalogRows = (ids: number[]) =>
  ids.flatMap((storeid) => [
    {
      storeid,
      sub_department: 1,
      sub_department_description: "Bread",
      last_rung: "2026-11-01",
    },
    {
      storeid,
      sub_department: 2,
      sub_department_description: "Lottery",
      last_rung: "2026-11-01",
    },
  ]);

const okExclusions = { data: { error: 0, data: [] } };

/** Renders the tab on a given store and returns a way to leave and come back. */
const open = (s = setupStore()) => {
  const view = () => (
    <Provider store={s}>
      <SubDeptExclusions />
    </Provider>
  );
  const first = render(view());
  return {
    store: s,
    leave: () => first.unmount(),
    back: () => render(view()),
  };
};

/** Opens the dropdown showing `current` and picks `option`. */
const pick = (current: string, option: string) => {
  fireEvent.click(screen.getByRole("button", { name: current }));
  fireEvent.click(screen.getByRole("button", { name: option }));
};

describe("Sub dept exclusions after leaving the tab and coming back", () => {
  beforeEach(() => {
    cleanup();
    getStores.mockReset();
    getCatalog.mockReset();
    getExclusions.mockReset();
    getStores.mockResolvedValue({
      data: { error: 0, assigned_stores: STORES, unassigned_stores: [] },
    });
    getCatalog.mockImplementation((_u, _t, ids: number[]) =>
      Promise.resolve(catalogRows(ids)),
    );
    getExclusions.mockResolvedValue(okExclusions);
  });

  it("does not read the catalogue again, and shows the rows at once", async () => {
    const tab = open();
    expect(await screen.findByText("Bread")).toBeTruthy();
    expect(getCatalog).toHaveBeenCalledTimes(1);

    tab.leave();
    tab.back();

    // Rows are there on the first render, before any call can have landed.
    expect(screen.getByText("Bread")).toBeTruthy();
    expect(screen.getByText("Lottery")).toBeTruthy();
    expect(screen.queryByText(/Reading sub departments/)).toBeNull();
    await screen.findByText("Bread");
    expect(getCatalog).toHaveBeenCalledTimes(1);
    expect(getExclusions).toHaveBeenCalledTimes(1);
  });

  it("keeps the search text, Likely hash and the window", async () => {
    const tab = open();
    await screen.findByText("Bread");
    pick("Last 120 days", "Last year");
    await screen.findByText("Bread");
    fireEvent.change(screen.getByPlaceholderText("Search departments…"), {
      target: { value: "bre" },
    });
    // Both departments rang at both stores, so only Lottery is a likely hash.
    expect(screen.getByRole("button", { name: /Likely hash/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Likely hash/ }));
    fireEvent.change(screen.getByPlaceholderText("Search departments…"), {
      target: { value: "" },
    });
    expect(screen.queryByText("Bread")).toBeNull();
    fireEvent.change(screen.getByPlaceholderText("Search departments…"), {
      target: { value: "lot" },
    });

    tab.leave();
    tab.back();

    const search = screen.getByPlaceholderText(
      "Search departments…",
    ) as HTMLInputElement;
    expect(search.value).toBe("lot");
    expect(screen.getByRole("button", { name: "Last year" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Last 120 days" })).toBeNull();
    // Likely hash is still on: Bread is hidden and Lottery is shown.
    expect(screen.getByText("Lottery")).toBeTruthy();
    fireEvent.change(search, { target: { value: "" } });
    expect(screen.queryByText("Bread")).toBeNull();
    expect(screen.getByText("Lottery")).toBeTruthy();
  });

  it("goes back to every store when another company is picked", async () => {
    open();
    await screen.findByText("Bread");
    expect(screen.getByRole("button", { name: "All 2 stores" })).toBeTruthy();

    pick("All 2 stores", "Alpha Two");
    expect(screen.getByRole("button", { name: "Alpha Two" })).toBeTruthy();

    pick("Alpha Foods", "Beta Mart");
    expect(screen.getByRole("button", { name: "Beta Mart" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "All 1 stores" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Alpha Two" })).toBeNull();
  });

  it("reads the catalogue again when the window changes", async () => {
    open();
    await screen.findByText("Bread");
    expect(getCatalog).toHaveBeenCalledTimes(1);
    expect(getCatalog.mock.calls[0][3]).toBe(120);

    pick("Last 120 days", "Last 2 years");
    await screen.findByText("Bread");

    expect(getCatalog).toHaveBeenCalledTimes(2);
    expect(getCatalog.mock.calls[1][3]).toBe(730);
  });

  it("reads again on return when the exclusions read failed", async () => {
    getExclusions.mockResolvedValue({
      data: { error: 1, msg: "boom", data: [] },
    });
    const tab = open();
    await screen.findByText("Bread");
    expect(getCatalog).toHaveBeenCalledTimes(1);
    expect(getExclusions).toHaveBeenCalledTimes(1);

    getExclusions.mockResolvedValue(okExclusions);
    tab.leave();
    tab.back();
    await screen.findByText("Bread");

    expect(getCatalog).toHaveBeenCalledTimes(2);
    expect(getExclusions).toHaveBeenCalledTimes(2);
  });
});
