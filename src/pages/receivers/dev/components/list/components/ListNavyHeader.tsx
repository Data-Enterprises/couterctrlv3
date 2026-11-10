// Hooks
import { useReceiversCtx, useReceiversState } from "../../../hooks";

// Utils
import { fmtDateLabel } from "../utils";

// Components
import BackButton from "../../../../../../components-dev/BackButton";
import PageInfoButton from "../../../../../../components-dev/PageInfoButton";

interface ListNavyHeaderProps {
  onOpenSearch: () => void;
  storeName: string;
}

/** The navy header of the receiver list: title, date range and receiver total, plus the re-search button,
 *  store name and page info button. */
const ListNavyHeader = ({ onOpenSearch, storeName }: ListNavyHeaderProps) => {
  const state = useReceiversState();
  const { search } = useReceiversCtx();
  const dateLabel = fmtDateLabel(search.startDate, search.endDate);
  
  return (
    <div
      className="flex-shrink-0 px-3 pt-1 pb-2.5 flex flex-col gap-0"
      style={{ background: "rgb(var(--color-brand-navy))" }}
    >
      {/* Row 1: title + date | record count */}
      <div className="flex items-end gap-3 min-h-[24px]">
        <span className="text-[13px] font-semibold text-custom-white flex-shrink-0">
          Receivers
        </span>
        <span className="text-custom-white text-[10px] flex-shrink-0">
          {dateLabel}
        </span>
        <div className="flex-1" />
        {state.listGridData.length > 0 && (
          <div className="flex items-baseline gap-1 flex-shrink-0">
            <span className="text-custom-white text-[10px] font-semibold uppercase tracking-wide">
              Total
            </span>
            <span className="text-[13px] font-medium text-custom-white">
              {state.listGridData.length}
            </span>
          </div>
        )}
      </div>
      {/* Row 2: back + store name */}
      <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-custom-white/[0.08]">
        <BackButton onClick={onOpenSearch} helpAnchor="search" />
        {state.storeid && (
          <span className="text-[11px] font-medium text-custom-white truncate">
            {storeName}
          </span>
        )}
        <div className="flex-1" />
        <div className="relative flex-shrink-0">
          <PageInfoButton page="receivers" />
        </div>
      </div>
    </div>
  );
};

export default ListNavyHeader;
