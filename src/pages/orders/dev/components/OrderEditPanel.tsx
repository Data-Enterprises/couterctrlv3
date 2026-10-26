import { Fragment, useEffect, useMemo, useRef } from "react";
import {
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/16/solid";
import EmptyPrompt from "../../../../components-dev/EmptyPrompt";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import { formatCurrency2 } from "../../../../utils";
import {
  EDITABLE,
  perCase,
  unitCostOf,
  FIELD_LABEL,
  addedLines,
  blankLines,
  changedLines,
  costSwing,
  editedLines,
  isAdded,
  isBlank,
  isEdited,
  validate,
  visibleLines,
  type DraftLine,
  type EditableField,
  type LinePatch,
  type OrderDraft,
} from "../orderEdit";

export type EditSearch = { code: string; desc: string; onlyChanged: boolean };
export type VendorOption = { id: string; name: string };
export type SubDeptOption = { id: number; name: string };

interface Props {
  draft: OrderDraft | null;
  loading: boolean;
  search: EditSearch;
  onSearch: (next: EditSearch) => void;
  onField: (lineNumber: number, field: EditableField, value: number) => void;
  onUnitCost: (lineNumber: number, unit: number) => void;
  onRevertLine: (lineNumber: number) => void;
  onRevertAll: () => void;
  onAddLine: () => void;
  onDropLine: (lineNumber: number) => void;
  /**
   * The line being filled in, which is not on the order yet. Held apart from
   * the draft so a half-filled row is never one of the order's lines.
   */
  pending: DraftLine | null;
  onPendingField: (field: EditableField, value: number) => void;
  onPendingPatch: (patch: LinePatch) => void;
  onConfirmPending: () => void;
  onCancelPending: () => void;
  /** What sequence number the pending line will take. */
  pendingSeq: number;
  /** Bumped when the lookup writes into the pending line's own boxes. */
  pendingNonce: number;
  /** Any field on an added line: typed, picked, or filled by the lookup. */
  onPatch: (lineNumber: number, patch: LinePatch) => void;
  /** Ask the item lookup to fill the rest in from a UPC. */
  onLookup: (lineNumber: number, upc: string) => void;
  lookingUp: number | null;
  /** The vendors already on this store's orders, for an added line. */
  vendors: VendorOption[];
  /** The sub departments this store has, fetched when the first line is added. */
  subDepts: SubDeptOption[];
  loadingSubDepts: boolean;
  onSubmit: () => void;
  submitting: boolean;
  /** Set once the file is in the bucket: the draft goes read-only. */
  submitted: boolean;
  onLeaveEdit: () => void;
}

const fmtOrderDate = (iso: string) => {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${+m}/${+d}/${y}`;
};

const padStoreNumber = (n: string | number) => String(n).padStart(3, "0");

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
  draft,
  loading,
  search,
  onSearch,
  onField,
  onUnitCost,
  onRevertLine,
  onRevertAll,
  onAddLine,
  onDropLine,
  pending,
  onPendingField,
  onPendingPatch,
  onConfirmPending,
  onCancelPending,
  pendingSeq,
  pendingNonce,
  onPatch,
  onLookup,
  lookingUp,
  vendors,
  subDepts,
  loadingSubDepts,
  onSubmit,
  submitting,
  submitted,
  onLeaveEdit,
}: Props) => {
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
    ? changed.filter((l) => !rows.some((r) => r.line_number === l.line_number)).length
    : 0;

  if (!draft) {
    return (
      <div
        className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white"
        style={{ flex: 1, minWidth: 0 }}
      >
        <Band onLeaveEdit={onLeaveEdit}>
          <span className="text-custom-white font-medium text-[13px]">
            Edit an order
          </span>
          <span className="text-custom-white/60 text-[11.5px]">
            pick one on the left
          </span>
        </Band>
        {loading ? (
          <div className="flex-1 relative">
            <LoadingIndicator message="Loading orders" />
          </div>
        ) : (
          <EmptyPrompt
            title="Pick an order to edit"
            description="Choose a store and an order date on the left. One order is one editable document, and the grid holds the whole of it — not what the filters happen to be showing."
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white"
      style={{ flex: 1, minWidth: 0 }}
    >
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
          onClick={onSubmit}
          disabled={changed.length === 0 || blank.length > 0 || locked}
          title={
            blank.length > 0
              ? "An added line still has no item on it"
              : "Build the file and submit it for import"
          }
          className="flex-shrink-0 rounded-md bg-custom-white px-3 py-1 text-[11.5px] font-bold text-brand_navy transition-opacity hover:opacity-90 disabled:opacity-45"
        >
          {submitting
            ? "Submitting…"
            : submitted
              ? "Submitted"
              : "Submit order update"}
        </button>
      </Band>

      <div className="flex-shrink-0 flex items-center gap-2 flex-wrap border-b border-brand_line bg-custom-white px-3 py-1.5">
        <SeekField
          id="order-edit-code"
          label="Product code"
          value={search.code}
          placeholder="004900000634"
          onChange={(code) => onSearch({ ...search, code })}
        />
        <SeekField
          id="order-edit-desc"
          label="Description"
          value={search.desc}
          placeholder="coffee"
          onChange={(desc) => onSearch({ ...search, desc })}
        />

        <button
          onClick={() => onSearch({ ...search, onlyChanged: !search.onlyChanged })}
          aria-pressed={search.onlyChanged}
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
            search.onlyChanged
              ? "border-filter_active_border bg-filter_active text-content"
              : "border-content/20 bg-custom-white text-content hover:border-content/35"
          }`}
        >
          Only changed
          <span className="tabular-nums">{changed.length}</span>
        </button>

        {!locked && (
          <button
            onClick={onAddLine}
            disabled={pending !== null}
            title={
              pending !== null
                ? "Finish the line you are adding first"
                : "Add a line to the end of this order"
            }
            className="flex items-center gap-1 rounded-full border border-brand_green px-2.5 py-0.5 text-[11px] font-semibold text-brand_green_darker transition-colors hover:bg-brand_green_tint disabled:opacity-45"
          >
            <PlusIcon className="w-3 h-3" />
            Add line
          </button>
        )}

        <div className="flex-1" />

        {hiddenChanged > 0 && (
          <span className="rounded bg-severity_watch_bg px-2 py-0.5 text-[11px] font-semibold text-severity_watch_text">
            {hiddenChanged} changed line{hiddenChanged === 1 ? "" : "s"} hidden by
            this search — still sent
          </span>
        )}
      </div>

      <div ref={scroller} className="flex-1 overflow-auto thin-scrollbar min-h-0">
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
                <Row
                  key={l.line_number}
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

      <div className="flex items-center gap-3 flex-wrap border-t border-gray-100 px-3 py-1.5 flex-shrink-0">
        <span className="text-[11px] text-content">
          Showing{" "}
          <span className="font-semibold tabular-nums">{rows.length}</span> of{" "}
          <span className="font-semibold tabular-nums">{draft.lines.length}</span>{" "}
          lines ·{" "}
          {changed.length === 0
            ? "nothing changed yet"
            : `the save sends all ${draft.lines.length}`}
        </span>

        {swing && Math.abs(swing.gap) > 0.004 && (
          <span className="text-[11px] text-content tabular-nums">
            Ext cost{" "}
            <span className="font-semibold">{formatCurrency2(swing.before)}</span> →{" "}
            <span className="font-semibold">{formatCurrency2(swing.after)}</span>{" "}
            <span
              className={`font-bold ${
                swing.gap > 0 ? "text-delta_negative_text" : "text-delta_positive_text"
              }`}
            >
              {swing.gap > 0 ? "+" : "−"}
              {formatCurrency2(Math.abs(swing.gap))}
            </span>
          </span>
        )}

        <span className="ml-auto flex items-center gap-1.5 flex-wrap">
          {checks.map((c) => (
            <span
              key={c.id}
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                c.ok
                  ? "bg-severity_healthy_bg text-severity_healthy_text"
                  : "bg-delta_negative_bg text-delta_negative_text"
              }`}
            >
              {c.ok ? "✓" : "✕"} {c.label}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
};

/** The navy band, with the way back to the read-only grid. */
const Band = ({
  children,
  onLeaveEdit,
}: {
  children: React.ReactNode;
  onLeaveEdit: () => void;
}) => (
  <div className="bg-brand_navy px-3 pt-2 pb-2.5 flex-shrink-0 flex items-center gap-2.5">
    <div className="flex rounded-md bg-custom-white/10 p-0.5 gap-0.5 flex-shrink-0">
      <button
        onClick={onLeaveEdit}
        className="rounded px-2.5 py-0.5 text-[11.5px] font-bold text-custom-white/95 transition-colors hover:text-custom-white"
      >
        Browse
      </button>
      <span className="rounded bg-custom-white px-2.5 py-0.5 text-[11.5px] font-bold text-brand_navy">
        Edit
      </span>
    </div>
    {children}
  </div>
);

const Head = ({
  label,
  width,
  align,
  editable,
}: {
  label: string;
  width: number;
  align?: "right";
  editable?: boolean;
}) => (
  <th
    className={`px-2.5 py-2 text-[9px] font-sans font-semibold uppercase tracking-wide whitespace-nowrap border-r border-brand_line ${
      align === "right" ? "text-right" : "text-left"
    } ${
      editable
        ? "bg-severity_watch_bg text-severity_watch_text"
        : "text-content"
    }`}
    style={{ width }}
  >
    {label}
    {editable && <span className="ml-1 font-normal">✎</span>}
  </th>
);

/**
 * One line.
 *
 * The three fields are uncontrolled on purpose: a controlled number input
 * rewrites the value on every keystroke, which moves the caret to the end
 * mid-number and makes "120" out of someone typing "12" into "0". The draft
 * is still the source of truth — the key below resets the inputs whenever the
 * line is reverted or reloaded.
 */
const Row = ({
  line,
  locked,
  lookingUp,
  resetNonce,
  onField,
  onUnitCost,
  onRevertLine,
  onDropLine,
  onConfirm,
  onLookup,
  onPatch,
  vendors,
  subDepts,
  loadingSubDepts,
  pendingSeq,
}: {
  line: DraftLine;
  /** Set on the line being composed: it shows a tick instead of a number. */
  pendingSeq?: number;
  onConfirm?: () => void;
  locked: boolean;
  lookingUp: boolean;
  resetNonce: number;
  vendors: VendorOption[];
  subDepts: SubDeptOption[];
  loadingSubDepts: boolean;
  onField: (lineNumber: number, field: EditableField, value: number) => void;
  onUnitCost: (lineNumber: number, unit: number) => void;
  onRevertLine: (lineNumber: number) => void;
  onDropLine: (lineNumber: number) => void;
  onLookup: (lineNumber: number, upc: string) => void;
  onPatch: (lineNumber: number, patch: LinePatch) => void;
}) => {
  const composing = pendingSeq !== undefined;
  const fresh = isAdded(line);
  const edited = isEdited(line);
  const ready = composing && !isBlank(line);
  const margin =
    (line.e_ret ?? 0) > 0
      ? (((line.e_ret ?? 0) - (line.cogs ?? 0)) / (line.e_ret ?? 1)) * 100
      : null;

  const cellTint = fresh
    ? "bg-brand_green_tint"
    : edited
      ? "bg-severity_watch_bg/40"
      : "";

  return (
    <tr
      className={`border-b border-b-brand_line ${
        fresh
          ? "bg-brand_green_tint"
          : edited
            ? "bg-severity_watch_bg/40"
            : "even:bg-row_stripe"
      }`}
    >
      {/* The undo and the remove live here rather than in a column of their
          own: a gutter that is empty on every unchanged line is a grey band
          down the left of a grid where nothing has been touched yet. */}
      <td className="px-2.5 py-1 text-right tabular-nums text-content border-r border-brand_line">
        <span className="flex items-center justify-end gap-1.5">
          {composing && (
            <button
              onClick={onConfirm}
              disabled={!ready}
              title={
                ready
                  ? `Add this to the order as line ${pendingSeq}`
                  : "A UPC and a vendor make it a line"
              }
              className="rounded border border-brand_green bg-brand_green px-1 py-px text-custom-white transition-opacity hover:opacity-90 disabled:opacity-35"
            >
              <CheckIcon className="w-3 h-3" />
            </button>
          )}
          {fresh && !locked && (
            <button
              onClick={() => onDropLine(line.line_number)}
              title={
                composing ? "Discard this line" : "Remove this added line"
              }
              className="text-brand_green_darker transition-colors hover:text-brand_danger"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {edited && !locked && (
            <button
              onClick={() => onRevertLine(line.line_number)}
              title="Put this line back"
              className="text-content transition-colors hover:text-brand_danger"
            >
              <ArrowUturnLeftIcon className="w-3 h-3" />
            </button>
          )}
          {(fresh || edited) && locked && (
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                fresh ? "bg-brand_green" : "bg-severity_watch_text"
              }`}
            />
          )}
          {composing ? (
            <span className="text-brand_green_darker">{pendingSeq}</span>
          ) : (
            line.line_number
          )}
        </span>
      </td>

      <td className="px-2.5 py-1 tabular-nums text-content whitespace-nowrap border-r border-brand_line">
        {fresh && !locked ? (
          <UpcField
            lineNumber={line.line_number}
            value={line.product_code}
            busy={lookingUp}
            onType={(product_code) => onPatch(line.line_number, { product_code })}
            onLookup={onLookup}
          />
        ) : (
          line.product_code || "—"
        )}
      </td>

      {/* An added line is filled in by hand as readily as by the lookup:
          there is nothing to scan with on a desktop, so every one of these is
          a field, and the lookup is a head start rather than the way in. */}
      <td className="px-2.5 py-1 font-medium text-content max-w-0 border-r border-brand_line">
        {fresh && !locked ? (
          <span className="flex items-center gap-1.5">
            <span className="flex-shrink-0 rounded bg-brand_green px-1 py-px font-sans text-[9px] font-bold uppercase tracking-wide text-custom-white">
              New
            </span>
            <input
              type="text"
              autoComplete="off"
              value={line.description ?? ""}
              placeholder={lookingUp ? "Looking it up…" : "Description"}
              aria-label={`Description on line ${line.line_number}`}
              onChange={(e) =>
                onPatch(line.line_number, { description: e.target.value })
              }
              className="w-full min-w-0 rounded-[5px] border border-brand_line_2 bg-custom-white px-1.5 py-0.5 font-mono text-[11px] text-content placeholder:text-brand_placeholder"
              style={{ outline: "none" }}
            />
          </span>
        ) : (
          <span className="block truncate">{line.description}</span>
        )}
      </td>

      <td className="px-2.5 py-1 text-content whitespace-nowrap border-r border-brand_line">
        {fresh && !locked ? (
          <select
            value={line.sub_department || ""}
            aria-label={`Sub department on line ${line.line_number}`}
            onChange={(e) => {
              const id = Number(e.target.value);
              onPatch(line.line_number, {
                sub_department: id,
                sub_department_description:
                  subDepts.find((s) => s.id === id)?.name ?? "",
              });
            }}
            className="w-[150px] rounded-[5px] border border-brand_line_2 bg-custom-white px-1 py-0.5 text-[11px] text-content"
            style={{ outline: "none" }}
          >
            <option value="">
              {loadingSubDepts ? "Loading…" : "Sub dept…"}
            </option>
            {subDepts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        ) : (
          line.sub_department_description || "—"
        )}
      </td>

      <td className="px-2.5 py-1 text-content whitespace-nowrap border-r border-brand_line">
        {fresh && !locked ? (
          <VendorField
            value={line.vendor_id}
            vendors={vendors}
            onChange={(vendorId) =>
              onPatch(line.line_number, {
                vendor_id: vendorId,
                vendor_name:
                  vendors.find((v) => v.id === vendorId)?.name ?? vendorId,
              })
            }
          />
        ) : (
          <span title={line.vendor_id || undefined}>
            {line.vendor_name || line.vendor_id || "—"}
          </span>
        )}
      </td>

      {EDITABLE.map((field) => (
        <Fragment key={field}>
          {/* Unit cost sits immediately before the case cost it writes, so
              typing one and watching the other move is the whole
              explanation of what it does. */}
          {field === "base_cost" && (
            <UnitCostCell
              line={line}
              tint={cellTint}
              resetNonce={resetNonce}
              disabled={locked}
              onUnitCost={onUnitCost}
            />
          )}
          <EditCell
            field={field}
            line={line}
            tint={cellTint}
            resetNonce={resetNonce}
            // Weight is what the money is worked out from on a scale item and
            // is ignored on everything else, so it is only offered where it
            // does something. A typed weight that changed no figure would read
            // as the grid being broken.
            disabled={locked || (field === "weight" && !line.scalable)}
            onField={onField}
          />
        </Fragment>
      ))}

      <td className="px-2.5 py-1 text-right tabular-nums text-content border-r border-brand_line">
        {formatCurrency2(line.cogs ?? 0)}
      </td>
      <td className="px-2.5 py-1 text-right tabular-nums text-content border-r border-brand_line">
        {formatCurrency2(line.e_ret ?? 0)}
      </td>
      <td
        className={`px-2.5 py-1 text-right tabular-nums ${
          edited ? "font-semibold" : ""
        } text-content`}
      >
        {margin === null ? "—" : `${margin.toFixed(1)}%`}
      </td>
    </tr>
  );
};

