// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface DetailHeaderProps {
  headerTitle: string;
  headerSuffix: string;
  dateRangeLabel: string;
  totalCoupons: number;
  onExport: () => void;
}

/** The navy bar: whose coupons, the dates, export and the record count. */
const DetailHeader = ({
  headerTitle,
  headerSuffix,
  dateRangeLabel,
  totalCoupons,
  onExport,
}: DetailHeaderProps) => (
    <div
      className="flex-shrink-0 px-4 py-[11px] flex items-start justify-between"
      style={{ background: "rgb(var(--color-brand-navy))" }}
    >
      <div className="text-[13px] font-semibold text-custom-white">
        {headerTitle}
        <span className="ml-2 text-[11px] font-normal text-custom-white">
          {headerSuffix} · {dateRangeLabel}
        </span>
      </div>
      {totalCoupons > 0 && (
        <div className="flex items-center gap-3 mt-0.5">
          <button data-help="export"
            onClick={() => onExport()}
            title="Export CSV"
            className="text-custom-white/60 hover:text-custom-white transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-custom-white/15" />
          <div className="flex items-baseline gap-1">
            <span className="text-custom-white text-[10px] uppercase tracking-wide">
              Records
            </span>
            <span className="text-[13px] font-medium text-custom-white">
              {totalCoupons}
            </span>
          </div>
        </div>
      )}
    </div>
);

export default DetailHeader;
