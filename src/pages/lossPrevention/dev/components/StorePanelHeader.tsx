// Utils
import { formatBigNumber, formatCurrencyCompact } from "../../../../utils";

// Components
import BackButton from "../../../../components-dev/BackButton";
import PageInfoButton from "../../../../components-dev/PageInfoButton";

interface StorePanelHeaderProps {
  dateLabel: string;
  /** Shown only when there are rows to total. */
  showTotals: boolean;
  totals: { sales: number; trans: number; items: number };
  onOpenSearch: () => void;
}

/** The store panel's two-row navy header: the week and its totals, then back
 *  to the search, what the list compares, and the "?". */
const StorePanelHeader = ({
  dateLabel,
  showTotals,
  totals,
  onOpenSearch,
}: StorePanelHeaderProps) => (
  <div className="flex-shrink-0 px-3 pt-1 pb-2.5 flex flex-col gap-0 bg-brand_navy">
    <div className="flex items-center gap-2 min-h-[24px]">
      <span className="text-[13px] cc-navy-title flex-shrink-0">
        {dateLabel}
      </span>
      <div className="flex-1" />
      {showTotals && (
        <>
          <div className="flex items-baseline gap-1 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-wide text-custom-white/95">
              Sales
            </span>
            <span className="text-[13px] font-medium text-custom-white">
              {formatCurrencyCompact(totals.sales)}
            </span>
          </div>
          <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />
          <div className="flex items-baseline gap-1 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-wide text-custom-white/95">
              Trans
            </span>
            <span className="text-[13px] font-medium text-custom-white">
              {formatBigNumber(totals.trans, 0)}
            </span>
          </div>
          <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />
          <div className="flex items-baseline gap-1 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-wide text-custom-white/95">
              Qty
            </span>
            <span className="text-[13px] font-medium text-custom-white">
              {formatBigNumber(totals.items, 0)}
            </span>
          </div>
        </>
      )}
    </div>

    <div className="flex items-center gap-2 cc-navy-header-row">
      <BackButton onClick={onOpenSearch} helpAnchor="search" />
      <div className="flex-1" />
      <span className="text-[9px] font-medium uppercase tracking-wide text-custom-white/95 flex-shrink-0">
        Exception activity vs baseline
      </span>
      <div className="relative flex-shrink-0">
        <PageInfoButton page="loss-prevention" />
      </div>
    </div>
  </div>
);

export default StorePanelHeader;
