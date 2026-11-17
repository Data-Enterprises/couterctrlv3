// Hooks
import { useMemo, useState } from "react";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { useOrderDraftActions, useOrdersCtx } from ".";

// Redux
import {
  setAllOrders,
  patchOrdersEdit,
  dropSentDraft,
  addStoreSubDepts,
  EMPTY_EDIT_SEARCH,
  type OrdersEdit,
} from "../../../../features/dev/devOrdersSlice";

// API
import { updateOrderFile } from "../../../../api/orders";
import { getItemLookupSingleStore } from "../../../../api/itemLookup";
import { getSubDeptCatalog } from "../../../../api/subDeptExclusions";

// Utils
import {
  addedLines,
  appendLine,
  blankLine,
  buildDocs,
  buildPayload,
  unsentDrafts,
  editedLines,
  patchLine,
  recompute,
  startDraft,
  applySent,
} from "../utils/orderEdit";
import { reasonOf } from "../../../../utils/serverError";

// Interfaces
import type { JsonError, UpdateFileResp } from "../../../../interfaces";
import type {
  EditSearch,
  DraftLine,
  EditableField,
  LinePatch,
  OrderDoc,
  OrderDraft,
} from "../interfaces";

/**
 * Edit mode: the drafts per order and the open one, the order picker, the
 * line being added, the item lookup that fills a line from a UPC, the sub
 * departments an added line can take, and the submit that sends every
 * changed order.
 */
