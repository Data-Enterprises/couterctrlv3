import axios, { type AxiosError } from "axios";
import { resetAppSlice } from "../features/appSlice";

/**
 * Signs somebody out when the API says their session is over.
 *
 * Since the backend started checking the account on every request (goliath
 * `efd4cd6`), a deactivated user's token is refused with 401 "This account is
 * no longer active" — and an expired one with 401 as before. Nothing here
 * listened, so the page stayed up and every click failed with a toast of its
 * own. Now the first 401 from our API signs them out the way Sign out does,
 * and the sign-in screen says why.
 *
 * ### What counts
 *
 * - A 401, from the goliath API (dev or prod base URL). The legacy backend
 *   has its own auth and its own reasons, so its 401s are left alone.
 * - Not from `auth/login`: a 401 there is a wrong password, said on the
 *   form, and there is no session to end.
 * - Only while signed in, so the burst of 401s that follows the first one —
 *   every call in flight was sent with the same token — signs out once.
 * - **Dev only, for now.** `apiEnv` must be "dev". Prod pages get this when
 *   they are promoted, like every other change made through the dev tree.
 *
 * ### Why the request is left hanging
 *
 * The call that triggered it would otherwise reject into its own catch, and
 * the sign-in screen would open under a stack of "Request failed with status
 * code 401" toasts — one per call in flight. The page that made the call is
 * gone the moment the store is reset, so nothing is waiting on the answer.
 */

/** Why the last automatic sign-out happened, for the sign-in screen. */
let pendingReason: string | null = null;

/**
 * The reason, without clearing it — safe as a `useState` initializer, which
 * StrictMode calls twice. The sign-in screen clears it once it has mounted.
 */
export const peekSignOutReason = (): string | null => pendingReason;

export const clearSignOutReason = () => {
  pendingReason = null;
};

/** What to tell somebody who was signed out, from the API's own detail. */
export const signOutReasonFor = (detail: unknown): string =>
  typeof detail === "string" && /no longer active/i.test(detail)
    ? "This account has been deactivated. If that is a mistake, ask whoever manages your users."
    : "Your session has ended. Sign in again to carry on.";

const ourApi = (url: string | undefined) =>
  typeof url === "string" &&
  [import.meta.env.VITE_API_URL_DEV, import.meta.env.VITE_API_URL_PROD].some(
    (base) => typeof base === "string" && base !== "" && url.startsWith(base),
  );

/** Whether this failure should end the session. Pure, for the tests. */
export const shouldSignOut = (
  err: Pick<AxiosError, "response" | "config">,
  state: { loggedIn: boolean; apiEnv: "dev" | "prod" },
): boolean => {
  if (err.response?.status !== 401) return false;
  if (!state.loggedIn || state.apiEnv !== "dev") return false;
  const url = err.config?.url;
  if (!ourApi(url)) return false;
  return !/\/auth\/login\b/.test(url ?? "");
};

type GuardStore = {
  getState: () => { app: { loggedIn: boolean; apiEnv: "dev" | "prod" } };
  dispatch: (action: ReturnType<typeof resetAppSlice>) => unknown;
};

/** Install once, before the first render — beside `armPageCalls`. */
export const armSessionGuard = (store: GuardStore) => {
  axios.interceptors.response.use(
    (resp) => resp,
    (error: AxiosError) => {
      if (!shouldSignOut(error, store.getState().app)) {
        return Promise.reject(error);
      }
      const data = error.response?.data as { detail?: unknown } | undefined;
      pendingReason = signOutReasonFor(data?.detail);
      store.dispatch(resetAppSlice());
      // Back to the root, as Sign out does. BrowserRouter only hears about a
      // history change made outside it through popstate.
      window.history.replaceState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
      return new Promise(() => undefined);
    },
  );
};
