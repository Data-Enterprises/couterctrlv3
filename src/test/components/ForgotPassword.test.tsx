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
vi.mock("../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockToastError,
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
  });

  // Now that we know it renders, we can test the steps
  it("should handle Step 1 - email verification", async () => {
    renderWithProviders(<ForgotPassword />);

    // if forgot password is rendered, then we have our carousel
    const carousel = await screen.findByTestId("carousel-1");
    expect(carousel).toBeInTheDocument();

    // Step 1: EmailVerify
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
    // clear mock for next test
    mockedAxios.post.mockClear();

    // clear the store for next test
    store.dispatch({ type: "forgotPassword/resetForgotPasswordState" });
  });

  it("should render toast error on Step 1 failure", async () => {
    renderWithProviders(<ForgotPassword />);

    const emailVerify = await screen.findByTestId("email-verify");
    expect(emailVerify).toBeInTheDocument();

    const username = screen.getByTestId("text-input-forgot-username");
    const email = screen.getByTestId("text-input-forgot-email");

    await user.type(username, "thiswillfail");
    await user.type(email, "thiswillfail@example.com");
    expect(username).toHaveValue("thiswillfail");
    expect(email).toHaveValue("thiswillfail@example.com");

    mockedAxios.post.mockRejectedValueOnce(new Error("Network Error"));

    const verifyBtn = screen.getByTestId("verify-email-button-forgot");
    await user.click(verifyBtn);
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });
});
