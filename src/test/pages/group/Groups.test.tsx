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
} from "../../../api/groups";
import { setIsDesktop, setToken } from "../../../features/appSlice";

// Mocked responses
import {
  defaultSuccessResp,
  getGroupsSuccessResp,
  JsonErrorResp,
  updatedGroupsAfterDeleteResp,
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
      const state = store.getState();
      console.log(state.group);
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
  
});