/**
 * Unit cost — typed here, stored as the case cost it implies.
 *
 * Four decimals rather than two: $26.32 over a case of 12 is $2.1933, and a
 * value rounded to the cent and multiplied back gives $26.32 or $26.31
 * depending on which way it went. The field people quote should not be the
 * lossy one.
 *
 * A line with no case size has nothing to divide by, so unit and case are the
 * same number — it is still typable, it just writes the same value through.
 */
const UnitCostCell = ({
  line,
  tint,
  resetNonce,
  disabled,
  onUnitCost,
}: {
  line: DraftLine;
  tint: string;
  resetNonce: number;
  disabled: boolean;
  onUnitCost: (lineNumber: number, unit: number) => void;
}) => {
  const original = line.original;
  const changed = original !== null && line.base_cost !== original.base_cost;
  const value = unitCostOf(line).toFixed(4);
  const wasUnit =
    original === null
      ? null
      : (original.base_cost ?? 0) / perCase(line);

  return (
    <td
      className={`px-2 py-1 align-top border-r border-brand_line ${tint || "bg-severity_watch_bg/[0.18]"}`}
    >
      <input
        key={`${line.line_number}-unit_cost-${resetNonce}`}
        type="number"
        min={0}
        step={0.0001}
        defaultValue={value}
        disabled={disabled}
        aria-label={`Unit cost on line ${line.line_number}`}
        title={
          line.casesize > 0
            ? `Case of ${line.casesize}`
            : "No case size — unit and case cost are the same"
        }
        onChange={(e) => {
          const next = e.target.value === "" ? 0 : Number(e.target.value);
          if (!Number.isFinite(next) || next < 0) return;
          onUnitCost(line.line_number, next);
        }}
        className={`w-full rounded-[5px] border px-1.5 py-0.5 text-right tabular-nums text-[11px] transition-colors disabled:border-transparent disabled:bg-transparent disabled:text-content ${
          changed
            ? "border-severity_watch_text bg-custom-white font-bold text-severity_watch_text"
            : "border-brand_line_2 bg-custom-white text-content hover:border-severity_watch_text/60"
        }`}
        style={{ outline: "none" }}
      />
      <span className="block h-[11px] text-right text-[9px] leading-[11px] tabular-nums text-severity_watch_text overflow-hidden">
        {changed && wasUnit !== null ? `was ${wasUnit.toFixed(4)}` : ""}
      </span>
    </td>
  );
};

