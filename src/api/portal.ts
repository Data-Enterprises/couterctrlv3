import axios from "axios";

/** Public portal form submissions (walkthrough requests, support tickets).
 *
 *  ⚠️ THE PATHS BELOW ARE PLACEHOLDERS. The endpoints do not exist yet — these
 *  names come from IMPLEMENTATION.md §2's proposed routes, not from anything
 *  built. Update both constants once the real routes land; nothing else in the
 *  portal needs to change.
 *
 *  Both post to `state.app.url`, the same base `login.ts` uses, so they follow
 *  the app's existing convention rather than introducing a second host.
 *
 *  Server-side work still outstanding (IMPLEMENTATION.md §3): these are public
 *  and unauthenticated, so they need re-validation, spam protection (honeypot
 *  or CAPTCHA), per-IP rate limiting, and persistence *before* notification so
 *  a mail failure cannot lose a lead. */
const WALKTHROUGH_PATH = "api/walkthrough"; // PLACEHOLDER

export interface WalkthroughRequest {
  name: string;
  company: string;
  email: string;
  phone?: string;
  role?: string;
  locations?: string;
  pos_system?: string;
  interest?: string;
  notes?: string;
}

// export interface SupportRequest {
//   name: string;
//   company: string;
//   email: string;
//   phone?: string;
//   location?: string;
//   urgency?: string;
//   issue_type: string;
//   message: string;
// }

export const requestWalkthrough = async (
  url: string,
  body: WalkthroughRequest,
) => {
  const json = await axios({
    method: "POST",
    url: url + WALKTHROUGH_PATH,
    data: body,
  });
  return json.data;
};
