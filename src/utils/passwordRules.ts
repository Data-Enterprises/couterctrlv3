/**
 * The password rules User info lists, as one list for the form and for the
 * check. They were only displayed: "a" was accepted (the backend's
 * create_user doesn't enforce them either; that half is yours).
 */
export const passwordRules = (pw: string) => [
  { met: pw.length >= 12, label: "At least 12 characters" },
  { met: /[a-z]/.test(pw) && /[A-Z]/.test(pw), label: "Upper and lower case" },
  { met: /[0-9]/.test(pw), label: "At least one number" },
  { met: /[^A-Za-z0-9]/.test(pw), label: "At least one symbol" },
];

export const passwordOk = (pw: string) => passwordRules(pw).every((r) => r.met);
