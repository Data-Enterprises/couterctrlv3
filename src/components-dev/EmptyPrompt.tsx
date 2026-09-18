interface EmptyPromptProps {
  title: string;
  description?: string;
  className?: string;
}

const EmptyPrompt = ({ title, description, className = "" }: EmptyPromptProps) => (
  <div className={`h-full flex flex-col items-center justify-center gap-2 bg-custom-white/60 rounded-xl border border-dashed border-gray-200 ${className}`}>
    <div className="text-content/50 text-[13px] font-medium">{title}</div>
    {description && (
      <div className="text-content/45 text-[11px]">{description}</div>
    )}
  </div>
);

export default EmptyPrompt;
