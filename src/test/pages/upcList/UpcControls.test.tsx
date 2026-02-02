import { describe, expect, it, vi, type Mock } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { setupStore } from "../../../store";
import { renderWithProviders } from "../../utils";
import userEvent from "@testing-library/user-event";

// Dispatchers
import { setAssignedStores } from "../../../features/userSlice";
import { setGroups } from "../../../features/groupSlice";

// API calls to be mocked
import { getSalesComp } from "../../../api/upc";

// Responses
import { stores, groups, salesCompResp } from ".";

// Components being tested
import UpcList from "../../../pages/upc/UpcList";
import { setSelectedStores } from "../../../features/upcSlice";

vi.mock("../../../api/upc");
const store = setupStore();
store.dispatch(setAssignedStores(stores));
store.dispatch(setGroups(groups));
const user = userEvent.setup();
const mockedToastWarn = vi.fn();
const mockedToastError = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    warn: mockedToastWarn,
    error: mockedToastError,
  }),
}));

describe("Upc Controls Component", () => {
  it("should handle API success when fetching Sales Comp data", async () => {
    // Mock the API failure
    (getSalesComp as Mock).mockResolvedValue(salesCompResp);

    renderWithProviders(<UpcList />, { store });

    const dropdown = await screen.findByTestId("single-select-trigger-icon-2");

    await user.click(dropdown);
    const option = await screen.findByTestId("single-select-option-2-1");
    await user.click(option);

    const salesComp = await screen.findByTestId("radio-1");
    await user.click(salesComp);

    const searchBtn = await screen.findByTestId("upc-module-data-search-btn");
    await user.click(searchBtn);
  });

  // Store's state persists so UpcControls can be tested here
  it("should render UpcControls after successful data fetching", async () => {
    renderWithProviders(<UpcList />, { store });
    expect(screen.getByTestId("upc-sales-comp")).toBeInTheDocument();
    expect(screen.getByTestId("upc-controls")).toBeInTheDocument();
  });

  it("should filter UPC items based on user input", async () => {
    renderWithProviders(<UpcList />, { store });

    // Testing the filtering of the UPC list
    const filterInput = await screen.findByTestId("upc-filter-input");
    await user.type(filterInput, "upc1");
    expect(filterInput).toHaveValue("upc1");
    await user.clear(filterInput);
    expect(filterInput).toHaveValue("");
  });

  it("should handle Showing all UPCs and toggle their display", async () => {
    renderWithProviders(<UpcList />, { store });

    // Display toggle button
    const displayToggle = await screen.findByTestId("upc-toggle-display-btn");

    // Testing selecting/deselecting stores
    const firstStore = await screen.findByTestId("check-1");
    const secondStore = await screen.findByTestId("check-2");

    // In show all mode first
    await user.click(firstStore);
    await user.click(secondStore);

    // Then toggle the item's display between UPC and Description
    await user.click(displayToggle); // Toggle display mode
    await user.click(displayToggle); // Toggle back
  });

  it("should handle Context Menu when in Show All mode", async () => {
    renderWithProviders(<UpcList />, { store });

    const upcOne = await screen.findByTestId("check-1");

    // Fire context menu
    fireEvent.contextMenu(upcOne, { preventDefault: vi.fn() });

    // Click on first option and it closes
    const ctxMenuOption0 = await screen.findByTestId("ctx-menu-option-0");
    expect(ctxMenuOption0).toBeInTheDocument();
    await user.click(ctxMenuOption0);

    // reopnen context menu and close by clicking outside
    fireEvent.contextMenu(upcOne, { preventDefault: vi.fn() });
    fireEvent.mouseDown(document);

    expect(screen.queryByTestId("ctx-menu")).not.toBeInTheDocument();
  });

  it("should handle Showing selected UPCs only", async () => {
    renderWithProviders(<UpcList />, { store });

    // Radio Buttons for displaying UPC/Description
    const showSelected = await screen.findByTestId("radio-20");
    const displayToggle = await screen.findByTestId("upc-toggle-display-btn");

    const firstStore = await screen.findByTestId("check-0");
    const secondStore = await screen.findByTestId("check-1");

    await user.click(firstStore);
    await user.click(secondStore);

    // Then show the selected items only => should be the two selected
    await user.click(showSelected);

    // Selecting one of the selected UPCs to deselect it
    const selectedUpc2 = await screen.findByTestId("selected-upc-2");
    await user.click(selectedUpc2);
    expect(selectedUpc2).not.toBeInTheDocument();

    // Testing for when the user would like to see the description instead of UPC
    await user.click(displayToggle);
    expect(displayToggle.innerHTML).toBe("Show UPC");
  });

  it("should show the selected stores when Show Stores is clicked", async () => {
    renderWithProviders(<UpcList />, { store });
    await waitFor(() => {
      store.dispatch(setSelectedStores(stores));
    });

    const showStores = await screen.findByTestId("radio-30");
    await user.click(showStores);

    // Then go back to Show all
    const showAll = await screen.findByTestId("radio-10");
    await user.click(showAll);
  });

  it("should handle deselecting all UPCs", async () => {
    renderWithProviders(<UpcList />, { store });

    const deselectAllBt = await screen.findByTestId("upc-deselect-all-btn");
    const firstStore = await screen.findByTestId("check-0");
    const secondStore = await screen.findByTestId("check-1");

    await user.click(firstStore);
    await user.click(secondStore);

    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedUpcs.length).toBeGreaterThan(0);
    });

    await user.click(deselectAllBt);

    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedUpcs.length).toBe(0);
    });
  });

  it("should handle resetting back to UpcWizard step one", async () => {
    renderWithProviders(<UpcList />, { store });
    const resetBtn = await screen.findByTestId("upc-controls-reset-btn");
    await user.click(resetBtn);

    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.salesComp.length).toEqual(0);
    });
  });
});
