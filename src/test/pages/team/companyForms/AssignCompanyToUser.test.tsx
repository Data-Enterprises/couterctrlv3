import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen, waitFor } from "@testing-library/react";

import { setupStore } from "../../../../store";
import userEvent from "@testing-library/user-event";

// apis to mock
import { getQuicksightUsers } from "../../../../api/quicksight";
import { getUserLevels } from "../../../../api/team";
import { getAllUsers, assignUserToCompany } from "../../../../api/user";
import { getCompanies } from "../../../../api/company";

vi.mock("../../../../api/quicksight");
vi.mock("../../../../api/team");
vi.mock("../../../../api/user");
vi.mock("../../../../api/company");

import {
  allUsersResp,
  qsUserResp,
  userLvlResp,
  deleteCompanyFormCompanies,
} from "..";
import { defaultError, defaultResp, companyRespForUpdate } from ".";

import Team from "../../../../pages/team/TeamLegacy";
import { setCompanies, setUserLevel } from "../../../../features/userSlice";

const user = userEvent.setup();
const store = setupStore();
store.dispatch(setUserLevel(5));
store.dispatch(setCompanies(deleteCompanyFormCompanies));

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
  (getCompanies as Mock).mockResolvedValue(companyRespForUpdate);
  renderWithProviders(<Team />, { store });

  const companyForm = await screen.findByTestId("team-companies-form");
  await user.click(companyForm);

  const assignForm = await screen.findByTestId("assign-company-to-user-form");
  await user.click(assignForm);

  expect(
    await screen.findByTestId("company-assign-container"),
  ).toBeInTheDocument();
};

describe("Assign Company To User Form", () => {
  it("should not allow the user to assign/unassign companies to higher ranked user", async () => {
    await stepOne();

    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.click(searchUserInput);

    const outRankingUser = await screen.findByTestId("search-user-0");
    await user.click(outRankingUser);

    expect(
      await screen.findByTestId("outranked-message-container"),
    ).toBeInTheDocument();

    const resetBtn = await screen.findByTestId("company-assign-reset-btn");
    await user.click(resetBtn);

    expect(
      await screen.findByTestId("company-assign-container"),
    ).toBeInTheDocument();
  });

  it("should handle api failure when trying to assign/unassign companies", async () => {
    await stepOne();

    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.click(searchUserInput);

    const validUser = await screen.findByTestId("search-user-1");
    await user.click(validUser);

    await user.type(searchUserInput, "test");
    await user.type(searchUserInput, "{backspace}");

    const unassignedInput = await screen.findByTestId("input-unassigned---5");
    await user.type(unassignedInput, "Test Company");
    await user.clear(unassignedInput);

    const assignedInput = await screen.findByTestId("input-assigned---1");
    await user.type(assignedInput, "Test Company");
    await user.clear(assignedInput);

    (assignUserToCompany as Mock).mockRejectedValue(defaultError);
    const unassAssignAllBtn = await screen.findByTestId(
      "company-unassign-all-btn",
    );
    await user.click(unassAssignAllBtn);

    await waitFor(() =>
      expect(mockedToastError).toHaveBeenCalledWith(defaultError.message),
    );
  });

  it("should handle unassigning all companies from a user", async () => {
    await stepOne();

    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.click(searchUserInput);

    const validUser = await screen.findByTestId("search-user-1");
    await user.click(validUser);

    (assignUserToCompany as Mock).mockResolvedValue(defaultResp);

    const unassAssignAllBtn = await screen.findByTestId(
      "company-unassign-all-btn",
    );
    await user.click(unassAssignAllBtn);
  });

  it("should handle assigning all companies to a user", async () => {
    await stepOne();

    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.click(searchUserInput);

    const validUser = await screen.findByTestId("search-user-1");
    await user.click(validUser);

    (assignUserToCompany as Mock).mockResolvedValue(defaultResp);

    const assignAllBtn = await screen.findByTestId("company-assign-all-btn");
    await user.click(assignAllBtn);
  });

  it("should handle assign selected companies to a user", async () => {
    await stepOne();
    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.click(searchUserInput);

    const validUser = await screen.findByTestId("search-user-1");
    await user.click(validUser);

    const companyToAssign = await screen.findByTestId("unassigned-company-0");

    // toggling selected/unselected/selected again
    await user.click(companyToAssign);
    await user.click(companyToAssign);
    await user.click(companyToAssign);

    (assignUserToCompany as Mock).mockResolvedValue(defaultResp);

    const assignBtn = await screen.findByTestId("company-assign-btn");
    await user.click(assignBtn);
  });

  it("should handle unassign selected companies from a user", async () => {
    await stepOne();
    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.click(searchUserInput);

    const validUser = await screen.findByTestId("search-user-1");
    await user.click(validUser);

    const companyToUnassign = await screen.findByTestId("assigned-company-0");

    // toggling selected/unselected/selected again
    await user.click(companyToUnassign);
    await user.click(companyToUnassign);
    await user.click(companyToUnassign);

    (assignUserToCompany as Mock).mockResolvedValue(defaultResp);

    const unassignBtn = await screen.findByTestId("company-unassign-btn");
    await user.click(unassignBtn);
  });

  it("should handle companies for non DCR users", async () => {
    await waitFor(() => {
      store.dispatch(
        setCompanies(deleteCompanyFormCompanies.filter((c) => c.id < 4)),
      );
    });

    await stepOne();

    const searchUserInput = await screen.findByTestId("search-user-input");
    await user.click(searchUserInput);

    const validUser = await screen.findByTestId("search-user-1");
    await user.click(validUser);
  });
});
