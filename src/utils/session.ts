import type { AppDispatch } from "../store";
import type { UserCompany } from "../interfaces";
import type { TicketTech } from "../api/tickets";
import { setDevToken, setProdToken, setToken } from "../features/appSlice";
import {
  setCompanies,
  setEmail,
  setFirstName,
  setLastName,
  setResetPassword,
  setRole,
  setSecurityQuestionId,
  setTicketTech,
  setUserLevel,
} from "../features/userSlice";

/**
 * A successful `/auth/login`, and `/auth/impersonate`, which the backend
 * builds with the same function: an impersonated session is the same body
 * field for field, for the person being signed in as.
 */
export interface SessionResp {
  error: number;
  access_token: string;
  first_name: string;
  last_name: string;
  email: string;
  role: number;
  user_level: number;
  ticket_tech?: TicketTech | null;
  password_change_needed: number;
  security_question_id: number;
  companies: UserCompany[];
}

/**
 * Take a session into the store.
 *
 * Sign-in and "Sign in as" both land here, so an impersonated session is set
 * up exactly as a real one is and nothing has to remember to do it twice.
 */
export const applySession = (
  dispatch: AppDispatch,
  j: SessionResp,
  apiEnv: "dev" | "prod",
) => {
  dispatch(setToken(j.access_token));
  // The token belongs to whichever environment issued it, and has to be filed
  // under that one specifically. `useDevApi` reads `devToken` directly, and
  // an empty slot there means `Bearer ` with nothing after it: Export Builder,
  // Invoices and the Inventory pages all take that route.
  dispatch(apiEnv === "dev" ? setDevToken(j.access_token) : setProdToken(j.access_token));
  dispatch(setFirstName(j.first_name));
  dispatch(setLastName(j.last_name));
  dispatch(setEmail(j.email));
  dispatch(setRole(j.role));
  dispatch(setUserLevel(j.user_level));
  // Null for everybody who is not on the ticket desk, which is most people.
  // Carried from here rather than fetched, so a page nobody opens costs no
  // call.
  dispatch(setTicketTech(j.ticket_tech ?? null));
  dispatch(setResetPassword(j.password_change_needed));
  dispatch(setSecurityQuestionId(j.security_question_id));
  dispatch(setCompanies(j.companies));
};

/**
 * Was this a refused sign-in, rather than a server we could not reach?
 *
 * The backend used to answer a wrong password with HTTP 200 and `error: 1`.
 * Since the override was taken out (22 Oct) it answers 401 — 401 with "We
 * could not find your user" for an unknown username too — and axios rejects
 * on that, so a wrong password landed in the catch and read "We couldn't
 * reach the server". Any 4xx is the server answering no. No response at all,
 * or a 5xx, is the server not answering.
 *
 * The 200 form is still read by the caller: an inactive user gets it, and so
 * does any API that has not had the change deployed.
 */
export const signInRefused = (err: unknown): boolean => {
  const status = (err as { response?: { status?: number } })?.response?.status;
  return typeof status === "number" && status >= 400 && status < 500;
};

/**
 * One claim from a JWT, without verifying it.
 *
 * For display only — the server verifies every token it is handed, so reading
 * one here decides nothing. Used for `imp`, which an impersonated token
 * carries naming the person really behind the session.
 */
export const tokenClaim = (token: string, claim: string): unknown => {
  const part = token.split(".")[1];
  if (!part) return undefined;
  try {
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return (JSON.parse(atob(padded)) as Record<string, unknown>)[claim];
  } catch {
    return undefined;
  }
};

/** Who is really signed in, when the session is someone else's. */
export const impersonatedBy = (token: string): string | null => {
  const imp = tokenClaim(token, "imp");
  return typeof imp === "string" && imp ? imp : null;
};

/**
 * What a refused "Sign in as" means, for the person who asked.
 *
 * The statuses are `/auth/impersonate`'s own: 403 below level 9, 404 no such
 * user, 400 the user exists but is inactive, 401 the caller's own session is
 * no good.
 */
export const impersonateFailureText = (err: unknown, username: string): string => {
  const status = (err as { response?: { status?: number } })?.response?.status;
  switch (status) {
    case 400:
      return `${username} is inactive, so there is no session to open.`;
    case 401:
      return "Your own session has run out. Sign out and back in, then try again.";
    case 403:
      return "Signing in as someone else needs a level 9 account.";
    case 404:
      return `There is no user named ${username}.`;
    default:
      return "That did not go through. Try again in a moment.";
  }
};
