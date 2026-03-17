import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStore } from "../../../../store";
import { setCompanies, setUserLevel } from "../../../../features/userSlice";
import { setRefresh, setUserLevels } from "../../../../features/usersSlice";
import { allUsersResp, nonDCRCompanies, userLvlResp } from "..";
import { getAllUsers } from "../../../../api/user";
import Team from "../../../../pages/team/Team";

const user = userEvent.setup();
const store = setupStore();
store.dispatch(setCompanies(nonDCRCompanies));
store.dispatch(setUserLevel(7));
store.dispatch(setUserLevels(userLvlResp.data.levels));

vi.mock("../../../../api/user");

const mockedToastError = vi.fn();
vi.mock("../../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockedToastError,
  }),
}));

const defaultRender = () => {
  (getAllUsers as Mock).mockResolvedValue(allUsersResp);
  renderWithProviders(<Team />, { store });
};

describe("User Info Form - No User Selected", () => {
  it("should handle non-DCR users", async () => {
    defaultRender();

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const userInfoForm = await screen.findByTestId("user-form-info");
    await user.click(userInfoForm);

    await waitFor(() => store.dispatch(setRefresh(true)));
  });

  it("should handle api failure when refreshing user grid", async () => {
    defaultRender();

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const userInfoForm = await screen.findByTestId("user-form-info");
    await user.click(userInfoForm);

    (getAllUsers as Mock).mockRejectedValue(new Error("API Error"));
    await waitFor(() => store.dispatch(setRefresh(true)));
    await waitFor(() =>
      expect(mockedToastError).toHaveBeenCalled()
    );
  });
});
