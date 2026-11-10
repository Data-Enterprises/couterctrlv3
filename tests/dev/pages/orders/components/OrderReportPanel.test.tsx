import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { setAssignedStores } from "@/features/userSlice";
import OrderReportPanel from "@/pages/orders/dev/components/OrderReportPanel";

// Interfaces
import type { AllOrder, Store } from "@/interfaces";

const line = (over: Partial<AllOrder>) =>
  ({
    storeid: 1,
    storenumber: "301",
    storename: "PAYLOAD NAME",
    order_id: 10,
    line_number: 1,
    product_code: "100",
    description: "Item",
    sub_department_description: "Produce",
    qty: 1,
    casesize: 1,
    base_cost: 1,
    cogs: 1,
    active_retail_price: 2,
    e_ret: 2,
    weight: 0,
    ...over,
  }) as AllOrder;

const setup = (rows: AllOrder[]) => {
  const store = setupStore();
  store.dispatch(
    setAssignedStores([
      { storeid: 1, store_name: "Food Giant Hayti" },
      { storeid: 2, store_name: "Food Giant Kennett" },
    ] as Store[]),
  );
  return render(
    <Provider store={store}>
      <OrderReportPanel
        rows={rows}
        sort={null}
        marginOver={null}
        onSort={() => undefined}
        loading={false}
        onExport={() => undefined}
        onEnterEdit={() => undefined}
        canEdit={false}
      />
    </Provider>,
  );
};

describe("the Orders report's Stores figure", () => {
  it("counts the stores in the grid and drops their names down from a click", () => {
    const view = setup([
      line({ storeid: 2, storenumber: "302", order_id: 11 }),
      line({ storeid: 1, storenumber: "301" }),
      line({ storeid: 1, storenumber: "301", line_number: 2 }),
    ]);
    const button = screen.getByRole("button", { name: /Stores/ });
    expect(button.textContent).toContain("2");

    const list = view.container.querySelector<HTMLElement>('[aria-label="Stores in the grid"]')!;
    expect(list.getAttribute("aria-hidden")).toBe("true");
    fireEvent.click(button);
    expect(list.getAttribute("aria-hidden")).toBe("false");
    expect(within(list).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Food Giant Hayti",
      "Food Giant Kennett",
    ]);
    fireEvent.click(button);
    expect(list.getAttribute("aria-hidden")).toBe("true");
  });
});
