import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStore } from "../../../../store";

// apis to mock
import { getQuicksightUsers } from "../../../../api/quicksight";
import { getUserLevels } from "../../../../api/team";
import { getAllUsers, getUserStores } from "../../../../api/user";

vi.mock("../../../../api/quicksight");
vi.mock("../../../../api/team");
vi.mock("../../../../api/user");
// vi.mock("../../../../api/company");
// vi.mock("../../../../api/baseGroups");

// responses
import {
  allUsersResp,
  qsUserResp,
  userLvlResp,
  loggedInUserCompanies,
} from "..";
import {
  userStoresResp,
  defaultError,
  // , defaultResp
} from ".";

// Component being tested
import Team from "../../../../pages/team/Team";
import { setCompanies, setUserLevel } from "../../../../features/userSlice";

// redux/user events
const user = userEvent.setup();
const store = setupStore();
store.dispatch(setUserLevel(5));
store.dispatch(setCompanies(loggedInUserCompanies));

// Mock Toast
const mockedToastSuccess = vi.fn();
const mockedToastError = vi.fn();
vi.mock("../../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    success: mockedToastSuccess,
    error: mockedToastError,
  }),
}));

const stepOne = async () => {
  (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
  (getUserLevels as Mock).mockResolvedValue(userLvlResp);
  (getAllUsers as Mock).mockResolvedValue(allUsersResp);

  renderWithProviders(<Team />, { store });

  const storesForm = await screen.findByTestId("team-stores-form");
  await user.click(storesForm);

  const userStoreForm = await screen.findByTestId("user-store-assign-btn");
  await user.click(userStoreForm);

  expect(
    await screen.findByTestId("user-store-form-main-container"),
  ).toBeInTheDocument();
};

describe("Assign/Unassign Stores to User Form", () => {
  it("should render the outranked warning if an outranking user is selected", async () => {
    await stepOne();

    const input = await screen.findByTestId("search-user-input");
    await user.click(input);

    const outRankedOption = await screen.findByTestId("search-user-0");
    await user.click(outRankedOption);

    expect(
      await screen.findByTestId("user-store-form-outranked-container"),
    ).toBeInTheDocument();

    const resetBtn = await screen.findByTestId(
      "user-store-form-outranked-reset-btn",
    );
    await user.click(resetBtn);

    expect(
      await screen.findByTestId("user-store-form-main-container"),
    ).toBeInTheDocument();
  });

  it("should handle api failure when fetching stores for a user", async () => {
    await stepOne();

    (getUserStores as Mock).mockRejectedValue(defaultError);
    const input = await screen.findByTestId("search-user-input");
    await user.click(input);

    const validUser = await screen.findByTestId("search-user-1");
    await user.click(validUser);
    await waitFor(() => expect(mockedToastError).toHaveBeenCalled());
  });

  it("should fetch the valid selected user's stores", async () => {
    await stepOne();

    (getUserStores as Mock).mockResolvedValue(userStoresResp);
    const input = await screen.findByTestId("search-user-input");
    await user.click(input);

    const validUser = await screen.findByTestId("search-user-1");
    await user.click(validUser);
  });
});
