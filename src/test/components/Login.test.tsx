import { describe, it, expect, vi, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import Login from "../../pages/home/Login";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../utils";
import { setupStore } from "../../store";
import SideBar from "../../components/navigation/SideBar";
import { login } from "../../api/login";

// Mock axios module and the userEvent setup
// vi.mock("axios");
// const mockedAxios = axios as Mocked<typeof axios>;
const user = userEvent.setup();
const store = setupStore();
const mockedToastError = vi.fn();
const mockedToastWarn = vi.fn();
vi.mock("../../components/toasts/hooks/useToast", () => {
  return {
    useToast: () => ({
      error: mockedToastError,
      warn: mockedToastWarn,
    }),
  };
});

vi.mock("../../api/login");

const loginResp = {
  error: 0,
  success: true,
  access_token: "token",
  token_type: "bearer",
  user_level: 9,
  first_name: "John",
  last_name: "Doe",
  company: 0,
  password_change_needed: 0,
  security_question_id: 1,
  role: 9,
};

describe("Login Page", () => {
  it("should render", () => {
    renderWithProviders(<Login />, { store });
    const login = screen.getByTestId("login-page");
    expect(login).toBeInTheDocument();
  });

  // need to test if typing in the inputs updates the redux state
  it("should render username and password inputs", async () => {
    renderWithProviders(<Login />, { store });
    const usernameInput = screen.getByTestId("username") as HTMLInputElement;
    const passwordInput = screen.getByTestId("password") as HTMLInputElement;

    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();

    expect(usernameInput.value).toEqual("");
    expect(passwordInput.value).toEqual("");
  });

  it("should handle username and password inputs", async () => {
    renderWithProviders(<Login />, { store });
    const usernameInput = screen.getByTestId("username") as HTMLInputElement;
    const passwordInput = screen.getByTestId("password") as HTMLInputElement;
    await user.type(usernameInput, "anotheruser");
    await user.type(passwordInput, "anotherpassword");

    // check the app slice state
    const state = store.getState();
    expect(state.user.username).toEqual("anotheruser");
    expect(state.user.password).toEqual("anotherpassword");
  });

  it("should handle Enter key press and API failure upon login", async () => {
    (login as Mock).mockRejectedValue(new Error("Invalid credentials"));

    renderWithProviders(<Login />, { store });

    // type in username and password
    const usernameInput = screen.getByTestId("username") as HTMLInputElement;
    const passwordInput = screen.getByTestId("password") as HTMLInputElement;
    await user.type(usernameInput, "wronguser");
    await user.type(passwordInput, "wrongpassword");

    // press Enter key
    await user.keyboard("{Enter}");
    expect(mockedToastError).toHaveBeenCalledWith(
      "Login failed: Invalid credentials"
    );
  });

  it("should display a warning toast on invalid credentials", async () => {
    (login as Mock).mockResolvedValueOnce({ data: { error: 1 } });

    renderWithProviders(<Login />, { store });

    const signInButton = screen.getByTestId("sign-in");
    await user.click(signInButton);

    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith("Invalid credentials, make sure your password and username are correct");
    });
  });

  it("should call the login api and update the token in redux state", async () => {
    (login as Mock).mockResolvedValue({
      data: loginResp,
    });

    renderWithProviders(<Login />, { store });

    const usernameInput = screen.getByTestId("username") as HTMLInputElement;
    const passwordInput = screen.getByTestId("password") as HTMLInputElement;

    const signInButton = screen.getByTestId("sign-in");
    await user.click(signInButton);

    const state = store.getState();
    await waitFor(() => {
      expect(state.app.token).toEqual("token");
    });

    await user.clear(usernameInput);
    await user.clear(passwordInput);
  });

  it("should sign out the user when clicking the Sign Out nav item", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SideBar />, { store });

    const sidebar = screen.getByTestId("side-bar");
    expect(sidebar).toBeInTheDocument();

    const signOutBtn = screen.getByTestId("signout-btn");
    await user.click(signOutBtn);

    // Sign Out should be resetting the redux slices
    await waitFor(() => {
      const state = store.getState();
      expect(state.app.loggedIn).toBe(false);
      expect(state.app.token).toBe("");
      expect(state.user.username).toBe("");
      expect(state.user.password).toBe("");
    });
  });
});
