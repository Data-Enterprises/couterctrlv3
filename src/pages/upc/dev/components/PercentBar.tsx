interface Props {
  pct: number;
  display: string;
}

// Single-value analog of BeforeAfterBar — same fixed 0-100% scale rule (the
// fill width has to mean the literal percentage), just one bar instead of a
// before/after pair, for metrics with no prior state to compare against.
const PercentBar = ({ pct, display }: Props) => {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-[13px] rounded bg-gray-100">
        <div className="h-full rounded bg-blue-600/60" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[13px] font-bold w-12 text-right tabular-nums">{display}</span>
    </div>
  );
};

export default PercentBar;
