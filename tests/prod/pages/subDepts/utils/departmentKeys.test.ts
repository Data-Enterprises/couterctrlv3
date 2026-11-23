import { describe, expect, it } from "vitest";
import {
  deriveSubDepts,
  groupBySubDept,
  groupTotalsBySubDept,
} from "@/pages/subDepts/prod/utils";
import type { RollupRow } from "@/api/rollup";
import type { SubDeptMargin } from "@/interfaces";

const item = (n: number, d: string) =>
  ({ sub_department: n, sub_department_description: d }) as SubDeptMargin;

/** ACE store 100223 files several departments under number 0. */
describe("Sub Dept Margins department keys", () => {
  it("lists departments that share a number separately, by number then name", () => {
    const depts = deriveSubDepts([item(14, "PAINT"), item(0, "DONATION"), item(0, "ACE REWARDS"), item(0, "DONATION")]);
    expect(depts.map((d) => d.key)).toEqual(["0|ACE REWARDS", "0|DONATION", "14|PAINT"]);
    expect(depts.map((d) => d.id)).toEqual([0, 0, 14]);
  });

  it("groups item rows by number and name", () => {
    const by = groupBySubDept([item(0, "DONATION"), item(0, "ACE REWARDS"), item(0, "DONATION")]);
    expect(by.get("0|DONATION")).toHaveLength(2);
    expect(by.get("0|ACE REWARDS")).toHaveLength(1);
  });

  it("keys a rollup row on its number and the name it carries", () => {
    const row = { key: "0", name: "POWER EQUIPMENT LABOR" } as RollupRow;
    expect([...groupTotalsBySubDept([row]).keys()]).toEqual(["0|POWER EQUIPMENT LABOR"]);
  });
});
