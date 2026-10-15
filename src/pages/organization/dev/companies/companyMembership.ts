/**
 * Moving users in and out of a company.
 *
 * ### The thing that makes this delicate
 *
 * `users/assign_user_to_company` **replaces**. It deletes every `company_link`
 * row the user has and inserts the list it was given. So a screen organised
 * around one company cannot send that company — it has to send the user's
 * whole resulting list, every time.
 *
 * Send `[thisCompany]` and the user silently loses every other company they
 * hold. Nothing errors, the panel refreshes looking correct, and the damage
 * only shows up when somebody notices a user can no longer see half their
 * stores. That is the entire reason this module exists rather than the calls
 * being made inline.
 *
 * The full list is already on hand: `GET users/` returns each user with their
 * `companies`, so nothing has to be fetched per company to do this safely.
 */

/** The shape this needs off a `User`. */
export interface MemberUser {
  id: number;
  /** Every company the user currently holds. */
  companies: number[];
}

/** One call to make: a user, and the complete list they should end up with. */
export interface CompanyPlan {
  userid: number;
  /** Whole and final — the endpoint replaces with exactly this. */
  companies: number[];
}

const uniq = (ids: number[]) =>
  Array.from(new Set(ids.filter((id) => Number.isFinite(id) && id > 0)));

/**
 * Add a company to each user who does not already hold it.
 *
 * Users who already hold it are left out rather than re-sent: the call would
 * be a no-op in result, but it still deletes and re-inserts every row that
 * user has, and a fan-out that reports "12 users assigned" when 9 of them
 * already were is a count nobody can act on.
 */
export const planAdd = (
  users: MemberUser[],
  companyid: number,
): CompanyPlan[] =>
  users
    .filter((u) => !u.companies.includes(companyid))
    .map((u) => ({
      userid: u.id,
      companies: uniq([...u.companies, companyid]),
    }));

/** Drop a company from each user who holds it, keeping the rest of their
 *  list intact. A user left holding none is allowed — removing the last one
 *  is a real thing to want, and the endpoint accepts an empty list. */
export const planRemove = (
  users: MemberUser[],
  companyid: number,
): CompanyPlan[] =>
  users
    .filter((u) => u.companies.includes(companyid))
    .map((u) => ({
      userid: u.id,
      companies: uniq(u.companies.filter((id) => id !== companyid)),
    }));

/** Users who would be left holding no company at all. Not blocked — their
 *  base groups simply stop showing on the admin screens, which read through
 *  `company_link` — but worth being able to name. */
export const leftWithNothing = (plans: CompanyPlan[]): number[] =>
  plans.filter((p) => p.companies.length === 0).map((p) => p.userid);

export type UserOutcome =
  | { userid: number; ok: true }
  | { userid: number; ok: false; reason: string };

export interface MembershipSummary {
  tone: "success" | "error";
  text: string;
  ok: number;
  failed: number;
}

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

const firstReason = (outcomes: UserOutcome[]) =>
  outcomes.find((o): o is Extract<UserOutcome, { ok: false }> => !o.ok)
    ?.reason ?? "";

export const summarize = (
  outcomes: UserOutcome[],
  companyName: string,
  direction: "in" | "out",
): MembershipSummary => {
  const done = outcomes.filter((o) => o.ok).length;
  const failed = outcomes.filter((o) => !o.ok).length;
  const verb = direction === "in" ? "added to" : "removed from";

  if (outcomes.length === 0) {
    return {
      tone: "success",
      text:
        direction === "in"
          ? `Everyone picked already holds ${companyName}.`
          : `Nobody picked holds ${companyName}.`,
      ok: 0,
      failed: 0,
    };
  }

  if (done === 0) {
    return {
      tone: "error",
      text: `No users were ${verb} ${companyName}. ${firstReason(outcomes)}`.trim(),
      ok: 0,
      failed,
    };
  }

  return {
    tone: failed > 0 ? "error" : "success",
    text:
      `${plural(done, "user")} ${verb} ${companyName}.` +
      (failed > 0 ? ` ${failed} could not be changed.` : ""),
    ok: done,
    failed,
  };
};
