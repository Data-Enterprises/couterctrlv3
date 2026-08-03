import React, { useRef, useState } from "react";
import CapsLockHint from "./CapsLockHint";
import { SIGN_IN_COPY } from "./portalContent";

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  /** Marks the field when submit found it empty. */
  invalid?: boolean;
}

/** Password input with the SHOW/HIDE peek toggle and Caps Lock warning.
 *
 *  No onKeyDown submit handler any more — the rail is a real <form>, so Enter
 *  submits natively. That also means password managers reliably offer to save
 *  the credentials, which they did not when submission hung off a click
 *  handler.
 *
 *  The toggle is <button type="button"> so it never submits, and reports state
 *  through aria-pressed rather than only its visible label. */
const PasswordField = ({ value, onChange, disabled, invalid }: Props) => {
  const [shown, setShown] = useState(false);
  const [caps, setCaps] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const checkCaps = (e: React.KeyboardEvent | React.FocusEvent) => {
    const native = e.nativeEvent as KeyboardEvent;
    if (typeof native.getModifierState !== "function") return;
    setCaps(native.getModifierState("CapsLock"));
  };

  const toggle = () => {
    setShown((s) => !s);
    // Put the caret back at the end rather than dropping focus, matching the
    // handoff's peek handler.
    const el = inputRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.focus();
      try {
        el.setSelectionRange(el.value.length, el.value.length);
      } catch {
        /* some input types disallow selection ranges */
      }
    });
  };

  return (
    <div className="mb-[15px]">
      <label htmlFor="password" className="block text-[12.5px] font-semibold mb-[7px] text-brand_navy">
        {SIGN_IN_COPY.passwordLabel}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          data-testid="password"
          id="password"
          name="password"
          type={shown ? "text" : "password"}
          autoComplete="current-password"
          enterKeyHint="go"
          required
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={checkCaps}
          onKeyUp={checkCaps}
          onFocus={checkCaps}
          onBlur={() => setCaps(false)}
          className={`w-full py-3 pl-3.5 pr-[70px] font-body text-[15px] text-brand_navy bg-custom-white border rounded-lg outline-none transition-colors placeholder:text-brand_placeholder focus:border-brand_green focus:shadow-[0_0_0_3.5px_rgba(30,158,82,0.15)] ${
            invalid ? "border-brand_danger" : "border-brand_line_2"
          }`}
        />
        <button
          type="button"
          onClick={toggle}
          aria-pressed={shown}
          aria-label={shown ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 font-mono text-[10px] tracking-[0.1em] text-brand_slate px-2.5 py-1.5 rounded-md transition-colors hover:text-brand_navy hover:bg-bkg cursor-pointer"
        >
          {shown ? "HIDE" : "SHOW"}
        </button>
      </div>
      <CapsLockHint show={caps} />
    </div>
  );
};

export default PasswordField;
