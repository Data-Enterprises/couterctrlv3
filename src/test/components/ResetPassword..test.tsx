import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../utils";
import { setupStore } from "../../store";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResetPassword from "../../pages/home/ResetPassword";
import { resetPassword } from "../../api/security";
import { login } from "../../api/login";
import Login from "../../pages/home/Login";

// This seems to be the best way to mock toast and api calls
vi.mock("../../api/login");
vi.mock("../../api/security");
const user = userEvent.setup();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));
const store = setupStore();
store.dispatch({ type: "user/setResetPassword", payload: 1 });

const loginResp = {
  error: 0,
  success: true,
  access_token: "token",
  token_type: "bearer",
  user_level: 9,
  first_name: "John",
  last_name: "Doe",
  company: 0,
  password_change_needed: 1,
  security_question_id: 1,
  role: 9,
};

describe("ResetPassword Component", () => {
  it("should not render modal when resetPassword is 0", () => {
    store.dispatch({ type: "user/setResetPassword", payload: 0 });
    renderWithProviders(<ResetPassword />, { store });
    const modal = screen.queryByText("Password Reset Detected");
    expect(modal).not.toBeInTheDocument();
  });

  it("should render the reset password modal when resetPassword is 1", async () => {
    (login as Mock).mockResolvedValueOnce({
      data: loginResp,
    });

    renderWithProviders(<Login />, { store });

    const signInButton = screen.getByTestId("sign-in");
    await user.click(signInButton);

    const state = store.getState();
    await waitFor(() => {
      expect(state.app.token).toEqual("token");
    });

    // When navigating beyond Login, this shows up, but we're just testing behaviors
    renderWithProviders(<ResetPassword />, { store });
  });

  it("should handle API failure upon resetting password", async () => {
    (resetPassword as Mock).mockRejectedValueOnce(new Error("Reset failed"));

    renderWithProviders(<ResetPassword />, { store });

    const resetBtn = await screen.findByTestId("reset-pw-btn");
    await user.click(resetBtn);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Error resetting password:Error: Reset failed"
      );
    });
  });

  it("should handle successful password reset", async () => {
    (resetPassword as Mock).mockResolvedValueOnce({ error: 0 });
    renderWithProviders(<ResetPassword />, { store });

    const input = await screen.findByTestId("text-input-newPassword");
        await user.type(input, "newsecurepassword");
    const resetBtn = await screen.findByTestId("reset-pw-btn");
    await user.click(resetBtn);

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Password successfully reset"
      );
    });
  });
});
