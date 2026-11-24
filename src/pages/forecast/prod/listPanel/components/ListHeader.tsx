// Components
import BackButton from "../../../../../components/BackButton";
import PageInfoButton from "../../../../../components/PageInfoButton";

interface ListHeaderProps {
  singleDate: string;
  checkedCount: number;
  totalCount: number;
  /** The store or group searched. */
  locationLabel: string;
  onReSearch: () => void;
}

/** The item list's two-row navy header, with the same metrics as
 *  LookupQueuePanel's: the date and how many are ticked, then Back to the
 *  search, where, and help. */
const ListHeader = ({
  singleDate,
  checkedCount,
  totalCount,
  locationLabel,
  onReSearch,
}: ListHeaderProps) => (
  <div className="bg-brand_navy rounded-t-xl px-3 pt-1 pb-2.5 flex flex-col gap-0 flex-shrink-0 relative">
    <div className="flex items-end gap-3 min-h-[24px]">
      <span className="text-[13px] cc-navy-title flex-shrink-0">Forecast</span>
      {singleDate && (
        <span className="text-custom-white text-[10px] flex-shrink-0">
          {singleDate}
        </span>
      )}
      <div className="flex-1" />
      <div className="flex items-baseline gap-1 flex-shrink-0">
        <span className="text-custom-white text-[10px] uppercase tracking-wide">
          Selected
        </span>
        <span className="text-[13px] font-medium text-custom-white tabular-nums">
          {checkedCount} / {totalCount}
        </span>
      </div>
    </div>

    <div className="flex items-center gap-2 cc-navy-header-row">
      <BackButton onClick={onReSearch} helpAnchor="search" />
      <span className="text-[11px] font-medium text-custom-white truncate">
        {locationLabel}
      </span>
      <div className="flex-1" />
      <div className="relative flex-shrink-0">
        <PageInfoButton page="forecasting" />
      </div>
    </div>
  </div>
);

export default ListHeader;