/**
 * One typable field.
 *
 * The note line under it is always rendered, empty when the value is
 * untouched — it is what keeps the row from changing height the moment an
 * edit puts a "was" under the number.
 */
const EditCell = ({
  field,
  line,
  tint,
  resetNonce,
  disabled,
  onField,
}: {
  field: EditableField;
  line: DraftLine;
  tint: string;
  resetNonce: number;
  disabled: boolean;
  onField: (lineNumber: number, field: EditableField, value: number) => void;
}) => {
  const original = line.original;
  const changed = original !== null && line[field] !== original[field];
  const value = field === "qty" ? String(line.qty) : Number(line[field]).toFixed(2);

  return (
    <td
      className={`px-2 py-1 align-top border-r border-brand_line ${tint || "bg-severity_watch_bg/[0.18]"}`}
    >
      <input
        // Keyed on the nonce, which changes on a revert or a lookup and not
        // on a keystroke. Keying on the value itself remounted the input
        // every time a digit was typed, which took the caret with it.
        key={`${line.line_number}-${field}-${resetNonce}`}
        type="number"
        min={0}
        step={field === "qty" ? 1 : 0.01}
        defaultValue={value}
        disabled={disabled}
        aria-label={`${FIELD_LABEL[field]} on line ${line.line_number}`}
        title={
          disabled && field === "weight"
            ? "Weight is only used on scale items"
            : undefined
        }
        onChange={(e) => {
          const next = e.target.value === "" ? 0 : Number(e.target.value);
          if (!Number.isFinite(next) || next < 0) return;
          onField(line.line_number, field, next);
        }}
        className={`w-full rounded-[5px] border px-1.5 py-0.5 text-right tabular-nums text-[11px] transition-colors disabled:border-transparent disabled:bg-transparent disabled:text-content ${
          changed
            ? "border-severity_watch_text bg-custom-white font-bold text-severity_watch_text"
            : "border-brand_line_2 bg-custom-white text-content hover:border-severity_watch_text/60"
        }`}
        style={{ outline: "none" }}
      />
      <span className="block h-[11px] text-right text-[9px] leading-[11px] tabular-nums text-severity_watch_text overflow-hidden">
        {changed && original !== null
          ? `was ${field === "qty" ? original[field] : Number(original[field]).toFixed(2)}`
          : ""}
      </span>
    </td>
  );
};

