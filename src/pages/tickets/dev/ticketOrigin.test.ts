import { describe, expect, it } from "vitest";
import { emptyGroup } from "../../../features/groupSlice";
import { initialState } from "../../../features/searchSlice";
import type { SearchState } from "../../../features/searchSlice";
import { originOf, scopeLine, scopeOf, searchSummary } from "./ticketOrigin";

const store = {
  storeid: 369,
  store_number: "002",
  store_name: "IGA Irvington KY",
  company: 4,
  company_name: "Houchens",
};

const at = (href: string) => originOf({ reportFrom: `/${href}` });

const searching = (over: Partial<SearchState> = {}): SearchState => ({
  ...initialState,
  type: "Store",
  selectedStore: store,
  startDate: "9/1/2026",
  endDate: "9/28/2026",
  singleDate: "9/27/2026",
  ...over,
});

describe("scope", () => {
  it("carries the ids a query needs, not just the name", () => {
    const scope = scopeOf(searching(), at("sales")) as {
      store: Record<string, unknown>;
    };
    expect(scope.store).toEqual({
      storeid: 369,
      store_number: "002",
      store_name: "IGA Irvington KY",
      company: 4,
      company_name: "Houchens",
    });
  });

  it("names the store number and the storeid in the line", () => {
    // Two locations of one business share a storeid, so the name alone does
    // not say which row a miscalculation is on.
    const line = scopeLine(searching(), at("sales"));
    expect(line).toContain("IGA Irvington KY");
    expect(line).toContain("#002");
    expect(line).toContain("storeid 369");
  });

  it("carries the group instead when the search is one", () => {
    const scope = scopeOf(
      searching({
        type: "Group",
        selectedGroup: { ...emptyGroup, id: 12, group_name: "West region" },
      }),
      at("sales"),
    ) as { group: Record<string, unknown> };
    expect(scope.group.id).toBe(12);
    expect(scope.group.group_name).toBe("West region");
  });

  it("records every date it holds, and which shape the page reads", () => {
    const scope = scopeOf(searching(), at("sales")) as {
      dates: Record<string, unknown>;
    };
    // Sales is a week ending on singleDate; the other two are recorded
    // anyway, because a tech reproducing this needs what the state held.
    expect(scope.dates.shape).toBe("week");
    expect(scope.dates.single_date).toBe("9/27/2026");
    expect(scope.dates.start_date).toBe("9/1/2026");
  });
});

describe("searchSummary", () => {
  it("reads a week for a weekly page", () => {
    expect(searchSummary(searching(), "sales")).toContain("week of");
  });

  it("reads one date for a single-date page", () => {
    const line = searchSummary(searching(), "loss-prevention");
    expect(line).toContain("09/27/2026");
    expect(line).not.toContain("week of");
  });

  it("pads a date the search state stored unpadded", () => {
    // formatDate writes m/d/yyyy; running the ISO formatter over that is
    // what printed "undefined/undefined/9/27/2026".
    expect(searchSummary(searching(), "loss-prevention")).not.toContain(
      "undefined",
    );
  });

  it("says nothing when nothing has been searched", () => {
    expect(
      searchSummary(searching({ selectedStore: { ...store, store_name: "" } }), "sales"),
    ).toBeNull();
  });
});
