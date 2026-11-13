// Hooks
import { useUpcDevCtx } from "../hooks/useUpcDevCtx";

// Components
import BackButton from "../../../../components-dev/BackButton";
import PageInfoButton from "../../../../components-dev/PageInfoButton";
import UpcItemList from "./UpcItemList";

interface UpcLeftPanelProps {
  onReSearch: () => void;
}

/** The UPC List's left panel: a navy header with the date range, the searched store or
 *  group, a search-again button and help, above the UPC list. */
const UpcLeftPanel = ({ onReSearch }: UpcLeftPanelProps) => {
  const ctx = useUpcDevCtx();

  // What was searched, from ctx, not the search being edited in the re-search
  // window: the header names the data underneath it.
  const locationLabel =
    ctx.searchType === "Store"
      ? ctx.selectedStore.store_name || `Store ${ctx.selectedStore.storeid}`
      : ctx.selectedGroup.group_name || "Group";

  const dateRange =
    ctx.startDate && ctx.endDate
      ? `${ctx.startDate.split("/").slice(0, 2).join("/")} – ${ctx.endDate}`
      : "";

  return (
    <div className="w-[300px] flex-shrink-0 shadow-lg flex flex-col overflow-hidden rounded-xl">
      {/* 2-row navy header */}
      <div className="bg-brand_navy rounded-t-xl px-3 pt-1 pb-2.5 flex flex-col gap-0 flex-shrink-0 relative">
        {/* Row 1: title + UPC count */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[12px] cc-navy-title">
              UPC Upload
            </div>
          </div>
          <div className="text-right">
            {dateRange && (
              <div className="text-[11px] mt-0.5 text-custom-white">
                {dateRange}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: search icon + location label + ? icon */}
        <div className="flex items-center gap-1.5 pt-1.5 mt-1 text-custom-white">
          <BackButton onClick={onReSearch} helpAnchor="search" />

          <span className="flex-1 text-[11px] truncate text-custom-white">
            {locationLabel}
          </span>

          <PageInfoButton
            page="upc-list"
            className="flex-shrink-0"
          />
        </div>

      </div>

      <div className="flex-1 bg-custom-white flex flex-col min-h-0 overflow-hidden">
        <UpcItemList />
      </div>
    </div>
  );
};

export default UpcLeftPanel;
