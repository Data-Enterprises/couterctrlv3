import { describe, expect, it } from "vitest";
import reducer, {
  rememberCounterpart,
  rememberInvestigation,
  forgetSalesCache,
  type CounterpartWeeks,
  type InvestigationWaves,
} from "./devSalesCacheSlice";
import { setHasSearched } from "./devSalesLedgerSlice";

const weeks = (tag: string) =>
  ({
    tw: [{ sub_department_description: tag }],
    lw: [],
    ly: [],
  }) as unknown as CounterpartWeeks;

const waves = (tag: string) =>
  ({
    sales: { mineTw: [{ product_code: tag }] },
    orders: { mine: [], theirs: [] },
    receipts: { mine: [], theirs: [] },
  }) as unknown as InvestigationWaves;

type CacheAction =
  | ReturnType<typeof rememberCounterpart>
  | ReturnType<typeof rememberInvestigation>
  | ReturnType<typeof forgetSalesCache>;

/** Apply a list of actions in order, from empty. */
const after = (...actions: CacheAction[]) =>
  actions.reduce(
    (state, a) => reducer(state, a),
    reducer(undefined, forgetSalesCache()),
  );

describe("the Sales comparison cache", () => {
  it("hands back what it was given, by key", () => {
    const state = after(
      rememberCounterpart({ key: "a", value: weeks("one") }),
      rememberCounterpart({ key: "b", value: weeks("two") }),
    );
    expect(state.counterpart.a.tw).toHaveLength(1);
    expect(state.counterpart.b).toBeDefined();
    expect(state.counterpart.c).toBeUndefined();
  });

  /**
   * An investigation is six periods of item rows across two stores, so the
   * cap is what stops a long session from carrying every department anybody
   * ever opened.
   */
  it("drops the oldest investigation past the cap", () => {
    const state = after(
      ...["a", "b", "c", "d", "e"].map((k) =>
        rememberInvestigation({ key: k, value: waves(k) }),
      ),
    );
    expect(state.investigationOrder).toEqual(["e", "d", "c", "b"]);
    expect(state.investigation.a).toBeUndefined();
    expect(state.investigation.e).toBeDefined();
  });

  it("moves a key it already holds to the front rather than listing it twice", () => {
    const state = after(
      rememberInvestigation({ key: "a", value: waves("a") }),
      rememberInvestigation({ key: "b", value: waves("b") }),
      rememberInvestigation({ key: "a", value: waves("a again") }),
    );
    expect(state.investigationOrder).toEqual(["a", "b"]);
  });

  /**
   * The only expiry there is.
   *
   * `setHasSearched` fires at the top of a new search and again on the way
   * back to the entry screen. Without this, somebody could re-run a search
   * and be shown the previous one's departments under the new heading — the
   * keys carry the dates and stores, but a repeat of the same search would
   * hit every one of them.
   */
  it("forgets everything when a search runs", () => {
    const loaded = after(
      rememberCounterpart({ key: "a", value: weeks("one") }),
      rememberInvestigation({ key: "a", value: waves("one") }),
    );
    expect(loaded.counterpartOrder).toHaveLength(1);

    const searched = reducer(loaded, setHasSearched(true));
    expect(searched.counterpart).toEqual({});
    expect(searched.investigation).toEqual({});
    expect(searched.counterpartOrder).toEqual([]);
    expect(searched.investigationOrder).toEqual([]);
  });

  it("forgets everything on the way back to the entry screen too", () => {
    const loaded = after(rememberCounterpart({ key: "a", value: weeks("one") }));
    expect(reducer(loaded, setHasSearched(false)).counterpart).toEqual({});
  });

  it("can be emptied on its own", () => {
    const loaded = after(rememberCounterpart({ key: "a", value: weeks("one") }));
    expect(reducer(loaded, forgetSalesCache()).counterpart).toEqual({});
  });
});
