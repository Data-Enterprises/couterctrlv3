interface PagerButtonProps {
  label: string;
  disabled: boolean;
  onClick: () => void;
}

/** A previous / next button under the report. */
const PagerButton = ({ label, disabled, onClick }: PagerButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="rounded border border-content/20 px-2 py-0.5 text-[11px] font-medium cc-muted-link hover:border-content/35 disabled:opacity-50"
  >
    {label}
  </button>
);

export default PagerButton;
