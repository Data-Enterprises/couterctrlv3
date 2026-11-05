import { describe, expect, it } from "vitest";
import { initialState } from "../../../features/searchSlice";
import type { SearchState } from "../../../features/searchSlice";
import type { RootState } from "../../../store";
import { pageStoreOf, searchForPage } from "./pageStore";
import { originOf, searchSummary } from "./ticketOrigin";

const irvington = {
  storeid: 369,
  store_number: "002",
  store_name: "IGA IRVINGTON KY 2",
  company: 4,
  company_name: "Houchens",
};
const bowling = {
  storeid: 512,
  store_number: "014",
  store_name: "IGA BOWLING GREEN",
  company: 4,
  company_name: "Houchens",
};

// The last search on Sales: Irvington.
const onSales: SearchState = {
  ...initialState,
  type: "Store",
  selectedStore: irvington,
  lastStore: 369,
  singleDate: "11/2/2026",
};

const withItemActions = (scope: { storeid: number; start: string; end: string } | null, storeId = 0) =>
  ({ dev: { itemReport: { scope, storeId } } }) as unknown as RootState;

const ticketLine = (state: RootState, href: string) => {
  const own = pageStoreOf(state, href);
  return searchSummary(
    searchForPage(onSales, own, [irvington, bowling]),
    originOf({ reportFrom: `/${href}` }).href,
  );
};

describe("a ticket from a page with its own store picker", () => {
  it("names the store the page ran, not the one open on Sales", () => {
    const state = withItemActions({ storeid: 512, start: "2026-10-27", end: "2026-11-02" });
    expect(ticketLine(state, "item-report")).toMatch(/^IGA BOWLING GREEN 014/);
  });

  it("names nothing while nothing is picked", () => {
    expect(ticketLine(withItemActions(null), "item-report")).toBeNull();
  });

  it("falls back to the picker before a run", () => {
    expect(ticketLine(withItemActions(null, 512), "item-report")).toMatch(/^IGA BOWLING GREEN/);
  });

  it("carries the page's own window into the record", () => {
    const search = searchForPage(
      onSales,
      { storeid: 512, start: "2026-10-27", end: "2026-11-02" },
      [bowling],
    );
    expect(search.startDate).toBe("2026-10-27");
    expect(search.endDate).toBe("2026-11-02");
    expect(search.selectedStore.storeid).toBe(512);
  });

  it("leaves pages on the shared search alone", () => {
    const state = withItemActions(null);
    expect(pageStoreOf(state, "sales")).toBeUndefined();
    expect(ticketLine(state, "sales")).toMatch(/^IGA IRVINGTON KY 2/);
  });
});
