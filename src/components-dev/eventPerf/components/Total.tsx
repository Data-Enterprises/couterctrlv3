interface TotalProps {
  label: string;
  value: string;
  strong?: boolean;
}

/** One label and amount line on the receipt, bold when strong. */
const Total = ({ label, value, strong = false }: TotalProps) => (
  <div className="flex items-baseline gap-3 py-0.5">
    <span
      className={`flex-1 font-mono uppercase tracking-wider ${strong ? "text-[12px] font-bold text-content" : "text-[11px] text-content/95"}`}
    >
      {label}
    </span>
    <span
      className={`flex-none font-mono tabular-nums ${strong ? "text-[14px] font-bold text-content" : "text-[12px] text-content/95"}`}
    >
      {value}
    </span>
  </div>
);

export default Total;
