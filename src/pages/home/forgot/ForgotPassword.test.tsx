import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { setupStore } from "../../../store";
import { setForgotPassword } from "../../../features/appSlice";
import ForgotPassword from "./ForgotPassword";

const api = vi.hoisted(() => ({
  verify: vi.fn(),
  answer: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("../../../api/password", () => ({
  forgotPWEmailVerify: api.verify,
  validateSecurityAnswer: api.answer,
  resetForgotPassword: api.reset,
}));

const ok = (data: object) => Promise.resolve({ data: { error: 0, ...data } });
const refused = (msg: string) => Promise.resolve({ data: { error: 1, msg } });

const open = () => {
  const store = setupStore();
  store.dispatch(setForgotPassword(true));
  render(
    <Provider store={store}>
      <ForgotPassword />
    </Provider>,
  );
  return store;
};

const toQuestion = async (user: ReturnType<typeof userEvent.setup>) => {
  api.verify.mockReturnValue(ok({ question: "What was the name of your first pet?" }));
  await user.type(screen.getByLabelText("Username"), "snelson");
  await user.type(screen.getByLabelText("Email"), "snelson@dcrpos.com");
  await user.click(screen.getByTestId("forgot-submit"));
  await screen.findByText("What was the name of your first pet?");
};

const toPassword = async (user: ReturnType<typeof userEvent.setup>) => {
  await toQuestion(user);
  api.answer.mockReturnValue(ok({ msg: "Answers Match!" }));
  await user.type(screen.getByLabelText("Answer"), "Biscuit");
  await user.click(screen.getByTestId("forgot-submit"));
  await screen.findByText("Choose a new password");
};

beforeEach(() => {
  api.verify.mockReset();
  api.answer.mockReset();
  api.reset.mockReset();
});

describe("forgot password", () => {
  it("sends step 1 once however fast Continue is pressed, so the question can't be skipped", async () => {
    const user = userEvent.setup();
    open();
    let finish: (v: unknown) => void = () => {};
    api.verify.mockReturnValue(new Promise((r) => (finish = r)));
    await user.type(screen.getByLabelText("Username"), "snelson");
    await user.type(screen.getByLabelText("Email"), "snelson@dcrpos.com");
    const submit = screen.getByTestId("forgot-submit");
    await user.click(submit);
    await user.click(submit);
    finish({ data: { error: 0, question: "First pet?" } });
    await screen.findByText("Answer your security question");
    expect(api.verify).toHaveBeenCalledTimes(1);
  });

  it("trims what was typed before sending it", async () => {
    const user = userEvent.setup();
    open();
    api.verify.mockReturnValue(ok({ question: "First pet?" }));
    await user.type(screen.getByLabelText("Username"), "  snelson ");
    await user.type(screen.getByLabelText("Email"), " snelson@dcrpos.com  ");
    await user.click(screen.getByTestId("forgot-submit"));
    await screen.findByText("First pet?");
    expect(api.verify.mock.calls[0].slice(1)).toEqual(["snelson", "snelson@dcrpos.com"]);
  });

  it("says why step 1 was refused, in plain words", async () => {
    const user = userEvent.setup();
    open();
    api.verify.mockReturnValue(refused("list index out of range"));
    await user.type(screen.getByLabelText("Username"), "nobody");
    await user.type(screen.getByLabelText("Email"), "nobody@dcrpos.com");
    await user.click(screen.getByTestId("forgot-submit"));
    expect(await screen.findByRole("alert")).toHaveTextContent("has no security question");
  });

  it("keeps you on the question after a wrong answer, and Back returns to step 1", async () => {
    const user = userEvent.setup();
    open();
    await toQuestion(user);
    api.answer.mockReturnValue(refused("Security answer does not match."));
    await user.type(screen.getByLabelText("Answer"), "Rex");
    await user.click(screen.getByTestId("forgot-submit"));
    expect(await screen.findByRole("alert")).toHaveTextContent("That answer doesn't match");
    await user.click(screen.getByRole("button", { name: "‹ Back" }));
    expect(screen.getByLabelText("Username")).toHaveValue("snelson");
  });

  it("won't change the password until the rules pass and both match, Enter included", async () => {
    const user = userEvent.setup();
    open();
    await toPassword(user);
    const submit = screen.getByTestId("forgot-submit");
    await user.type(screen.getByLabelText("New password"), "short");
    expect(submit).toBeDisabled();
    await user.clear(screen.getByLabelText("New password"));
    await user.type(screen.getByLabelText("New password"), "Long-enough-Pass1");
    await user.type(screen.getByLabelText("Confirm password"), "Long-enough-Pass2{Enter}");
    expect(submit).toBeDisabled();
    expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    expect(api.reset).not.toHaveBeenCalled();
  });

  it("finishes with the username filled in on the sign-in page", async () => {
    const user = userEvent.setup();
    const store = open();
    await toPassword(user);
    api.reset.mockReturnValue(ok({ msg: "Password updated!" }));
    await user.type(screen.getByLabelText("New password"), "Long-enough-Pass1");
    await user.type(screen.getByLabelText("Confirm password"), "Long-enough-Pass1");
    await user.click(screen.getByTestId("forgot-submit"));
    expect(api.reset.mock.calls[0].slice(1)).toEqual(["snelson", "Long-enough-Pass1"]);
    await user.click(await screen.findByTestId("forgot-back-to-sign-in"));
    await waitFor(() => expect(screen.queryByTestId("forgot-password")).not.toBeInTheDocument());
    expect(store.getState().user.username).toBe("snelson");
    expect(store.getState().app.showForgotPassword).toBe(false);
  });
});
