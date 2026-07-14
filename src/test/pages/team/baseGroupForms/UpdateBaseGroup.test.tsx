import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStore } from "../../../../store";

// apis to mock
import { getQuicksightUsers } from "../../../../api/quicksight";
import { getUserLevels } from "../../../../api/team";
import { getAllUsers } from "../../../../api/user";
import { getBaseGroups, updateBaseGroup } from "../../../../api/baseGroups";

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
import { selectedCompanyBGResp, updatedBGResp } from ".";

// Component being tested
import Team from "../../../../pages/team/TeamLegacy";
import { setCompanies, setUserLevel } from "../../../../features/userSlice";
import { defaultError, defaultResp } from "../companyForms";

// redux/user events
const user = userEvent.setup();
const store = setupStore();
store.dispatch(setUserLevel(9));
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

  const updateForm = await screen.findByTestId("bg-update-form-btn");
  await user.click(updateForm);

  expect(
    await screen.findByTestId("update-bg-form-container"),
  ).toBeInTheDocument();

  const singleSelect = await screen.findByTestId(
    "single-select-trigger-icon-0",
  );
  await user.click(singleSelect);

  const option = await screen.findByTestId("single-select-option-0-0");
  await user.click(option);
};

describe("Team Page Base Groups Form", () => {
  it("should handle api failure when fetching base groups on load", async () => {
    await stepOne(false);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(defaultError.message);
    });
  });

  it("should handle api failure when updating a group", async () => {
    await stepOne();

    const bgToUpdate = await screen.findByTestId("bg-option-1");

    // Toggling selected, unselected, back to selected to cover the handleBGSelect event handler
    await user.click(bgToUpdate);
    await user.click(bgToUpdate);
    await user.click(bgToUpdate);

    const input = await screen.findByTestId("input-group-name");
    await user.type(input, "updated group");

    const submitBtn = await screen.findByTestId("submit-update-bg-btn");
    (updateBaseGroup as Mock).mockRejectedValue(defaultError);
    await user.click(submitBtn);
  });

  it("should handle api failure when updating a group", async () => {
    await stepOne();

    const bgToUpdate = await screen.findByTestId("bg-option-1");
    await user.click(bgToUpdate);

    const input = await screen.findByTestId("input-group-name");
    await user.type(input, "updated group");

    const submitBtn = await screen.findByTestId("submit-update-bg-btn");
    (getBaseGroups as Mock).mockResolvedValue(updatedBGResp);
    (updateBaseGroup as Mock).mockResolvedValue(defaultResp);
    await user.click(submitBtn);
  });
});
