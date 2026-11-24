// Components
import BackButton from "../../../../../components-dev/BackButton";
import PageInfoButton from "../../../../../components-dev/PageInfoButton";

interface CouponListHeaderProps {
  dateLabel: string;
  recordCount: number;
  /** A group search names the group and its store count; a store search, the store. */
  groupName: string | null;
  groupStoreCount: number;
  storeName: string | null;
  sortMetric: "amount" | "qty";
  onSortMetric: (v: "amount" | "qty") => void;
  onOpenSearch: () => void;
}

/** The store list's navy header: the range and record count, then Back to
 *  the search, the group or store, the Amt/Qty sort and help. */
const CouponListHeader = ({
  dateLabel,
  recordCount,
  groupName,
  groupStoreCount,
  storeName,
  sortMetric,
  onSortMetric,
  onOpenSearch,
}: CouponListHeaderProps) => (
  <div
    className="flex-shrink-0 px-3 pt-1 pb-2.5 flex flex-col gap-0"
    style={{ background: "rgb(var(--color-brand-navy))" }}
  >
    <div className="flex items-end gap-3 min-h-[24px]">
      <span className="text-[13px] cc-navy-title flex-shrink-0">Coupons</span>
      <span className="text-custom-white text-[10px] flex-shrink-0">
        {dateLabel}
      </span>
      <div className="flex-1" />
      {recordCount > 0 && (
        <div className="flex items-baseline gap-1 flex-shrink-0">
          <span className="text-custom-white text-[10px] uppercase tracking-wide">
            Records
          </span>
          <span className="text-[13px] font-medium text-custom-white">
            {recordCount}
          </span>
        </div>
      )}
    </div>
    <div className="flex items-center gap-2 cc-navy-header-row">
      <BackButton onClick={onOpenSearch} helpAnchor="search" />
      {groupName && (
        <div className="flex flex-col leading-tight truncate">
          <span className="text-[11px] font-medium text-custom-white truncate">
            {groupName}
          </span>
          {groupStoreCount > 0 && (
            <span className="text-[9px] text-custom-white">
              {groupStoreCount} stores
            </span>
          )}
        </div>
      )}
      {storeName !== null && (
        <span className="text-[11px] font-medium text-custom-white truncate">
          {storeName}
        </span>
      )}
      <div className="flex-1" />
      <div
        data-help="metric"
        className="flex items-center gap-0.5 flex-shrink-0"
      >
        {(["amount", "qty"] as const).map((m) => (
          <button
            key={m}
            onClick={() => onSortMetric(m)}
            className={`px-2 py-0.5 text-[9px] font-medium rounded transition-colors ${
              sortMetric === m
                ? "bg-custom-white/20 text-custom-white"
                : "text-custom-white/95 hover:text-custom-white/70"
            }`}
          >
            {m === "amount" ? "Amt" : "Qty"}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

      <div className="relative flex-shrink-0">
        <PageInfoButton page="coupons" />
      </div>
    </div>
  </div>
);

export default CouponListHeader;
