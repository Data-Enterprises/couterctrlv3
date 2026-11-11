interface RowProps {
  label: string;
  value: string;
}

/** One label and value line on the submit receipt. */
const Row = ({ label, value }: RowProps) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-brand_line pb-1">
    <span className="flex-shrink-0 text-[10px] cc-caps-strong">
      {label}
    </span>
    <span className="font-mono text-[11px] text-right text-content break-all">
      {value}
    </span>
  </div>
);

export default Row;
