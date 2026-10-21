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
 * Companies that administer each other, because one owner holds them all.
 *
 * Houchens is five companies on the books -- Houchens (1), Food Giant (4),
 * Sonic (6), Ace (17) and Brooks (21) -- and one organisation in practice, so
 * somebody administering any of them administers the staff of all five.
 * Everybody else stands alone: Bruces Foodland (3), Grocery Basket (2), S&C
 * Foods (15) and B and T (20) each reach only their own people.
 *
 * DCR (5) is deliberately NOT here. It appears alongside these ids in the
 * Orders edit gate, which is Houchens plus ourselves -- a different question
 * with a coincidentally similar list. DCR staff reach everyone through
 * `seesEverything`, not through a family.
 *
 * A hardcoded list is the wrong long-term home for this, the same way an
 * email allowlist is the wrong home for support users: add a sixth Houchens
 * company and this file has to be edited before anybody can administer it,
 * and nothing will say so. It wants a `parent_company_id` on the company
 * record. Until there is one, this is the honest version -- one list, named,
 * in the file that already answers "who may administer what".
 */
export const COMPANY_FAMILIES: readonly (readonly number[])[] = [
  [1, 4, 6, 17, 21],
];

/**
 * Every company the viewer administers through, given what they hold.
 *
 * Their own, plus the rest of any family one of theirs belongs to. Holding
 * Food Giant reaches Sonic; holding Bruces reaches Bruces.
 */
export const companyReach = (viewerCompanyIds: number[]): Set<number> => {
  const reach = new Set(viewerCompanyIds);
  COMPANY_FAMILIES.forEach((family) => {
    if (viewerCompanyIds.some((id) => family.includes(id)))
      family.forEach((id) => reach.add(id));
  });
  return reach;
};

/**
 * Whether the signed-in user may administer this person at all.
 *
 * The Companies tab builds its candidate column from every user the server
 * returns, which is every user on the system. A Bruces manager was therefore
 * offered four hundred people to add to Bruces, Houchens staff among them --
 * and `assign_user_to_company` takes a bare userid with no ownership check, so
 * the offer was real. Somebody could pull a person out of a company they have
 * nothing to do with.
 *
 * Three ways in, and no others:
 *
 *  - **Sees everything.** Level 9 and DCR support, by the same rule the rest
 *    of this file uses. A programmer setting up a tenancy holds none of it.
 *  - **Holds no company.** A new account belongs to nobody yet, and putting it
 *    somewhere is the whole of onboarding. Nobody loses anything when it moves,
 *    which is what makes it safe for any manager to pick up.
 *  - **Is inside the viewer's reach.** Their own companies and any family
 *    those belong to -- see `companyReach`. Not the company on screen: one
 *    person can administer several, and a Houchens manager works across the
 *    five.
 *
 * The level guard is separate and still applies: this says which people are
 * yours to touch, `user_level <= ctx.userLevel` says you cannot reach above
 * yourself. Both have to pass.
 *
 * Note what this does NOT narrow: the right-hand column. Somebody already in
 * the company you are looking at holds it, so they are in your reach by
 * definition -- the gate can only ever shorten the candidate list.
 */
export const canAdministerUser = (
  candidateCompanyIds: number[],
  reach: Set<number>,
  canSeeAll: boolean,
): boolean => {
  if (canSeeAll) return true;
  if (candidateCompanyIds.length === 0) return true;
  return candidateCompanyIds.some((id) => reach.has(id));
};

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
