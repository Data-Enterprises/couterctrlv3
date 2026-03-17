import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { updateUser, getUserLevels } from "../../../../api/team";
import { getAllUsers, getUserStores } from "../../../../api/user";
import { getQuicksightUsers } from "../../../../api/quicksight";
import {
  allUsersResp,
  defaultResp,
  userStoresResp,
  qsUserResp,
  loggedInUserCompanies,
  userLvlResp,
} from "..";
import { setupStore } from "../../../../store";
import Team from "../../../../pages/team/Team";
import { setCompanies, setUserLevel } from "../../../../features/userSlice";
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
  (getAllUsers as Mock).mockResolvedValue(allUsersResp);
  (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
  (getUserLevels as Mock).mockResolvedValue(userLvlResp);
  renderWithProviders(<Team />, { store });
};

describe("Team Page Update User Form (DCR user)", () => {
  it("should now allow a user to modify a user with higher user level", async () => {
    defaultRender();

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const updateForm = await screen.findByTestId("user-form-update");
    await user.click(updateForm);
    const searchUserInput = await screen.findByTestId("search-user-input");

    await user.click(searchUserInput); // open dropdown
    await user.click(document.body); // close dropdown
    await user.type(searchUserInput, "test1"); // type in dropdown input to search for user

    const selectedUser = await screen.findByTestId("search-user-0");
    await user.click(selectedUser); // select user from dropdown

    // From here the isOutranked flag gets triggered, so click on the reset button
    const outrankedContainer = await screen.findByTestId("outranked-container");
    const resetBtn = await screen.findByTestId("reset-outranked-btn");

    expect(outrankedContainer).toBeInTheDocument();
    await user.click(resetBtn);
    expect(outrankedContainer).not.toBeInTheDocument();
  });

  it("should allow a user to be selected if not outranked", async () => {
    (updateUser as Mock).mockResolvedValue(defaultResp);
    (getUserStores as Mock).mockResolvedValue(userStoresResp);
    defaultRender();

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const updateForm = await screen.findByTestId("user-form-update");
    await user.click(updateForm);

    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.type(searchUserInput, "test2"); // type in dropdown input to search for user

    const selectedUser = await screen.findByTestId("search-user-0");
    await user.click(selectedUser); // select user from dropdown

    const updateBtn = await screen.findByTestId("update-user-btn");
    await user.click(updateBtn);
  });

  it("should handle api failure for the update user endpoint", async () => {
    (updateUser as Mock).mockRejectedValue(defaultError);
    defaultRender();

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const updateForm = await screen.findByTestId("user-form-update");
    await user.click(updateForm);

    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.type(searchUserInput, "test2"); // type in dropdown input to search for user

    const selectedUser = await screen.findByTestId("search-user-0");
    await user.click(selectedUser); // select user from dropdown

    const updateBtn = await screen.findByTestId("update-user-btn");
    await user.click(updateBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalled();
    });
  });

  it("should handle api failure when fetching user stores after successful update", async () => {
    (updateUser as Mock).mockResolvedValue(defaultResp);
    (getUserStores as Mock).mockRejectedValue(defaultError);
    defaultRender();

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const updateForm = await screen.findByTestId("user-form-update");
    await user.click(updateForm);

    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.type(searchUserInput, "test2"); // type in dropdown input to search for user

    const selectedUser = await screen.findByTestId("search-user-0");
    await user.click(selectedUser); // select user from dropdown

    const updateBtn = await screen.findByTestId("update-user-btn");
    await user.click(updateBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalled();
    });
  });
});
