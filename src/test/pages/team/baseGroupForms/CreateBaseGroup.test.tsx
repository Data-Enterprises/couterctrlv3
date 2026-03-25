import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStore } from "../../../../store";

// apis to mock
import { getQuicksightUsers } from "../../../../api/quicksight";
import { getUserLevels } from "../../../../api/team";
import { getAllUsers } from "../../../../api/user";
import { getBaseGroups, createBaseGroup } from "../../../../api/baseGroups";

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
import { getBGResp, bgCreatedResp } from ".";

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
    (getBaseGroups as Mock).mockResolvedValue(getBGResp);
  } else {
    (getBaseGroups as Mock).mockRejectedValue(defaultError);
  }

  renderWithProviders(<Team />, { store });

  const bgForm = await screen.findByTestId("team-bg-form");
  await user.click(bgForm);

  const createForm = await screen.findByTestId("bg-create-form-btn");
  await user.click(createForm);

  expect(
    await screen.findByTestId("create-bg-form-container"),
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
  
  it("should warn the user of a duplicate group name", async () => {
    await stepOne();

    const input = await screen.findByTestId("input-group-name");
    await user.type(input, "All Stores");

    expect(
      await screen.findByTestId("create-bg-warning-div"),
    ).toBeInTheDocument();
  });

  it("should handle api failure when creating a base group", async () => {
    (createBaseGroup as Mock).mockRejectedValue(defaultError);
    await stepOne();

    const input = await screen.findByTestId("input-group-name");
    await user.type(input, "Unique Name");
    const submitBtn = await screen.findByTestId("create-bg-submit-btn");
    await user.click(submitBtn);

    await waitFor(() =>
      expect(mockedToastError).toHaveBeenCalledWith(defaultError.message),
    );
  });

  it("should create a base group successfully", async () => {
    (createBaseGroup as Mock).mockResolvedValue(defaultResp);
    await stepOne();

    (getBaseGroups as Mock).mockResolvedValue(bgCreatedResp);
    const input = await screen.findByTestId("input-group-name");
    await user.type(input, "Unique Name");
    const submitBtn = await screen.findByTestId("create-bg-submit-btn");
    await user.click(submitBtn);
  });
});
