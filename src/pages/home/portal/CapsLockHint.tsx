interface Props {
  show: boolean;
}

/** Caps Lock warning under the password field.
 *
 *  From the Aug 2026 handoff revision, whose comment calls it "the single most
 *  common cause of a failed sign-in". `aria-live="polite"` so it is announced
 *  when it appears without interrupting typing. */
const CapsLockHint = ({ show }: Props) => (
  <p
    aria-live="polite"
    className={`flex items-center gap-1.5 mt-1.5 text-[12px] text-brand_danger transition-opacity ${
      show ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
    }`}
  >
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-none" aria-hidden="true"
         fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4 5 11h4v5h6v-5h4z" />
      <path d="M9 20h6" />
    </svg>
    Caps Lock is on
  </p>
);

export default CapsLockHint;
