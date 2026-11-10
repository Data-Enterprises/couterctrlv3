// Utils
import { FIELD_LABEL } from "../../../utils/orderEdit";

// Interfaces
import type { DraftLine, EditableField } from "../../../interfaces";

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

export default EditCell;
