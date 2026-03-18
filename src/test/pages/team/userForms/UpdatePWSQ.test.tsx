import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStore } from "../../../../store";

import { resetUserSecurityQuestion } from "../../../../api/team";
import { setTempPassword } from "../../../../api/security";
import {
  allUsersResp,
  defaultResp,
  qsUserResp,
  loggedInUserCompanies,
  userLvlResp,
} from "..";

import Team from "../../../../pages/team/Team";
import { getAllUsers } from "../../../../api/user";
import { getQuicksightUsers } from "../../../../api/quicksight";
import { getUserLevels } from "../../../../api/team";
import { setCompanies, setUserLevel } from "../../../../features/userSlice";
import { defaultError } from "../../sales";

const user = userEvent.setup();
const store = setupStore();
store.dispatch(setCompanies(loggedInUserCompanies));
store.dispatch(setUserLevel(7));

vi.mock("../../../../api/quicksight");
vi.mock("../../../../api/security");
vi.mock("../../../../api/team");
vi.mock("../../../../api/user");

const mockedToastSuccess = vi.fn();
const mockedToastError = vi.fn();
const mockedToastWarning = vi.fn();
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

describe("Update Security Question and Password Forms", () => {
  it("should allow a user to update the password flag for a user", async () => {
    defaultRender();
    (setTempPassword as Mock).mockResolvedValue(defaultResp);

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const updatePWForm = await screen.findByTestId("user-form-update-pw");
    await user.click(updatePWForm);

    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.type(searchUserInput, "test1"); // type in dropdown input to search for user

    const selectedUser = await screen.findByTestId("search-user-0");
    await user.click(selectedUser);

    const pwInput = await screen.findByTestId("text-input-password");
    const confirmInput = await screen.findByTestId(
      "text-input-confirm_password",
    );
    const submitBtn = await screen.findByTestId("update-pw-submit-btn");

    await user.type(pwInput, "NewTempPassword123!");
    await user.type(confirmInput, "NewTempPassword123!");

    await user.click(submitBtn);
  });

  it("should handle api failure when updating the password flag for a user", async () => {
    defaultRender();
    (setTempPassword as Mock).mockRejectedValue(defaultError);

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const updatePWForm = await screen.findByTestId("user-form-update-pw");
    await user.click(updatePWForm);

    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.type(searchUserInput, "test1"); // type in dropdown input to search for user

    const selectedUser = await screen.findByTestId("search-user-0");
    await user.click(selectedUser);

    const pwInput = await screen.findByTestId("text-input-password");
    const confirmInput = await screen.findByTestId(
      "text-input-confirm_password",
    );
    const submitBtn = await screen.findByTestId("update-pw-submit-btn");

    await user.type(pwInput, "Password123!");
    await user.type(confirmInput, "Password123!");

    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalled();
    });
  });

  it("should allow a user to update the security question for a user", async () => {
    defaultRender();
    (resetUserSecurityQuestion as Mock).mockResolvedValue(defaultResp);
    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const securityForm = await screen.findByTestId("user-form-update-sq");
    await user.click(securityForm);

    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.type(searchUserInput, "test1"); // type in dropdown input to search for user

    const selectedUser = await screen.findByTestId("search-user-0");
    await user.click(selectedUser);

    const submitBtn = await screen.findByTestId("reset-security-submit-btn");
    await user.click(submitBtn);
  });

  it("should handle api failure when updating the security question for a user", async () => {
    defaultRender();
    (resetUserSecurityQuestion as Mock).mockRejectedValue(defaultError);
    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const securityForm = await screen.findByTestId("user-form-update-sq");
    await user.click(securityForm);

    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.type(searchUserInput, "test1"); // type in dropdown input to search for user

    const selectedUser = await screen.findByTestId("search-user-0");
    await user.click(selectedUser);

    const submitBtn = await screen.findByTestId("reset-security-submit-btn");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalled();
    });
  });
});
