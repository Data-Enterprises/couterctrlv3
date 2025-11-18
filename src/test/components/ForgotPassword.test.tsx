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

const mockToastError = vi.fn();
const mockToastWarn = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock("../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockToastError,
    warn: mockToastWarn,
    success: mockToastSuccess,
  }),
}));

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

    const carousel = await screen.findByTestId("carousel-1");
    expect(carousel).toBeInTheDocument();
  });

  it("should handle Step 1 - email verification", async () => {
    renderWithProviders(<ForgotPassword />);

    const emailVerify = await screen.findByTestId("email-verify");
    expect(emailVerify).toBeInTheDocument();

    const username = screen.getByTestId("text-input-forgot-username");
    const email = screen.getByTestId("text-input-forgot-email");

    await user.type(username, "testuser");
    await user.type(email, "testuser@example.com");
    expect(username).toHaveValue("testuser");
    expect(email).toHaveValue("testuser@example.com");

    // the click chooses an API call, so we need to mock that
    mockedAxios.post.mockResolvedValueOnce({
      data: { error: 0, question: "What is your pet's name?" },
    });

    const verifyBtn = screen.getByTestId("verify-email-button-forgot");
    await user.click(verifyBtn);
    expect(mockedAxios).toHaveBeenCalled();
  });

  it("should render toast error on Step 1 failure", async () => {
    renderWithProviders(<ForgotPassword />);

    mockedAxios.post.mockRejectedValueOnce(new Error("Network Error"));

    const verifyBtn = screen.getByTestId("verify-email-button-forgot");
    await user.click(verifyBtn);
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });

    // clear the store for next test
    store.dispatch({ type: "forgotPassword/resetForgotPasswordState" });
  });

  it("should handle Step 2 - security question", async () => {
    renderWithProviders(<ForgotPassword />);
    // set the store to step 2
    store.dispatch({
      type: "forgotPassword/setIndex",
    });
    store.dispatch({
      type: "forgotPassword/setQuestion",
      payload: "What is your pet's name?",
    });

    const state = store.getState().forgotPassword;
    expect(state.index).toBe(1);
    expect(state.question).toBe("What is your pet's name?");

    const securityAnswer = await screen.findByTestId("security-answer-forgot");
    expect(securityAnswer).toBeInTheDocument();

    const answerInput = screen.getByTestId("text-input-forgot-question-answer");
    await user.type(answerInput, "Fluffy");
    expect(answerInput).toHaveValue("Fluffy");

    const newState = store.getState().forgotPassword;
    expect(newState.answer).toBe("Fluffy");

    mockedAxios.post.mockResolvedValueOnce({
      data: { error: 0, question: "Answers Match!" },
    });

    const submitBtn = screen.getByTestId(
      "submit-security-answer-button-forgot"
    );
    await user.click(submitBtn);
    expect(mockedAxios).toHaveBeenCalled();

    // clear the store for next test
    store.dispatch({ type: "forgotPassword/resetForgotPasswordState" });
  });

  it("should render toast error on Step 2 failure", async () => {
    renderWithProviders(<ForgotPassword />);
    // set the store to step 2
    store.dispatch({
      type: "forgotPassword/setIndex",
    });
    store.dispatch({
      type: "forgotPassword/setQuestion",
      payload: "What is your pet's name?",
    });

    mockedAxios.post.mockRejectedValueOnce(new Error("Network Error"));

    const state = store.getState().forgotPassword;
    expect(state.index).toBe(1);
    expect(state.question).toBe("What is your pet's name?");

    const answerInput = screen.getByTestId("text-input-forgot-question-answer");
    await user.type(answerInput, "Fluffy");
    expect(answerInput).toHaveValue("Fluffy");

    const submitBtn = screen.getByTestId(
      "submit-security-answer-button-forgot"
    );
    await user.click(submitBtn);
    expect(mockedAxios).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });

    // not clearing the state so I can check if index is 2
  });

  it("should handle Step 3 - new password", async () => {
    renderWithProviders(<ForgotPassword />);
    // set the store to step 3
    store.dispatch({
      type: "forgotPassword/setIndex",
    });

    const state = store.getState().forgotPassword;
    expect(state.index).toBe(2);

    const newPassword = await screen.findByTestId("new-password-forgot");
    expect(newPassword).toBeInTheDocument();

    const passwordInput = screen.getByTestId("text-input-password-new-forgot");
    await user.type(passwordInput, "NewSecureP@ssw0rd");

    const newState = store.getState().forgotPassword;
    expect(newState.newPassword).toBe("NewSecureP@ssw0rd");

    mockedAxios.post.mockResolvedValueOnce({
      data: { error: 0, msg: "Password updated!" },
    });

    const changePasswordBtn = screen.getByTestId("forgot-change-pw-btn");
    await user.click(changePasswordBtn);

    expect(mockedAxios).toHaveBeenCalled();
  });

  it("should handle Step 3 - new password", async () => {
    renderWithProviders(<ForgotPassword />);
    const state = store.getState().forgotPassword;
    expect(state.index).toBe(2);

    const newPassword = await screen.findByTestId("new-password-forgot");
    expect(newPassword).toBeInTheDocument();

    // inputs don't need to change, just testing failure case
    mockedAxios.post.mockRejectedValueOnce(new Error("Network Error"));

    const changePasswordBtn = screen.getByTestId("forgot-change-pw-btn");
    await user.click(changePasswordBtn);
    expect(mockedAxios).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });

    // clear the store
    store.dispatch({ type: "forgotPassword/resetForgotPasswordState" });
  });
});
