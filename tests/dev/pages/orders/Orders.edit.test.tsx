import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, renderHook, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { setupStore } from "@/store";
import { setUserLevel, setCompanies } from "@/features/userSlice";
import {
  setAllOrders,
  openOrderDraft,
  patchOrdersEdit,
} from "@/features/dev/devOrdersSlice";
import Orders from "@/pages/orders/dev/Orders";
import { useOrderDraftActions } from "@/pages/orders/dev/hooks";
import {
  applyField,
  changedLines,
  docKey,
  buildDocs,
  startDraft,
} from "@/pages/orders/dev/utils/orderEdit";
import { getAllOrders, updateOrderFile } from "@/api/orders";
import type { AllOrder } from "@/interfaces";

vi.mock("@/api/orders", () => ({ getAllOrders: vi.fn(), updateOrderFile: vi.fn() }));
vi.mock("@/api/itemLookup", () => ({ getItemLookupSingleStore: vi.fn() }));
vi.mock("@/api/subDeptExclusions", () => ({ getSubDeptCatalog: vi.fn() }));
vi.mock("@/api/groups", () => ({ getStoresAssignedToUserGroup: vi.fn() }));
vi.mock("@/components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: () => {},
    success: () => {},
    info: () => {},
    warning: () => {},
    warn: () => {},
  }),
}));

/** One order line; the figures give a non-zero cost and retail. */
const line = (
  over: Partial<AllOrder> & Pick<AllOrder, "order_id" | "line_number">,
): AllOrder => ({
  storeid: 1,
  order_date: "2026-11-02",
  storenumber: "101",
  storename: "Chapel Hill",
  status: "open",
  record_count: 2,
  order_type: "Grocery",
  product_code: `P${over.order_id}${over.line_number}`,
  qty: 2,
  tpr: 0,
  active_price: 0,
  active_qty: 0,
  extended_plessy: null,
  net_cost: 10,
  weight: 0,
  active_retail_price: 5,
  active_retail_qty: 1,
  description: `ITEM ${over.order_id}-${over.line_number}`,
  base_cost: 10,
  category: 1,
  category_description: "Cat",
  vendor_id: "50",
  retail_price: 5,
  sub_department: 1,
  sub_department_description: "Sub",
  vendor_name: "AWG",
  casesize: 1,
  edited: null,
  scalable: 0,
  e_ret: 10,
  cogs: 20,
  rev: -10,
  ...over,
});

/** Orders 1001 and 1002 at store 101, and order 2001 at store 202. */
const LINES: AllOrder[] = [
  line({ order_id: 1001, line_number: 1 }),
  line({ order_id: 1001, line_number: 2 }),
  line({ order_id: 1002, line_number: 1, order_date: "2026-11-03", order_type: "Meat" }),
  line({ order_id: 1002, line_number: 2, order_date: "2026-11-03", order_type: "Meat" }),
  line({
    order_id: 2001,
    line_number: 1,
    storeid: 2,
    storenumber: "202",
    storename: "Tupelo",
    order_date: "2026-11-03",
  }),
];

const KEY_A = docKey(LINES[0]);
const KEY_B = docKey(LINES[2]);

type TestStore = ReturnType<typeof setupStore>;

/** An owner at Houchens: level 7 is not held to the Thursday cut-off. */
const seed = (): TestStore => {
  const store = setupStore();
  store.dispatch(setUserLevel(7));
  store.dispatch(
    setCompanies([{ id: 1, name: "Houchens", userid: 1, company: 1, username: "o" }]),
  );
  store.dispatch(setAllOrders(LINES));
  return store;
};

const page = (store: TestStore) => (
  <Provider store={store}>
    <Orders />
  </Provider>
);

/** A card's name runs the type on after the number ("Order 1001Grocery..."). */
const cardName = (n: number) => new RegExp(`^Order ${n}(?!\\d)`);
const card = (n: number) => screen.getByRole("button", { name: cardName(n) });
const noCard = (n: number) =>
  expect(screen.queryByRole("button", { name: cardName(n) })).not.toBeInTheDocument();

/** The open order's header line in the edit panel. */
const openHeader = (n: number) => screen.getByText(new RegExp(`order ${n}\\b`));

const enterEditAndOpen = async (n: number) => {
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));
  await userEvent.click(card(n));
};

