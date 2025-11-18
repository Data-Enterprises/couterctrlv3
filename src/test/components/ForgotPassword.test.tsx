import { describe, it, expect, vi, type Mocked } from "vitest";
import { renderWithProviders } from "../utils";
import { screen, waitFor } from "@testing-library/react";
import { store } from "../../store";
import userEvent from "@testing-library/user-event";
import axios from "axios";

import Login from "../../pages/home/Login";
import ForgotPassword from "../../pages/home/forgot/ForgotPassword";

vi.mock("axios");
const mockedAxios = axios as Mocked<typeof axios>;
const user = userEvent.setup();

describe("ForgotPassword Component", () => {
  it("should render the forgot password modal", async () => {
    renderWithProviders(<Login />);
    const forgotPasswordLink = screen.getByTestId("forgot-password");
    expect(forgotPasswordLink).toBeInTheDocument();
    await user.click(forgotPasswordLink);

    await waitFor(() => {
      // again, wait for redux store to update before checking modal
      expect(store.getState().app.showForgotPassword).toBe(true);
    });

    const modal = screen.findByTestId("modal");
    expect(modal).toBeDefined();
  });

  // Now that we know it renders, we can test the steps
  it("should handle step 1: email verification", async () => {
    renderWithProviders(<ForgotPassword />);
  });
});
