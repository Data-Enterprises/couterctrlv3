interface SetupHeaderProps {
  title: string;
  stepIndex: number;
  total: number;
}

/** The navy band, then the step bars when there is more than one step. */
const SetupHeader = ({ title, stepIndex, total }: SetupHeaderProps) => (
  <>
    <div className="bg-brand_navy px-4 py-2.5 flex items-center gap-2">
      <span id="account-setup-title" className="text-custom-white text-[13px] font-semibold">
        {title}
      </span>
      <div className="flex-1" />
      {total > 1 && (
        <span className="text-custom-white text-[11px] flex-shrink-0">
          Step {stepIndex + 1} of {total}
        </span>
      )}
    </div>
    {total > 1 && (
      <div className="flex gap-1 px-4 pt-2.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`flex-1 h-[3px] rounded-full ${i <= stepIndex ? "bg-brand_navy" : "bg-brand_line"}`}
          />
        ))}
      </div>
    )}
  </>
);

export default SetupHeader;