const setQty = async (lineNo: number, value: string) => {
  const box = screen.getByLabelText(`Qty on line ${lineNo}`);
  await userEvent.clear(box);
  await userEvent.type(box, value);
};

beforeEach(() => {
  vi.mocked(getAllOrders).mockResolvedValue({ data: { error: 0, orders: [] } } as never);
});

describe("Orders edit mode, leaving the page and coming back", () => {
  it("keeps edit mode, the open order and the changed marker", async () => {
    const store = seed();
    const first = render(page(store));

    await enterEditAndOpen(1001);
    await setQty(1, "9");
    expect(screen.getByText("was 2")).toBeInTheDocument();

    await userEvent.click(card(1002));
    expect(openHeader(1002)).toBeInTheDocument();
    first.unmount();

    render(page(store));

    // Still in edit mode: the picker is up, not the Browse grid.
    expect(screen.getByText("Order to edit")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    // The second order is the one open.
    expect(openHeader(1002)).toBeInTheDocument();
    expect(screen.queryByText(/order 1001\b/)).not.toBeInTheDocument();
    // The first order is marked changed, and nothing else is.
    expect(screen.getByText("1 changed")).toBeInTheDocument();
    expect(within(card(1001)).getByTitle("Changes not yet submitted")).toBeInTheDocument();
    expect(within(card(1002)).queryByTitle("Changes not yet submitted")).not.toBeInTheDocument();
  });

  it("shows the typed edit when the first order is opened again after the remount", async () => {
    const store = seed();
    const first = render(page(store));

    await enterEditAndOpen(1001);
    await setQty(1, "9");
    await userEvent.click(card(1002));
    first.unmount();

    render(page(store));
    await userEvent.click(card(1001));

    // The draft holds the edit, and the box and its note show it.
    expect(store.getState().dev.orders.edit.drafts[KEY_A].lines[0].qty).toBe(9);
    expect(screen.getByLabelText("Qty on line 1")).toHaveValue(9);
    expect(screen.getByText("was 2")).toBeInTheDocument();
  });

  it("shows the typed edit when the first order is opened again without leaving", async () => {
    render(page(seed()));

    await enterEditAndOpen(1001);
    await setQty(1, "9");
    await userEvent.click(card(1002));
    await userEvent.click(card(1001));

    expect(screen.getByLabelText("Qty on line 1")).toHaveValue(9);
  });

  it("keeps a narrowed store and order type narrowed", async () => {
    const store = seed();
    const first = render(page(store));

    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("3 orders in range")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByDisplayValue(/Every store/), "202");
    await userEvent.selectOptions(screen.getByDisplayValue(/Every type/), "Grocery");
    expect(screen.getByText("1 of 3 orders")).toBeInTheDocument();
    first.unmount();

    render(page(store));

    expect(screen.getByText("1 of 3 orders")).toBeInTheDocument();
    expect(card(2001)).toBeInTheDocument();
    noCard(1001);
    expect(screen.getByDisplayValue(/202/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Grocery")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear all" })).toBeInTheDocument();
  });

  it("keeps a narrowed order date narrowed", async () => {
    const store = seed();
    const first = render(page(store));

    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.selectOptions(screen.getByDisplayValue(/Every date/), "2026-11-02");
    expect(screen.getByText("1 of 3 orders")).toBeInTheDocument();
    first.unmount();

    render(page(store));

    expect(screen.getByText("1 of 3 orders")).toBeInTheDocument();
    expect(card(1001)).toBeInTheDocument();
    noCard(1002);
  });

  it("still shows the receipt after a real Submit, and the sent order is not an unsent change", async () => {
    vi.mocked(updateOrderFile).mockResolvedValue({
      data: {
        error: 0,
        success: true,
        msg: "ok",
        bucket: "import-bucket",
        key: "orders/1001-120000.csv",
        line_count: 2,
        logged: true,
      },
    } as never);
    const store = seed();
    const first = render(page(store));

    await enterEditAndOpen(1001);
    await setQty(1, "9");
    await userEvent.click(screen.getByRole("button", { name: "Submit order update" }));
    expect(await screen.findByText("Order update submitted")).toBeInTheDocument();
    expect(updateOrderFile).toHaveBeenCalledTimes(1);
    first.unmount();

    render(page(store));

    expect(screen.getByText("Order update submitted")).toBeInTheDocument();
    expect(screen.getByText("import-bucket")).toBeInTheDocument();
    expect(screen.getByText("Order to edit")).toBeInTheDocument();
    // The sent order is open and not counted as waiting to go.
    expect(openHeader(1001)).toBeInTheDocument();
    expect(screen.queryByText(/\d+ changed/)).not.toBeInTheDocument();
  });

  it("shows a receipt put in the slice, with its order open, and no unsent change", () => {
    const store = seed();
    const doc = buildDocs(LINES).find((d) => d.key === KEY_A)!;
    const sent = applyField(startDraft(doc, LINES), 1, "qty", 9);
    store.dispatch(openOrderDraft(sent));
    store.dispatch(
      patchOrdersEdit({
        editing: true,
        receipt: {
          error: 0,
          success: true,
          msg: "ok",
          bucket: "import-bucket",
          key: "k",
          line_count: 2,
          logged: true,
        },
        submittedCounts: { orders: 1, edited: 1, added: 0 },
      }),
    );

    render(page(store));

    expect(screen.getByText("Order update submitted")).toBeInTheDocument();
    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.queryByText(/\d+ changed/)).not.toBeInTheDocument();
  });
});

