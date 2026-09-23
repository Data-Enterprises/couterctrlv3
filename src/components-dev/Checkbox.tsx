import type { ReactNode } from "react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Sits to the right of the box and is part of the click target. */
  label?: ReactNode;
  /** For a box with no visible label — the column lists, where the name is
   *  its own element. */
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * The app's checkbox.
 *
 * A real `<input type="checkbox">` is still underneath: it keeps the keyboard
 * behaviour, the label association and the form semantics, and it is what
 * screen readers announce. It is only visually replaced — `accent-color` can
 * tint a native box but cannot give it the app's radius, border or focus ring,
 * and the native control looks like the operating system rather than like this
 * app.
 *
 * Dev library only, like everything else in here. Prod pages keep the boxes
 * they shipped with until a page is promoted.
 */
const Checkbox = ({
  checked,
  onChange,
  label,
  ariaLabel,
  disabled = false,
  className = "",
}: CheckboxProps) => (
  <label
    className={`inline-flex items-center gap-2 select-none ${
      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
    } ${className}`}
  >
    <span className="relative flex items-center justify-center flex-shrink-0">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span className="w-[15px] h-[15px] rounded border border-brand_line_2 bg-card_bg transition-colors peer-checked:bg-[#1e2a4a] peer-checked:border-[#1e2a4a] peer-hover:border-brand_slate peer-focus-visible:ring-2 peer-focus-visible:ring-[#1e2a4a]/40 peer-focus-visible:ring-offset-1" />
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="absolute w-[11px] h-[11px] text-custom-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
      >
        <path
          d="M3.5 8.5l3 3 6-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
    {label !== undefined && <span className="min-w-0">{label}</span>}
  </label>
);

export default Checkbox;
