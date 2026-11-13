import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { setupStore } from "../../store";
import { setToken } from "../../features/appSlice";
import {
  setResetPassword,
  setSecurityQuestionId,
  setUserId,
  setUsername,
} from "../../features/userSlice";
import AccountSetupModal from "./AccountSetupModal";

const api = vi.hoisted(() => ({
  questions: vi.fn(),
  reset: vi.fn(),
  answer: vi.fn(),
}));

vi.mock("../../api/security", () => ({
  getSecurityQuestions: api.questions,
  resetPassword: api.reset,
  setSecurityQuestionAnswer: api.answer,
}));
vi.mock("../toasts/hooks/useToast", () => ({
  useToast: () => ({ error: () => {}, success: () => {}, info: () => {}, warning: () => {}, warn: () => {} }),
}));

const open = ({ password, security }: { password: boolean; security: boolean }) => {
  const store = setupStore();
  store.dispatch(setUsername("snelson"));
  store.dispatch(setUserId(42));
  store.dispatch(setResetPassword(password ? 1 : 0));
  store.dispatch(setSecurityQuestionId(security ? 0 : 3));
  store.dispatch(setToken("token"));
  render(
    <Provider store={store}>
      <MemoryRouter>
        <AccountSetupModal />
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

beforeEach(() => {
  api.questions.mockReset().mockResolvedValue({
    data: { error: 0, questions: [{ id: 7, question: "What was the name of your first pet?" }] },
  });
  api.reset.mockReset().mockResolvedValue({ data: { error: 0 } });
  api.answer.mockReset().mockResolvedValue({ data: { error: 0 } });
});

describe("account setup", () => {
  it("holds a new password to the four rules and a match", async () => {
    const user = userEvent.setup();
    open({ password: true, security: false });
    const submit = screen.getByTestId("reset-pw-btn");
    await user.type(screen.getByLabelText("New password"), "a");
    await user.type(screen.getByLabelText("Confirm password"), "a{Enter}");
    expect(submit).toBeDisabled();
    expect(api.reset).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText("New password"));
    await user.clear(screen.getByLabelText("Confirm password"));
    await user.type(screen.getByLabelText("New password"), "Long-enough-Pass1");
    await user.type(screen.getByLabelText("Confirm password"), "Long-enough-Pass1{Enter}");
    await waitFor(() => expect(api.reset).toHaveBeenCalledTimes(1));
  });

  it("saves the security answer trimmed", async () => {
    const user = userEvent.setup();
    open({ password: false, security: true });
    await screen.findByRole("option", { name: "What was the name of your first pet?" });
    await user.selectOptions(screen.getByLabelText("Question"), "7");
    await user.type(screen.getByLabelText("Answer"), "  Biscuit ");
    await user.click(screen.getByTestId("submit-security-answer"));
    await waitFor(() => expect(api.answer).toHaveBeenCalled());
    expect(api.answer.mock.calls[0].slice(2)).toEqual([42, 7, "Biscuit"]);
  });

  it("can always be left: Sign out empties the session", async () => {
    const user = userEvent.setup();
    api.questions.mockResolvedValue({ data: { error: 1 } });
    const store = open({ password: false, security: true });
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn't be loaded");
    await user.click(screen.getByTestId("setup-sign-out"));
    expect(store.getState().app.token).toBe("");
    expect(store.getState().user.username).toBe("snelson");
  });
});
