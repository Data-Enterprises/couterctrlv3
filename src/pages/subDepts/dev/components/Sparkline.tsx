interface SparklineProps {
  values: number[];
  stroke: string;
}

/** A small inline trend line of a sub dept's daily sales across the current week.
 *  Purely visual, with no axis or labels, sized to sit in a single row. */
const Sparkline = ({ values, stroke }: SparklineProps) => {
  const w = 48;
  const h = 18;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;
  const points = values
    .map((v, i) => {
      const x = values.length > 1 ? (i / (values.length - 1)) * w : w / 2;
      const y = range > 0 ? h - 2 - ((v - min) / range) * (h - 4) : h / 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  );
};

export default Sparkline;
