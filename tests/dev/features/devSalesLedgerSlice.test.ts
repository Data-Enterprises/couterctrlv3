import { describe, expect, it } from "vitest";
import reducer, {
  EMPTY_INVESTIGATION_GRID,
  setInvestigation,
  setInvestigationGrid,
  type InvestigationTarget,
} from "@/features/dev/devSalesLedgerSlice";

/*
 * The investigation's Items grid lives in the slice so every tab reads the
 * same one, and it starts clean each time an investigation opens or closes.
 */

const target = { storeid: 1, subDept: 5 } as unknown as InvestigationTarget;
const start = reducer(undefined, { type: "init" });

describe("the investigation grid", () => {
  it("merges what it is given and keeps the rest", () => {
    const s = reducer(start, setInvestigationGrid({ page: 3, vendorQ: "Acme" }));
    const t = reducer(s, setInvestigationGrid({ picked: "0001" }));
    expect(t.investigationGrid).toEqual({
      ...EMPTY_INVESTIGATION_GRID,
      page: 3,
      vendorQ: "Acme",
      picked: "0001",
    });
  });

  it("is cleared when an investigation opens, and when it closes", () => {
    const dirty = reducer(
      start,
      setInvestigationGrid({ page: 2, cause: "never-ordered", sort: { col: "mine", dir: "asc" } }),
    );
    const opened = reducer(dirty, setInvestigation(target));
    expect(opened.investigationGrid).toEqual(EMPTY_INVESTIGATION_GRID);
    const again = reducer(opened, setInvestigationGrid({ supplyUpcs: "0001" }));
    expect(reducer(again, setInvestigation(null)).investigationGrid).toEqual(
      EMPTY_INVESTIGATION_GRID,
    );
  });
});
