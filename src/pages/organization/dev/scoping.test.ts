import { describe, it, expect } from "vitest";
import {
  canAdministerUser,
  companyReach,
  familyOf,
  companiesWithHeldGroups,
  heldGroupIds,
  seesEverything,
  visibleCompanyList,
  visibleGroups,
  type CompanyRef,
} from "./scoping";
import type { BaseGroup } from "../../../interfaces";

const row = (
  id: number,
  company: number,
  active: 1 | 0,
): BaseGroup => ({
  id,
  name: `Group ${id}`,
  company,
  company_name: `Company ${company}`,
  active,
  mode: active === 1 ? "all" : null,
});

describe("seesEverything", () => {
  it("is true for a programmer", () => {
    expect(seesEverything(9, "someone@dcr.com")).toBe(true);
  });

  it("is true for DCR support, who field calls about stores they do not hold", () => {
    expect(seesEverything(7, "jdilleha@dcrpos.com")).toBe(true);
  });

  it("is false for an owner", () => {
    expect(seesEverything(7, "manager@houchens.com")).toBe(false);
  });

  it("is false for a manager", () => {
    expect(seesEverything(5, "manager@houchens.com")).toBe(false);
  });
});

describe("heldGroupIds", () => {
  it("takes only the groups the person actually holds", () => {
    // The endpoint returns every group in their companies; `active` is the
    // half that says which are theirs.
    const held = heldGroupIds([row(4, 7, 1), row(9, 7, 0), row(12, 7, 1)]);
    expect([...held].sort((a, b) => a - b)).toEqual([4, 12]);
  });

  it("is empty when they hold none", () => {
    expect(heldGroupIds([row(4, 7, 0)]).size).toBe(0);
  });
});

describe("companiesWithHeldGroups", () => {
  it("names only companies where something is held", () => {
    const companies = companiesWithHeldGroups([
      row(4, 7, 1),
      row(9, 21, 0),
      row(12, 21, 0),
    ]);
    expect([...companies]).toEqual([7]);
  });
});

describe("visibleGroups", () => {
  const groups = [{ id: 4 }, { id: 9 }, { id: 12 }];

  it("hides a group in your company that is not yours to hand out", () => {
    // Holding the company is not enough: granting access you do not have
    // yourself is privilege escalation, however little anyone meant it.
    expect(visibleGroups(groups, false, new Set([4, 12]))).toEqual([
      { id: 4 },
      { id: 12 },
    ]);
  });

  it("shows everything to someone who sees everything", () => {
    expect(visibleGroups(groups, true, new Set())).toEqual(groups);
  });

  it("does not briefly blank a programmer while the held list loads", () => {
    // canSeeAll short-circuits, so an empty `held` -- which is what an
    // in-flight fetch looks like -- cannot hide anything from them.
    expect(visibleGroups(groups, true, new Set()).length).toBe(3);
  });

  it("shows nothing when you hold nothing", () => {
    expect(visibleGroups(groups, false, new Set())).toEqual([]);
  });
});

describe("visibleCompanyList", () => {
  const companies = [{ id: 7 }, { id: 21 }];

  it("drops a company that would open onto nothing", () => {
    expect(visibleCompanyList(companies, false, new Set([7]))).toEqual([
      { id: 7 },
    ]);
  });

  it("leaves the list alone for someone who sees everything", () => {
    expect(visibleCompanyList(companies, true, new Set())).toEqual(companies);
  });
});

/**
 * The real company ids, so these read as the tenancy rather than as fixtures.
 * Houchens is five companies under one owner; everyone else stands alone.
 */
const HOUCHENS = 1;
const GROCERY_BASKET = 2;
const BRUCES = 3;
const FOOD_GIANT = 4;
const DCR = 5;
const SONIC = 6;
const SC_FOODS = 15;
const ACE = 17;
const BT = 20;
const BROOKS = 21;

/**
 * The companies as RDS holds them since 22 Oct: Food Giant, Sonic, Ace and
 * Brooks point at Houchens; everyone else has no parent.
 */
const PARENT: Record<number, number> = {
  [FOOD_GIANT]: HOUCHENS,
  [SONIC]: HOUCHENS,
  [ACE]: HOUCHENS,
  [BROOKS]: HOUCHENS,
};
const co = (id: number): CompanyRef => ({
  company: id,
  parent_company_id: PARENT[id] ?? null,
});
const cos = (...ids: number[]) => ids.map(co);
const HOUCHENS_FIVE = [HOUCHENS, FOOD_GIANT, SONIC, ACE, BROOKS];

