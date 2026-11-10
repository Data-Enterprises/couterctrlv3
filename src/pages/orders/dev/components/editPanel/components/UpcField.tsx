// Hooks
import { useRef } from "react";

interface UpcFieldProps {
  lineNumber: number;
  value: string;
  busy: boolean;
  onType: (upc: string) => void;
  onLookup: (lineNumber: number, upc: string) => void;
}

/**
 * The UPC on an added line.
 *
 * A lookup rather than a field: the item brings its own description and what
 * the store last paid, so the only thing typed here is the code — scanned,
 * most of the time. It fires on blur and on Enter rather than per keystroke,
 * because a 12-digit code would otherwise be eleven failed lookups.
 */
const UpcField = ({ lineNumber, value, busy, onType, onLookup }: UpcFieldProps) => {
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

export default UpcField;