/**
 * The UPC on an added line.
 *
 * A lookup rather than a field: the item brings its own description and what
 * the store last paid, so the only thing typed here is the code — scanned,
 * most of the time. It fires on blur and on Enter rather than per keystroke,
 * because a 12-digit code would otherwise be eleven failed lookups.
 */
const UpcField = ({
  lineNumber,
  value,
  busy,
  onType,
  onLookup,
}: {
  lineNumber: number;
  value: string;
  busy: boolean;
  onType: (upc: string) => void;
  onLookup: (lineNumber: number, upc: string) => void;
}) => {
  // What was last sent to the lookup, so leaving the field twice does not ask
  // the same question twice.
  const asked = useRef("");

  const fire = () => {
    const code = value.trim();
    if (code === "" || code === asked.current) return;
    asked.current = code;
    onLookup(lineNumber, code);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      autoFocus={value === ""}
      placeholder="UPC"
      value={value}
      disabled={busy}
      aria-label={`UPC on line ${lineNumber}`}
      onChange={(e) => onType(e.target.value)}
      onBlur={fire}
      onKeyDown={(e) => {
        if (e.key === "Enter") fire();
      }}
      title="Leave the field or press Enter to fill the rest in from the item"
      className={`w-[128px] rounded-[5px] border bg-custom-white px-1.5 py-0.5 text-[11px] tabular-nums text-content placeholder:text-brand_placeholder ${
        value.trim() ? "border-brand_green" : "border-brand_line_2"
      }`}
      style={{ outline: "none" }}
    />
  );
};

