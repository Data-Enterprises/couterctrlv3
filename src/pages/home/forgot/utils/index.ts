// Interfaces
import type { ForgotForm, ForgotStep } from "../interfaces";

/** A blank reset, as it opens. */
export const EMPTY_FORM: ForgotForm = {
  username: "",
  email: "",
  question: "",
  answer: "",
  newPassword: "",
  confirmPassword: "",
};

/** The numbered steps; the done card has no number. */
export const STEP_COUNT = 3;
export const STEP_NUMBER: Record<Exclude<ForgotStep, "done">, number> = {
  who: 1,
  question: 2,
  password: 3,
};

/** The step Back goes to. */
export const PREVIOUS_STEP: Partial<Record<ForgotStep, ForgotStep>> = {
  question: "who",
  password: "question",
};

export const WHO_EMPTY = "Enter your username and email.";
export const ANSWER_EMPTY = "Enter your answer.";
export const NETWORK_ERROR = "The server couldn't be reached. Try again.";

/**
 * Step 1's refusal in plain words. The server says "Email doesn't exist." for a
 * known username with the wrong email, and leaks a Python error for an unknown
 * username or an account with no security question.
 */
export const whoError = (msg?: string) => {
  if (msg === "Email doesn't exist.") return "That username and email don't match.";
  if (!msg || msg.includes("index out of range")) {
    return "We couldn't find that account, or it has no security question. Ask your admin to reset your password.";
  }
  return msg;
};

/** Step 2's refusal in plain words. */
export const answerError = (msg?: string) =>
  msg === "Security answer does not match."
    ? "That answer doesn't match. Check it and try again."
    : "Your answer couldn't be checked. Try again.";

/** Step 3's refusal: the server's own words, or a plain fallback. */
export const passwordError = (msg?: string) =>
  msg || "Your password couldn't be changed. Try again.";

/** The sign-in rail's input, so a reset field looks like the one beside it. */
export const FIELD =
  "w-full px-3.5 py-3 font-body text-[15px] text-portal_navy bg-custom-white border border-brand_line_2 rounded-lg outline-none transition-colors placeholder:text-brand_placeholder focus:border-brand_green focus:shadow-[0_0_0_3.5px_rgba(30,158,82,0.15)]";

/** The sign-in rail's field label. */
export const LABEL = "block text-[12.5px] font-semibold mb-[7px] text-portal_navy";

/** The sign-in rail's link. */
export const LINK = "text-[13.5px] font-medium text-brand_green_dark hover:underline cursor-pointer";
