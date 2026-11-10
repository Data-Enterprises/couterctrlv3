/** Where the reset is: the three steps, then the done card. */
export type ForgotStep = "who" | "question" | "password" | "done";

/** What the person has typed so far, and the question the server sent back. */
export interface ForgotForm {
  username: string;
  email: string;
  question: string;
  answer: string;
  newPassword: string;
  confirmPassword: string;
}

/** The fields a person types into. */
export type ForgotField = Exclude<keyof ForgotForm, "question">;

/** What the three forgot_password calls answer with. */
export interface ForgotReply {
  error: number;
  msg?: string;
  question?: string;
}
