import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { setupStore } from "../../../store";
import SourcePicker from "./SourcePicker";

const renderPicker = () => {
  const store = setupStore();
  render(
    <Provider store={store}>
      <SourcePicker />
    </Provider>,
  );
  return store;
};

describe("the Data choice", () => {
  it("is one choice of four, with Sales picked", () => {
    renderPicker();
    const group = screen.getByRole("radiogroup", { name: "Data" });
    expect(group).toBeTruthy();
    const rows = screen.getAllByRole("radio");
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.getAttribute("aria-checked"))).toEqual([
      "true",
      "false",
      "false",
      "false",
    ]);
    // One Tab stop: the pick.
    expect(rows.map((r) => r.tabIndex)).toEqual([0, -1, -1, -1]);
  });

  it("moves the pick with the arrow keys, wrapping at the ends", async () => {
    const user = userEvent.setup();
    const store = renderPicker();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: /Sales/ }));

    await user.keyboard("{ArrowDown}");
    expect(store.getState().dev.exportBuilder.searchSource).toBe("orders");
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: /Orders/ }));

    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(store.getState().dev.exportBuilder.searchSource).toBe("markdowns");
  });

  it("picks on a click, and a second click leaves it picked", async () => {
    const user = userEvent.setup();
    const store = renderPicker();
    const invoices = screen.getByRole("radio", { name: /Invoices/ });
    await user.click(invoices);
    await user.click(invoices);
    expect(store.getState().dev.exportBuilder.searchSource).toBe("invoices");
    expect(invoices.getAttribute("aria-checked")).toBe("true");
  });
});
