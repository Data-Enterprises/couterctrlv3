import { formatBigNumber, formatCurrency2 } from "../../../utils";

interface ComparisonRowProps {
  title: string;
  ty: number;
  ly: number;
  formatAsCurrency?: boolean;
}

const ComparisonCard = ({
  title,
  ty,
  ly,
  formatAsCurrency = true,
}: ComparisonRowProps) => {
  const diff = ty - ly;
  const pct = ly !== 0 ? (diff / ly) * 100 : 0;

  const formatVal = (v: number) =>
    formatAsCurrency ? formatCurrency2(v) : formatBigNumber(v, 0);

  const isUp = diff > 0;
  const isDown = diff < 0;

  const diffClass = isUp
    ? "text-emerald-600"
    : isDown
      ? "text-red-600"
      : "text-content";

  return (
    <div className="rounded-2xl border border-content/60 bg-bkg px-3 py-3 shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-content">
            {title}
          </div>
        </div>
        <div
          className={`text-center text-xs font-medium tabular-nums ${diffClass}`}
        >
          {diff === 0
            ? "No change"
            : `${isUp ? "+" : ""}${formatVal(diff)} (${pct.toFixed(1)}%)`}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_1fr] items-center gap-2">
        <div className="text-right bg-custom-white p-2 rounded-lg shadow">
          <div className="text-[11px] uppercase tracking-wide text-content/60">
            This Year
          </div>
          <div className="mt-1 text-sm font-semibold tabular-nums text-content">
            {formatVal(ty)}
          </div>
        </div>

        <div className="text-left bg-custom-white p-2 rounded-lg shadow">
          <div className="text-[11px] uppercase tracking-wide text-content/60">
            Last Year
          </div>
          <div className="mt-1 text-sm font-semibold tabular-nums text-content">
            {formatVal(ly)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonCard;
