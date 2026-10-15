import type { BaseGroup } from "../../../interfaces";
import { isSupportUser } from "../../../utils/supportUsers";

/**
 * Who sees past their own assignments, and what everyone else sees.
 *
 * One definition, because three tabs ask the same question and two of them
 * used to answer it in their own words.
 *
 * **Level 9, or DCR support.** A programmer is setting up other people's
 * tenancies and holds none of them. Support is not a programmer — they change
 * nothing about the tenancy — but assignment-based scoping works against them
 * specifically: they field calls about stores they will never be assigned to.
 * See `utils/supportUsers`, which is honest that an email allowlist is the
 * wrong long-term home for the second half of this.
 */
export const seesEverything = (userLevel: number, email: string) =>
  userLevel === 9 || isSupportUser(email);

/**
 * The base groups somebody may administer.
 *
 * `base_groups_assigned_to_user` returns every group in the person's
 * companies with `active` saying whether they hold it — so the rows are both
 * halves of the answer, and which half to use is the whole question.
 *
 * Holding the company is not enough. An owner at Houchens who holds East and
 * HC North administers those two; Conventional is in the same company and is
 * not theirs to hand out. Anything else lets somebody grant access they do
 * not have themselves, which is the shape of a privilege escalation even when
 * nobody means it that way.
 */
export const heldGroupIds = (rows: BaseGroup[]): Set<number> =>
  new Set(rows.filter((g) => g.active === 1).map((g) => g.id));

/**
 * Companies worth listing at all.
 *
 * A company whose every group is somebody else's is a row that opens onto
 * nothing. Derived from the same rows rather than a second call: each carries
 * its own `company`.
 */
export const companiesWithHeldGroups = (rows: BaseGroup[]): Set<number> =>
  new Set(rows.filter((g) => g.active === 1).map((g) => g.company));

/**
 * Narrow a company's groups to the ones on offer.
 *
 * `canSeeAll` short-circuits rather than being folded into the set, so the
 * everything-case never depends on a fetch having landed — a programmer with
 * an empty `held` still sees every group, instead of briefly seeing none.
 */
export const visibleGroups = <T extends { id: number }>(
  groups: T[],
  canSeeAll: boolean,
  held: Set<number>,
): T[] => (canSeeAll ? groups : groups.filter((g) => held.has(g.id)));

/**
 * Narrow a list of companies the same way.
 *
 * `held` empty and `canSeeAll` false gives an empty list, which is the right
 * answer: somebody holding no base groups has none to administer.
 */
export const visibleCompanyList = <T extends { id: number }>(
  companies: T[],
  canSeeAll: boolean,
  withHeld: Set<number>,
): T[] =>
  canSeeAll ? companies : companies.filter((c) => withHeld.has(c.id));
