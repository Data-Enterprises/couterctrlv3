// Hooks
import { useMemo } from "react";
import { useOrderDraftActions, useOrdersCtx } from "../../../hooks";

// Redux
import { patchOrdersEdit } from "../../../../../../features/dev/devOrdersSlice";

// Utils
import {
  applyField,
  applyUnitCost,
  unsentDrafts,
  dropLine,
  nextSeq,
  patchLine,
  revertAll,
  revertLine,
} from "../../../utils/orderEdit";
import { storeVendors } from "../utils";

// Interfaces
import type { EditSearch, EditableField, LinePatch, OrderDraft } from "../../../interfaces";

/**
 * The open order and everything the edit panel does to it, read from the
 * slice's `edit` block. Each edit goes to the order open when the panel drew.
 */
export const useOpenDraft = () => {
  const ctx = useOrdersCtx();
  const { editDraft } = useOrderDraftActions();
  const { drafts, openKey, search, subDeptsByStore, receipt } = ctx.edit;
  const draft = openKey ? (drafts[openKey] ?? null) : null;
  const edit = (fn: (d: OrderDraft) => OrderDraft) =>
    editDraft(openKey, (d) => (d ? fn(d) : d));

  /** The vendors already on this store's orders, for an added line. */
  const vendors = useMemo(
    () => storeVendors(ctx.allOrders, draft),
    [ctx.allOrders, draft],
  );

  return {
    draft,
    loading: ctx.loadingAllOrders,
    search,
    onSearch: (next: EditSearch) => ctx.dispatch(patchOrdersEdit({ search: next })),
    onField: (lineNumber: number, field: EditableField, value: number) =>
      edit((d) => applyField(d, lineNumber, field, value)),
    /** A typed unit cost, stored as the case cost it implies. */
    onUnitCost: (lineNumber: number, unit: number) =>
      edit((d) => applyUnitCost(d, lineNumber, unit)),
    onRevertLine: (lineNumber: number) => edit((d) => revertLine(d, lineNumber)),
    onRevertAll: () => edit((d) => revertAll(d)),
    onDropLine: (lineNumber: number) => edit((d) => dropLine(d, lineNumber)),
    /** Everything typed or picked on an added line comes through here. */
    onPatch: (lineNumber: number, patch: LinePatch) =>
      edit((d) => patchLine(d, lineNumber, patch)),
    /** What sequence number the pending line will take. */
    pendingSeq: draft ? nextSeq(draft) : 1,
    vendors,
    /** The sub departments this store has, fetched when the first line is added. */
    subDepts: draft ? (subDeptsByStore[draft.doc.storeid] ?? []) : [],
    /** Opens the Problems tab, where one item's unit cost is fixed across
     *  every order the left panel shows. */
    onFixCost: () => ctx.dispatch(patchOrdersEdit({ leftTab: "problems" })),
    /** How many orders hold changes waiting to be sent; Submit sends them all. */
    stagedCount: unsentDrafts(drafts, openKey, receipt !== null).length,
    /** Set once the file is in the bucket: the draft goes read-only. */
    submitted: receipt !== null,
  };
};
