import Login from "../../pages/home/Login";
import { renderWithProviders } from "../utils";
import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { setupStore } from "../../store";
import userEvent from "@testing-library/user-event";

const store = setupStore();
const user = userEvent.setup();

describe("Impersonate Component", () => {
  it("should allow admins to impersonate another user", async () => {
    renderWithProviders(<Login />, { store });

    const usernameInput = screen.getByTestId("username");
    const pwInput = screen.getByTestId("password");

    await user.type(usernameInput, "otkim");
    await user.type(pwInput, "!@#6Mikto6!@#");
    const loginBtn = screen.getByTestId("sign-in");
    await user.click(loginBtn);

    const icb = await screen.findByTestId("impersonate-checkbox");
    expect(icb).toBeInTheDocument();
    await user.click(icb);
    
    await waitFor(() => {
      const state = store.getState().user;
      expect(state.username).toEqual("");
      expect(state.password).toEqual("");
    });
  });
});
