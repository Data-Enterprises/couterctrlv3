import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStore } from "../../../../store";

// apis to mock
import { getQuicksightUsers } from "../../../../api/quicksight";
import { getUserLevels } from "../../../../api/team";
import { getAllUsers } from "../../../../api/user";
import { getBaseGroups, deleteBaseGroup } from "../../../../api/baseGroups";

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
import { selectedCompanyBGResp } from ".";

// Component being tested
import Team from "../../../../pages/team/Team";
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

  const deleteForm = await screen.findByTestId("bg-delete-form-btn");
  await user.click(deleteForm);

  expect(
    await screen.findByTestId("bg-delete-step-1-container"),
  ).toBeInTheDocument();

  const singleSelect = await screen.findByTestId(
    "single-select-trigger-icon-0",
  );
  await user.click(singleSelect);

  const option = await screen.findByTestId("single-select-option-0-0");
  await user.click(option);
};

describe("Delete Base Group Form", () => {
  it("should handle api failure when fetching base groups on load", async () => {
    await stepOne(false);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(defaultError.message);
    });
  });

  it("should handle delete step 1 to step 2 transition", async () => {
    await stepOne();

    const bgOption = await screen.findByTestId("bg-option-0");

    // Toggling selected/unselected/selected to cover handleBGSelect event handler
    await user.click(bgOption);
    await user.click(bgOption);
    await user.click(bgOption);

    const stepOneSubmitBtn = await screen.findByTestId(
      "bg-delete-step-1-submit-btn",
    );
    await user.click(stepOneSubmitBtn);

    expect(
      await screen.findByTestId("bg-delete-step-2-container"),
    ).toBeInTheDocument();

    const stepTwoCancelBtn = await screen.findByTestId(
      "bg-delete-step-2-cancel-btn",
    );
    await user.click(stepTwoCancelBtn);
    // the input shouldn't change
    const input = await screen.findByTestId("input-group-name");
    await user.clear(input);
  });

  it("should handl api failure when deleting a base group", async () => {
    await stepOne();

    const bgOption = await screen.findByTestId("bg-option-0");
    await user.click(bgOption);

    const stepOneSubmitBtn = await screen.findByTestId(
      "bg-delete-step-1-submit-btn",
    );
    await user.click(stepOneSubmitBtn);

    (deleteBaseGroup as Mock).mockRejectedValue(defaultError);

    const stepTwoSubmitBtn = await screen.findByTestId(
      "bg-delete-step-2-submit-btn",
    );
    await user.click(stepTwoSubmitBtn);

    await waitFor(() =>
      expect(mockedToastError).toHaveBeenCalledWith(defaultError.message),
    );
  });

  it("should successfully delete a base group", async () => {
    await stepOne();

    const bgOption = await screen.findByTestId("bg-option-0");
    await user.click(bgOption);

    const stepOneSubmitBtn = await screen.findByTestId(
      "bg-delete-step-1-submit-btn",
    );
    await user.click(stepOneSubmitBtn);

    // (getBaseGroups as Mock).mockResolvedValue(deletedBGResp);
    (deleteBaseGroup as Mock).mockResolvedValue(defaultResp);

    const stepTwoSubmitBtn = await screen.findByTestId(
      "bg-delete-step-2-submit-btn",
    );
    await user.click(stepTwoSubmitBtn);

    await waitFor(() => {
      expect(mockedToastSuccess).toHaveBeenCalledWith("Base group deleted");
    });

    // This should be 1, since the form resets after successful deletion
    // At this point only the Select Company dropdown should be visible
    // until another company is selected
    const mainContainer = await screen.findByTestId("bg-delete-step-1-container");
    expect(mainContainer.childElementCount).toBe(1);
  });
});
