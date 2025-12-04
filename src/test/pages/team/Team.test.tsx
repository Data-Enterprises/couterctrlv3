import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  createUser,
  getBaseGroupsAssignedToUser,
  updateUser,
  deleteUserBaseGroupLink,
  assignBaseGroupToUser,
  resetUserSecurityQuestion,
  unassignUserFromStore,
  assignUserToStore,
  deleteUser,
} from "../../../api/team";
import { getAllUsers, getUserStores } from "../../../api/user";
import { setTempPassword } from "../../../api/security";
import {
  baseGroupResp,
  allUsersResp,
  updateUserResp,
  deleteUpdateBaseGroupLinkResp,
  defaultResp,
  userStoresResp,
  updatedUserStoresResp,
} from ".";
import { setupStore } from "../../../store";
import Team from "../../../pages/team/Team";

const user = userEvent.setup();
const store = setupStore();
const mockedToastSuccess = vi.fn();
const mockedToastError = vi.fn();
const mockedToastWarning = vi.fn();

vi.mock("../../../api/security");
vi.mock("../../../api/team");
vi.mock("../../../api/user");
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    success: mockedToastSuccess,
    error: mockedToastError,
    warn: mockedToastWarning,
  }),
}));

describe("Team Page", () => {
  it("handles API failure gracefully", async () => {
    (getBaseGroupsAssignedToUser as Mock).mockRejectedValueOnce(
      new Error("Network Error")
    );
    (getAllUsers as Mock).mockRejectedValueOnce(new Error("Network Error"));

    renderWithProviders(<Team />);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledTimes(2);
      expect(mockedToastError).toHaveBeenCalledWith(
        expect.stringContaining("Error fetching base groups")
      );
      expect(mockedToastError).toHaveBeenCalledWith(
        expect.stringContaining("Error fetching users")
      );
    });
  });

  it("should fetch all users and handle search input", async () => {
    (getBaseGroupsAssignedToUser as Mock).mockResolvedValueOnce({
      data: baseGroupResp,
    });

    (getAllUsers as Mock).mockResolvedValueOnce({
      data: allUsersResp,
    });

    renderWithProviders(<Team />, { store });

    await waitFor(() => {
      store.dispatch({ type: "users/setUsers", payload: allUsersResp.users });
    });

    const userSearch = await screen.findByTestId("user-grid-search");
    await user.type(userSearch, "test1");

    await waitFor(() => {
      expect(userSearch).toHaveValue("test1");
    });

    await user.clear(userSearch);
    await waitFor(() => {
      expect(userSearch).toHaveValue("");
    });
  });

  it("should handle API failure when selecting a user", async () => {
    (getBaseGroupsAssignedToUser as Mock).mockRejectedValueOnce({
      message: "Network Error",
    });

    renderWithProviders(<Team />, { store });

    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((cell) => cell.textContent === "test1");
    expect(cellToClick).toBeDefined();

    await user.click(cellToClick!);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        expect.stringContaining("Error fetching user's base groups")
      );
    });
  });

  it("should handle user selection in the grid", async () => {
    (getBaseGroupsAssignedToUser as Mock).mockResolvedValue({
      data: baseGroupResp,
    });

    renderWithProviders(<Team />, { store });

    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((cell) => cell.textContent === "test1");
    expect(cellToClick).toBeDefined();

    await user.click(cellToClick!);
    await waitFor(() => {
      const state = store.getState();
      expect(state.users.selectedUserId).toBe(1);
    });
  });

  it("should handle API failure when updating user info", async () => {
    (updateUser as Mock).mockRejectedValueOnce(new Error("Update failed"));

    renderWithProviders(<Team />, { store });
    const updateBtn = await screen.findByTestId("team-update-user-button");
    await user.click(updateBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Error updating user Update failed"
      );
    });
  });

  it("should successfully update the selected user info", async () => {
    (updateUser as Mock).mockResolvedValueOnce({
      data: updateUserResp,
    });

    // These two are needed because these API calls are also made after user is updated or created
    (getBaseGroupsAssignedToUser as Mock).mockResolvedValueOnce({
      data: baseGroupResp,
    });

    (getAllUsers as Mock).mockResolvedValueOnce({
      data: allUsersResp,
    });

    renderWithProviders(<Team />, { store });

    const updateBtn = await screen.findByTestId("team-update-user-button");
    await user.click(updateBtn);

    await waitFor(() => {
      expect(mockedToastSuccess).toHaveBeenCalledWith(
        "User updated successfully"
      );
    });
  });

  it("should not allow updating if user doesn't have security or template", async () => {
    (getBaseGroupsAssignedToUser as Mock).mockResolvedValue({
      data: baseGroupResp,
    });

    renderWithProviders(<Team />, { store });

    // First, select a user without security/template
    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((cell) => cell.textContent === "test2");
    expect(cellToClick).toBeDefined();
    await user.click(cellToClick!);

    const updateBtn = await screen.findByTestId("team-update-user-button");
    await user.click(updateBtn);
  });

  it("should not allow updating if user doesn't pass the validation check", async () => {
    (getBaseGroupsAssignedToUser as Mock).mockResolvedValue({
      data: baseGroupResp,
    });

    renderWithProviders(<Team />, { store });

    // First, select a user without security/template
    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((cell) => cell.textContent === "test3");
    expect(cellToClick).toBeDefined();
    await user.click(cellToClick!);

    const updateBtn = await screen.findByTestId("team-update-user-button");
    await user.click(updateBtn);

    const clearBtn = await screen.findByTestId("clear-user-info-btn");
    await user.click(clearBtn);
  });

  it("should handle user input for the TextInputs", async () => {
    renderWithProviders(<Team />, { store });

    const username = await screen.findByTestId("text-input-username");
    const email = await screen.findByTestId("text-input-email");
    const firstName = await screen.findByTestId("text-input-first_name");
    const lastName = await screen.findByTestId("text-input-last_name");
    const createBtn = await screen.findByTestId("create-user-button");

    // Validation check for username
    await user.click(createBtn);
    await user.type(username, "test1");
    await user.click(createBtn);
    await user.type(username, "test7");
    await user.click(createBtn);

    // email
    await user.type(email, "test7@example.com");
    await user.click(createBtn);

    // first name
    await user.type(firstName, "Test");
    await user.click(createBtn);

    // last name
    await user.type(lastName, "User");
    await user.click(createBtn);
  });

  it("should handle validation for role, company, and user level", async () => {
    renderWithProviders(<Team />, { store });

    const userLvlIcon = await screen.findByTestId(
      "single-select-trigger-icon-4"
    );
    const companyIcon = await screen.findByTestId(
      "single-select-trigger-icon-5"
    );
    const userLvlOption = await screen.findByTestId("single-select-option-4-1"); // value is 2
    const companyOption = await screen.findByTestId("single-select-option-5-2"); // value is 12
    const roleIcon = await screen.findByTestId("single-select-trigger-icon-8");
    const roleOption = await screen.findByTestId("single-select-option-8-4"); // value is 9
    const createBtn = await screen.findByTestId("create-user-button");

    // user role
    await user.click(roleIcon);
    await user.click(roleOption);
    await user.click(createBtn);

    // user level
    await user.click(userLvlIcon);
    await user.click(userLvlOption);
    await user.click(createBtn);

    // company
    await user.click(companyIcon);
    await user.click(companyOption);
    await user.click(createBtn);
  });

  // Testing user creation
  it("should handle user input for creating a new user", async () => {
    // Again, these are needed because creating a new user also triggers these API calls
    (getBaseGroupsAssignedToUser as Mock).mockResolvedValueOnce({
      data: baseGroupResp,
    });

    (getAllUsers as Mock).mockResolvedValueOnce({
      data: allUsersResp,
    });

    renderWithProviders(<Team />, { store });

    const pwInput = await screen.findByTestId("text-input-password");
    const confirmPwInput = await screen.findByTestId(
      "text-input-confirm_password"
    );

    (createUser as Mock).mockRejectedValueOnce({
      message: "Creation failed",
    });

    (createUser as Mock).mockResolvedValueOnce({
      data: {
        error: 0,
      },
    });

    const createBtn = await screen.findByTestId("create-user-button");

    // pw
    const eyeIcon = await screen.findAllByTestId("eye-icon");
    await user.click(eyeIcon[0]); // to show the password and get test coverage for the Eye Icon

    await user.type(pwInput, "SecureP@ssw0rd!");
    await user.type(confirmPwInput, "SecureP@ssw0rd");
    await user.click(createBtn);
    await user.clear(confirmPwInput);
    await user.type(confirmPwInput, "SecureP@ssw0rd!");
    await user.click(createBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Error creating user Creation failed"
      );
    });

    await user.click(createBtn);

    await waitFor(() => {
      expect(mockedToastSuccess).toHaveBeenCalledWith(
        "User created successfully"
      );
    });
  });

  // Base Groups
  it("should assign or unassign base groups when a user is selected", async () => {
    (getBaseGroupsAssignedToUser as Mock).mockResolvedValueOnce({
      data: baseGroupResp,
    });

    (deleteUserBaseGroupLink as Mock).mockResolvedValueOnce({
      data: deleteUpdateBaseGroupLinkResp,
    });

    (assignBaseGroupToUser as Mock).mockResolvedValueOnce({
      data: deleteUpdateBaseGroupLinkResp,
    });

    renderWithProviders(<Team />, { store });

    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((cell) => cell.textContent === "test1");
    expect(cellToClick).toBeDefined();
    await user.click(cellToClick!);

    const groupPanel = await screen.findByTestId("base-group-panel-59");
    const groupPanelTwo = await screen.findByTestId("base-group-panel-41");
    expect(groupPanel).toBeDefined();

    // Unassign the group
    await user.click(groupPanel); // this group is already assigned

    // Assign the group => the previsous unassign action must have succeeded
    await user.click(groupPanelTwo);
  });

  it("should handle API failure when assigning/unassigning base groups", async () => {
    (getBaseGroupsAssignedToUser as Mock).mockResolvedValueOnce({
      data: baseGroupResp,
    });

    (deleteUserBaseGroupLink as Mock).mockRejectedValueOnce(
      new Error("Unassign failed")
    );

    (assignBaseGroupToUser as Mock).mockRejectedValueOnce(
      new Error("Assign failed")
    );

    renderWithProviders(<Team />, { store });

    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((cell) => cell.textContent === "test1");
    expect(cellToClick).toBeDefined();
    await user.click(cellToClick!);

    const groupPanel = await screen.findByTestId("base-group-panel-59");
    const groupPanelTwo = await screen.findByTestId("base-group-panel-41");
    await user.click(groupPanel);
    await user.click(groupPanelTwo);
  });

  it("should handle resetting user's password", async () => {
    (getBaseGroupsAssignedToUser as Mock).mockResolvedValueOnce({
      data: baseGroupResp,
    });

    (setTempPassword as Mock).mockResolvedValueOnce({
      data: defaultResp,
    });

    renderWithProviders(<Team />, { store });

    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((cell) => cell.textContent === "test1");
    expect(cellToClick).toBeDefined();
    await user.click(cellToClick!);

    const resetPW = await screen.findByTestId("team-reset-pw-btn");
    await user.click(resetPW);
  });

  it("should handle failure resetting user's password", async () => {
    (getBaseGroupsAssignedToUser as Mock).mockResolvedValueOnce({
      data: baseGroupResp,
    });

    (setTempPassword as Mock).mockRejectedValueOnce(new Error("Reset failed"));

    renderWithProviders(<Team />, { store });

    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((cell) => cell.textContent === "test1");
    expect(cellToClick).toBeDefined();
    await user.click(cellToClick!);

    const pwInput = await screen.findByTestId("text-input-password");
    const confirmPwInput = await screen.findByTestId(
      "text-input-confirm_password"
    );
    await user.clear(pwInput);
    await user.type(pwInput, "NewTempP@ssw0rd!");

    const resetPW = await screen.findByTestId("team-reset-pw-btn");
    await user.click(resetPW);

    await waitFor(() => {
      expect(mockedToastWarning).toHaveBeenCalledWith("Passwords do not match");
    });

    // Now match the passwords and get the error
    await user.clear(confirmPwInput);
    await user.type(confirmPwInput, "NewTempP@ssw0rd!");
    await user.click(resetPW);
    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Error resetting password: Reset failed"
      );
    });
  });

  // Security Question Reset
  it("should handle resetting user's security flag", async () => {
    (getBaseGroupsAssignedToUser as Mock).mockResolvedValueOnce({
      data: baseGroupResp,
    });

    (resetUserSecurityQuestion as Mock).mockResolvedValueOnce({
      data: defaultResp,
    });

    renderWithProviders(<Team />, { store });

    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((cell) => cell.textContent === "test1");
    expect(cellToClick).toBeDefined();
    await user.click(cellToClick!);

    const resetSecurity = await screen.findByTestId("team-reset-security-btn");
    await user.click(resetSecurity);
  });

  it("should handle failure resetting user's security flag", async () => {
    (resetUserSecurityQuestion as Mock).mockRejectedValueOnce(
      new Error("Reset failed")
    );

    renderWithProviders(<Team />, { store });
    const resetSecurity = await screen.findByTestId("team-reset-security-btn");
    await user.click(resetSecurity);
  });

  it("should handle all failure and success scenarios for Assign Stores Modal", async () => {
    // Failure to fetch user's stores
    (getUserStores as Mock).mockRejectedValueOnce(new Error("Fetch failed"));

    // initial rendering
    renderWithProviders(<Team />, { store });

    // Try to open the modal the first time (meant to fail)
    const assignStoresBtn = await screen.findByTestId("team-assign-stores-btn");
    await user.click(assignStoresBtn);
    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Error fetching available stores Fetch failed"
      );
    });

    // Now handle the successful fetch for user stores
    (getUserStores as Mock).mockResolvedValueOnce({
      data: userStoresResp,
    });

    // Re-open the modal
    await user.click(assignStoresBtn);
    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();

    // Handle the failure to assign/unassign stores first
    (unassignUserFromStore as Mock).mockRejectedValueOnce(
      new Error("Unassign failed")
    );

    // Modal already open so we use these test ids => from the mock response
    const assignedStore = await screen.findByTestId("assigned-store-1");
    const unassignedStore = await screen.findByTestId("unassigned-store-5");

    // Unassign store => failure
    await user.click(assignedStore);
    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Error unassigning store Unassign failed"
      );
    });

    // Unassign store => success
    (unassignUserFromStore as Mock).mockResolvedValueOnce({
      data: defaultResp,
    });
    await user.click(assignedStore);

    // Assign store => failure
    (assignUserToStore as Mock).mockRejectedValueOnce(
      new Error("Assign failed")
    );
    await user.click(unassignedStore);
    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Error assigning store Assign failed"
      );
    });

    (getUserStores as Mock).mockResolvedValueOnce({
      data: updatedUserStoresResp,
    });

    // Now assign store => success
    (assignUserToStore as Mock).mockResolvedValueOnce({
      data: defaultResp,
    });
    await user.click(unassignedStore);

    // Both respective stores should be in their opposite containers now
    await waitFor(() => {
      const state = store.getState().users.selectedUserStores;
      expect(state.assigned.find((s) => s.storeid === 5)).toBeDefined();
      expect(state.unassigned.find((s) => s.storeid === 1)).toBeDefined();
    });

    // click outside the modal to close
    await user.click(modal);
    await waitFor(() => {
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });
  });

  // Handling the deletion of a user
  it("should handle opening/closing the Delete User Modal and deleting a user", async () => {
    // Successfully deleting a user sets refresh to true in the users slice
    // so these responses are needed in order to completely recreate the scenario
    (getBaseGroupsAssignedToUser as Mock).mockResolvedValueOnce({
      data: baseGroupResp,
    });

    (getAllUsers as Mock).mockResolvedValueOnce({
      data: allUsersResp,
    });

    (deleteUser as Mock).mockRejectedValueOnce(new Error("Delete failed"));

    renderWithProviders(<Team />, { store });

    const deleteUserBtn = await screen.findByTestId("team-delete-user-btn");
    await user.click(deleteUserBtn);

    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();

    const cancelBtn = await screen.findByTestId("delete-user-modal-cancel");
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    // Re-open and confirm deletion
    await user.click(deleteUserBtn);
    const deleteBtn = await screen.findByTestId("delete-user-modal-delete");
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Error deleting user - Delete failed"
      );
    });

    // Now handle successful deletion
    (deleteUser as Mock).mockResolvedValueOnce({
      data: defaultResp,
    });

    await user.click(deleteBtn);
    await waitFor(() => {
      expect(mockedToastSuccess).toHaveBeenCalledWith(
        "User deleted successfully"
      );
    });
  });
});
