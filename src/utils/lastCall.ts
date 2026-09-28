import axios from "axios";

/**
 * The last API response, kept so a ticket can carry evidence.
 *
 * Someone hits a problem on a page and files a ticket about it. What the tech
 * needs is the payload that produced what they were looking at, and asking a
 * client to reproduce it is asking them to do the diagnosis. One interceptor
 * holds the last call so the ticket can attach it.
 *
 * Deliberately NOT Redux. A response body is not application state — it
 * would be serialised into every devtools export, every persisted slice and
 * every state snapshot a bug report carries, which is the opposite of the
 * point. It lives here, in a module, and nothing reads it but the ticket
 * form.
 */

export interface CapturedCall {
  method: string;
  /** Path only — a full URL carries the environment and, on some calls, the
   *  query string, and the query string is where ids end up. */
  path: string;
  status: number;
  at: number;
  /** Already stringified, already capped. */
  body: string;
  truncated: boolean;
}

/**
 * Never captured.
 *
 * The first three hold or reset credentials — `/auth/token` and
 * `/auth/login` return the bearer token itself. The fourth is user creation
 * and editing, which carries whatever was typed into the form.
 *
 * This list is the frontend's to keep, and it is the weaker half of the
 * protection: it only covers endpoints somebody thought of. The size cap
 * below is the half that fails safe.
 */
const NEVER = [/\/auth\/(token|login)/i, /\/forgot_password/i, /\/users\b/i];

/**
 * A few hundred KB, and the rest is a marker.
 *
 * `/sales/export_preview` comes back at around 520 KB — two hundred rows of
 * ninety-nine columns — and `/tickets/` carries whole descriptions. Neither
 * is useful as evidence at full length, and both would be attached to a
 * ticket somebody has to open on a phone.
 */
const CAP = 256 * 1024;

let last: CapturedCall | null = null;
let armed = false;

const pathOf = (url: string | undefined) => {
  if (!url) return "";
  // Relative and absolute both arrive here; the base only matters enough to
  // let URL parse, and is thrown away with the origin.
  try {
    return new URL(url, "http://x").pathname;
  } catch {
    return url;
  }
};

/**
 * Register the interceptor. Called once, from the app's entry.
 *
 * Idempotent: a second call is a no-op rather than a second interceptor,
 * because hot reload in dev would otherwise stack them.
 */
export const armLastCall = () => {
  if (armed) return;
  armed = true;

  const keep = (
    method: string | undefined,
    url: string | undefined,
    status: number,
    data: unknown,
  ) => {
    const path = pathOf(url);
    if (!path || NEVER.some((re) => re.test(path))) return;

    let body: string;
    try {
      body = JSON.stringify(data, null, 2);
    } catch {
      // A circular or otherwise unserialisable body is not worth a crash in
      // an interceptor that every call in the app passes through.
      return;
    }

    const truncated = body.length > CAP;
    last = {
      method: (method ?? "get").toUpperCase(),
      path,
      status,
      at: Date.now(),
      body: truncated ? `${body.slice(0, CAP)}\n\n[truncated]` : body,
      truncated,
    };
  };

  axios.interceptors.response.use(
    (resp) => {
      keep(resp.config?.method, resp.config?.url, resp.status, resp.data);
      return resp;
    },
    (error) => {
      // A failed call is usually the more useful one — the house convention
      // is a 200 with `error: 1`, so a real rejection means something broke
      // below the application.
      const resp = error?.response;
      if (resp) {
        keep(error.config?.method, error.config?.url, resp.status, resp.data);
      }
      return Promise.reject(error);
    },
  );
};

export const getLastCall = () => last;

/** For a test, and for the moment after a ticket has taken a copy. */
export const clearLastCall = () => {
  last = null;
};

/** What the file is called when it rides along on a ticket. */
export const lastCallFilename = (call: CapturedCall) =>
  `response-${call.path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.json`;

/**
 * The call as a file, ready for `fileTicket`.
 *
 * `application/json` is one of the three types the endpoint takes — browsers
 * disagree about what they send for a `.json`, so the backend accepts
 * `application/json`, `text/plain` and `application/octet-stream`. Setting it
 * outright means we are not relying on the guess.
 */
export const lastCallAsFile = (call: CapturedCall) =>
  new File(
    [
      JSON.stringify(
        {
          method: call.method,
          path: call.path,
          status: call.status,
          captured_at: new Date(call.at).toISOString(),
          truncated: call.truncated,
        },
        null,
        2,
      ),
      "\n\n",
      call.body,
    ],
    lastCallFilename(call),
    { type: "application/json" },
  );
