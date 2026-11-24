interface RecordsChoiceProps {
  /** Rows the file will hold, in a line. */
  detail: string;
  /** Single-store data has no store list above it, so it gets a caption. */
  showCaption: boolean;
}

/** Presets mode's one dataset: the coupon records, always included. */
const RecordsChoice = ({ detail, showCaption }: RecordsChoiceProps) => (
  <div>
    {showCaption && (
      <p className="text-[11px] text-content/95 uppercase tracking-wide font-medium mb-3">
        Select data to include
      </p>
    )}
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked
        readOnly
        className="mt-0.5 cc-checkbox border-line_strong flex-shrink-0"
      />
      <div>
        <p className="text-[13px] cc-row-title">Coupon Records</p>
        <p className="text-[11px] text-content/95 mt-0.5">{detail}</p>
      </div>
    </label>
  </div>
);

export default RecordsChoice;