/**
 * The vendor on an added line.
 *
 * `items/itemlookup` returns the item but not a `vendor_id`, and `vendor_id`
 * is `NOT NULL` on the order — so it is asked for rather than guessed. The
 * options are the vendors already on this store's orders, because a vendor id
 * the POS does not know is worse than no line at all.
 */
const VendorField = ({
  value,
  vendors,
  onChange,
}: {
  value: string;
  vendors: VendorOption[];
  onChange: (vendorId: string) => void;
}) => (
    <select
      value={value}
      aria-label="Vendor for the added line"
      onChange={(e) => onChange(e.target.value)}
      className={`w-[142px] rounded-[5px] border bg-custom-white px-1 py-0.5 text-[11px] text-content ${
        value ? "border-brand_green" : "border-brand_line_2"
      }`}
      style={{ outline: "none" }}
    >
      <option value="">Vendor…</option>
      {vendors.map((v) => (
        <option key={v.id} value={v.id} title={v.id}>
          {v.name}
        </option>
      ))}
    </select>
);

const SeekField = ({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) => (
  <label htmlFor={id} className="flex items-center gap-1.5">
    <span className="text-[10px] font-bold uppercase tracking-wide text-content">
      {label}
    </span>
    <input
      id={id}
      type="text"
      autoComplete="off"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-[150px] rounded-md border border-brand_line_2 bg-bkg px-2 py-0.5 font-mono text-[11px] text-content placeholder:text-brand_placeholder focus:bg-custom-white focus:border-filter_active_border"
      style={{ outline: "none" }}
    />
  </label>
);

export default OrderEditPanel;
