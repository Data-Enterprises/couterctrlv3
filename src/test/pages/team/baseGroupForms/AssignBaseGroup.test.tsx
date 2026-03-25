import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStore } from "../../../../store";

// apis to mock
import { getQuicksightUsers } from "../../../../api/quicksight";
import {
  getUserLevels,
  assignBaseGroupToUser,
  deleteUserBaseGroupLink,
  getBaseGroupsAssignedToUser,
} from "../../../../api/team";
import { getAllUsers } from "../../../../api/user";
import { getBaseGroups } from "../../../../api/baseGroups";

vi.mock("../../../../api/quicksight");
vi.mock("../../../../api/team");
vi.mock("../../../../api/user");
vi.mock("../../../../api/company");
vi.mock("../../../../api/baseGroups");

// responses
import {
  allUsersResp,
  qsUserResp,
  userLvlResp,
  loggedInUserCompanies,
} from "..";
import { selectedCompanyBGResp, bgAssignedToUserResp } from ".";

// Component being tested
import Team from "../../../../pages/team/Team";
import { setCompanies, setUserLevel } from "../../../../features/userSlice";
import { defaultError, defaultResp } from "../companyForms";

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

const stepOne = async (success: boolean = true) => {
  (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
  (getUserLevels as Mock).mockResolvedValue(userLvlResp);
  (getAllUsers as Mock).mockResolvedValue(allUsersResp);

  if (success) {
    (getBaseGroups as Mock).mockResolvedValue(selectedCompanyBGResp);
  } else {
    (getBaseGroups as Mock).mockRejectedValue(defaultError);
  }

  renderWithProviders(<Team />, { store });

  const bgForm = await screen.findByTestId("team-bg-form");
  await user.click(bgForm);

  const assignForm = await screen.findByTestId("bg-assign-form-btn");
  await user.click(assignForm);

  expect(
    await screen.findByTestId("bg-assign-form-container"),
  ).toBeInTheDocument();

  // const singleSelect = await screen.findByTestId(
  //   "single-select-trigger-icon-0",
  // );
  // await user.click(singleSelect);

  // const option = await screen.findByTestId("single-select-option-0-0");
  // await user.click(option);
};

describe("Assign User To Base Group Form", () => {
  it("should warn user about an out ranking selected user", async () => {
    await stepOne();

    const userInput = await screen.findByTestId("search-user-input");
    await user.click(userInput);

    const outrankingOption = await screen.findByTestId("search-user-0");
    await user.click(outrankingOption);

    const outrankContainer = await screen.findByTestId(
      "bg-assign-outrank-container",
    );
    expect(outrankContainer).toBeInTheDocument();

    const resetBtn = await screen.findByTestId("bg-assign-outrank-reset-btn");
    await user.click(resetBtn);

    expect(
      screen.queryByTestId("bg-assign-form-container"),
    ).toBeInTheDocument();
  });

  it("should handle api failure when fetching base groups for the selected user", async () => {
    await stepOne();

    const userInput = await screen.findByTestId("search-user-input");
    await user.click(userInput);

    (getBaseGroupsAssignedToUser as Mock).mockRejectedValue(defaultError);

    const validOption = await screen.findByTestId("search-user-1");
    await user.click(validOption);

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-0",
    );
    await user.click(singleSelect);

    const option = await screen.findByTestId("single-select-option-0-0");
    await user.click(option);
  });

  it("should handle api success when fetching base groups for the selected user", async () => {
    await stepOne();

    const userInput = await screen.findByTestId("search-user-input");
    await user.click(userInput);

    (getBaseGroupsAssignedToUser as Mock).mockResolvedValue(
      bgAssignedToUserResp,
    );

    const validOption = await screen.findByTestId("search-user-1");
    await user.click(validOption);

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-0",
    );
    await user.click(singleSelect);

    const option = await screen.findByTestId("single-select-option-0-0");
    await user.click(option);
  });

  it("should handle api failure when assigning or unassigning all base groups for the selected user", async () => {
    await stepOne();

    const userInput = await screen.findByTestId("search-user-input");
    await user.click(userInput);

    (getBaseGroupsAssignedToUser as Mock).mockResolvedValue(
      bgAssignedToUserResp,
    );

    const validOption = await screen.findByTestId("search-user-1");
    await user.click(validOption);

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-0",
    );
    await user.click(singleSelect);

    const option = await screen.findByTestId("single-select-option-0-0");
    await user.click(option);

    const assignAllBtn = await screen.findByTestId(
      "bg-assign-form-assign-all-btn",
    );

    const unassigneAllBtn = await screen.findByTestId(
      "bg-assign-form-unassign-all-btn",
    );

    (assignBaseGroupToUser as Mock).mockRejectedValue(defaultError);
    (deleteUserBaseGroupLink as Mock).mockRejectedValue(defaultError);

    await user.click(assignAllBtn);
    await user.click(unassigneAllBtn);

    await waitFor(() =>
      expect(mockedToastError).toHaveBeenCalledWith(defaultError.message),
    );
  });

  it("should handle api success when assigning or unassigning all base groups for the selected user", async () => {
    await stepOne();

    const userInput = await screen.findByTestId("search-user-input");
    await user.click(userInput);

    (getBaseGroupsAssignedToUser as Mock).mockResolvedValue(
      bgAssignedToUserResp,
    );

    const validOption = await screen.findByTestId("search-user-1");
    await user.click(validOption);

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-0",
    );
    await user.click(singleSelect);

    const option = await screen.findByTestId("single-select-option-0-0");
    await user.click(option);

    const assignAllBtn = await screen.findByTestId(
      "bg-assign-form-assign-all-btn",
    );

    const unassigneAllBtn = await screen.findByTestId(
      "bg-assign-form-unassign-all-btn",
    );

    (assignBaseGroupToUser as Mock).mockResolvedValue(defaultResp);
    (deleteUserBaseGroupLink as Mock).mockResolvedValue(defaultResp);

    await user.click(assignAllBtn);
    await user.click(unassigneAllBtn);
  });

  it("should handle api failure and success when assigning selected base groups", async () => {
    await stepOne();

    const userInput = await screen.findByTestId("search-user-input");
    await user.click(userInput);

    (getBaseGroupsAssignedToUser as Mock).mockResolvedValue(
      bgAssignedToUserResp,
    );

    const validOption = await screen.findByTestId("search-user-1");
    await user.click(validOption);

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-0",
    );
    await user.click(singleSelect);

    const option = await screen.findByTestId("single-select-option-0-0");
    await user.click(option);

    const input = await screen.findByTestId("input-unassigned");
    await user.type(input, "All Stores");
    await user.clear(input);

    const bgToAssign = await screen.findByTestId("unassigned-bg-0");
    await user.click(bgToAssign);

    (assignBaseGroupToUser as Mock).mockRejectedValue(defaultError);
    const submitBtn = await screen.findByTestId("bg-assign-form-assign-btn");
    await user.click(submitBtn);
    await waitFor(() =>
      expect(mockedToastError).toHaveBeenCalled(),
    );

    (assignBaseGroupToUser as Mock).mockResolvedValue(defaultResp);
    await user.click(submitBtn);
  });

  it("should handle api failure and success when unassigning selected base groups", async () => {
    await stepOne();

    const userInput = await screen.findByTestId("search-user-input");
    await user.click(userInput);

    (getBaseGroupsAssignedToUser as Mock).mockResolvedValue(
      bgAssignedToUserResp,
    );

    const validOption = await screen.findByTestId("search-user-1");
    await user.click(validOption);

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-0",
    );
    await user.click(singleSelect);

    const option = await screen.findByTestId("single-select-option-0-0");
    await user.click(option);

    const input = await screen.findByTestId("input-assigned");
    await user.type(input, "All Stores");
    await user.clear(input);

    const bgToUnassign = await screen.findByTestId("assigned-bg-0");
    await user.click(bgToUnassign);

    (deleteUserBaseGroupLink as Mock).mockRejectedValue(defaultError);
    const submitBtn = await screen.findByTestId("bg-assign-form-unassign-btn");
    await user.click(submitBtn);
    await waitFor(() =>
      expect(mockedToastError).toHaveBeenCalled(),
    );

    (deleteUserBaseGroupLink as Mock).mockResolvedValue(defaultResp);
    await user.click(submitBtn);
  });
});
