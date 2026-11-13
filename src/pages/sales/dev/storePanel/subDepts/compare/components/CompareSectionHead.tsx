interface CompareSectionHeadProps {
  title: string;
  /** A note at the right end of the rule, e.g. what the figures are. */
  note?: string;
}

/** A section's caption with a rule running to the right edge. */
const CompareSectionHead = ({ title, note }: CompareSectionHeadProps) => (
  <div className="flex items-center gap-2.5 mt-4 mb-1">
    <span className="cc-caps text-[10.5px] whitespace-nowrap">{title}</span>
    <span className="flex-1 h-px bg-line_hair" />
    {note ? <span className="text-[11px] text-content whitespace-nowrap">{note}</span> : null}
  </div>
);

export default CompareSectionHead;
