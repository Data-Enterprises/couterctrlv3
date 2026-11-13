import { describe, expect, it } from "vitest";
import reducer, {
  addStoreSubDepts,
  clearOrderDrafts,
  dropSentDraft,
  openOrderDraft,
  patchOrdersEdit,
  storeOrderDraft,
} from "@/features/dev/devOrdersSlice";
import { setupStore } from "@/store";
import { resetAppSlice } from "@/features/appSlice";

// Interfaces
import type { OrderDraft } from "@/pages/orders/dev/interfaces";

const fresh = () => reducer(undefined, { type: "@@init" });
const draft = (key: string, resetNonce = 0) =>
  ({ doc: { key }, lines: [], resetNonce }) as unknown as OrderDraft;

describe("Orders' edit mode state", () => {
  it("starts outside edit mode with no drafts", () => {
    const e = fresh().edit;
    expect(e.editing).toBe(false);
    expect(e.drafts).toEqual({});
    expect(e.openKey).toBeNull();
    expect(e.leftTab).toBe("orders");
  });

  it("opens a draft, and stores another without moving off the open one", () => {
    let s = reducer(fresh(), openOrderDraft(draft("a")));
    s = reducer(s, storeOrderDraft(draft("b")));
    expect(s.edit.openKey).toBe("a");
    expect(Object.keys(s.edit.drafts)).toEqual(["a", "b"]);
  });

  it("drops a sent draft unless it was the open one", () => {
    let s = reducer(fresh(), openOrderDraft(draft("a")));
    s = reducer(s, storeOrderDraft(draft("b")));
    s = reducer(s, dropSentDraft({ key: "b", openKey: "a" }));
    s = reducer(s, dropSentDraft({ key: "a", openKey: "a" }));
    expect(Object.keys(s.edit.drafts)).toEqual(["a"]);
  });

  it("clears every draft and the open one for a new search", () => {
    let s = reducer(fresh(), openOrderDraft(draft("a")));
    s = reducer(s, patchOrdersEdit({ editing: true, pickStore: "301" }));
    s = reducer(s, clearOrderDrafts());
    expect(s.edit.drafts).toEqual({});
    expect(s.edit.openKey).toBeNull();
    // Edit mode and the pickers are not the search's to clear.
    expect(s.edit.editing).toBe(true);
    expect(s.edit.pickStore).toBe("301");
  });

  it("keeps each store's sub departments", () => {
    const s = reducer(
      fresh(),
      addStoreSubDepts({ storeid: 301, options: [{ id: 5, name: "Dairy" }] }),
    );
    expect(s.edit.subDeptsByStore[301]).toEqual([{ id: 5, name: "Dairy" }]);
  });

  it("is cleared on sign-out", () => {
    const store = setupStore();
    store.dispatch(openOrderDraft(draft("a")));
    store.dispatch(patchOrdersEdit({ editing: true, skipped: ["4900000634"] }));
    store.dispatch(resetAppSlice());
    const e = store.getState().dev.orders.edit;
    expect(e.drafts).toEqual({});
    expect(e.editing).toBe(false);
    expect(e.skipped).toEqual([]);
  });
});
