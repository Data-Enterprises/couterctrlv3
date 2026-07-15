import {
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/16/solid";
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
      ? searchState.selectedStore.store_name ||
        `Store ${searchState.selectedStore.storeid}`
      : searchState.selectedGroup.group_name || "Group";

  const dateRange =
    ctx.startDate && ctx.endDate
      ? `${ctx.startDate.split("/").slice(0, 2).join("/")} – ${ctx.endDate}`
      : "";

  return (
    <div className="w-[300px] flex-shrink-0 shadow-lg flex flex-col overflow-hidden rounded-xl">
      {/* 2-row navy header */}
      <div className="bg-[#1e2a4a] rounded-t-xl px-3 pt-1 pb-2.5 flex flex-col gap-0 flex-shrink-0">
        {/* Row 1: title + UPC count */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[12px] font-semibold text-custom-white">
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
          <button
            onClick={onReSearch}
            title="Search again"
            className="flex items-center justify-center w-[22px] h-[22px] rounded border text-custom-white hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0"
            style={{ borderColor: "rgb(var(--color-custom-white) / 0.20)" }}
          >
            <MagnifyingGlassIcon className="w-3 h-3" />
          </button>

          <span className="flex-1 text-[11px] truncate text-custom-white">
            {locationLabel}
          </span>

          <button
            title="About this view"
            className="flex items-center justify-center w-[22px] h-[22px] rounded border text-custom-white hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0"
            style={{ borderColor: "rgb(var(--color-custom-white) / 0.20)" }}
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
