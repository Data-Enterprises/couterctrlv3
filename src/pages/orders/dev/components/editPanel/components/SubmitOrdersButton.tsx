interface SubmitOrdersButtonProps {
  onSubmit: () => void;
  disabled: boolean;
  title: string;
  submitting: boolean;
  submitted: boolean;
  /** Orders with changes waiting to be sent. */
  stagedCount: number;
}

/** The band's white Submit button; its label follows the round trip and how
 *  many orders it sends. */
const SubmitOrdersButton = ({
  onSubmit,
  disabled,
  title,
  submitting,
  submitted,
  stagedCount,
}: SubmitOrdersButtonProps) => (
  <button
    onClick={onSubmit}
    disabled={disabled}
    title={title}
    className="flex-shrink-0 rounded-md bg-custom-white px-3 py-1 text-[11.5px] font-bold text-brand_navy transition-opacity hover:opacity-90 disabled:opacity-45"
  >
    {submitting
      ? "Submitting…"
      : submitted
        ? "Submitted"
        : stagedCount > 1
          ? `Submit ${stagedCount} orders`
          : "Submit order update"}
  </button>
);

export default SubmitOrdersButton;
