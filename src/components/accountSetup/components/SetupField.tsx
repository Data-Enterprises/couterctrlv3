// Hooks
import { useState } from "react";

// Utils
import { FIELD, LABEL } from "../utils";

interface SetupFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** A password field gets the SHOW / HIDE peek. */
  type?: "text" | "password";
  autoComplete?: string;
  autoFocus?: boolean;
}

/** A labelled input in the app's look. */
const SetupField = ({ id, label, value, onChange, type = "text", autoComplete, autoFocus }: SetupFieldProps) => {
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          data-testid={id}
          type={isPassword && !shown ? "password" : "text"}
          value={value}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          className={`${FIELD} ${isPassword ? "pr-16" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-pressed={shown}
            aria-label={shown ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 -translate-y-1/2 font-mono text-[10px] tracking-[0.1em] text-brand_slate px-2 py-1 rounded-md transition-colors hover:text-brand_navy hover:bg-bkg"
          >
            {shown ? "HIDE" : "SHOW"}
          </button>
        )}
      </div>
    </div>
  );
};

export default SetupField;
