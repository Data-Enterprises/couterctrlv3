import { renderWithProviders } from "../utils";
import { describe, it, expect } from "vitest";
import App from "../../App";
import { setupStore } from "../../store";
import {
  setIsDesktop,
  setIsMobile,
  setLoggedIn,
} from "../../features/appSlice";
import { waitFor, screen } from "@testing-library/react";
import { setIsNavOpen } from "../../features/navSlice";
import { formatGoliathDate } from "../../utils";

const store = setupStore();
store.dispatch(setIsMobile(true));
store.dispatch(setIsDesktop(false));
describe("App Component", () => {
  it("should render Login instead of Outlet on mount", async () => {
    renderWithProviders(<App />, { store });
    const login = screen.getByTestId("login-page");
    expect(login).toBeInTheDocument();
  });

  it("should handle styling for after login", async () => {
    await waitFor(() => {
      store.dispatch(setLoggedIn(true));
    });
    renderWithProviders(<App />, { store });

    const container = await screen.findByTestId("outlet-container");
    expect(container).toBeInTheDocument();
  });

  it("should handle open navigation styling for App component", async () => {
    await waitFor(() => {
      store.dispatch(setIsDesktop(true));
      store.dispatch(setIsMobile(false));
      store.dispatch(setIsNavOpen(true));
    });
    renderWithProviders(<App />, { store });
    const container = await screen.findByTestId("outlet-container");

    expect(container).toHaveClass("opacity-20 pointer-events-none");

    await waitFor(() => {
      store.dispatch(setIsNavOpen(false));
    });

    expect(container).toHaveClass("bg-content/5");
  });

  it("should handle formatGolaithDate with a date before October", async () => {
    const date = '9/1/2025';
    const formattedDate = formatGoliathDate(date);
    expect(formattedDate).toBe('2025-09-01');
  });
});
