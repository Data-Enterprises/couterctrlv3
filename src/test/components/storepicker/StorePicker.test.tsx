import StorePicker from "../../../components/storePicker/StorePicker";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../utils";
import { describe, expect, it, vi, type Mock } from "vitest";
import { setupStore } from "../../../store";
import userEvent from "@testing-library/user-event";
import { setUserPrefs } from "../../../api/user";
import { fakeStores, fakeGroups } from ".";
import { setAssignedStores, setRole } from "../../../features/userSlice";
import { setGroups } from "../../../features/groupSlice";
import { setIsDesktop } from "../../../features/appSlice";

const testStore = setupStore();
const user = userEvent.setup();
vi.mock("../../../api/user");
testStore.dispatch(setAssignedStores(fakeStores));
testStore.dispatch(setGroups(fakeGroups));

describe("StorePicker Component", () => {
  it("should render StorePicker component with all children", () => {
    renderWithProviders(<StorePicker />, { store: testStore });

    const storePicker = screen.getByTestId("store-picker");
    expect(storePicker).toBeInTheDocument();

    const state = testStore.getState().search.type;
    if (state === "Store") {
      const searchStore = screen.getByTestId("search-store");
      expect(searchStore).toBeInTheDocument();
    } else if (state === "Group") {
      const selectGroup = screen.getByTestId("select-group");
      expect(selectGroup).toBeInTheDocument();
    }
  });

  it("should render with the single store only prop", async () => {
    (setUserPrefs as Mock).mockResolvedValue({ data: { error: 0 } });
    await waitFor(() => {
      testStore.dispatch(setRole(1));
    });
    renderWithProviders(<StorePicker />, {
      store: testStore,
    });

    const storePicker = screen.getByTestId("store-picker");
    expect(storePicker).toBeInTheDocument();

    const singleStoreSelection = await screen.findByTestId(
      "searchtype-single-store-option",
    );
    await user.click(singleStoreSelection);
  });

  it("should handle the selection of different search types", async () => {
    await waitFor(() => {
      testStore.dispatch(setRole(9));
    });
    (setUserPrefs as Mock).mockResolvedValue({ data: { error: 0 } });
    renderWithProviders(<StorePicker />, { store: testStore });

    const storePicker = screen.getByTestId("store-picker");
    expect(storePicker).toBeInTheDocument();

    // Open the options
    const trigger = await screen.findByTestId("type-trigger-ref");
    await user.click(trigger);

    // Select the Group option
    const groupOption = await screen.findByTestId("st-option-2");
    await user.click(groupOption);
    await waitFor(() => {
      const state = testStore.getState().search.type;
      expect(state).toBe("Group");
    });

    // Open the options again
    await user.click(trigger);

    // click outisde of the options to close it
    await user.click(document.body);

    await waitFor(() => {
      const list = screen.queryByTestId("type-options-list");
      expect(list).not.toBeInTheDocument();
    });
  });

  it("should grab Group as search type if it was the last search type upon rendering", async () => {
    (setUserPrefs as Mock).mockResolvedValue({ data: { error: 0 } });
    renderWithProviders(<StorePicker />, { store: testStore });

    await waitFor(() => {
      const state = testStore.getState().search.type;
      expect(state).toBe("Group");
    });

    const trigger = await screen.findByTestId("type-trigger-ref");
    await user.click(trigger);

    const storeOption = await screen.findByTestId("st-option-3");

    await user.click(storeOption);
    await waitFor(() => {
      const state = testStore.getState().search.type;
      expect(state).toBe("Store");
    });
  });

  it("should grab Store as search type if it was the last search type upon rendering", async () => {
    (setUserPrefs as Mock).mockResolvedValue({ data: { error: 0 } });
    renderWithProviders(<StorePicker />, { store: testStore });

    await waitFor(() => {
      const state = testStore.getState().search.type;
      expect(state).toBe("Store");
    });

    await waitFor(() => {
      testStore.dispatch({ type: "search/setType", payload: "" });
      const state = testStore.getState().search.type;
      expect(state).toBe("");
    });
  });

  it("should set the default query as Single Store if no last search type is found", async () => {
    (setUserPrefs as Mock).mockResolvedValue({ data: { error: 0 } });
    renderWithProviders(<StorePicker />, { store: testStore });
    await waitFor(() => {
      // expect the text Single Store to be in the document
      const singleStoreText = screen.getByText("Store");
      expect(singleStoreText).toBeInTheDocument();
    });
  });

  it("should handle SearchStore selections", async () => {
    (setUserPrefs as Mock).mockResolvedValue({ data: { error: 0 } });
    renderWithProviders(<StorePicker />, { store: testStore });

    const trigger = await screen.findByTestId("type-trigger-ref");
    await user.click(trigger);

    const storeOption = await screen.findByTestId("st-option-3");
    await user.click(storeOption);

    const input = await screen.findByTestId("search-store-input");
    await user.click(input);
    const storeToSelect = await screen.findByTestId("searchstore-2");
    await user.click(storeToSelect);

    await waitFor(() => {
      const state = testStore.getState();
      expect(state.search.lastStore).toBe(2);
    });

    // clear and then type in the input
    await user.clear(input);
    await user.type(input, "Store Two");
  });

  it("should handle SelectGroup selections", async () => {
    (setUserPrefs as Mock).mockResolvedValue({ data: { error: 0 } });
    renderWithProviders(<StorePicker />, { store: testStore });

    // Select Group as search type
    const trigger = await screen.findByTestId("type-trigger-ref");
    await user.click(trigger);

    const groupOption = await screen.findByTestId("st-option-2");
    await user.click(groupOption);

    // Click on one of the groups
    const groupTrigger = await screen.findByTestId("selectgroup-trigger-ref");
    await user.click(groupTrigger);
    await user.click(groupTrigger);

    await waitFor(() => {
      testStore.dispatch(setIsDesktop(false));
    });

    await waitFor(() => {
      testStore.dispatch(setIsDesktop(true));
    });

    const groupToSelect = await screen.findByTestId("selectgroup-3");
    await user.click(groupToSelect);

    const groupInput = await screen.findByTestId("search-group-input");
    // focus
    await user.click(groupInput);

    await waitFor(() => {
      const state = testStore.getState().search;
      expect(state.lastGroup).toBe(3);
    });
  });

  it("should handle SelectGroup query filtering", async () => {
    (setUserPrefs as Mock).mockResolvedValue({ data: { error: 0 } });
    renderWithProviders(<StorePicker />, { store: testStore });

    // Select Group as search type
    const trigger = await screen.findByTestId("type-trigger-ref");
    await user.click(trigger);

    const groupOption = await screen.findByTestId("st-option-2");
    await user.click(groupOption);

    // Click on one of the groups
    const groupTrigger = await screen.findByTestId("selectgroup-trigger-ref");
    await user.click(groupTrigger);

    const groupInput = await screen.findByTestId("search-group-input");
    // focus
    await user.click(groupInput);
    await user.clear(groupInput);
    await user.type(groupInput, "Group T");

    const listRefChildren = await screen.findByTestId("list-ref");
    expect(listRefChildren.children.length).toBe(2);
  });
});
