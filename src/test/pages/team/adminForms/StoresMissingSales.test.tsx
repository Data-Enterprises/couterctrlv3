import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getAllUsers, getUserStores } from "../../../../api/user";
import { getQuicksightUsers } from "../../../../api/quicksight";
import { getUserLevels } from "../../../../api/team";
import { getStoresMissingSales } from "../../../../api/admin";

import {
  allUsersResp,
  loggedInUserCompanies,
  qsUserResp,
  userLvlResp,
  userStoresResp,
} from "..";
import { assignedStores, storesMissingSaleResp, unassignedStores } from ".";

import { setupStore } from "../../../../store";
import Team from "../../../../pages/team/Team";
import {
  setAssignedStores,
  setCompanies,
  setUnassignedStores,
} from "../../../../features/userSlice";

const user = userEvent.setup();
const store = setupStore();
store.dispatch(setCompanies(loggedInUserCompanies));
store.dispatch(setAssignedStores(assignedStores));
store.dispatch(setUnassignedStores(unassignedStores));

vi.mock("../../../../api/quicksight");
vi.mock("../../../../api/team");
vi.mock("../../../../api/user");
vi.mock("../../../../api/admin");

const mockedToastError = vi.fn();
const mockedToastWarning = vi.fn();
vi.mock("../../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockedToastError,
    warn: mockedToastWarning,
  }),
}));

const defaultRender = () => {
  (getUserStores as Mock).mockResolvedValue(userStoresResp);
  (getAllUsers as Mock).mockResolvedValue(allUsersResp);
  (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
  (getUserLevels as Mock).mockResolvedValue(userLvlResp);
  renderWithProviders(<Team />, { store });
};

describe("Stores Missing Sales Form", () => {
  it("should handle successful api call for stores missing sales", async () => {
    defaultRender();
    (getStoresMissingSales as Mock).mockResolvedValue(storesMissingSaleResp);
    const adminForm = await screen.findByTestId("team-admin-form");
    await user.click(adminForm);

    const missingSalesForm = await screen.findByTestId(
      "admin-stores-missing-sales-form",
    );
    await user.click(missingSalesForm);

    const companySelect = await screen.findByTestId(
      "single-select-trigger-icon-1",
    );
    await user.click(companySelect);

    const companyOption = await screen.findByTestId("single-select-option-1-0");
    await user.click(companyOption);

    const submitBtn = await screen.findByTestId("no-sales-submit-btn");
    await user.click(submitBtn);

    (getStoresMissingSales as Mock).mockResolvedValue({
      data: {
        error: 0,
        success: true,
        missing: [],
      },
    });

    await user.click(companySelect);

    const companyOption2 = await screen.findByTestId(
      "single-select-option-1-1",
    );
    await user.click(companyOption2);
    await user.click(submitBtn);
  });

  it("should handle api failure for stores missing sales", async () => {
    defaultRender();
    (getStoresMissingSales as Mock).mockRejectedValue(new Error("API Error"));
    const adminForm = await screen.findByTestId("team-admin-form");
    await user.click(adminForm);

    const missingSalesForm = await screen.findByTestId(
      "admin-stores-missing-sales-form",
    );
    await user.click(missingSalesForm);

    const companySelect = await screen.findByTestId(
      "single-select-trigger-icon-1",
    );
    await user.click(companySelect);

    const companyOption = await screen.findByTestId("single-select-option-1-0");
    await user.click(companyOption);

    const submitBtn = await screen.findByTestId("no-sales-submit-btn");
    await user.click(submitBtn);

    await waitFor(() => expect(mockedToastError).toHaveBeenCalled());
  });

  it("should handle grid filtering from the input", async () => {
    defaultRender();
    (getStoresMissingSales as Mock).mockResolvedValue(storesMissingSaleResp);
    const adminForm = await screen.findByTestId("team-admin-form");
    await user.click(adminForm);

    const missingSalesForm = await screen.findByTestId(
      "admin-stores-missing-sales-form",
    );
    await user.click(missingSalesForm);

    const companySelect = await screen.findByTestId(
      "single-select-trigger-icon-1",
    );
    await user.click(companySelect);

    const companyOption = await screen.findByTestId("single-select-option-1-0");
    await user.click(companyOption);

    const submitBtn = await screen.findByTestId("no-sales-submit-btn");
    await user.click(submitBtn);

    const input = await screen.findByTestId("input-stores---2");
    await user.type(input, "Store 1");
  });

  it("should handle data export and refresh", async () => {
    defaultRender();
    (getStoresMissingSales as Mock).mockResolvedValue(storesMissingSaleResp);
    const adminForm = await screen.findByTestId("team-admin-form");
    await user.click(adminForm);

    const missingSalesForm = await screen.findByTestId(
      "admin-stores-missing-sales-form",
    );
    await user.click(missingSalesForm);

    const companySelect = await screen.findByTestId(
      "single-select-trigger-icon-1",
    );
    await user.click(companySelect);

    const companyOption = await screen.findByTestId("single-select-option-1-0");
    await user.click(companyOption);

    const submitBtn = await screen.findByTestId("no-sales-submit-btn");
    await user.click(submitBtn);

    const exportBtn = await screen.findByTestId("export-missing-stores-btn");
    await user.click(exportBtn);

    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();

    const exportSubmitBtn = await screen.findByTestId("export-ms-submit-btn");
    await user.click(exportSubmitBtn);

    await waitFor(() => expect(mockedToastWarning).toHaveBeenCalled());

    const modalInput = await screen.findByTestId("input-file-name");
    await user.type(modalInput, "test-file");

    await user.click(exportSubmitBtn);

    const refreshBtn = await screen.findByTestId("refresh-missing-stores-btn");
    await user.click(refreshBtn);
  });
});
