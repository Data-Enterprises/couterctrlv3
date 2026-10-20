import { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, XMarkIcon, ArrowUturnLeftIcon } from "@heroicons/react/16/solid";
import EmptyPrompt from "../../../../components-dev/EmptyPrompt";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import { formatCurrency2 } from "../../../../utils";
import {
  EDITABLE,
  FIELD_LABEL,
  addedLines,
  blankLines,
  changedLines,
  costSwing,
  editedLines,
  isAdded,
  isEdited,
  validate,
  visibleLines,
  type DraftLine,
  type EditableField,
  type OrderDraft,
} from "../orderEdit";

export type EditSearch = { code: string; desc: string; onlyChanged: boolean };
export type VendorOption = { id: string; name: string };

interface Props {
  draft: OrderDraft | null;
  loading: boolean;
  search: EditSearch;
  onSearch: (next: EditSearch) => void;
  onField: (lineNumber: number, field: EditableField, value: number) => void;
  onRevertLine: (lineNumber: number) => void;
  onRevertAll: () => void;
  onAddLine: () => void;
  onDropLine: (lineNumber: number) => void;
  /** The UPC typed on an added line, looked up against this order's store. */
  onLookup: (lineNumber: number, upc: string) => void;
  onVendor: (lineNumber: number, vendorId: string) => void;
  lookingUp: number | null;
  /** The vendors already on this store's orders, for an added line. */
  vendors: VendorOption[];
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
  onRevertLine,
  onRevertAll,
  onAddLine,
  onDropLine,
  onLookup,
  onVendor,
  lookingUp,
  vendors,
  onSubmit,
  submitting,
  submitted,
  onLeaveEdit,
}: Props) => {
  const rows = useMemo(
    () => (draft ? visibleLines(draft, search) : []),
    [draft, search],
  );

  const totals = useMemo(() => {
    if (!draft) return null;
    let qty = 0;
    let cogs = 0;
    let eRet = 0;
    for (const l of draft.lines) {
      qty += l.qty;
      cogs += l.cogs ?? 0;
      eRet += l.e_ret ?? 0;
    }
    return { qty, cogs, eRet };
  }, [draft]);

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
            className="flex items-center gap-1 rounded-full border border-brand_green px-2.5 py-0.5 text-[11px] font-semibold text-brand_green_darker transition-colors hover:bg-brand_green_tint"
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

      <div className="grid grid-cols-6 divide-x divide-brand_navy/15 border-b border-gray-100 bg-custom-white flex-shrink-0">
        <Kpi
          label="Lines"
          value={draft.lines.length.toLocaleString()}
          note={added.length > 0 ? `+${added.length} added` : undefined}
        />
        <Kpi
          label="Changed"
          value={changed.length.toLocaleString()}
          note={changed.length > 0 ? `of ${draft.lines.length}` : undefined}
        />
        <Kpi label="Qty" value={totals?.qty.toLocaleString() ?? "—"} />
        <Kpi
          label="Ext cost"
          value={formatCurrency2(totals?.cogs ?? 0)}
          note={
            swing && Math.abs(swing.gap) > 0.004
              ? `was ${formatCurrency2(swing.before)}`
              : undefined
          }
        />
        <Kpi label="Ext retail" value={formatCurrency2(totals?.eRet ?? 0)} />
        <Kpi
          label="Margin"
          value={
            totals && totals.eRet > 0
              ? `${(((totals.eRet - totals.cogs) / totals.eRet) * 100).toFixed(1)}%`
              : "—"
          }
        />
      </div>

      <div className="flex-1 overflow-auto thin-scrollbar min-h-0">
        <table className="w-full text-[11px] border-collapse font-mono">
          <thead className="sticky top-0 z-10 bg-custom-white">
            <tr className="border-b border-b-brand_line_2">
              <th
                className="sticky left-0 z-30 bg-bkg border-r border-brand_line_2"
                style={{ width: 38 }}
              />
              <Head label="Seq #" width={60} align="right" />
              <Head label="UPC" width={140} />
              <Head label="Description" width={220} />
              <Head label="Sub dept" width={120} />
              <Head label="Vendor" width={110} />
              <Head label="Qty" width={76} align="right" editable />
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
                  colSpan={12}
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
                  onField={onField}
                  onRevertLine={onRevertLine}
                  onDropLine={onDropLine}
                  onLookup={onLookup}
                  onVendor={onVendor}
                />
              ))
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
  onRevertLine,
  onDropLine,
  onLookup,
  onVendor,
  vendors,
}: {
  line: DraftLine;
  locked: boolean;
  lookingUp: boolean;
  resetNonce: number;
  vendors: VendorOption[];
  onField: (lineNumber: number, field: EditableField, value: number) => void;
  onRevertLine: (lineNumber: number) => void;
  onDropLine: (lineNumber: number) => void;
  onLookup: (lineNumber: number, upc: string) => void;
  onVendor: (lineNumber: number, vendorId: string) => void;
}) => {
  const fresh = isAdded(line);
  const edited = isEdited(line);
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
      <td
        className="sticky left-0 z-20 bg-bkg border-r border-brand_line_2 text-center"
        style={{ width: 38 }}
      >
        {fresh && !locked && (
          <button
            onClick={() => onDropLine(line.line_number)}
            title="Remove this added line"
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
      </td>

      <td className="px-2.5 py-1 text-right tabular-nums text-content border-r border-brand_line">
        {line.line_number}
      </td>

      <td className="px-2.5 py-1 tabular-nums text-content whitespace-nowrap border-r border-brand_line">
        {fresh && !locked ? (
          <UpcField
            lineNumber={line.line_number}
            value={line.product_code}
            resolved={line.resolved}
            busy={lookingUp}
            onLookup={onLookup}
          />
        ) : (
          line.product_code || "—"
        )}
      </td>

      <td className="px-2.5 py-1 font-medium text-content max-w-0 truncate border-r border-brand_line">
        {fresh && !line.resolved ? (
          <span className="font-sans italic text-brand_green_darker">
            {lookingUp ? "Looking it up…" : "The item fills this in"}
          </span>
        ) : (
          <>
            {fresh && (
              <span className="mr-1.5 rounded bg-brand_green px-1 py-px font-sans text-[9px] font-bold uppercase tracking-wide text-custom-white">
                New
              </span>
            )}
            {line.description}
          </>
        )}
      </td>

      <td className="px-2.5 py-1 text-content whitespace-nowrap border-r border-brand_line">
        {line.sub_department_description || "—"}
      </td>

      <td className="px-2.5 py-1 text-content whitespace-nowrap border-r border-brand_line">
        {fresh && !locked ? (
          <VendorField
            value={line.vendor_id}
            vendors={vendors}
            onChange={(vendorId) => onVendor(line.line_number, vendorId)}
            disabled={!line.resolved}
          />
        ) : (
          line.vendor_id || "—"
        )}
      </td>

      {EDITABLE.map((field) => (
        <EditCell
          key={field}
          field={field}
          line={line}
          tint={cellTint}
          resetNonce={resetNonce}
          disabled={locked || (fresh && !line.resolved)}
          onField={onField}
        />
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
  resolved,
  busy,
  onLookup,
}: {
  lineNumber: number;
  value: string;
  resolved: boolean;
  busy: boolean;
  onLookup: (lineNumber: number, upc: string) => void;
}) => {
  const [draft, setDraft] = useState(value);
  const seen = useRef(value);

  useEffect(() => {
    if (value !== seen.current) {
      seen.current = value;
      setDraft(value);
    }
  }, [value]);

  const fire = () => {
    const code = draft.trim();
    if (code === "" || code === seen.current) return;
    seen.current = code;
    onLookup(lineNumber, code);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      autoFocus={!resolved && value === ""}
      placeholder="Scan or type UPC"
      value={draft}
      disabled={busy}
      aria-label="UPC for the added line"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={fire}
      onKeyDown={(e) => {
        if (e.key === "Enter") fire();
      }}
      className={`w-[128px] rounded-[5px] border bg-custom-white px-1.5 py-0.5 text-[11px] tabular-nums text-content ${
        resolved ? "border-brand_green" : "border-brand_line_2"
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
  disabled,
}: {
  value: string;
  vendors: VendorOption[];
  onChange: (vendorId: string) => void;
  disabled: boolean;
}) => (
    <select
      value={value}
      disabled={disabled}
      aria-label="Vendor for the added line"
      onChange={(e) => onChange(e.target.value)}
      className={`w-[104px] rounded-[5px] border bg-custom-white px-1 py-0.5 font-mono text-[11px] text-content disabled:border-transparent disabled:bg-transparent ${
        value ? "border-brand_green" : "border-brand_line_2"
      }`}
      style={{ outline: "none" }}
    >
      <option value="">Vendor…</option>
      {vendors.map((v) => (
        <option key={v.id} value={v.id} title={v.name}>
          {v.id}
        </option>
      ))}
    </select>
);

const Kpi = ({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) => (
  <div className="px-4 pt-2.5 pb-2 text-center min-w-0">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content">
      {label}
    </div>
    <div className="text-[13px] font-bold text-content truncate">{value}</div>
    <div className="h-[13px] text-[10px] font-semibold text-severity_watch_text truncate">
      {note ?? ""}
    </div>
  </div>
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
