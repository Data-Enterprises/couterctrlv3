import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen, waitFor } from "@testing-library/react";

import { setupStore } from "../../../../store";
import userEvent from "@testing-library/user-event";

// apis to mock
import { getQuicksightUsers } from "../../../../api/quicksight";
import { getUserLevels } from "../../../../api/team";
import { getAllUsers } from "../../../../api/user";
import { updateCompany, getCompanies } from "../../../../api/company";

vi.mock("../../../../api/quicksight");
vi.mock("../../../../api/team");
vi.mock("../../../../api/user");
vi.mock("../../../../api/company");

import {
  allUsersResp,
  qsUserResp,
  userLvlResp,
  loggedInUserCompanies,
} from "..";
import {
  companyRespForUpdate,
  updatedCompanyResp,
  defaultError,
  defaultResp,
} from ".";

import Team from "../../../../pages/team/Team";
import { setCompanies, setUserLevel } from "../../../../features/userSlice";
import { setCompanyInfo } from "../../../../features/companySlice";

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

const stepOne = async (setInputValues: boolean = false) => {
  (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
  (getUserLevels as Mock).mockResolvedValue(userLvlResp);
  (getAllUsers as Mock).mockResolvedValue(allUsersResp);
  (getCompanies as Mock).mockResolvedValue(companyRespForUpdate);
  renderWithProviders(<Team />, { store });

  const companyForm = await screen.findByTestId("team-companies-form");
  await user.click(companyForm);

  const updateForm = await screen.findByTestId("update-company-form");
  await user.click(updateForm);

  const companySelect = await screen.findByTestId(
    "single-select-trigger-icon-0",
  );
  await user.click(companySelect);

  const newlyCreatedCompany = await screen.findByTestId(
    "single-select-option-0-4",
  );
  await user.click(newlyCreatedCompany);

  if (setInputValues) {
    store.dispatch(setCompanyInfo({ key: "name", val: "Updated Company 6" }));
    store.dispatch(setCompanyInfo({ key: "address", val: "Updated St 6" }));
    store.dispatch(setCompanyInfo({ key: "city", val: "Updated City 6" }));
    store.dispatch(setCompanyInfo({ key: "state", val: "US" }));
    store.dispatch(setCompanyInfo({ key: "zip", val: "54321" }));
    store.dispatch(setCompanyInfo({ key: "phone", val: "5555555559" }));
    store.dispatch(
      setCompanyInfo({ key: "contact_email", val: "updated6@example.com" }),
    );
  }
};

describe("Update Company Form", () => {
  it("should handle name and address input change", async () => {
    await stepOne();
    const nameInput = await screen.findByTestId("input-name");
    const addressInput = await screen.findByTestId("input-address");

    await user.clear(nameInput);
    await user.clear(addressInput);

    await user.type(nameInput, "Updated Company 6");
    await user.type(addressInput, "Updated St 6");

    await waitFor(() => {
      const state = store.getState().company.companyInfo;
      expect(state.name).toBe("Updated Company 6");
      expect(state.address).toBe("Updated St 6");
    });
  });

  it("should handle city, state, and zip input change", async () => {
    await stepOne();
    const cityInput = await screen.findByTestId("input-city");
    const stateInput = await screen.findByTestId("input-state");
    const zipInput = await screen.findByTestId("input-zip");

    await user.clear(cityInput);
    await user.clear(stateInput);
    await user.clear(zipInput);

    await user.type(cityInput, "Updated City 6");
    await user.type(stateInput, "US");
    await user.type(zipInput, "54321");

    await waitFor(() => {
      const state = store.getState().company.companyInfo;
      expect(state.city).toBe("Updated City 6");
      expect(state.state).toBe("US");
      expect(state.zip).toBe(54321);
    });
  });

  it("should handle phone and email input change", async () => {
    await stepOne();
    const phoneInput = await screen.findByTestId("input-phone");
    const emailInput = await screen.findByTestId("input-contact-email");

    await user.clear(phoneInput);
    await user.clear(emailInput);

    await user.type(phoneInput, "5555555559");
    await user.type(emailInput, "updated6@example.com");

    await waitFor(() => {
      const state = store.getState().company.companyInfo;
      expect(state.phone).toBe("5555555559");
      expect(state.contact_email).toBe("updated6@example.com");
    });
  });
  it("should handle clearing the fields", async () => {
    await stepOne();

    const clearBtn = await screen.findByTestId("update-company-clear-btn");
    await user.click(clearBtn);

    await waitFor(() => {
      const state = store.getState().company.companyInfo;
      expect(state.id).toBe(0);
      expect(state.name).toBe("");
      expect(state.address).toBe("");
      expect(state.city).toBe("");
      expect(state.state).toBe("");
      expect(state.zip).toBe(0);
      expect(state.phone).toBe("");
      expect(state.contact_email).toBe("");
    });
  });

  it("should handle api failure when updating a company", async () => {
    await stepOne(true);
    (updateCompany as Mock).mockRejectedValue(defaultError);

    const submitBtn = await screen.findByTestId("update-company-submit-btn");
    await user.click(submitBtn);

    await waitFor(() =>
      expect(mockedToastError).toHaveBeenCalledWith("Test error"),
    );
  });

  it("should successfully update a company", async () => {
    await stepOne(true);
    (getCompanies as Mock).mockResolvedValue(updatedCompanyResp);
    (updateCompany as Mock).mockResolvedValue(defaultResp);

    const submitBtn = await screen.findByTestId("update-company-submit-btn");
    await user.click(submitBtn);
    await waitFor(() => {
      expect(mockedToastSuccess).toHaveBeenCalledWith(
        "Company Updated Company 6 updated, refreshing company list...",
      );
    });
  });
});
