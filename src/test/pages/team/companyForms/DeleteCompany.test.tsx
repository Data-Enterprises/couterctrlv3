import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen, waitFor } from "@testing-library/react";

import { setupStore } from "../../../../store";
import userEvent from "@testing-library/user-event";

// apis to mock
import { getQuicksightUsers } from "../../../../api/quicksight";
import { getUserLevels } from "../../../../api/team";
import { getAllUsers } from "../../../../api/user";
import { deleteCompany, getCompanies } from "../../../../api/company";

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

import Team from "../../../../pages/team/Team";
import { setCompanies, setUserLevel } from "../../../../features/userSlice";

const user = userEvent.setup();
const store = setupStore();
store.dispatch(setUserLevel(9));
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

  const deleteForm = await screen.findByTestId("delete-company-form");
  await user.click(deleteForm);

  expect(
    await screen.findByTestId("delete-company-form-container"),
  ).toBeInTheDocument();

  const companyToDelete = await screen.findByTestId("delete-company-select-4");
  await user.click(companyToDelete);

  const input = await screen.findByTestId("input-company-name");
  await user.clear(input);
  expect(input.getAttribute("value")).toBe("Test Company 6");

  await user.click(companyToDelete);
  expect(input.getAttribute("value")).toBe("");

  await user.click(companyToDelete);
  expect(input.getAttribute("value")).toBe("Test Company 6");
};

describe("Delete Company Form", () => {
  it("should handle toggling the delete steps", async () => {
    await stepOne();
    const deleteStepOne = await screen.findByTestId(
      "delete-company-step-one-btn",
    );
    await user.click(deleteStepOne);

    const noBtn = await screen.findByTestId("delete-company-reset-stepone-btn");
    await user.click(noBtn);

    expect(
      await screen.findByTestId("delete-company-form-container"),
    ).toBeInTheDocument();
  });

  it("should handle api error when deleting a company", async () => {
    await stepOne();
    const deleteStepOne = await screen.findByTestId(
      "delete-company-step-one-btn",
    );
    await user.click(deleteStepOne);

    const submitBtn = await screen.findByTestId("delete-company-submit-btn");
    (deleteCompany as Mock).mockRejectedValue(defaultError);
    await user.click(submitBtn);

    await waitFor(() =>
      expect(mockedToastError).toHaveBeenCalledWith(defaultError.message),
    );
  });

  it("should handle api failure when refrshing companies", async () => {
    await stepOne();

    const deleteStepOne = await screen.findByTestId(
      "delete-company-step-one-btn",
    );
    await user.click(deleteStepOne);

    (getCompanies as Mock).mockRejectedValueOnce(defaultError);

    const submitBtn = await screen.findByTestId("delete-company-submit-btn");
    (deleteCompany as Mock).mockResolvedValue(defaultResp);
    await user.click(submitBtn);

    await waitFor(() =>
      expect(mockedToastError).toHaveBeenCalledWith(defaultError.message),
    );
  });

  it("should delete a company successfully", async () => {
    await stepOne();

    const deleteStepOne = await screen.findByTestId(
      "delete-company-step-one-btn",
    );
    await user.click(deleteStepOne);

    const submitBtn = await screen.findByTestId("delete-company-submit-btn");
    (deleteCompany as Mock).mockResolvedValue(defaultResp);
    await user.click(submitBtn);
  });
});
