import { describe, it, expect } from "vitest";
import {
  canAdministerUser,
  companyReach,
  companiesWithHeldGroups,
  heldGroupIds,
  seesEverything,
  visibleCompanyList,
  visibleGroups,
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

describe("companyReach", () => {
  it("gives a standalone company only itself", () => {
    expect([...companyReach([BRUCES])]).toEqual([BRUCES]);
    expect([...companyReach([BT])]).toEqual([BT]);
  });

  it("opens the whole family to anyone holding one of it", () => {
    // Food Giant is a Houchens company, so its manager administers Sonic's
    // people too -- one organisation, five rows on the books.
    const reach = companyReach([FOOD_GIANT]);
    [HOUCHENS, FOOD_GIANT, SONIC, ACE, BROOKS].forEach((id) =>
      expect(reach.has(id)).toBe(true),
    );
  });

  it("does not leak the family to a neighbour", () => {
    const reach = companyReach([BRUCES]);
    [HOUCHENS, FOOD_GIANT, SONIC, ACE, BROOKS].forEach((id) =>
      expect(reach.has(id)).toBe(false),
    );
  });

  it("leaves DCR out of the family", () => {
    // DCR sits beside these ids in the Orders edit gate, which is Houchens
    // plus ourselves. Different question, coincidentally similar list. DCR
    // staff reach everyone through seesEverything instead.
    expect(companyReach([DCR]).has(HOUCHENS)).toBe(false);
    expect(companyReach([HOUCHENS]).has(DCR)).toBe(false);
  });

  it("adds up across several companies held at once", () => {
    const reach = companyReach([BRUCES, SONIC]);
    expect(reach.has(BRUCES)).toBe(true);
    expect(reach.has(ACE)).toBe(true);
    expect(reach.has(BT)).toBe(false);
  });

  it("is empty for somebody holding nothing", () => {
    expect([...companyReach([])]).toEqual([]);
  });
});

describe("canAdministerUser", () => {
  const bruces = companyReach([BRUCES]);
  const houchens = companyReach([HOUCHENS]);

  it("keeps a manager out of another company's people", () => {
    // The report that started this: a Bruces manager was offered Houchens
    // staff in the candidate column, and assign_user_to_company takes a bare
    // userid, so the button would have worked.
    expect(canAdministerUser([HOUCHENS], bruces, false)).toBe(false);
    expect(canAdministerUser([BT], bruces, false)).toBe(false);
    expect(canAdministerUser([SC_FOODS], bruces, false)).toBe(false);
  });

  it("lets a manager administer their own", () => {
    expect(canAdministerUser([BRUCES], bruces, false)).toBe(true);
  });

  it("lets a Houchens manager administer across the five", () => {
    [HOUCHENS, FOOD_GIANT, SONIC, ACE, BROOKS].forEach((id) =>
      expect(canAdministerUser([id], houchens, false)).toBe(true),
    );
    expect(canAdministerUser([BRUCES], houchens, false)).toBe(false);
    expect(canAdministerUser([GROCERY_BASKET], houchens, false)).toBe(false);
  });

  it("offers somebody who holds nothing to anyone", () => {
    // A new account belongs to nobody, and putting it somewhere is the whole
    // of onboarding. Nothing is taken from anyone when it moves.
    expect(canAdministerUser([], bruces, false)).toBe(true);
    expect(canAdministerUser([], companyReach([BT]), false)).toBe(true);
  });

  it("needs only one company in common", () => {
    // Somebody in two companies, one of them shared. Overlap is enough: the
    // viewer already administers them somewhere.
    expect(canAdministerUser([BT, BRUCES], bruces, false)).toBe(true);
  });

  it("does not let holding nothing stand in for seeing everything", () => {
    const nothing = companyReach([]);
    expect(canAdministerUser([BRUCES], nothing, false)).toBe(false);
    expect(canAdministerUser([], nothing, false)).toBe(true);
  });

  it("gives a programmer or DCR support everyone", () => {
    expect(canAdministerUser([HOUCHENS], bruces, true)).toBe(true);
    expect(canAdministerUser([BT, ACE], companyReach([]), true)).toBe(true);
  });
});
