import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../utils";
import { screen, waitFor } from "@testing-library/react";
import { store } from "../../store";
import userEvent from "@testing-library/user-event";

import Login from "../../pages/home/Login";
import ForgotPassword from "../../pages/home/forgot/ForgotPassword";
import {
  forgotPWEmailVerify,
  validateSecurityAnswer,
  resetForgotPassword,
} from "../../api/password";

const user = userEvent.setup();
vi.mock("../../api/password");

const mockedToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockToastWarn = vi.fn();
vi.mock("../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    success: mockedToastSuccess,
    error: mockToastError,
    warn: mockToastWarn,
  }),
}));

describe("ForgotPassword Component", () => {
  it("should render the forgot password modal", async () => {
    renderWithProviders(<Login />, { store });
    const forgotPasswordLink = screen.getByTestId("login-forgot-password");
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

  it("Should handle Step One: Email Verification API Error", async () => {
    (forgotPWEmailVerify as Mock).mockRejectedValueOnce(
      new Error("Invalid email")
    );
    renderWithProviders(<ForgotPassword />, { store });

    const verifyBtn = await screen.findByTestId("verify-email-button-forgot");
    expect(verifyBtn).toBeInTheDocument();
    await user.click(verifyBtn);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Invalid email");
    });
  });

  it("should handle Step One: Email Verification API Success", async () => {
    (forgotPWEmailVerify as Mock).mockResolvedValueOnce({
      data: {
        error: 0,
        question: "What is your pet's name?",
      },
    });
    renderWithProviders(<ForgotPassword />, { store });

    const userNameInput = await screen.findByTestId(
      "text-input-forgot-username"
    );
    const emailInput = await screen.findByTestId("text-input-forgot-email");
    const verifyBtn = await screen.findByTestId("verify-email-button-forgot");

    expect(userNameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(verifyBtn).toBeInTheDocument();

    await user.type(userNameInput, "testuser");
    await user.type(emailInput, "testuser@example.com");
    await user.click(verifyBtn);

    await waitFor(() => {
      const state = store.getState().forgotPassword;
      expect(state.question).toBe("What is your pet's name?");
      expect(state.index).toBe(1);
    });
  });

  it("Should handle Step Two: Security Question Verification API Error", async () => {
    (validateSecurityAnswer as Mock).mockRejectedValueOnce(
      new Error("Incorrect answer")
    );
    renderWithProviders(<ForgotPassword />, { store });

    const answerInput = await screen.findByTestId(
      "text-input-forgot-question-answer"
    );
    const submitBtn = await screen.findByTestId(
      "submit-security-answer-button-forgot"
    );
    expect(answerInput).toBeInTheDocument();
    expect(submitBtn).toBeInTheDocument();

    await user.type(answerInput, "wrong answer");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Incorrect answer");
      const state = store.getState().forgotPassword;
      expect(state.index).toBe(1); // should remain on the same step
    });
  });

  it("should handle Step Two: Security Question Success", async () => {
    (validateSecurityAnswer as Mock).mockResolvedValueOnce({
      data: {
        error: 0,
        msg: "Answers Match!",
      },
    });
    renderWithProviders(<ForgotPassword />, { store });

    const answerInput = await screen.findByTestId(
      "text-input-forgot-question-answer"
    );
    const submitBtn = await screen.findByTestId(
      "submit-security-answer-button-forgot"
    );
    expect(answerInput).toBeInTheDocument();
    expect(submitBtn).toBeInTheDocument();

    // clear answerInput
    await user.clear(answerInput);
    await user.type(answerInput, "correct answer");
    await user.click(submitBtn);

    await waitFor(() => {
      const state = store.getState().forgotPassword;
      expect(mockedToastSuccess).toHaveBeenCalledWith("Answers Match!");
      expect(state.index).toBe(2);
    });
  });

  it("Should handle Step Three: Reset Password API Error", async () => {
    (resetForgotPassword as Mock).mockRejectedValueOnce(
      new Error("Failed to reset password")
    );
    renderWithProviders(<ForgotPassword />, { store });

    const newPWInput = await screen.findByTestId(
      "text-input-password-new-forgot"
    );
    const changePWBtn = await screen.findByTestId("forgot-change-pw-btn");
    expect(changePWBtn).toBeInTheDocument();

    // First test empty password case
    await user.click(changePWBtn);
    await waitFor(() => {
      expect(mockToastWarn).toHaveBeenCalledWith("Password cannot be empty");
    });

    // Then handle API error
    await user.type(newPWInput, "newsecurepassword");
    await user.click(changePWBtn);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to reset password");
    });
  });

  it("should handle Step Three: Reset Password Success", async () => {
    (resetForgotPassword as Mock).mockResolvedValueOnce({
      data: {
        error: 0,
        msg: "Password reset successfully",
      },
    });
    renderWithProviders(<ForgotPassword />, { store });

    // New password is still typed in and in redux, so just test the api success
    const changePWBtn = await screen.findByTestId("forgot-change-pw-btn");
    expect(changePWBtn).toBeInTheDocument();
    await user.click(changePWBtn);

    await waitFor(() => {
      expect(mockedToastSuccess).toHaveBeenCalledWith(
        "Password reset successfully"
      );
    });
  });
});
