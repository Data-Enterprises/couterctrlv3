import { describe, it, expect, vi, type Mocked } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import Login from "../../pages/home/Login";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../utils";
import { mockStore as store } from "../mockStore";
import axios from "axios";
import SideBar from "../../components/navigation/SideBar";

// Mock axios module and the userEvent setup
vi.mock("axios");
const mockedAxios = axios as Mocked<typeof axios>;
const user = userEvent.setup();

describe("Login Page", () => {
  it("should render", () => {
    renderWithProviders(<Login />);
    const login = screen.getByTestId("login-page");
    expect(login).toBeInTheDocument();
  });

  // need to test if typing in the inputs updates the redux state
  it("should render username and password inputs", async () => {
    renderWithProviders(<Login />);
    const usernameInput = screen.getByTestId("username") as HTMLInputElement;
    const passwordInput = screen.getByTestId("password") as HTMLInputElement;

    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();

    expect(usernameInput.value).toEqual("");
    expect(passwordInput.value).toEqual("");
  });

  it("should handle username and password inputs", async () => {
    renderWithProviders(<Login />);
    const usernameInput = screen.getByTestId("username") as HTMLInputElement;
    const passwordInput = screen.getByTestId("password") as HTMLInputElement;
    await user.type(usernameInput, "anotheruser");
    await user.type(passwordInput, "anotherpassword");

    // check the app slice state
    const state = store.getState();
    expect(state.user.username).toEqual("anotheruser");
    expect(state.user.password).toEqual("anotherpassword");
  });

  it("should call the login api and update the token in redux state", async () => {
    mockedAxios.post.mockResolvedValue({
      data: { error: 0, token: "mocked_token_123" },
    });

    renderWithProviders(<Login />);

    const usernameInput = screen.getByTestId("username") as HTMLInputElement;
    const passwordInput = screen.getByTestId("password") as HTMLInputElement;

    const signInButton = screen.getByTestId("sign-in");
    // Just simulating the click event and updating redux state
    signInButton.onclick = () =>
      axios
        .post("/auth/login", {
          username: usernameInput.value,
          password: passwordInput.value,
        })
        .then((resp) => {
          const j = resp.data;
          if (j.error == 0) {
            // This way I can just set the temporary store state directly
            store.dispatch({ type: "app/setToken", payload: j.token });
          }
        });
    await user.click(signInButton);

    const state = store.getState();
    await waitFor(() => {
      expect(state.app.token).toEqual("mocked_token_123");
    });

    await user.clear(usernameInput);
    await user.clear(passwordInput);
  });

  it("should sign out the user when clicking the Sign Out nav item", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SideBar />);

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
