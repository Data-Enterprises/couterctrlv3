import { useEffect, useRef, useState } from "react";
import { isValidEdit } from "./vendors/awg/applyEdit";

interface Props {
  /** What the file currently says, already formatted for display. */
  value: string;
  /** The schema field this cell writes to — decides how a typed value is read. */
  field: string;
  /** True once this field has been corrected, so the cell can say so. */
  edited: boolean;
  align?: "left" | "right";
  mono?: boolean;
  /** Commit. Not called when the value is unchanged or unreadable. */
  onCommit: (value: string) => void;
  /** Put this field back to what the file said. */
  onRevert: () => void;
  /** Screen-reader name, since the header is a separate element. */
  label: string;
}

/**
 * One value on an invoice line, corrected in place.
 *
 * Click it, type, and it commits on Enter or on leaving the field; Escape puts
 * it back. Committing is what re-derives the invoice totals and re-runs the
 * four checks, so a correction is visible at the card header a keystroke after
 * it is made.
 *
 * An unreadable value is refused at the keyboard rather than accepted and
 * dropped later. The input goes red and Enter does nothing while it cannot be
 * parsed, because a cell that appears to take "12.4.5" and then silently keeps
 * the old number is worse than one that will not take it at all.
 *
 * A corrected field keeps a marker afterwards. On a page whose whole job is
 * deciding whether to trust a file, "this number is not what the file said"
 * has to survive scrolling past it.
 */
const EditableCell = ({
  value,
  field,
  edited,
  align = "left",
  mono = false,
  onCommit,
  onRevert,
  label,
}: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const input = useRef<HTMLInputElement>(null);

  // Opening the editor starts from what is on screen, not from whatever was
  // left in the draft the last time this cell was open.
  useEffect(() => {
    if (editing) {
      setDraft(value);
      // The value is short and the point of clicking is to replace it.
      requestAnimationFrame(() => input.current?.select());
    }
  }, [editing, value]);

  const valid = isValidEdit(field, draft);

  const commit = () => {
    setEditing(false);
    if (!valid || draft === value) return;
    onCommit(draft);
  };

  const alignment = align === "right" ? "text-right" : "text-left";
  const family = mono ? "font-mono" : "";

  if (editing) {
    return (
      <input
        ref={input}
        value={draft}
        aria-label={label}
        aria-invalid={!valid}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setEditing(false);
          }
        }}
        className={`w-full min-w-0 rounded border bg-custom-white px-1 py-0.5 text-[12px] ${alignment} ${family} ${
          valid
            ? "border-filter_active_border"
            : "border-severity_critical_text text-severity_critical_text"
        }`}
        style={{ outline: "none", boxShadow: "none" }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        // Backspace on a corrected cell puts the file's own value back. The
        // revert is otherwise only reachable from the header count, which is
        // a long way from the cell you are looking at.
        if (edited && (e.key === "Backspace" || e.key === "Delete")) {
          e.preventDefault();
          onRevert();
        }
      }}
      title={edited ? "Corrected — Backspace to put the file's value back" : "Click to edit"}
      aria-label={`${label}${edited ? ", corrected" : ""}`}
      className={`w-full min-w-0 truncate rounded px-1 py-0.5 text-[12px] ${alignment} ${family} hover:bg-row_selected ${
        edited
          ? "bg-filter_active font-semibold text-content"
          : "text-content"
      }`}
    >
      {value || "—"}
    </button>
  );
};

export default EditableCell;
