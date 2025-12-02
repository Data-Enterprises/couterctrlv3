import { describe, it, expect, vi } from "vitest";
import { type Mock } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../../utils";
import userEvent from "@testing-library/user-event";
import { setupStore, store } from "../../../store";
import UserInfo from "../../../pages/team/UserInfo";
import { createUser } from "../../../api/team";
import { fakeUsers } from ".";

const mockedToastError = vi.fn();
vi.mock("../../../api/team");
vi.mock("../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockedToastError,
  }),
}));

const user = userEvent.setup();

describe("UserInfo component", () => {
  it("should render", () => {
    renderWithProviders(<UserInfo />, { store });
    store.dispatch({
      type: "users/setUsers",
      payload: fakeUsers,
    });
    const userInfo = screen.getByTestId("user-info");
    expect(userInfo).toBeInTheDocument();
  });

  it("should handle changes on input text change", async () => {
    renderWithProviders(<UserInfo />, { store });

    // grab the inputs
    const username = screen.getByTestId("text-input-username");
    const email = screen.getByTestId("text-input-email");
    const firstName = screen.getByTestId("text-input-first_name");
    const lastName = screen.getByTestId("text-input-last_name");

    // simulate user typing
    await user.type(username, "omgNewUserNoWay");
    await user.type(email, "123@example.com");
    await user.type(firstName, "First");
    await user.type(lastName, "Last");

    // check the state
    const state = store.getState().users.userInfo;
    expect(state.username).toBe("omgNewUserNoWay");
    expect(state.email).toBe("123@example.com");
    expect(state.first_name).toBe("First");
    expect(state.last_name).toBe("Last");
  });

  it("should handle changes on SingleSelect change", async () => {
    renderWithProviders(<UserInfo />, { store });

    // grab the selects
    const roleSelect = screen.getByTestId("single-select-4");
    const roleSelectIcon = within(roleSelect).getByTestId(
      "single-select-trigger-icon-4"
    );
    const levelSelect = screen.getByTestId("single-select-5");
    const levelSelectIcon = within(levelSelect).getByTestId(
      "single-select-trigger-icon-5"
    );
    const companySelect = screen.getByTestId("single-select-8");
    const companySelectIcon = within(companySelect).getByTestId(
      "single-select-trigger-icon-8"
    );

    // simulate user selecting options
    await user.click(roleSelectIcon);
    const roleOption = screen.getByTestId("single-select-option-4-3");
    await user.click(roleOption);

    await user.click(levelSelectIcon);
    const levelOption = screen.getByTestId("single-select-option-5-8");
    await user.click(levelOption);

    await user.click(companySelectIcon);
    const companyOption = screen.getByTestId("single-select-option-8-2");
    await user.click(companyOption);

    // check the state => storing the id values in redux
    const state = store.getState().users.userInfo;
    expect(state.role).toBe(3);
    expect(state.user_level).toBe(4);
    expect(state.company).toBe(1);
  });

  it("should clear user info on create user", async () => {
    const newStore = setupStore();
    renderWithProviders(<UserInfo />, { store: newStore });

    const usernameInput = screen.getByTestId("text-input-username");
    const emailInput = screen.getByTestId("text-input-email");
    // Simulate typing a username
    await user.type(usernameInput, "toBeCleared");
    await user.type(emailInput, "<EMAIL>");

    const newState = newStore.getState().users.userInfo;
    expect(newState.username).toBe("toBeCleared");
    expect(newState.email).toBe("<EMAIL>");

    const clearBtn = screen.getByTestId("clear-user-info-button");
    await user.click(clearBtn);

    const clearedState = newStore.getState().users.userInfo;
    expect(clearedState.username).toBe("");
    expect(clearedState.email).toBe("");
  });

  it("should handle password and confirm password input changes", async () => {
    renderWithProviders(<UserInfo />, { store });

    const passwordInput = screen.getByTestId("text-input-password");
    const confirmPasswordInput = screen.getByTestId(
      "text-input-confirm_password"
    );
    await user.type(passwordInput, "My$ecureP@ssw0rd");
    await user.type(confirmPasswordInput, "My$ecureP@ssw0rd");

    const state = store.getState().users.userInfo;
    expect(state.password).toEqual(state.confirm_password);
  });

  it("should successfully create a user", async () => {
    (createUser as Mock).mockResolvedValue({ data: { error: 0 } });
    renderWithProviders(<UserInfo />, { store });
    const state = store.getState().users.userInfo;
    const context = store.getState().app;

    // once passwords are settled, make the api call and handle success
    const createBtn = screen.getByTestId("create-user-button");
    await user.click(createBtn);

    await waitFor(() => {
      expect(createUser).toHaveBeenCalledWith(
        context.url,
        context.token,
        state
      );
    });
  });
});
