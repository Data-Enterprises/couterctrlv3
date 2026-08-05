/** "Remember me" — the username only.
 *
 *  The password is deliberately not here. localStorage is readable by any
 *  script running on the origin and never expires, and these terminals get
 *  shared between shifts. The browser's own password manager already handles
 *  the password properly: the sign-in fields carry autoComplete="username" and
 *  "current-password" inside a real <form>, so it offers to save and autofills
 *  on return, encrypted and outside the page's reach.
 *
 *  What it can't do is prefill a username on its own — it only offers a
 *  username once a password is saved for the site. That gap is what this
 *  closes.
 */

const KEY = "ccc.rememberedUsername";

/** Wrapped because localStorage throws rather than returning null in Safari's
 *  private mode and when a policy blocks site data. A sign-in page that white
 *  screens because it couldn't read a convenience preference is a bad trade. */
export const readRememberedUsername = (): string => {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
};

export const saveRememberedUsername = (username: string) => {
  try {
    const trimmed = username.trim();
    if (trimmed) localStorage.setItem(KEY, trimmed);
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable — the box still works for this session */
  }
};

export const clearRememberedUsername = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing stored means nothing to clear */
  }
};
