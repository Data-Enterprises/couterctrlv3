import { describe, expect, it } from "vitest";
import { membersOf, parentChoices, type CompanyRecord } from "./companyFamily";

const co = (id: number, name: string, parent: number | null = null) =>
  ({ id, name, parent_company_id: parent }) as CompanyRecord;

// As RDS holds them: four companies under Houchens, the rest alone.
const ALL = [
  co(1, "Houchens"),
  co(3, "Bruces Foodland"),
  co(4, "Food Giant", 1),
  co(5, "DCR"),
  co(6, "Sonic", 1),
];

describe("parentChoices", () => {
  it("offers only companies that stand alone", () => {
    expect(parentChoices(ALL, undefined).map((o) => o.label)).toEqual([
      "Bruces Foodland",
      "DCR",
      "Houchens",
    ]);
  });

  it("never offers a company as its own parent", () => {
    expect(parentChoices(ALL, 3).map((o) => o.value)).not.toContain("3");
  });
});

describe("membersOf", () => {
  it("names the companies under a family head", () => {
    expect(membersOf(ALL, 1).map((c) => c.name)).toEqual(["Food Giant", "Sonic"]);
  });

  it("is empty for a company nobody belongs under, or a new one", () => {
    expect(membersOf(ALL, 3)).toEqual([]);
    expect(membersOf(ALL, undefined)).toEqual([]);
  });
});
