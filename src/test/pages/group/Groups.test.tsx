import { describe, it, expect, vi, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../utils";
import Groups from "../../../pages/groups/Groups";
import userEvent from "@testing-library/user-event";
import { setupStore } from "../../../store";
import {
  getGroups,
  getStoresAssignedToUserGroup,
  createGroup,
  deleteGroup,
  addStoreToGroup,
  removeStoreFromGroup,
} from "../../../api/groups";
import { setIsDesktop, setToken } from "../../../features/appSlice";

// Mocked responses
import {
  defaultSuccessResp,
  getGroupsSuccessResp,
  JsonErrorResp,
  updatedGroupsAfterDeleteResp,
  getStoresWithGroupStatusResp,
} from "./index";
import { setRefreshGroups } from "../../../features/groupSlice";

vi.mock("../../../api/groups");
const user = userEvent.setup();
const store = setupStore();

const mockedToastSuccess = vi.fn();
const mockedToastError = vi.fn();
const mockedToastWarn = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    success: mockedToastSuccess,
    warn: mockedToastWarn,
    error: mockedToastError,
  }),
}));

describe("Groups Page", () => {
  it("should render without crashing", async () => {
    renderWithProviders(<Groups />, { store });
    const groupsPage = screen.getByTestId("groups-page");
    expect(groupsPage).toBeInTheDocument();

    // Setting the token to getData after user interactions in the child components
    await waitFor(() => {
      store.dispatch(setToken("test-token"));
    });
  });

  // Create Group COMPONENT TESTS
  // ////////////////////////////
  it("should create a group or throw warning if group input is empty", async () => {
    (getGroups as Mock).mockResolvedValue(getGroupsSuccessResp);
    (createGroup as Mock).mockRejectedValue(JsonErrorResp);

    renderWithProviders(<Groups />, { store });

    const createInput = screen.getByTestId("create-group-input");
    const createButton = screen.getByTestId("group-create-btn");
    expect(createInput).toBeInTheDocument();
    expect(createButton).toBeInTheDocument();

    // Throw warning if create input is empty
    await user.click(createButton);
    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith("Please enter a group name");
    });

    // Type in the create input => will call createGroup API
    await user.type(createInput, "Test Group");
    await user.click(createButton);

    // Handl Error
    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith("API request failed");
    });

    // Now handle the success
    (createGroup as Mock).mockResolvedValue(defaultSuccessResp);
    await user.click(createButton);
    await waitFor(() => {
      expect(mockedToastSuccess).toHaveBeenCalledWith(
        "Group created successfully"
      );
    });
  });

  it("should handle the deleting of a group and any errors with deleting the group", async () => {
    (getGroups as Mock).mockResolvedValue(updatedGroupsAfterDeleteResp);
    renderWithProviders(<Groups />, { store });

    const openDeleteModalBtn = await screen.findByTestId("group-delete-btn");
    expect(openDeleteModalBtn).toBeInTheDocument();
    await user.click(openDeleteModalBtn);

    // Should warn if input is empty
    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith(
        "Please enter a group name to delete"
      );
    });

    // Should warn if the user's group does not exist => typed from input
    const createInput = screen.getByTestId("create-group-input");
    await user.type(createInput, "Nonexistent Group");
    await user.click(openDeleteModalBtn);
    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith("User group does not exist");
    });

    // Then get the modal to open for a valid group
    await user.clear(createInput);
    await user.type(createInput, "Managers");
    await user.click(openDeleteModalBtn);

    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();

    // Handle opening and closing of delete group modal
    const cancelBtn = screen.getByTestId("modal-cancel-btn");
    const confirmBtn = screen.getByTestId("modal-confirm-btn");
    expect(cancelBtn).toBeInTheDocument();
    expect(confirmBtn).toBeInTheDocument();

    // close the modal first
    await user.click(cancelBtn);
    await user.click(openDeleteModalBtn);

    // clicking outside the modal to close then reopen
    await user.click(document.body);
    await user.click(openDeleteModalBtn);

    // Now confirm deletion with error
    (deleteGroup as Mock).mockRejectedValue(JsonErrorResp);
    const newConfirm = await screen.findByTestId("modal-confirm-btn");
    expect(newConfirm).toBeInTheDocument();
    await user.click(newConfirm);
    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith("API request failed");
    });

    // Now successfully delete the group
    (deleteGroup as Mock).mockResolvedValue(defaultSuccessResp);
    await user.click(newConfirm);

    await waitFor(() => {
      expect(mockedToastSuccess).toHaveBeenCalledWith(
        "Group deleted successfully"
      );
    });
  });

  it("should handle API error when fetching groups", async () => {
    const newStore = setupStore();
    (getGroups as Mock).mockRejectedValue(JsonErrorResp);
    newStore.dispatch(setToken("test-token"));
    newStore.dispatch(setRefreshGroups(true));

    renderWithProviders(<Groups />, { store: newStore });
    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith("API request failed");
    });
  });

  it("should handle mobile styling", async () => {
    const mobileStore = setupStore();
    mobileStore.dispatch(setIsDesktop(false));

    renderWithProviders(<Groups />, { store: mobileStore });
    const container = await screen.findByTestId("groups-page");
    expect(container).toHaveClass(
      "w-full h-[calc(100vh-3rem)] p-2 flex flex-col gap-2"
    );
  });

  // Select Group COMPONENT TESTS
  // ////////////////////////////
  it("should handle selecting a group with failure and success api calls", async () => {
    // (getGroups as Mock).mockResolvedValue(getGroupsSuccessResp);
    (getStoresAssignedToUserGroup as Mock).mockRejectedValue(JsonErrorResp);
    renderWithProviders(<Groups />, { store });

    const selectGroupIcon = await screen.findByTestId(
      "single-select-trigger-icon-1"
    );
    expect(selectGroupIcon).toBeInTheDocument();
    await user.click(selectGroupIcon);

    // Select the first group and handle error then success
    const groupToSelect = await screen.findByTestId("single-select-option-1-0");
    expect(groupToSelect).toBeInTheDocument();
    await user.click(groupToSelect);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith("API request failed");
    });

    // Now handle the successful fetching of stores with group status
    (getStoresAssignedToUserGroup as Mock).mockResolvedValue(
      getStoresWithGroupStatusResp
    );

    await user.click(selectGroupIcon);
    await user.click(groupToSelect);

    await waitFor(() => {
      const state = store.getState();
      expect(state.group.storesWithGroupStatus.length).toBeGreaterThan(0);
    });
  });

  it("should handle selecting filter options", async () => {
    renderWithProviders(<Groups />, { store });
    const filterOptionsIcon = await screen.findByTestId(
      "single-select-trigger-icon-2"
    );
    expect(filterOptionsIcon).toBeInTheDocument();
    await user.click(filterOptionsIcon);

    // Selecting Inactive option
    const inactiveOption = await screen.findByTestId(
      "single-select-option-2-2"
    );
    expect(inactiveOption).toBeInTheDocument();
    await user.click(inactiveOption);

    await waitFor(() => {
      const state = store.getState();
      expect(state.group.filterOption).toBe("inactive");
    });

    // Selecting Active options
    const activeOption = await screen.findByTestId("single-select-option-2-1");
    expect(activeOption).toBeInTheDocument();
    await user.click(activeOption);

    await waitFor(() => {
      const state = store.getState();
      expect(state.group.filterOption).toBe("active");
    });

    // Selecting All option
    const allOption = await screen.findByTestId("single-select-option-2-0");
    expect(allOption).toBeInTheDocument();
    await user.click(allOption);
    await waitFor(() => {
      const state = store.getState();
      expect(state.group.filterOption).toBe("all");
    });
  });

  // GROUP LIST COMPONENT TESTS
  // ////////////////////////////
  it("should handle columns by window resize", async () => {
    renderWithProviders(<Groups />, { store });
    const groupListCards = await screen.findByTestId("group-list-cards");
    expect(groupListCards).toBeInTheDocument();
    // Default is desktop size
    expect(groupListCards).toHaveClass("grid-cols-3");

    // Resize to mobile
    await waitFor(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 500,
      });
      window.dispatchEvent(new Event("resize"));
      expect(window.innerWidth).toBe(500);
    });

    // Reset back to desktop
    await waitFor(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1536,
      });
      window.dispatchEvent(new Event("resize"));
      expect(window.innerWidth).toBe(1536);
    });
  });

  it("should handle the filtering of stores based on search input and group filter option", async () => {
    renderWithProviders(<Groups />, { store });
    const searchInput = await screen.findByTestId("store-search-input");
    expect(searchInput).toBeInTheDocument();

    // handle input change
    await user.type(searchInput, "Store 12");
    expect(searchInput).toHaveValue("Store 12");
    const groupListCards = await screen.findByTestId("group-list-cards");

    // There should be only one store card showing
    await waitFor(() => {
      const children = groupListCards.children;
      expect(children.length).toBe(1);
    });

    // Clearing the input should put back all the store cards
    await user.clear(searchInput);
    expect(searchInput).toHaveValue("");
    await waitFor(() => {
      const children = groupListCards.children;
      expect(children.length).toBeGreaterThan(1);
    });
  });

  it("should handle adding store to group", async () => {
    // test the failure first
    (addStoreToGroup as Mock).mockRejectedValue(JsonErrorResp);
    renderWithProviders(<Groups />, { store });

    const groupListCards = await screen.findByTestId("group-list-cards");
    expect(groupListCards).toBeInTheDocument();

    const firstStoreCard = await screen.findByTestId("grouplist-store-card-2");
    const secondChild = firstStoreCard.children[1];
    expect(secondChild.innerHTML).toContain("Inactive");
    await user.click(firstStoreCard);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith("API request failed");
    });

    // Now test the success
    (addStoreToGroup as Mock).mockResolvedValue(defaultSuccessResp);
    await user.click(firstStoreCard);

    await waitFor(() => {
      expect(mockedToastSuccess).toHaveBeenCalledWith(
        "Store added to group successfully"
      );
    });
  });

  it("should handle removing store from group", async () => {
    // test the failure first
    (removeStoreFromGroup as Mock).mockRejectedValue(JsonErrorResp);
    renderWithProviders(<Groups />, { store });

    const groupListCards = await screen.findByTestId("group-list-cards");
    expect(groupListCards).toBeInTheDocument();

    const storeToRemove = await screen.findByTestId("grouplist-store-card-1");
    const firstChild = storeToRemove.children[1];
    expect(firstChild.innerHTML).toContain("Active");
    await user.click(storeToRemove);
    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith("API request failed");
    });

    // Now test the success
    (removeStoreFromGroup as Mock).mockResolvedValue(defaultSuccessResp);
    await user.click(storeToRemove);
    await waitFor(() => {
      expect(mockedToastSuccess).toHaveBeenCalledWith(
        "Store removed from group successfully"
      );
    });
  });
});
