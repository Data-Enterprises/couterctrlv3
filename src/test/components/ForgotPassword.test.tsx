import { describe, it, expect, vi } from "vitest";
import { renderWithProviders } from "../utils";
import { screen, waitFor } from "@testing-library/react";
import { store } from "../../store";
import userEvent from "@testing-library/user-event";

import Login from "../../pages/home/Login";
import ForgotPassword from "../../pages/home/forgot/ForgotPassword";

const user = userEvent.setup();

const mockToastError = vi.fn();
vi.mock("../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockToastError,
  }),
}));

describe("ForgotPassword Component", () => {
  it("should render the forgot password modal", async () => {
    renderWithProviders(<Login />, { store });
    const forgotPasswordLink = screen.getByTestId("forgot-password");
    expect(forgotPasswordLink).toBeInTheDocument();

    await user.click(forgotPasswordLink);
    await waitFor(() => {
      // again, wait for redux store to update before checking modal
      expect(store.getState().app.showForgotPassword).toBe(true);
    });

    const modal = screen.findByTestId("modal");
    expect(modal).toBeDefined();

    const carousel = await screen.findByTestId("carousel-1");
    expect(carousel).toBeInTheDocument();
  });

  it("should handle Step One: Email Verification", async () => {
    renderWithProviders(<ForgotPassword />, { store });
  });
});