describe("useOrderDraftActions, a write landing late", () => {
  const wrapper =
    (store: TestStore) =>
    ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

  it("edits the order it was aimed at and keeps the open order's edits", () => {
    const store = seed();
    const docs = buildDocs(LINES);
    const docA = docs.find((d) => d.key === KEY_A)!;
    const docB = docs.find((d) => d.key === KEY_B)!;
    const { result } = renderHook(() => useOrderDraftActions(), { wrapper: wrapper(store) });

    // A is opened, then B is opened with an edit of its own.
    act(() => result.current.openDraft(startDraft(docA, LINES)));
    act(() => result.current.openDraft(applyField(startDraft(docB, LINES), 2, "qty", 7)));
    expect(store.getState().dev.orders.edit.openKey).toBe(KEY_B);

    // A lookup aimed at A lands now.
    act(() =>
      result.current.editDraft(KEY_A, (d) => (d ? applyField(d, 1, "base_cost", 12) : d)),
    );

    const { drafts, openKey } = store.getState().dev.orders.edit;
    expect(openKey).toBe(KEY_B);
    const a = drafts[KEY_A];
    const b = drafts[KEY_B];
    expect(a.lines.find((l) => l.line_number === 1)!.base_cost).toBe(12);
    expect(changedLines(a)).toHaveLength(1);
    // B kept its own edit and took nothing from the late write.
    expect(b.lines.find((l) => l.line_number === 2)!.qty).toBe(7);
    expect(b.lines.find((l) => l.line_number === 1)!.base_cost).toBe(10);
    expect(changedLines(b)).toHaveLength(1);
  });

  it("builds on the draft as it is when the write runs", () => {
    const store = seed();
    const docA = buildDocs(LINES).find((d) => d.key === KEY_A)!;
    const { result } = renderHook(() => useOrderDraftActions(), { wrapper: wrapper(store) });

    act(() => result.current.openDraft(startDraft(docA, LINES)));
    const queued = result.current.editDraft;
    // Two writes made through the same handle: the second must not undo the first.
    act(() => queued(KEY_A, (d) => (d ? applyField(d, 1, "qty", 5) : d)));
    act(() => queued(KEY_A, (d) => (d ? applyField(d, 2, "qty", 6) : d)));

    const a = store.getState().dev.orders.edit.drafts[KEY_A];
    expect(a.lines.map((l) => l.qty)).toEqual([5, 6]);
  });

  it("leaves the drafts alone when the key is null or the result is null", () => {
    const store = seed();
    const docA = buildDocs(LINES).find((d) => d.key === KEY_A)!;
    const { result } = renderHook(() => useOrderDraftActions(), { wrapper: wrapper(store) });
    act(() => result.current.openDraft(startDraft(docA, LINES)));
    const before = store.getState().dev.orders.edit.drafts;

    act(() => result.current.editDraft(null, (d) => d));
    act(() => result.current.editDraft(KEY_A, () => null));

    expect(store.getState().dev.orders.edit.drafts).toBe(before);
  });
});
