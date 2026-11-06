// Hooks
import { Fragment } from "react";

// Utils
import { formatCurrency2 } from "../../../../../../utils";
import { EDITABLE, isAdded, isBlank, isEdited } from "../../../utils/orderEdit";

// Interfaces
import type { DraftLine, EditableField, LinePatch } from "../../../utils/orderEdit";
import type { SubDeptOption, VendorOption } from "../../../interfaces";

// Components
import {
  XMarkIcon,
  CheckIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/16/solid";
import UnitCostCell from "./UnitCostCell";
import EditCell from "./EditCell";
import UpcField from "./UpcField";
import VendorField from "./VendorField";

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

export default Row;
