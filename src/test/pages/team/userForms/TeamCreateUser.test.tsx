import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  createUser,
  assignBaseGroupToUser,
  getUserLevels,
} from "../../../../api/team";
import {
  assignUserToCompany,
  getAllUsers,
  getUserStores,
} from "../../../../api/user";
import { getQuicksightUsers } from "../../../../api/quicksight";
import {
  allUsersResp,
  defaultResp,
  userStoresResp,
  qsUserResp,
  loggedInUserCompanies,
  userLvlResp,
  getBGResp,
  createUserResp,
} from "..";
import { setupStore } from "../../../../store";
import Team from "../../../../pages/team/Team";
import { setCompanies, setUserLevel } from "../../../../features/userSlice";
import { defaultError } from "../../sales";
import { setIsDesktop } from "../../../../features/appSlice";
import {
  setUserCompanyIds,
  setUserInfo,
  setUserLevels,
} from "../../../../features/usersSlice";
import { getBaseGroups } from "../../../../api/baseGroups";
import { setAllSelectedBaseGroups } from "../../../../features/baseGroupSlice";

const user = userEvent.setup();
const store = setupStore();
store.dispatch(setCompanies(loggedInUserCompanies));
store.dispatch(setUserLevel(9));
store.dispatch(setUserLevels(userLvlResp.data.levels));

const mockedToastSuccess = vi.fn();
const mockedToastError = vi.fn();
const mockedToastWarning = vi.fn();

vi.mock("../../../../api/quicksight");
vi.mock("../../../../api/security");
vi.mock("../../../../api/team");
vi.mock("../../../../api/user");
vi.mock("../../../../api/baseGroups");
vi.mock("../../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    success: mockedToastSuccess,
    error: mockedToastError,
    warn: mockedToastWarning,
  }),
}));

