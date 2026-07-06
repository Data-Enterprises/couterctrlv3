import { MagnifyingGlassIcon, QuestionMarkCircleIcon } from "@heroicons/react/16/solid";
import { useAppSelector } from "../../../../hooks";
import { useUpcDevCtx } from "../hooks/useUpcDevCtx";
import UpcItemList from "./UpcItemList";

interface Props {
  onReSearch: () => void;
}

const UpcLeftPanel = ({ onReSearch }: Props) => {
  const ctx = useUpcDevCtx();
  const searchState = useAppSelector((s) => s.search);

  const locationLabel =
    searchState.type === "Store"
      ? searchState.selectedStore.store_name || `Store ${searchState.selectedStore.storeid}`
      : searchState.selectedGroup.group_name || "Group";

  const dateRange = ctx.startDate && ctx.endDate ? `${ctx.startDate} – ${ctx.endDate}` : "";

  return (
    <div className="w-[266px] flex-shrink-0 shadow-lg flex flex-col overflow-hidden rounded-xl">
      {/* 2-row navy header */}
      <div className="bg-[#1e2a4a] rounded-t-xl px-3 pt-1 pb-2.5 flex flex-col gap-0 flex-shrink-0">
        {/* Row 1: title + UPC count */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[12px] font-semibold text-white leading-tight">UPC Workbook</div>
            {dateRange && (
              <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                {dateRange}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[12px] font-semibold text-white leading-tight">{ctx.upcCount}</div>
            <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.45)" }}>UPCs</div>
          </div>
        </div>

        {/* Row 2: search icon + location label + ? icon */}
        <div
          className="flex items-center gap-1.5 pt-1.5 mt-1"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={onReSearch}
            title="Search again"
            className="flex items-center justify-center w-[22px] h-[22px] rounded border text-white/60 hover:text-white hover:border-white/40 transition-colors flex-shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.20)" }}
          >
            <MagnifyingGlassIcon className="w-3 h-3" />
          </button>

          <span
            className="flex-1 text-[10px] truncate"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            {locationLabel}
          </span>

          <button
            title="About this view"
            className="flex items-center justify-center w-[22px] h-[22px] rounded border text-white/60 hover:text-white hover:border-white/40 transition-colors flex-shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.20)" }}
          >
            <QuestionMarkCircleIcon className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-custom-white flex flex-col min-h-0 overflow-hidden">
        <UpcItemList />
      </div>
    </div>
  );
};

export default UpcLeftPanel;
