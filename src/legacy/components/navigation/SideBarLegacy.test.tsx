import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { setupStore } from "../../../store";
import { setLoggedIn } from "../../../features/appSlice";
import { setUserLevel } from "../../../features/userSlice";
import SideBarLegacy from "./SideBarLegacy";

// The sidebar writes the route it just moved to back to the API on every
// click. Nothing here is testing that.
vi.mock("../../../api/user", () => ({
  setUserPrefs: () => Promise.resolve({ data: { error: 0 } }),
}));
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({ error: () => {}, success: () => {}, info: () => {}, warning: () => {}, warn: () => {} }),
}));

const Where = () => <span data-testid="where">{useLocation().pathname}</span>;

const renderSidebar = () => {
  const store = setupStore();
  store.dispatch(setLoggedIn(true));
  store.dispatch(setUserLevel(9));
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/sales"]}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <SideBarLegacy />
                <Where />
              </>
            }
          >
            <Route path="sales" element={null} />
            <Route path="receivers" element={null} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

describe("the legacy sidebar", () => {
  it("lists only the pages legacy has", () => {
    renderSidebar();
    expect(screen.getByTestId("nav-receivers")).toBeTruthy();
    // Pages that never had a legacy version, but are in the nav array this
    // was vendored with.
    expect(screen.queryByTestId("nav-item-report")).toBeNull();
    expect(screen.queryByTestId("nav-quicksight")).toBeNull();
    expect(screen.queryByTestId("nav-invoices")).toBeNull();
  });

  it("navigates when a page is clicked", async () => {
    renderSidebar();
    expect(screen.getByTestId("where").textContent).toBe("/sales");
    await userEvent.click(screen.getByTestId("nav-receivers"));
    expect(screen.getByTestId("where").textContent).toBe("/receivers");
  });
});