describe("familyOf", () => {
  it("is the parent for a company that has one, its own id otherwise", () => {
    expect(familyOf(co(FOOD_GIANT))).toBe(HOUCHENS);
    expect(familyOf(co(HOUCHENS))).toBe(HOUCHENS);
    expect(familyOf(co(BRUCES))).toBe(BRUCES);
  });

  it("reads a company with no parent_company_id at all as standing alone", () => {
    // An API without the change. Narrower than the family, never wider.
    expect(familyOf({ company: FOOD_GIANT })).toBe(FOOD_GIANT);
  });
});

describe("companyReach", () => {
  const reaches = (viewer: number[], candidate: number) =>
    canAdministerUser([co(candidate)], companyReach(cos(...viewer)), false);

  it("gives a standalone company only itself", () => {
    expect(reaches([BRUCES], BRUCES)).toBe(true);
    expect(reaches([BT], BT)).toBe(true);
    expect(reaches([BT], BRUCES)).toBe(false);
  });

  it("opens the whole family to anyone holding one of it", () => {
    // Food Giant is a Houchens company, so its manager administers Sonic's
    // people too -- one organisation, five rows on the books.
    HOUCHENS_FIVE.forEach((id) => expect(reaches([FOOD_GIANT], id)).toBe(true));
  });

  it("does not leak the family to a neighbour", () => {
    HOUCHENS_FIVE.forEach((id) => expect(reaches([BRUCES], id)).toBe(false));
  });

  it("leaves DCR out of the family", () => {
    // DCR sits beside these ids in the Orders edit gate, which is Houchens
    // plus ourselves. Different question, coincidentally similar list. DCR
    // staff reach everyone through seesEverything instead.
    expect(reaches([DCR], HOUCHENS)).toBe(false);
    expect(reaches([HOUCHENS], DCR)).toBe(false);
  });

  it("adds up across several companies held at once", () => {
    expect(reaches([BRUCES, SONIC], BRUCES)).toBe(true);
    expect(reaches([BRUCES, SONIC], ACE)).toBe(true);
    expect(reaches([BRUCES, SONIC], BT)).toBe(false);
  });

  it("takes in a new family member with no code change", () => {
    // What the hardcoded list could not do: a sixth Houchens company is
    // reachable the moment its record points at Houchens.
    const sixth: CompanyRef = { company: 99, parent_company_id: HOUCHENS };
    expect(canAdministerUser([sixth], companyReach(cos(SONIC)), false)).toBe(true);
  });

  it("is empty for somebody holding nothing", () => {
    expect([...companyReach([])]).toEqual([]);
  });
});

describe("canAdministerUser", () => {
  const bruces = companyReach(cos(BRUCES));
  const houchens = companyReach(cos(HOUCHENS));

  it("keeps a manager out of another company's people", () => {
    // The report that started this: a Bruces manager was offered Houchens
    // staff in the candidate column, and assign_user_to_company takes a bare
    // userid, so the button would have worked.
    expect(canAdministerUser(cos(HOUCHENS), bruces, false)).toBe(false);
    expect(canAdministerUser(cos(BT), bruces, false)).toBe(false);
    expect(canAdministerUser(cos(SC_FOODS), bruces, false)).toBe(false);
  });

  it("lets a manager administer their own", () => {
    expect(canAdministerUser(cos(BRUCES), bruces, false)).toBe(true);
  });

  it("lets a Houchens manager administer across the five", () => {
    HOUCHENS_FIVE.forEach((id) =>
      expect(canAdministerUser(cos(id), houchens, false)).toBe(true),
    );
    expect(canAdministerUser(cos(BRUCES), houchens, false)).toBe(false);
    expect(canAdministerUser(cos(GROCERY_BASKET), houchens, false)).toBe(false);
  });

  it("offers somebody who holds nothing to anyone", () => {
    // A new account belongs to nobody, and putting it somewhere is the whole
    // of onboarding. Nothing is taken from anyone when it moves.
    expect(canAdministerUser([], bruces, false)).toBe(true);
    expect(canAdministerUser([], companyReach(cos(BT)), false)).toBe(true);
  });

  it("needs only one company in common", () => {
    // Somebody in two companies, one of them shared. Overlap is enough: the
    // viewer already administers them somewhere.
    expect(canAdministerUser(cos(BT, BRUCES), bruces, false)).toBe(true);
  });

  it("does not let holding nothing stand in for seeing everything", () => {
    const nothing = companyReach([]);
    expect(canAdministerUser(cos(BRUCES), nothing, false)).toBe(false);
    expect(canAdministerUser([], nothing, false)).toBe(true);
  });

  it("gives a programmer or DCR support everyone", () => {
    expect(canAdministerUser(cos(HOUCHENS), bruces, true)).toBe(true);
    expect(canAdministerUser(cos(BT, ACE), companyReach([]), true)).toBe(true);
  });
});
