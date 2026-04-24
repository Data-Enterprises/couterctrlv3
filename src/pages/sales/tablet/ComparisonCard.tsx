import { formatCurrency2 } from "../../../utils";

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
    formatAsCurrency ? formatCurrency2(v) : v.toLocaleString();

  const diffColor =
    diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-content";

  return (
    <div className="rounded-xl border border-content/60 bg-bkg p-2 shadow-sm">
      <div className="truncate font-semibold text-content/60 text-center">
        {title}
      </div>
      <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
        <div className="text-right text-sm font-medium tabular-nums text-slate-700">
          {formatVal(ty)}
        </div>

        <div className="text-center min-w-0">
          <div className={`text-xs font-medium ${diffColor}`}>
            {diff === 0
              ? "No change"
              : // : `${diff > 0 ? "+" : ""}${formatVal(diff)} (${pct.toFixed(1)}%)`}
                `${formatVal(diff)}`}
          </div>
          <div className={`text-xs font-medium ${diffColor}`}>
            ({pct.toFixed(1)}%)
          </div>
        </div>

        <div className="text-left text-sm font-medium tabular-nums text-slate-700">
          {formatVal(ly)}
        </div>
      </div>
    </div>
  );
};

export default ComparisonCard;