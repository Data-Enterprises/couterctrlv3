// Interfaces
import type { CompanyPlan, MemberUser, MembershipSummary, UserOutcome } from "../interfaces";

/**
 * Moving users in and out of a company.
 *
 * `users/assign_user_to_company` **replaces**: it deletes every `company_link`
 * row the user has and inserts the list given. So every call must send the
 * user's whole resulting list; sending `[thisCompany]` silently strips every
 * other company they hold. `GET users/` already carries each user's list.
 */

const uniq = (ids: number[]) =>
  Array.from(new Set(ids.filter((id) => Number.isFinite(id) && id > 0)));

/**
 * Add a company to each user who does not already hold it. Holders are left
 * out, so the count reported is the people actually changed.
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
 *  list. Leaving someone with none is allowed (the endpoint accepts []). */
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

/** Users who would be left holding no company at all. Allowed, but their
 *  base groups stop showing on the admin screens, so worth naming. */
export const leftWithNothing = (plans: CompanyPlan[]): number[] =>
  plans.filter((p) => p.companies.length === 0).map((p) => p.userid);

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
