import { describe, it, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStore } from "../../../../store";

import { allUsersResp, loggedInUserCompanies, userLvlResp } from "..";

import { getAllUsers } from "../../../../api/user";
import Team from "../../../../pages/team/Team";
import { setRefresh, setUserLevels } from "../../../../features/usersSlice";
import { setCompanies, setUserLevel } from "../../../../features/userSlice";

const user = userEvent.setup();
const store = setupStore();
store.dispatch(setCompanies(loggedInUserCompanies));
store.dispatch(setUserLevel(7));
store.dispatch(setUserLevels(userLvlResp.data.levels));

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
  renderWithProviders(<Team />, { store });
};

describe("User Info Form", () => {
  it("should allow the user to filter the users in the grid", async () => {
    defaultRender();
    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const userInfoForm = await screen.findByTestId("user-form-info");
    await user.click(userInfoForm);

    await waitFor(() => store.dispatch(setRefresh(true)));

    const input = await screen.findByTestId("input-");
    await user.type(input, "test2");

    const emailFilterOption = await screen.findByTestId("email-filter-btn");
    await user.click(emailFilterOption);

    const nameFilterOption = await screen.findByTestId("name-filter-btn");
    await user.click(nameFilterOption);
  });

  it("should allow a user to select a user and view their info", async () => {
    defaultRender();
    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const userInfoForm = await screen.findByTestId("user-form-info");
    await user.click(userInfoForm);

    const rows = await screen.findAllByRole("row");
    await user.click(rows[1]);
  });
});
