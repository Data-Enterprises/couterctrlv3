/** A labelled figure in the report column. */
const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-3 px-3 py-1.5 border-b border-gray-100">
    <span className="text-[11px] text-content/60">{label}</span>
    <span className="text-[12.5px] font-semibold text-content tabular-nums">
      {value}
    </span>
  </div>
);

export default Stat;
