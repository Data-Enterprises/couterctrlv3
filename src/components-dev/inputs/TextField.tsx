import type { ReactNode } from "react";

interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: ReactNode;
  placeholder?: string;
  /** Sits under the field, for the shape of the thing being typed. */
  hint?: ReactNode;
  className?: string;
}

/**
 * A plain text field, dressed like the filter inputs.
 *
 * Same shell as `filters/TextFilter` — the navy hairline, the soft shadow, the
 * border that firms up on focus — without the parts that make that one a
 * filter: no magnifying glass, no clear button, and no highlighted state while
 * it holds a value. A file name is not a filter; it is expected to be full,
 * and a field that shouts whenever it has content would be shouting always.
 */
const TextField = ({
  value,
  onChange,
  label,
  placeholder,
  hint,
  className = "",
}: TextFieldProps) => (
  <label className={`flex flex-col gap-1 min-w-0 ${className}`}>
    <span className="text-[12px] font-medium text-content">{label}</span>
    <span className="flex items-center rounded px-1.5 border border-[#1e2a4a]/75 bg-custom-white shadow-[0_1px_2px_rgba(30,42,74,0.08)] hover:border-[#1e2a4a]/50 focus-within:border-[#1e2a4a] focus-within:shadow-[0_1px_4px_rgba(30,42,74,0.18)] transition-colors">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[12px] text-content placeholder:text-content/75 min-w-0 flex-1 py-1 border-0"
        style={{ outline: "none", WebkitAppearance: "none", boxShadow: "none" }}
      />
    </span>
    {hint && <span className="text-[11px] text-content/55">{hint}</span>}
  </label>
);

export default TextField;
