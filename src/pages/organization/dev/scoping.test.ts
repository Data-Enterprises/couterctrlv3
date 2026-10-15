import { describe, it, expect } from "vitest";
import {
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
