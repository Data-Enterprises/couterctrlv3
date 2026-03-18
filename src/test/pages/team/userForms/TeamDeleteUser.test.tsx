import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { deleteUser, getUserLevels } from "../../../../api/team";
import { getAllUsers } from "../../../../api/user";
import { getQuicksightUsers } from "../../../../api/quicksight";

import {
  allUsersResp,
  defaultResp,
  qsUserResp,
  loggedInUserCompanies,
  userLvlResp,
  assignedBGResp,
} from "..";

import { setupStore } from "../../../../store";
import Team from "../../../../pages/team/Team";
import { setCompanies, setUserLevel } from "../../../../features/userSlice";
import { getBGAssignedToUserSplit } from "../../../../api/baseGroups";

import { defaultError } from "../../sales";
import { setUserLevels } from "../../../../features/usersSlice";

const user = userEvent.setup();
const store = setupStore();
store.dispatch(setCompanies(loggedInUserCompanies));
store.dispatch(setUserLevel(5));
store.dispatch(setUserLevels(userLvlResp.data.levels));

const mockedToastSuccess = vi.fn();
const mockedToastError = vi.fn();
const mockedToastWarning = vi.fn();

vi.mock("../../../../api/quicksight");
vi.mock("../../../../api/security");
vi.mock("../../../../api/team");
vi.mock("../../../../api/user");
vi.mock("../../../../api/baseGroups");
vi.mock("../../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    success: mockedToastSuccess,
    error: mockedToastError,
    warn: mockedToastWarning,
  }),
}));

const defaultRender = () => {
  (getBGAssignedToUserSplit as Mock).mockResolvedValue(assignedBGResp);
  (getAllUsers as Mock).mockResolvedValue(allUsersResp);
  (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
  (getUserLevels as Mock).mockResolvedValue(userLvlResp);
  renderWithProviders(<Team />, { store });
};

describe("Team Page Delete User Form (DCR user)", () => {
  it("should handle api failure when fetching a selected user's assigned base groups", async () => {
    defaultRender();
    (getBGAssignedToUserSplit as Mock).mockRejectedValueOnce(defaultError);

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const deleteForm = await screen.findByTestId("user-form-delete");
    await user.click(deleteForm);

    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.type(searchUserInput, "test2"); // type in dropdown input to search for user

    const selectedUser = await screen.findByTestId("search-user-0");
    await user.click(selectedUser);
  });

  it("should handle api failure when trying to delete a user", async () => {
    defaultRender();
    (deleteUser as Mock).mockRejectedValueOnce(defaultError);

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const deleteForm = await screen.findByTestId("user-form-delete");
    await user.click(deleteForm);

    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.type(searchUserInput, "test2"); // type in dropdown input to search for user

    const selectedUser = await screen.findByTestId("search-user-0");
    await user.click(selectedUser); // select user from dropdown

    // This opens the container asking if you want to delete the user
    const deleteBtn = await screen.findByTestId("delete-user-btn");
    await user.click(deleteBtn);

    const confirmBtn = await screen.findByTestId("delete-user-confirm-btn");
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalled();
    });
  });

  it("should handle the successful deletion of a user", async () => {
    defaultRender();
    (deleteUser as Mock).mockResolvedValue(defaultResp);

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const deleteForm = await screen.findByTestId("user-form-delete");
    await user.click(deleteForm);

    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.type(searchUserInput, "test2"); // type in dropdown input to search for user

    const emailFilterBtn = await screen.findByTestId("email-filter-btn");
    await user.click(emailFilterBtn); // click email filter to switch to email filtering

    const usernameFilterBtn = await screen.findByTestId("username-filter-btn");
    await user.click(usernameFilterBtn); // click username filter to switch back to username filtering

    const selectedUser = await screen.findByTestId("search-user-0");
    await user.click(selectedUser); // select user from dropdown
    
    const cancelBtn = await screen.findByTestId("delete-user-cancel-btn");
    await user.click(cancelBtn);

    // This opens the container asking if you want to delete the user
    const deleteBtn = await screen.findByTestId("delete-user-btn");
    await user.click(deleteBtn);

    const confirmBtn = await screen.findByTestId("delete-user-confirm-btn");
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockedToastSuccess).toHaveBeenCalled();
    });
  });
});
