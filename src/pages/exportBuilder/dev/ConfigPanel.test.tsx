import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { setupStore } from "../../../store";
import { setConfig } from "../../../features/dev/devExportBuilderSlice";
import ConfigPanel from "./ConfigPanel";

vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: () => {},
    success: () => {},
    info: () => {},
    warning: () => {},
    warn: () => {},
  }),
}));

const vendors = [
  { vendor_id: "50", vendor_name: "AWG" },
  { vendor_id: "F0007", vendor_name: "Frito Lay" },
  { vendor_id: "C0021", vendor_name: "Clark Beverage Group" },
];

const renderPanel = () => {
  const store = setupStore();
  store.dispatch(
    setConfig({
      stores: [{ storeid: 1, store_number: "001", store_name: "001 - IGA" }],
      saleTypes: ["Sale"],
      itemRingTypes: ["ITEM"],
      subDepartments: [
        { sub_department: "10", sub_department_description: "Grocery" },
        { sub_department: "20", sub_department_description: "Produce" },
      ],
      vendors,
      columns: [{ name: "sale_id", data_type: "bigint" }],
      rows: [],
      hasData: true,
      message: null,
    }),
  );
  return render(
    <Provider store={store}>
      <ConfigPanel />
    </Provider>,
  );
};

describe("searching a long list", () => {
  it("keeps the focus while typing, character after character", async () => {
    // The bug this exists for: the row was a component declared inside the
    // render body, so every keystroke was a new component type — React
    // unmounted the tree and the box being typed into lost the focus after one
    // character.
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /Vendors/ }));
    const box = screen.getByLabelText("Find a vendor...");
    await user.click(box);
    await user.keyboard("fri");

    expect(document.activeElement).toBe(box);
    expect((box as HTMLInputElement).value).toBe("fri");
  });

  it("narrows the list to what matches, by name or by id", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /Vendors/ }));
    await user.type(screen.getByLabelText("Find a vendor..."), "fri");
    expect(screen.getByText("Frito Lay")).toBeTruthy();
    expect(screen.queryByText("AWG")).toBeNull();

    await user.clear(screen.getByLabelText("Find a vendor..."));
    await user.type(screen.getByLabelText("Find a vendor..."), "C0021");
    expect(screen.getByText("Clark Beverage Group")).toBeTruthy();
  });

  it("does not change what is ticked", async () => {
    // Searching hides rows; it must not quietly deselect them, or a narrowed
    // list would export less than it showed a moment ago.
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /Vendors/ }));
    await user.type(screen.getByLabelText("Find a vendor..."), "fri");
    await user.click(screen.getByRole("button", { name: /Vendors/ }));

    expect(screen.getByRole("button", { name: /Vendors/ }).textContent).toContain(
      "all 3",
    );
  });
});
