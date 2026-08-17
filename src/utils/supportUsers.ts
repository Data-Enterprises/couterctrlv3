/**
 * Internal support accounts that see every company and store.
 *
 * These are DCR's own support staff rather than an operator's users, so the
 * assignment-based scoping that applies to everyone else would be actively
 * unhelpful — they are called about stores they will never be assigned to.
 *
 * Deliberately **not** the same thing as a programmer. Support sees all the
 * data; only level 9 can create, rename or delete a company, because that
 * changes the tenancy itself rather than what someone is looking at.
 *
 * An allowlist is the wrong long-term home for this — every new hire needs a
 * deploy. The right fix is a role or level the backend already knows about, at
 * which point this file deletes itself and `isSupportUser` becomes a field
 * check. Until then this is the one list to edit, which is why it is here and
 * not buried in a component.
 */
const SUPPORT_EMAILS = ["jdilleha@dcrpos.com", "wmcdonough@dcrpos.com"];

/** Case- and whitespace-insensitive: these arrive from a login form, and
 *  "JDilleha@dcrpos.com " is the same person. */
export const isSupportUser = (email: string): boolean => {
  const normalized = email.trim().toLowerCase();
  return SUPPORT_EMAILS.some((e) => e === normalized);
};
