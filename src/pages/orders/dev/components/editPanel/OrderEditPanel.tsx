// Hooks
import { useEffect, useMemo, useRef } from "react";
import { useOpenDraft } from "./hooks";

// Utils
import {
  perCase,
  addedLines,
  blankLines,
  changedLines,
  costSwing,
  editedLines,
  validate,
  visibleLines,
} from "../../utils/orderEdit";
import { padStoreNumber } from "../../../../../utils/storeIdentity";
import { fmtOrderDate } from "./utils";

// Interfaces
import type { DraftLine, EditableField, LinePatch } from "../../interfaces";

// Components
import EmptyPrompt from "../../../../../components-dev/EmptyPrompt";
import LoadingIndicator from "../../../../../components-dev/loading/LoadingIndicator";
import Band from "../Band";
import Head from "./components/Head";
import Row from "./components/Row";
import SubmitOrdersButton from "./components/SubmitOrdersButton";
import EditSearchBar from "./components/EditSearchBar";
import EditStatusBar from "./components/EditStatusBar";

interface OrderEditPanelProps {
  onAddLine: () => void;
  /**
   * The line being filled in, which is not on the order yet. Held apart from
   * the draft so a half-filled row is never one of the order's lines.
   */
  pending: DraftLine | null;
  onPendingField: (field: EditableField, value: number) => void;
  onPendingPatch: (patch: LinePatch) => void;
  onConfirmPending: () => void;
  onCancelPending: () => void;
  /** Bumped when the lookup writes into the pending line's own boxes. */
  pendingNonce: number;
  /** Ask the item lookup to fill the rest in from a UPC. */
  onLookup: (lineNumber: number, upc: string) => void;
  lookingUp: number | null;
  loadingSubDepts: boolean;
  onSubmit: () => void;
  submitting: boolean;
  onLeaveEdit: () => void;
}

/**
 * One order, editable.
 *
 * Only three fields are typable — qty, case cost and retail — and they are
 * tinted and marked so the rest of a 31-column row reads as what it is:
 * carried, not offered. Each of the three is a field at rest rather than a
 * cell that turns into one on hover, with the note line under it always
 * present: a "was" arriving on edit would otherwise change the row's height
 * and move the grid under the cursor.
 *
 * Ext cost, ext retail and margin are not worked out here. They are recomputed
 * on the line itself the moment a field changes (see `orderEdit.recompute`),
 * so the grid, the totals and the payload cannot disagree about what a line is
 * worth.
 */