export const useOrderEdit = () => {
  const ctx = useOrdersCtx();
  const toast = useToast();
  /**
   * Edit mode's working state lives in the slice (`edit`), so unsent edits,
   * the open order, the pickers and the Problems tab are still there after
   * leaving the page. A draft per order: Fix cost changes every order the
   * filters hit, and switching orders must not throw away the last one's
   * changes. A new search drops the drafts, whose lines are gone.
   */
  const edit = ctx.edit;
  const patchEdit = (p: Partial<OrdersEdit>) =>
    ctx.dispatch(patchOrdersEdit(p));
  const draftActions = useOrderDraftActions();
  const { editing, drafts, openKey, submittedCounts, receipt } = edit;
  const setEditing = (editing: boolean) => patchEdit({ editing });
  const setOpenKey = (openKey: string | null) => patchEdit({ openKey });
  const setReceipt = (receipt: UpdateFileResp | null) => patchEdit({ receipt });
  const setSubmittedCounts = (submittedCounts: OrdersEdit["submittedCounts"]) =>
    patchEdit({ submittedCounts });
  const draft = openKey ? (drafts[openKey] ?? null) : null;

  /**
   * The open order's draft, with the signature the single-draft setter had,
   * so every handler that edits a line is unchanged.
   *
   * A value opens that order (adding it if it is new); a function edits the
   * one open when the handler was made; null drops them all, which is what a
   * reloaded search needs.
   */
  const setDraft = (
    next: OrderDraft | null | ((d: OrderDraft | null) => OrderDraft | null),
  ) => {
    if (next === null) draftActions.clearDrafts();
    else if (typeof next === "function") draftActions.editDraft(openKey, next);
    else draftActions.openDraft(next);
  };

  /** Every order with something to send, open or not. */
  const changedDrafts = unsentDrafts(drafts, openKey, receipt !== null);
  const changedKeys = new Set(changedDrafts.map((d) => d.doc.key));
  const { pickStore, pickDate, pickType } = edit;
  const setPickStore = (pickStore: string) => patchEdit({ pickStore });
  const setPickDate = (pickDate: string) => patchEdit({ pickDate });
  const setPickType = (pickType: string) => patchEdit({ pickType });

  const setEditSearch = (search: EditSearch) => patchEdit({ search });
  /**
   * The line being filled in, which is not on the order yet.
   *
   * Held here rather than in the draft so that a half-filled row is never one
   * of the order's lines: it takes its sequence number when it is added, not
   * when the form opens, so opening one and discarding it leaves no gap.
   */
  const [pending, setPending] = useState<DraftLine | null>(null);
  /**
   * The composing line's own reset counter, for the same reason the draft has
   * one: its cost and retail boxes are uncontrolled, so a lookup writing into
   * them has to say so.
   */
  const [pendingNonce, setPendingNonce] = useState(0);
  const [lookingUp, setLookingUp] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /**
   * The sub departments each store has, by storeid (in the slice).
   *
   * Asked for once per store and kept, because the answer does not change
   * while somebody edits an order and the catalog is a grouped scan of
   * `sales_partitioned` — not a thing to re-ask on every added line.
   */
  const subDeptsByStore = edit.subDeptsByStore;
  const [loadingSubDepts, setLoadingSubDepts] = useState(false);
  /** The orders in the result, for the picker. No call: see buildDocs. */
  const docs = useMemo(() => buildDocs(ctx.allOrders), [ctx.allOrders]);

  const dirty =
    (changedDrafts.length > 0 || pending !== null) && receipt === null;

  const leaveEdit = () => {
    if (dirty) {
      toast.warn(
        "Submit the order or undo the changes before leaving edit mode.",
      );
      return;
    }
    setEditing(false);
    setReceipt(null);
  };

  const handlePick = (doc: OrderDoc) => {
    if (doc.key === openKey) return;
    // An order that already has changes — from an earlier visit or from Fix
    // cost — opens with them rather than being started over.
    draftActions.editDrafts((ds) =>
      ds[doc.key] ? ds : { ...ds, [doc.key]: startDraft(doc, ctx.allOrders) },
    );
    setOpenKey(doc.key);
    setPending(null);
    setReceipt(null);
    setEditSearch(EMPTY_EDIT_SEARCH);
  };

  /**
   * Which sub departments this store has, for an added line.
   *
   * Fetched when the first line is added rather than when an order is opened:
   * most editing never adds a line, and this is the one call edit mode makes
   * that the page did not already have an answer for.
   */
  const loadSubDepts = (storeid: number) => {
    if (subDeptsByStore[storeid] || loadingSubDepts) return;
    setLoadingSubDepts(true);

    getSubDeptCatalog(ctx.url, ctx.token, [storeid])
      .then((rows) => {
        const seen = new Map<number, string>();
        for (const r of rows) {
          if (!seen.has(r.sub_department)) {
            seen.set(r.sub_department, r.sub_department_description);
          }
        }
        ctx.dispatch(
          addStoreSubDepts({
            storeid,
            options: [...seen.entries()]
              .map(([id, name]) => ({ id, name }))
              .sort((a, b) => a.name.localeCompare(b.name)),
          }),
        );
      })
      .catch((err) => toast.error(reasonOf(err)))
      .finally(() => setLoadingSubDepts(false));
  };

  const handleAddLine = () => {
    if (!draft || pending) return;
    loadSubDepts(draft.doc.storeid);
    const fresh = blankLine(draft);
    if (!fresh) {
      toast.warn("There is no line on this order to copy the order from.");
      return;
    }
    setPending(fresh);
    setPendingNonce((n) => n + 1);
  };

  /** The composing line is edited the same way, into its own state. */
  const handlePendingField = (field: EditableField, value: number) =>
    setPending((l) =>
      l
        ? recompute({
            ...l,
            [field]: field === "qty" ? Math.round(value) : value,
          })
        : l,
    );

  const handlePendingPatch = (patch: LinePatch) =>
    setPending((l) => (l ? recompute({ ...l, ...patch }) : l));

  /** Onto the end of the order, taking the next sequence number there. */
  const handleConfirmPending = () => {
    if (!draft || !pending) return;
    setDraft(appendLine(draft, pending));
    setPending(null);
  };

  /**
   * What the item lookup can fill in from a UPC.
   *
   * A head start, not a gate: nothing on a desktop scans, so every field on an
   * added line can be typed, and a code the lookup does not know leaves what
   * was typed alone rather than clearing it.
   *
   * The lookup does not return a case size, so that is derived from the two
   * costs it does return — `net_cost` is per case and `casecost` per unit, so
   * their ratio is the case size. Both zero means no invoice history, and 0 is
   * read as a case of one.
   */
  const handleLookup = (lineNumber: number, upc: string) => {
    if (!draft) return;
    // 0 is the line being composed: it has no sequence number until it is
    // added, so that is what the panel sends for it.
    setLookingUp(lineNumber);

    getItemLookupSingleStore(ctx.url, ctx.token, upc, draft.doc.storeid, 14)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0 || !j.product_code) {
          toast.warn(
            `No item at this store for ${upc}. Fill the line in by hand.`,
          );
          return;
        }

        const history: {
          sale_date: string;
          casecost: number;
          net_cost: number;
          price: number;
        }[] = j.history ?? [];
        const latest = [...history].sort((a, b) =>
          b.sale_date.localeCompare(a.sale_date),
        )[0];

        const perCase = latest?.net_cost ?? 0;
        const perUnit = latest?.casecost ?? 0;
        const casesize =
          perCase > 0 && perUnit > 0 ? Math.round(perCase / perUnit) : 0;

        const found: LinePatch = {
          product_code: j.product_code,
          description: j.description ?? "",
          base_cost: perCase > 0 ? perCase : perUnit,
          active_retail_price: latest?.price ?? 0,
          casesize,
        };

        if (lineNumber === 0) {
          setPending((l) => (l ? recompute({ ...l, ...found }) : l));
          setPendingNonce((n) => n + 1);
          return;
        }

        // Written from outside the boxes, so the boxes are told.
        setDraft((d) => (d ? patchLine(d, lineNumber, found, true) : d));
      })
      .catch((err) => toast.error(reasonOf(err)))
      .finally(() => setLookingUp(null));
  };

  /**
   * Build the file and submit it.
   *
   * Locked for the whole round trip: the key carries an HHMMSS stamp, so two
   * presses drop two files for one order and the import would take both. And
   * nothing is refetched afterwards — `all_orders` returns the old figures
   * until the import runs, which would read as the edit being thrown away.
   */
  const handleSubmit = async () => {
    if (submitting || receipt) return;
    if (pending) {
      toast.warn("Add the line you are filling in, or discard it, first.");
      return;
    }
    // The open order counts even untouched, so pressing Submit on it does
    // what it always did; staged orders count only when they changed.
    const toSend = changedDrafts.length ? changedDrafts : draft ? [draft] : [];
    if (!toSend.length) return;

    setSubmitting(true);
    let last: UpdateFileResp | null = null;
    const failed: string[] = [];
    let lines = ctx.allOrders;

    // One order at a time: each is its own file for the import, and a burst
    // of them is harder to read back than sending them by hand.
    for (const d of toSend) {
      const payload = buildPayload(d);
      try {
        const resp = await updateOrderFile(
          ctx.url,
          ctx.token,
          payload.storeid,
          payload.lines,
        );
        const j: UpdateFileResp = resp.data;
        if (j.error !== 0) {
          failed.push(`${d.doc.storenumber} order ${d.doc.order_id}: ${j.msg}`);
          continue;
        }
        last = j;
        // The import has not run, so `all_orders` would still return the old
        // figures. Write the sent ones onto the lines held here, or the grid,
        // the flags and "Edit again" all go back to the pre-edit costs.
        lines = applySent(lines, d);
        // Sent — so it is no longer a change waiting to go.
        ctx.dispatch(dropSentDraft({ key: d.doc.key, openKey }));
      } catch (err) {
        failed.push(
          `${d.doc.storenumber} order ${d.doc.order_id}: ${(err as JsonError).message}`,
        );
      }
    }

    setSubmitting(false);
    if (lines !== ctx.allOrders) ctx.dispatch(setAllOrders(lines));
    setSubmittedCounts({
      orders: toSend.length - failed.length,
      edited: toSend.reduce((n, d) => n + editedLines(d).length, 0),
      added: toSend.reduce((n, d) => n + addedLines(d).length, 0),
    });
    if (last) setReceipt(last);
    if (failed.length) {
      toast.warn(`Not sent — ${failed.join("; ")}`);
    } else {
      toast.success(
        toSend.length === 1
          ? "Order update submitted for import."
          : `${toSend.length} order updates submitted for import.`,
      );
    }
  };

  return {
    editing,
    setEditing,
    drafts,
    openKey,
    submittedCounts,
    setSubmittedCounts,
    receipt,
    setReceipt,
    draft,
    setDraft,
    changedDrafts,
    changedKeys,
    pickStore,
    pickDate,
    pickType,
    setPickStore,
    setPickDate,
    setPickType,
    pending,
    setPending,
    pendingNonce,
    lookingUp,
    submitting,
    loadingSubDepts,
    docs,
    leaveEdit,
    handlePick,
    handleAddLine,
    handlePendingField,
    handlePendingPatch,
    handleConfirmPending,
    handleLookup,
    handleSubmit,
  };
};
