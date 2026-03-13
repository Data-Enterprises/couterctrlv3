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
  removeStoreFromGroup,
  updateGroup,
  addStoreToGroup,
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
import { setGroups, setRefreshGroups } from "../../../features/groupSlice";
import { getGroupsResp } from "../../components/dataLoader";

vi.mock("../../../api/groups");
const user = userEvent.setup();
const store = setupStore();
store.dispatch(setGroups(getGroupsResp.data.groups));

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

  // Create User Group Form
  it("should not allow the user to create a new group with a duplicate name", async () => {
    renderWithProviders(<Groups />, { store });

    const createForm = await screen.findByTestId("user-group-create-form-btn");
    await user.click(createForm);

    expect(screen.getByTestId("create-usergroup-form")).toBeInTheDocument();
    const input = await screen.findByTestId("input-group-name");
    await user.type(input, "Admins");

    const submitBtn = await screen.findByTestId("create-usergroup-btn");
    expect(submitBtn.className).toContain("opacity-50 pointer-events-none");
  });

  it("should handle api failure when creating a new group", async () => {
    (createGroup as Mock).mockRejectedValueOnce(JsonErrorResp);
    renderWithProviders(<Groups />, { store });

    const createForm = await screen.findByTestId("user-group-create-form-btn");
    await user.click(createForm);

    const input = await screen.findByTestId("input-group-name");
    await user.type(input, "New Group");

    const submitBtn = await screen.findByTestId("create-usergroup-btn");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(JsonErrorResp.message);
    });
  });

  it("should handle mobile css styling for create user group form", async () => {
    // setting isDesktop to false to cover the mobile styling functionality
    await waitFor(() => {
      store.dispatch(setIsDesktop(false));
    });
    renderWithProviders(<Groups />, { store });

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-0",
    );
    await user.click(singleSelect);

    const creatOption = await screen.findByTestId("single-select-option-0-0");
    await user.click(creatOption);
  });

  it("should handle api failure when fetching groups", async () => {
    // resetting back to desktop to cover the functionality
    await waitFor(() => {
      store.dispatch(setIsDesktop(true));
    });

    (getGroups as Mock).mockRejectedValueOnce(JsonErrorResp);
    (createGroup as Mock).mockResolvedValueOnce(defaultSuccessResp);
    renderWithProviders(<Groups />, { store });

    const createForm = await screen.findByTestId("user-group-create-form-btn");
    await user.click(createForm);

    expect(screen.getByTestId("create-usergroup-form")).toBeInTheDocument();
    const input = await screen.findByTestId("input-group-name");
    await user.type(input, "N");

    const submitBtn = await screen.findByTestId("create-usergroup-btn");
    await user.click(submitBtn);
  });

  it("should create a new user group successfully and refresh the group data", async () => {
    (getGroups as Mock).mockResolvedValueOnce(getGroupsSuccessResp);
    (createGroup as Mock).mockResolvedValueOnce(defaultSuccessResp);

    renderWithProviders(<Groups />, { store });

    const createForm = await screen.findByTestId("user-group-create-form-btn");
    await user.click(createForm);

    expect(screen.getByTestId("create-usergroup-form")).toBeInTheDocument();
    const input = await screen.findByTestId("input-group-name");
    await user.type(input, "New Group");

    const submitBtn = await screen.findByTestId("create-usergroup-btn");
    await user.click(submitBtn);
  });

  // Update User Group Form
  it("should handle mobile styling for update group form", async () => {
    await waitFor(() => store.dispatch(setIsDesktop(false)));
    renderWithProviders(<Groups />, { store });

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-0",
    );
    await user.click(singleSelect);

    const creatOption = await screen.findByTestId("single-select-option-0-1");
    await user.click(creatOption);
  });

  it("should not allow a user to update a group if no change is made or if the new name is a duplicate", async () => {
    await waitFor(() => store.dispatch(setIsDesktop(true)));
    renderWithProviders(<Groups />, { store });
    const updateForm = await screen.findByTestId("user-group-update-form-btn");
    await user.click(updateForm);

    const option1 = await screen.findByTestId("update-group-option-0");
    await user.click(option1);
  });

  it("should handle api failure when updating a group", async () => {
    (updateGroup as Mock).mockRejectedValueOnce(JsonErrorResp);
    renderWithProviders(<Groups />, { store });
    const updateForm = await screen.findByTestId("user-group-update-form-btn");
    await user.click(updateForm);
    const option1 = await screen.findByTestId("update-group-option-0");
    await user.click(option1);
    const input = await screen.findByTestId("input-group-name");
    await user.type(input, "Updated Group Name");
    const submitBtn = await screen.findByTestId("create-usergroup-btn");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(JsonErrorResp.message);
    });
  });

  it("should handle successfully updating a group name", async () => {
    (updateGroup as Mock).mockResolvedValueOnce(defaultSuccessResp);
    (getGroups as Mock).mockResolvedValueOnce(getGroupsSuccessResp);
    renderWithProviders(<Groups />, { store });
    const updateForm = await screen.findByTestId("user-group-update-form-btn");
    await user.click(updateForm);
    const option1 = await screen.findByTestId("update-group-option-0");
    await user.click(option1);
    const input = await screen.findByTestId("input-group-name");
    await user.type(input, "Updated Group Name");
    const submitBtn = await screen.findByTestId("create-usergroup-btn");
    await user.click(submitBtn);
  });

  // Delete User Group
  it("should handle mobile styling for delete group form", async () => {
    await waitFor(() => store.dispatch(setIsDesktop(false)));
    renderWithProviders(<Groups />, { store });

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-0",
    );
    await user.click(singleSelect);

    const deleteOption = await screen.findByTestId("single-select-option-0-2");
    await user.click(deleteOption);
  });

  it("should handle toggling on and off a selected user group", async () => {
    renderWithProviders(<Groups />, { store });
    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-0",
    );
    await user.click(singleSelect);

    const deleteOption = await screen.findByTestId("single-select-option-0-2");
    await user.click(deleteOption);

    const option1 = await screen.findByTestId("delete-group-option-0");
    await user.click(option1);
    await user.click(option1);
    await user.click(option1);

    const deleteBtn = await screen.findByTestId("delete-usergroup-btn");
    await user.click(deleteBtn);

    const cancelBtn = await screen.findByTestId("delete-cancel-btn");
    await user.click(cancelBtn);

    await waitFor(() => {
      const state = store.getState().group;
      expect(state.selectedGroup.id).toBe(0);
    });
  });

  it("should handle api failure when deleting a user group", async () => {
    await waitFor(() => store.dispatch(setIsDesktop(true)));
    (deleteGroup as Mock).mockRejectedValueOnce(JsonErrorResp);
    renderWithProviders(<Groups />, { store });

    const deleteForm = await screen.findByTestId("user-group-delete-form-btn");
    await user.click(deleteForm);
    const option1 = await screen.findByTestId("delete-group-option-0");
    await user.click(option1);
    const deleteBtn = await screen.findByTestId("delete-usergroup-btn");
    await user.click(deleteBtn);

    const submitBtn = await screen.findByTestId("delete-submit-btn");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(JsonErrorResp.message);
    });
  });

  it("should delete a user group successfully and refresh the group data", async () => {
    (deleteGroup as Mock).mockResolvedValueOnce(defaultSuccessResp);
    (getGroups as Mock).mockResolvedValueOnce(updatedGroupsAfterDeleteResp);
    renderWithProviders(<Groups />, { store });

    const deleteForm = await screen.findByTestId("user-group-delete-form-btn");
    await user.click(deleteForm);
    const option1 = await screen.findByTestId("delete-group-option-0");
    await user.click(option1);
    const deleteBtn = await screen.findByTestId("delete-usergroup-btn");
    await user.click(deleteBtn);

    const submitBtn = await screen.findByTestId("delete-submit-btn");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastSuccess).toHaveBeenCalledWith(
        "Group deleted successfully",
      );
    });
  });

  // Assign/Unassign Stores to User Group Form
  it("should handle mobile styling for assign stores to user group form", async () => {
    (getStoresAssignedToUserGroup as Mock).mockResolvedValueOnce(
      getStoresWithGroupStatusResp,
    );
    await waitFor(() => store.dispatch(setIsDesktop(false)));
    renderWithProviders(<Groups />, { store });

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-0",
    );
    await user.click(singleSelect);

    const storesOption = await screen.findByTestId("single-select-option-0-3");
    await user.click(storesOption);

    const groupSelect = await screen.findByTestId(
      "single-select-trigger-icon-1",
    );
    await user.click(groupSelect);

    const groupOption = await screen.findByTestId("single-select-option-1-0");
    await user.click(groupOption);
  });

  it("should handle api failure when fetching stores for a selected group", async () => {
    await waitFor(() => store.dispatch(setIsDesktop(true)));
    (getStoresAssignedToUserGroup as Mock).mockRejectedValueOnce(JsonErrorResp);
    renderWithProviders(<Groups />, { store });

    const storeAssignForm = await screen.findByTestId(
      "user-group-assign-form-btn",
    );
    await user.click(storeAssignForm);

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-1",
    );
    await user.click(singleSelect);

    const groupOption = await screen.findByTestId("single-select-option-1-0");
    await user.click(groupOption);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(JsonErrorResp.message);
    });
  });

  it("should handle api failure when assigning a store to a group", async () => {
    (addStoreToGroup as Mock).mockRejectedValueOnce(JsonErrorResp);
    (getStoresAssignedToUserGroup as Mock).mockResolvedValueOnce(
      getStoresWithGroupStatusResp,
    );
    renderWithProviders(<Groups />, { store });

    const storeAssignForm = await screen.findByTestId(
      "user-group-assign-form-btn",
    );
    await user.click(storeAssignForm);

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-1",
    );
    await user.click(singleSelect);

    const groupOption = await screen.findByTestId("single-select-option-1-0");
    await user.click(groupOption);

    const storeToAssign = await screen.findByTestId("unassigned-store-2");
    await user.click(storeToAssign);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(JsonErrorResp.message);
    });
  });

  it("should allow a user to assign a store to the group", async () => {
    (addStoreToGroup as Mock).mockResolvedValueOnce(defaultSuccessResp);
    (getStoresAssignedToUserGroup as Mock).mockResolvedValueOnce(
      getStoresWithGroupStatusResp,
    );
    renderWithProviders(<Groups />, { store });

    const storeAssignForm = await screen.findByTestId(
      "user-group-assign-form-btn",
    );
    await user.click(storeAssignForm);

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-1",
    );
    await user.click(singleSelect);

    const groupOption = await screen.findByTestId("single-select-option-1-0");
    await user.click(groupOption);

    const unassignedInput = await screen.findByTestId("input-unassigned---3");
    const assignedInput = await screen.findByTestId("input-assigned---3");

    await user.type(unassignedInput, "S");
    await user.type(assignedInput, "S");

    const storeToAssign = await screen.findByTestId("unassigned-store-2");
    await user.click(storeToAssign);

    await waitFor(() => {
      const state = store.getState().group;
      const activeStores = state.storesWithGroupStatus.filter(
        (s) => s.active === 1,
      );
      const inactiveStores = state.storesWithGroupStatus.filter(
        (s) => s.active === 0,
      );
      expect(activeStores.length).toBe(4);
      expect(inactiveStores.length).toBe(2);
    });
  });

  it("should handle api failure when unassigning a store from a group", async () => {
    (removeStoreFromGroup as Mock).mockRejectedValueOnce(JsonErrorResp);
    (getStoresAssignedToUserGroup as Mock).mockResolvedValueOnce(
      getStoresWithGroupStatusResp,
    );
    renderWithProviders(<Groups />, { store });

    const storeAssignForm = await screen.findByTestId(
      "user-group-assign-form-btn",
    );
    await user.click(storeAssignForm);

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-1",
    );
    await user.click(singleSelect);

    const groupOption = await screen.findByTestId("single-select-option-1-0");
    await user.click(groupOption);

    const storeToUnassign = await screen.findByTestId("assigned-store-1");
    await user.click(storeToUnassign);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(JsonErrorResp.message);
    });
  });

  it("should allow a user to unassign a store from a group", async () => {
    (removeStoreFromGroup as Mock).mockResolvedValueOnce(defaultSuccessResp);
    (getStoresAssignedToUserGroup as Mock).mockResolvedValueOnce(
      getStoresWithGroupStatusResp,
    );
    renderWithProviders(<Groups />, { store });

    const storeAssignForm = await screen.findByTestId(
      "user-group-assign-form-btn",
    );
    await user.click(storeAssignForm);

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-1",
    );
    await user.click(singleSelect);

    const groupOption = await screen.findByTestId("single-select-option-1-0");
    await user.click(groupOption);

    const storeToUnassign = await screen.findByTestId("assigned-store-1");
    await user.click(storeToUnassign);

    await waitFor(() => {
      const state = store.getState().group;
      const activeStores = state.storesWithGroupStatus.filter(
        (s) => s.active === 1,
      );
      const inactiveStores = state.storesWithGroupStatus.filter(
        (s) => s.active === 0,
      );
      expect(activeStores.length).toBe(2);
      expect(inactiveStores.length).toBe(4);
    });
  });
});
