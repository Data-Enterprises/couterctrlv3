interface SubmitButtonProps {
  label: string;
  busyLabel: string;
  busy: boolean;
  disabled?: boolean;
}

/** The step's submit, the sign-in button's twin: busy shows a spinner and blocks a second press. */
const SubmitButton = ({ label, busyLabel, busy, disabled }: SubmitButtonProps) => (
  <button
    type="submit"
    data-testid="forgot-submit"
    disabled={busy || disabled}
    aria-busy={busy}
    className="w-full mt-[7px] flex items-center justify-center gap-2.5 font-display font-semibold text-[15px] text-custom-white bg-portal_navy rounded-lg px-[18px] py-3 transition-colors hover:bg-portal_navy_hover disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
  >
    {busy && (
      <span
        aria-hidden="true"
        className="w-4 h-4 rounded-full border-2 border-custom-white/35 border-t-custom-white animate-spin motion-reduce:animate-none"
      />
    )}
    {busy ? busyLabel : label}
  </button>
);

export default SubmitButton;
