// Interfaces
import type { AdListRow } from "../../../../../features/forecastDevSlice";

interface NotFoundBannerProps {
  upcs: string[];
  /** The ad list's rows, for each UPC's name. */
  adListRows: Record<string, AdListRow>;
  open: boolean;
  onToggle: () => void;
}

/** Over the grid: how many items had no history at the selected stores, opening
 *  to the list of them. */
const NotFoundBanner = ({
  upcs,
  adListRows,
  open,
  onToggle,
}: NotFoundBannerProps) => (
  <div className="flex-shrink-0 border-b border-severity_watch_text/20 relative">
    <button
      className="w-full flex items-center justify-between px-3 py-1 bg-severity_watch_bg hover:bg-severity_watch_bg/80 transition-colors text-left"
      onClick={onToggle}
    >
      <span className="text-[11px] text-severity_watch_text font-medium">
        {upcs.length} item{upcs.length !== 1 ? "s" : ""} had no sales history at
        the selected stores
      </span>
      <span className="text-[10px] text-amber-500 ml-2 shrink-0">
        {open ? "hide" : "show"}
      </span>
    </button>
    {open && (
      <div className="absolute left-0 right-0 top-full z-20 max-h-96 overflow-y-auto thin-scrollbar bg-severity_watch_bg border border-severity_watch_text/20 shadow-lg rounded-b-md px-3 pb-2">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 pt-1">
          {upcs.map((upc) => (
            <div key={upc} className="contents">
              <span className="text-[11px] font-medium text-content tabular-nums">
                {upc}
              </span>
              <span className="text-[11px] font-medium text-content/95 truncate">
                {adListRows[upc]?.featureDescription ||
                  adListRows[upc]?.pageName ||
                  "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default NotFoundBanner;
