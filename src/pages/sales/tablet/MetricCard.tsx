import { formatCurrency2 } from "../../../utils";

type MetricCardProps = {
  title: string;
  ty: number;
  ly: number;
  formatAsCurrency?: boolean;
};

const MetricCard = ({
  title,
  ty,
  ly,
  formatAsCurrency = true,
}: MetricCardProps) => {
  const diff = ty - ly;
  const pct = ly !== 0 ? (diff / ly) * 100 : 0;

  const formatVal = (v: number) =>
    formatAsCurrency ? formatCurrency2(v) : v.toLocaleString();

  const diffColor =
    diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-content";

  const formatDate = (dateStr: string) => {
    const split = dateStr.split("T")[0].split("-");
    return `${split[1]}/${split[2]}/${split[0].slice(2)}`;
  };

  const dow = new Date(title).toDateString().split(" ")[0];

  return (
    <div className="rounded-xl border border-content/60 bg-bkg px-3 py-3 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 w-full flex justify-between">
          <div className="truncate text-sm font-semibold text-content">
            {dow}, {formatDate(title)}
          </div>
          <div className={`mt-1 text-xs font-medium ${diffColor}`}>
            {diff === 0
              ? "No change"
              : `${diff > 0 ? "+" : ""}${formatVal(diff)} (${pct.toFixed(2)}%)`}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg shadow bg-custom-white px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-content/60">
            This Year
          </div>
          <div className="mt-1 text-sm font-semibold tabular-nums text-content">
            {formatVal(ty)}
          </div>
        </div>

        <div className="rounded-lg shadow bg-custom-white px-3 py-2">
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

export default MetricCard;