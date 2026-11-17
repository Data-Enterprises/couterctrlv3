// Components
import BackButton from "../../../../../components-dev/BackButton";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import HeaderIconButton from "../../../../../components-dev/HeaderIconButton";
import PageInfoButton from "../../../../../components-dev/PageInfoButton";

interface SheetHeaderProps {
  storeName: string;
  dateLabel: string;
  itemCount: number;
  onSearchOpen: () => void;
  onExportOpen: () => void;
}

/**
 * The sheet's two-row navy header, matching LedgerHeader. Row 1: the store,
 * the page and week, the item count and export. Row 2: back to the search,
 * what every row is built from, and the "?".
 *
 * The centre names the page, not the source: a list can span many
 * departments, so a single department name would be wrong more often than
 * right.
 */
const SheetHeader = ({
  storeName,
  dateLabel,
  itemCount,
  onSearchOpen,
  onExportOpen,
}: SheetHeaderProps) => (
  <div className="flex-shrink-0 cc-navy-panel-header flex flex-col gap-0">
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 min-h-[26px]">
      <span className="cc-navy-title text-[13px] truncate justify-self-start">
        {storeName}
      </span>
      <span className="cc-navy-title text-[13px] justify-self-center truncate">
        {["Item Actions", dateLabel].filter(Boolean).join(" · ")}
      </span>
      <div
        data-help="export"
        className="flex items-center gap-2 justify-self-end"
      >
        <span className="text-[14px] cc-navy-title tabular-nums">
          {itemCount} items
        </span>
        <HeaderIconButton onClick={onExportOpen} title="Export CSV">
          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
        </HeaderIconButton>
      </div>
    </div>

    <div className="flex items-center gap-2 cc-navy-header-row">
      <BackButton onClick={onSearchOpen} />
      <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

      <div className="flex-1" />

      {/* What every row is built from, and how far back the delivery
          side reaches — the question "Last" and "Recv" always raise.
          Register lines load per item on the right, and no action on
          this side depends on them. */}
      <span className="text-[11px] text-custom-white font-medium flex-shrink-0 truncate">
        Sales vs Receivers · 90 days
      </span>

      <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

      <div className="relative flex-shrink-0">
        <PageInfoButton page="item-actions" />
      </div>
    </div>
  </div>
);

export default SheetHeader;
