import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStore } from "../../../../store";

// apis to mock
import { getQuicksightUsers } from "../../../../api/quicksight";
import { getUserLevels } from "../../../../api/team";
import { getAllUsers } from "../../../../api/user";
import { createCompany, getCompanies } from "../../../../api/company";

vi.mock("../../../../api/quicksight");
vi.mock("../../../../api/team");
vi.mock("../../../../api/user");
vi.mock("../../../../api/company");

// responses
import {
  allUsersResp,
  qsUserResp,
  userLvlResp,
  loggedInUserCompanies,
} from "..";
import { defaultCompaniesResp, defaultError, defaultResp } from ".";

// Component being tested
import Team from "../../../../pages/team/Team";
import { setCompanies, setUserLevel } from "../../../../features/userSlice";
import { setCompanyInfo } from "../../../../features/companySlice";

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

const stepOne = async (setInputValues: boolean = false) => {
  (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
  (getUserLevels as Mock).mockResolvedValue(userLvlResp);
  (getAllUsers as Mock).mockResolvedValue(allUsersResp);
  (getCompanies as Mock).mockResolvedValue(defaultCompaniesResp);
  renderWithProviders(<Team />, { store });

  const companyForm = await screen.findByTestId("team-companies-form");
  await user.click(companyForm);

  const createForm = await screen.findByTestId("create-company-form");
  await user.click(createForm);

  // For filling the redux state after the input behaviors are tested
  // Reduces test times
  if (setInputValues) {
    store.dispatch(setCompanyInfo({ key: "name", val: "Test Company 6" }));
    store.dispatch(setCompanyInfo({ key: "address", val: "123 Test St" }));
    store.dispatch(setCompanyInfo({ key: "city", val: "Testville" }));
    store.dispatch(setCompanyInfo({ key: "state", val: "TS" }));
    store.dispatch(setCompanyInfo({ key: "zip", val: "12345" }));
    store.dispatch(setCompanyInfo({ key: "phone", val: "5555555555" }));
    store.dispatch(
      setCompanyInfo({ key: "contact_email", val: "test@example.com" }),
    );
  }
};

describe("Create Company Form", () => {
  it("should handle name and address inputs", async () => {
    await stepOne();

    const nameInput = await screen.findByTestId("input-name");
    const addressInput = await screen.findByTestId("input-address");

    await user.type(nameInput, "Test Company 1");
    // The above name exists =>so the "Name already exists" error is thrown, but we can still test the input behavior
    await user.clear(nameInput);
    await user.type(nameInput, "Test Company 6");
    await user.type(addressInput, "Test St 6");

    await waitFor(() => {
      const state = store.getState().company.companyInfo;
      expect(state.name).toBe("Test Company 6");
      expect(state.address).toBe("Test St 6");
    });
  });

  it("should handle city, state, and zip inputs", async () => {
    await stepOne();

    const cityInput = await screen.findByTestId("input-city");
    const stateInput = await screen.findByTestId("input-state");
    const zipInput = await screen.findByTestId("input-zip");

    await user.type(cityInput, "Testtown");
    await user.type(stateInput, "TS");
    await user.type(zipInput, "67890");

    await waitFor(() => {
      const state = store.getState().company.companyInfo;
      expect(state.city).toBe("Testtown");
      expect(state.state).toBe("TS");
      expect(state.zip).toBe(67890);
    });
  });

  it("should handle phone and email inputs", async () => {
    await stepOne();

    const phoneInput = await screen.findByTestId("input-phone");
    const emailInput = await screen.findByTestId("input-contact-email");
    await user.type(phoneInput, "5555555555");
    await user.type(emailInput, "test6w@example.com");

    await waitFor(() => {
      const state = store.getState().company.companyInfo;
      expect(state.phone).toBe("5555555555");
      expect(state.contact_email).toBe("test6w@example.com");
    });
  });

  it("should handle api failure when creating a company", async () => {
    await stepOne(true);

    const submitBtn = await screen.findByTestId("create-company-submit-btn");
    (createCompany as Mock).mockRejectedValue(defaultError);
    await user.click(submitBtn);

    await expect(mockedToastError).toHaveBeenCalledWith("Test error");
  });

  it("should handle clearing the input fields", async () => {
    await stepOne(true);

    const clearBtn = await screen.findByTestId(
      "clear-create-company-fields-btn",
    );
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

  it("should successfully create a company", async () => {
    await stepOne(true);

    const submitBtn = await screen.findByTestId("create-company-submit-btn");
    (createCompany as Mock).mockResolvedValue(defaultResp);
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastSuccess).toHaveBeenCalledWith(
        "Company Test Company 6 successfully created",
      );
    });
  });

  it("should do nothing if error !== 0 when creating a company", async () => {
    await stepOne(true);

    const submitBtn = await screen.findByTestId("create-company-submit-btn");
    (createCompany as Mock).mockResolvedValue({ data: { error: 1 } });
    await user.click(submitBtn);
  });
});
