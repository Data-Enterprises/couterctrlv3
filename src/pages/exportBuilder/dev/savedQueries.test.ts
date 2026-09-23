import { describe, expect, it } from "vitest";
import reducer, {
  clearDeletedQuery,
  forgetQuery,
  initialState,
  setQueries,
  upsertQuery,
} from "../../../features/dev/devExportBuilderSlice";
import type { SavedQuery } from "../../../api/savedQueries";

const row = (over: Partial<SavedQuery> = {}): SavedQuery => ({
  id: 26,
  userid: 45,
  name: "Loss and gain by vendor",
  description: null,
  project: "sales_export",
  sql: "select vendor_id, sum(total_sales) group by vendor_id",
  created_at: "2026-09-02T22:09:35.373750",
  updated_at: "2026-09-02T22:09:35.373750",
  ...over,
});

describe("the saved queries a session holds", () => {
  it("puts a new row on top and leaves an edited one where it was", () => {
    const listed = reducer(
      initialState,
      setQueries([row({ id: 1, name: "First" }), row({ id: 2, name: "Second" })]),
    );

    const added = reducer(listed, upsertQuery(row({ id: 3, name: "Third" })));
    expect(added.queries.map((q) => q.id)).toEqual([3, 1, 2]);

    const edited = reducer(added, upsertQuery(row({ id: 1, name: "First v2" })));
    expect(edited.queries.map((q) => q.id)).toEqual([3, 1, 2]);
    expect(edited.queries[1].name).toBe("First v2");
  });

  it("makes the row it just wrote the one Save would replace", () => {
    // Names are not unique on that table, so this is what keeps Save from
    // leaving a second copy every time someone presses it.
    const after = reducer(initialState, upsertQuery(row({ id: 9 })));
    expect(after.currentQueryId).toBe(9);
  });

  it("keeps a deleted row whole, so the undo can post it back", () => {
    const listed = reducer(initialState, setQueries([row({ id: 4 })]));
    const held = reducer(listed, forgetQuery(row({ id: 4 })));

    expect(held.queries).toEqual([]);
    expect(held.deletedQuery?.sql).toBe(row().sql);
    // And the scratchpad is no longer holding a row that is gone.
    expect(held.currentQueryId).toBeNull();

    expect(reducer(held, clearDeletedQuery()).deletedQuery).toBeNull();
  });

  it("does not offer an undo for a row nobody deleted", () => {
    expect(initialState.deletedQuery).toBeNull();
  });
});