const defaultRender = () => {
  (getAllUsers as Mock).mockResolvedValue(allUsersResp);
  (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
  (getUserLevels as Mock).mockResolvedValue(userLvlResp);
  renderWithProviders(<Team />, { store });
};

const setCreateUserInfo = async () => {
  await waitFor(() => {
    store.dispatch(setUserInfo({ key: "username", value: "test" }));
    store.dispatch(setUserInfo({ key: "email", value: "tuser@example.com" }));
    store.dispatch(setUserInfo({ key: "first_name", value: "Test" }));
    store.dispatch(setUserInfo({ key: "last_name", value: "User" }));
    store.dispatch(setUserInfo({ key: "password", value: "Maiden00931!1" }));
    store.dispatch(
      setUserInfo({ key: "confirm_password", value: "Maiden00931!1" }),
    );
    store.dispatch(setUserInfo({ key: "user_level", value: 7 }));
    store.dispatch(setUserInfo({ key: "role", value: 2 }));
    store.dispatch(setUserCompanyIds([1]));
    store.dispatch(
      setAllSelectedBaseGroups([{ id: 1, name: "TEST GROUP", company: 1 }]),
    );
  });
};

describe("Team Page Create User Form (DCR user)", () => {
  it("should handle api failure when fetching all users", async () => {
    (getAllUsers as Mock).mockRejectedValue(defaultError);
    (getQuicksightUsers as Mock).mockRejectedValue(defaultError);
    (getUserLevels as Mock).mockRejectedValue(defaultError);
    renderWithProviders(<Team />, { store });
  });

  it("should handle form select on mobile device", async () => {
    await waitFor(() => store.dispatch(setIsDesktop(false)));
    (getAllUsers as Mock).mockResolvedValue(allUsersResp);
    (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
    (getUserLevels as Mock).mockResolvedValue(userLvlResp);
    renderWithProviders(<Team />, { store });

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-0",
    );
    await user.click(singleSelect);
    const usersOption = await screen.findByTestId("single-select-option-0-0");
    await user.click(usersOption);
  });

  it("should load the Users Form", async () => {
    await waitFor(() => store.dispatch(setIsDesktop(true)));
    (getAllUsers as Mock).mockResolvedValue(allUsersResp);
    (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
    (getUserLevels as Mock).mockResolvedValue(userLvlResp);
    renderWithProviders(<Team />, { store });

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);
  });

  it("should handle create use form load", async () => {
    (getAllUsers as Mock).mockResolvedValue(allUsersResp);
    (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
    (getUserLevels as Mock).mockResolvedValue(userLvlResp);
    renderWithProviders(<Team />, { store });

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const createBtn = await screen.findByTestId("user-form-create");
    await user.click(createBtn);
  });

  it("should handle username and email input change in create user form", async () => {
    (getAllUsers as Mock).mockResolvedValue(allUsersResp);
    (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
    (getUserLevels as Mock).mockResolvedValue(userLvlResp);
    renderWithProviders(<Team />, { store });

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const createBtn = await screen.findByTestId("user-form-create");
    await user.click(createBtn);

    const usernameInput = await screen.findByTestId("input-username");
    await user.type(usernameInput, "test");

    const emailInput = await screen.findByTestId("input-email");
    await user.type(emailInput, "test@example.com");

    const firstNameInput = await screen.findByTestId("input-first-name");
    await user.type(firstNameInput, "Test");

    const lastNameInput = await screen.findByTestId("input-last-name");
    await user.type(lastNameInput, "User");

    await waitFor(() => {
      expect(store.getState().users.userInfo.username).toEqual("test");
      expect(store.getState().users.userInfo.email).toEqual("test@example.com");
      expect(store.getState().users.userInfo.first_name).toEqual("Test");
      expect(store.getState().users.userInfo.last_name).toEqual("User");
    });
  });

  it("should handle password/confirm password input change in create user form", async () => {
    await waitFor(() => {
      store.dispatch(setUserInfo({ key: "username", value: "test" }));
      store.dispatch(setUserInfo({ key: "email", value: "test@example.com" }));
      store.dispatch(setUserInfo({ key: "first_name", value: "Test" }));
      store.dispatch(setUserInfo({ key: "last_name", value: "User" }));
    });

    (getAllUsers as Mock).mockResolvedValue(allUsersResp);
    (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
    (getUserLevels as Mock).mockResolvedValue(userLvlResp);
    renderWithProviders(<Team />, { store });

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const createBtn = await screen.findByTestId("user-form-create");
    await user.click(createBtn);

    const pwInput = await screen.findByTestId("text-input-password");
    const confirmInput = await screen.findByTestId(
      "text-input-confirm_password",
    );

    await user.type(pwInput, "Maiden00931!1");
    await user.type(confirmInput, "Maiden00931!1");

    const eyeIcon = await screen.findByTestId("eye-icon-password");
    await user.click(eyeIcon);
    await user.click(eyeIcon);

    await waitFor(() => {
      const pw = store.getState().users.userInfo.password;
      const confirm_pw = store.getState().users.userInfo.confirm_password;
      expect(pw).toEqual(confirm_pw);
    });
  });

  it("should handle role selection in create user form", async () => {
    (getAllUsers as Mock).mockResolvedValue(allUsersResp);
    (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
    (getUserLevels as Mock).mockResolvedValue(userLvlResp);
    renderWithProviders(<Team />, { store });

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const createBtn = await screen.findByTestId("user-form-create");
    await user.click(createBtn);

    const roleSelect = await screen.findByTestId(
      "single-select-trigger-icon-2",
    );
    await user.click(roleSelect);
    const roleOption = await screen.findByTestId("single-select-option-2-1");
    await user.click(roleOption);

    const userLvlSelect = await screen.findByTestId(
      "single-select-trigger-icon-1",
    );
    await user.click(userLvlSelect);
    const userLvlOption = await screen.findByTestId("single-select-option-1-3");
    await user.click(userLvlOption);
  });

  it("should handle api failure when selecting a company", async () => {
    (getAllUsers as Mock).mockResolvedValue(allUsersResp);
    (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
    (getUserLevels as Mock).mockResolvedValue(userLvlResp);
    (getBaseGroups as Mock).mockRejectedValue(defaultError);
    renderWithProviders(<Team />, { store });

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const createBtn = await screen.findByTestId("user-form-create");
    await user.click(createBtn);

    const companySelect = await screen.findByTestId(
      "single-select-trigger-icon-3",
    );
    await user.click(companySelect);
    const companyOption = await screen.findByTestId("single-select-option-3-0");
    await user.click(companyOption);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(defaultError.message);
    });
  });

  it("should handle company/base group selection in create user form", async () => {
    (getAllUsers as Mock).mockResolvedValue(allUsersResp);
    (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
    (getUserLevels as Mock).mockResolvedValue(userLvlResp);
    (getBaseGroups as Mock).mockResolvedValue(getBGResp);
    renderWithProviders(<Team />, { store });

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const createBtn = await screen.findByTestId("user-form-create");
    await user.click(createBtn);

    const companySelect = await screen.findByTestId(
      "single-select-trigger-icon-3",
    );
    await user.click(companySelect);
    const companyOption = await screen.findByTestId("single-select-option-3-0");
    await user.click(companyOption);

    const bgSelect = await screen.findByTestId("single-select-trigger-icon-4");
    await user.click(bgSelect);
    const bgOption = await screen.findByTestId("single-select-option-4-0");
    await user.click(bgOption);

    await waitFor(() => {
      const info = store.getState().baseGroup.selectedBaseGroups;
      const ids = store.getState().users.userCompanyIds;
      expect(ids.length).toBe(1);
      expect(info.length).toBe(1);
    });
  });

  it("should handle api failure when creating a new user", async () => {
    (getAllUsers as Mock).mockResolvedValue(allUsersResp);
    (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
    (getUserLevels as Mock).mockResolvedValue(userLvlResp);
    (getBaseGroups as Mock).mockResolvedValue(getBGResp);
    (createUser as Mock).mockRejectedValue(defaultError);
    renderWithProviders(<Team />, { store });

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const createBtn = await screen.findByTestId("user-form-create");
    await user.click(createBtn);

    await setCreateUserInfo();

    const createUserBtn = await screen.findByTestId("create-user-btn");
    await user.click(createUserBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Error creating user " + defaultError.message,
      );
    });
  });

  it("should handle api failure when assigning a user to a company", async () => {
    (getAllUsers as Mock).mockResolvedValue(allUsersResp);
    (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
    (getUserLevels as Mock).mockResolvedValue(userLvlResp);
    (getBaseGroups as Mock).mockResolvedValue(getBGResp);
    (createUser as Mock).mockResolvedValue(createUserResp);
    (assignUserToCompany as Mock).mockRejectedValue(defaultError);
    renderWithProviders(<Team />, { store });

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const createBtn = await screen.findByTestId("user-form-create");
    await user.click(createBtn);

    await setCreateUserInfo();

    const companySelect = await screen.findByTestId(
      "single-select-trigger-icon-3",
    );
    await user.click(companySelect);
    const companyOption = await screen.findByTestId("single-select-option-3-0");
    await user.click(companyOption);

    const bgSelect = await screen.findByTestId("single-select-trigger-icon-4");
    await user.click(bgSelect);
    const bgOption = await screen.findByTestId("single-select-option-4-0");
    await user.click(bgOption);

    const createUserBtn = await screen.findByTestId("create-user-btn");
    await user.click(createUserBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(defaultError.message);
    });
  });

  it("should handle api failure when trying to assign base groups to user", async () => {
    (getAllUsers as Mock).mockResolvedValue(allUsersResp);
    (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
    (getUserLevels as Mock).mockResolvedValue(userLvlResp);
    (getBaseGroups as Mock).mockResolvedValue(getBGResp);
    (createUser as Mock).mockResolvedValue(createUserResp);
    (assignUserToCompany as Mock).mockResolvedValue(defaultResp);
    (assignBaseGroupToUser as Mock).mockRejectedValue(defaultError);
    renderWithProviders(<Team />, { store });

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const createBtn = await screen.findByTestId("user-form-create");
    await user.click(createBtn);

    await setCreateUserInfo();

    const createUserBtn = await screen.findByTestId("create-user-btn");
    await user.click(createUserBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalled();
    });
  });
  it("should handle successful user creation in User Form and return the new user's stores", async () => {
    (getAllUsers as Mock).mockResolvedValue(allUsersResp);
    (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
    (getUserLevels as Mock).mockResolvedValue(userLvlResp);
    (getBaseGroups as Mock).mockResolvedValue(getBGResp);
    (createUser as Mock).mockResolvedValue(createUserResp);
    (assignUserToCompany as Mock).mockResolvedValue(defaultResp);
    (assignBaseGroupToUser as Mock).mockResolvedValue(defaultResp);
    (getUserStores as Mock).mockResolvedValue(userStoresResp);
    renderWithProviders(<Team />, { store });

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const createBtn = await screen.findByTestId("user-form-create");
    await user.click(createBtn);

    await setCreateUserInfo();

    const createUserBtn = await screen.findByTestId("create-user-btn");
    await user.click(createUserBtn);
  });

  it("should handle the clearing of the input fields", async () => {
    (getAllUsers as Mock).mockResolvedValue(allUsersResp);
    (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
    (getUserLevels as Mock).mockResolvedValue(userLvlResp);
    renderWithProviders(<Team />, { store });

    const usersForm = await screen.findByTestId("team-users-form");
    await user.click(usersForm);

    const createBtn = await screen.findByTestId("user-form-create");
    await user.click(createBtn);

    await setCreateUserInfo();

    const clearFieldsBtn = await screen.findByTestId(
      "user-form-clear-fields-btn",
    );
    await user.click(clearFieldsBtn);

    await waitFor(() => {
      const state = store.getState().users.userInfo;
      expect(state.username).toEqual("");
      expect(state.email).toEqual("");
      expect(state.first_name).toEqual("");
      expect(state.last_name).toEqual("");
      expect(state.password).toEqual("");
      expect(state.confirm_password).toEqual("");
      expect(state.user_level).toEqual(0);
      expect(state.role).toEqual(0);
    });
  });
});

describe("Team Page Base Groups Form", () => {
  it("should load the Base Groups Form", async () => {
    defaultRender();
    const bgForm = await screen.findByTestId("team-bg-form");
    await user.click(bgForm);
  });
});

describe("Team Page Companies Form", () => {
  it("should load the Companies Form", async () => {
    defaultRender();
    const companiesForm = await screen.findByTestId("team-companies-form");
    await user.click(companiesForm);
  });
});

describe("Team Page Admin Form", () => {
  it("should load the Admin Form", async () => {
    defaultRender();
    const adminForm = await screen.findByTestId("team-admin-form");
    await user.click(adminForm);
  });
});
