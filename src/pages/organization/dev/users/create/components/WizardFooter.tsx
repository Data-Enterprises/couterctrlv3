interface WizardFooterProps {
  onCancel: () => void;
  /** Why the primary button is off, said beside it. */
  blockReason: string | null;
  showUnsaved: boolean;
  /** The step's index from 0, and how many there are. */
  at: number;
  stepCount: number;
  saving: boolean;
  onBack: () => void;
  isLast: boolean;
  primaryEnabled: boolean;
  primaryLabel: string;
  /** Continue, or on the last step create or save. */
  onPrimary: () => void;
}

/** The wizard's sticky footer: Cancel, why it can't go on, the step count,
 *  Back, and Continue or the save. Sticky, because the assignments step is
 *  taller than the panel. */
const WizardFooter = ({
  onCancel,
  blockReason,
  showUnsaved,
  at,
  stepCount,
  saving,
  onBack,
  isLast,
  primaryEnabled,
  primaryLabel,
  onPrimary,
}: WizardFooterProps) => (
  <div className="sticky bottom-0 cc-bar-footer flex-wrap gap-3 -mx-4 mt-3 bg-custom-white flex-shrink-0">
    <button
      onClick={onCancel}
      className="text-[12px] font-semibold px-2 py-1.5 rounded-md text-brand_navy hover:bg-fill_soft"
    >
      Cancel
    </button>
    <div className="flex items-center gap-2.5">
      {blockReason && (
        <span
          className="text-[11.5px] font-semibold text-content"
          role="status"
        >
          {blockReason}
        </span>
      )}
      <span className="text-[11.5px] text-content/95">
        {showUnsaved ? "Unsaved changes · " : ""}
        Step {at + 1} of {stepCount}
      </span>
      {at > 0 && (
        <button
          onClick={onBack}
          disabled={saving}
          className="text-[12px] font-medium px-3.5 py-1.5 rounded-md border border-brand_line text-content hover:bg-fill_soft"
        >
          Back
        </button>
      )}
      <button
        onClick={onPrimary}
        disabled={!primaryEnabled}
        className={`text-[12px] font-medium px-4 py-1.5 rounded-md text-custom-white ${
          primaryEnabled
            ? "bg-brand_navy hover:bg-brand_navy_hover"
            : "bg-fill_track_strong cursor-not-allowed"
        }`}
      >
        {isLast ? primaryLabel : "Continue"}
      </button>
    </div>
  </div>
);

export default WizardFooter;
