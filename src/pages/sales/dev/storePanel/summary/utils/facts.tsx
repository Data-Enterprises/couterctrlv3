/** One fact in the column: its label, then its figure with an aside at the right. */
export const fact = (label: string, value: string, sub: string, first: boolean) => (
  <div key={label} className={`py-[5px] ${first ? "" : "border-t border-brand_line"}`}>
    <span className="block text-[12px] text-content">{label}</span>
    <span className="mt-px flex items-baseline justify-between gap-2">
      <strong className="text-[16px] font-bold text-content tabular-nums whitespace-nowrap">
        {value}
      </strong>
      <span className="text-[13px] text-content tabular-nums whitespace-nowrap">{sub}</span>
    </span>
  </div>
);