const OrderEditPanel = ({
  onAddLine,
  pending,
  onPendingField,
  onPendingPatch,
  onConfirmPending,
  onCancelPending,
  pendingNonce,
  onLookup,
  lookingUp,
  loadingSubDepts,
  onSubmit,
  submitting,
  onLeaveEdit,
}: OrderEditPanelProps) => {
  // The open order, its edits and the panel's figures come from the slice.
  const {
    draft,
    loading,
    search,
    onSearch,
    onField,
    onUnitCost,
    onRevertLine,
    onRevertAll,
    onDropLine,
    onPatch,
    pendingSeq,
    vendors,
    subDepts,
    onFixCost,
    stagedCount,
    submitted,
  } = useOpenDraft();
  const rows = useMemo(
    () => (draft ? visibleLines(draft, search) : []),
    [draft, search],
  );

  /** The grid's own scroller, so adding a line can bring it into view. */
  const scroller = useRef<HTMLDivElement | null>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    const open = pending !== null;
    if (open && !wasPending.current && scroller.current) {
      // The new line goes on the end of the order, so the end is where to
      // look. After paint, or the row it should land on is not there yet.
      window.requestAnimationFrame(() => {
        const el = scroller.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
    wasPending.current = open;
  }, [pending]);

  const checks = draft ? validate(draft) : [];
  const changed = draft ? changedLines(draft) : [];
  const edited = draft ? editedLines(draft) : [];
  const added = draft ? addedLines(draft) : [];
  const blank = draft ? blankLines(draft) : [];
  const swing = draft ? costSwing(draft) : null;
  const locked = submitted || submitting;

  /** Edited lines the search is hiding still go in the file, so say so. */
  const hiddenChanged = draft
    ? changed.filter((l) => !rows.some((r) => r.line_number === l.line_number))
        .length
    : 0;

  if (!draft) {
    return (
      <div className="cc-panel shadow-lg" style={{ flex: 1, minWidth: 0 }}>
        <Band onLeaveEdit={onLeaveEdit}>
          <span className="text-custom-white font-medium text-[13px]">
            Edit an order
          </span>
          <span className="text-custom-white/95 text-[11.5px]">
            pick one on the left
          </span>
          <div className="flex-1" />
          <button
            onClick={onFixCost}
            title="Open the Problems tab: fix one item's unit cost on every order the left panel shows"
            className="flex-shrink-0 rounded-md border border-custom-white/30 px-2.5 py-1 text-[13px] font-semibold text-custom-white/95 transition-colors hover:bg-custom-white/10 hover:border-custom-white/55"
          >
            Fix cost
          </button>
          {stagedCount > 0 && (
            <SubmitOrdersButton
              onSubmit={onSubmit}
              disabled={submitting}
              title="Build each changed order's file and submit it for import"
              submitting={submitting}
              submitted={submitted}
              stagedCount={stagedCount}
            />
          )}
        </Band>
        {loading ? (
          <div className="flex-1 relative">
            <LoadingIndicator message="Loading orders" />
          </div>
        ) : (
          <EmptyPrompt
            title={stagedCount > 0 ? "Changes staged" : "Pick an order to edit"}
            description={
              stagedCount > 0
                ? `${stagedCount} order${stagedCount === 1 ? " holds" : "s hold"} changes waiting to be sent — they are marked on the left. Open one to check it, or Submit to send them all.`
                : "Choose a store and an order date on the left, or use Fix cost to set one item's cost across every order that carries it."
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="cc-panel shadow-lg" style={{ flex: 1, minWidth: 0 }}>
      <Band onLeaveEdit={onLeaveEdit}>
        <span className="w-2.5 h-2.5 rounded-full bg-store_open flex-shrink-0" />
        <span className="text-custom-white font-medium text-[13px] truncate">
          {padStoreNumber(draft.doc.storenumber)} — {draft.doc.storename}
        </span>
        <span className="text-custom-white/95 text-[11.5px] tabular-nums flex-shrink-0">
          {fmtOrderDate(draft.doc.order_date)} · order {draft.doc.order_id} ·{" "}
          {draft.doc.order_type}
        </span>

        <div className="flex-1" />

        {changed.length > 0 && (
          <span className="text-custom-white/95 text-[11.5px] flex-shrink-0">
            {[
              edited.length > 0 &&
                `${edited.length} line${edited.length === 1 ? "" : "s"} edited`,
              added.length > 0 &&
                `${added.length} line${added.length === 1 ? "" : "s"} added`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        )}

        {changed.length > 0 && !locked && (
          <button
            onClick={onRevertAll}
            title="Undo every change on this order"
            className="flex-shrink-0 rounded-md border border-custom-white/30 px-2 py-0.5 text-[11.5px] font-semibold text-custom-white/95 transition-colors hover:bg-custom-white/10 hover:border-custom-white/55"
          >
            Undo all
          </button>
        )}

        <button
          onClick={onFixCost}
          title="Open the Problems tab: fix one item's unit cost on every order the left panel shows"
          className="flex-shrink-0 rounded-md border border-custom-white/30 px-2.5 py-1 text-[13px] font-semibold text-custom-white/95 transition-colors hover:bg-custom-white/10 hover:border-custom-white/55"
        >
          Fix cost
        </button>

        <SubmitOrdersButton
          onSubmit={onSubmit}
          // Any order with changes, not just this one — Fix cost stages into
          // orders that were never opened.
          disabled={stagedCount === 0 || blank.length > 0 || locked}
          title={
            blank.length > 0
              ? "An added line still has no item on it"
              : "Build the file and submit it for import"
          }
          submitting={submitting}
          submitted={submitted}
          stagedCount={stagedCount}
        />
      </Band>

      <EditSearchBar
        search={search}
        onSearch={onSearch}
        changedCount={changed.length}
        locked={locked}
        pending={pending !== null}
        onAddLine={onAddLine}
        hiddenChanged={hiddenChanged}
      />

      <div
        ref={scroller}
        className="flex-1 overflow-auto thin-scrollbar min-h-0"
      >
        <table className="w-full text-[11px] border-collapse font-mono">
          <thead className="sticky top-0 z-10 bg-custom-white">
            <tr className="border-b border-b-brand_line_2">
              <Head label="Seq #" width={78} align="right" />
              <Head label="UPC" width={140} />
              <Head label="Description" width={220} />
              <Head label="Sub dept" width={120} />
              <Head label="Vendor" width={150} />
              <Head label="Qty" width={76} align="right" editable />
              <Head label="Weight" width={82} align="right" editable />
              <Head label="Unit cost" width={92} align="right" editable />
              <Head label="Case cost" width={92} align="right" editable />
              <Head label="Retail" width={86} align="right" editable />
              <Head label="Ext cost" width={92} align="right" />
              <Head label="Ext retail" width={96} align="right" />
              <Head label="Margin" width={74} align="right" />
            </tr>
          </thead>
          <tbody className="bg-custom-white">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={13}
                  className="px-3 py-5 text-center text-[12px] font-sans text-content"
                >
                  No line matches that search. The save still carries all{" "}
                  {draft.lines.length} lines.
                </td>
              </tr>
            ) : (
              rows.map((l) => (
                // The order is part of the key: the qty, cost and retail boxes
                // are uncontrolled, so switching orders must give fresh ones.
                <Row
                  key={`${draft.doc.key}-${l.line_number}`}
                  line={l}
                  locked={locked}
                  lookingUp={lookingUp === l.line_number}
                  resetNonce={draft.resetNonce}
                  vendors={vendors}
                  subDepts={subDepts}
                  loadingSubDepts={loadingSubDepts}
                  onField={onField}
                  onUnitCost={onUnitCost}
                  onRevertLine={onRevertLine}
                  onDropLine={onDropLine}
                  onLookup={onLookup}
                  onPatch={onPatch}
                />
              ))
            )}

            {/* Last, because that is where its sequence number puts it once
                it is added. */}
            {pending && !locked && (
              <Row
                key="pending"
                line={pending}
                pendingSeq={pendingSeq}
                locked={false}
                lookingUp={lookingUp === 0}
                resetNonce={pendingNonce}
                vendors={vendors}
                subDepts={subDepts}
                loadingSubDepts={loadingSubDepts}
                onField={(_ln, field, value) => onPendingField(field, value)}
                onUnitCost={(_ln, unit) =>
                  onPendingField("base_cost", unit * perCase(pending))
                }
                onRevertLine={() => {}}
                onDropLine={onCancelPending}
                onConfirm={onConfirmPending}
                onLookup={onLookup}
                onPatch={(_ln, patch) => onPendingPatch(patch)}
              />
            )}
          </tbody>
        </table>
      </div>

      <EditStatusBar
        shown={rows.length}
        total={draft.lines.length}
        changedCount={changed.length}
        swing={swing}
        checks={checks}
      />
    </div>
  );
};

export default OrderEditPanel;
