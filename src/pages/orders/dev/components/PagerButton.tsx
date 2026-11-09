/** A previous / next button under the report. */
const PagerButton = ({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="rounded border border-content/20 px-2 py-0.5 text-[11px] font-medium text-content/95 transition-colors hover:border-content/35 hover:text-content disabled:opacity-50"
  >
    {label}
  </button>
);

export default PagerButton;
