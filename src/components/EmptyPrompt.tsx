interface EmptyPromptProps {
  title: string;
  description?: string;
  className?: string;
}

/** Dashed placeholder panel that fills its parent with a title and an optional
 *  description when there is nothing to show yet. */
const EmptyPrompt = ({ title, description, className = "" }: EmptyPromptProps) => (
  <div className={`h-full flex flex-col items-center justify-center gap-2 bg-custom-white/60 rounded-xl border border-dashed border-line_field ${className}`}>
    <div className="text-content/95 text-[13px] font-medium">{title}</div>
    {description && (
      <div className="text-content/95 text-[11px]">{description}</div>
    )}
  </div>
);

export default EmptyPrompt;
