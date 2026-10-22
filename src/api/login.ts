import axios from "axios";

/**
 * Sign in.
 *
 * A wrong username or password is HTTP 401 since 22 Oct, not a 200 carrying
 * `error: 1` — see `signInRefused` in utils/session. `ov`, the old override
 * flag, is gone: the backend ignores it now, and it was the hole that let
 * anyone who set it sign in as anybody.
 */
export const login = async (url: string, username: string, password: string) => {
  // endpoint is expecting username and password to be in the request body
  const json = await axios({
    method: "POST",
    url: url + "auth/login",
    data: {
      username,
      password,
    },
  });
  return json;
};

/**
 * Sign in as someone else, from a level 9 session.
 *
 * Answers with the same body `/auth/login` does, for the person named, and a
 * token that carries `imp` naming the caller. It lasts 60 minutes rather than
 * a sign-in's usual length. The level is checked on the server from the
 * database, not from the token, so a demotion takes effect at once.
 */
export const impersonate = (url: string, token: string, username: string) =>
  axios({
    method: "POST",
    url: url + "auth/impersonate",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    data: { username },
  });
