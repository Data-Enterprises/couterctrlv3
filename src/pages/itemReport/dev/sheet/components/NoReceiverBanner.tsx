// Hooks
import { useState } from "react";

// Interfaces
import type { ReportItem } from "../../interfaces";

// Components
import DetailPopover from "../../components/DetailPopover";

interface NoReceiverBannerProps {
  /** False when `receivers/` returned nothing at all for this store. */
  receivingAvailable: boolean;
  items: ReportItem[];
  itemCount: number;
}

/**
 * Said once above the sheet instead of once per row: how many items have no
 * receiver invoice on file. The number opens the items behind it, so the count
 * never has to be taken on trust. The orders are missing from our data, which
 * is not a claim that the store received nothing.
 */
const NoReceiverBanner = ({
  receivingAvailable,
  items,
  itemCount,
}: NoReceiverBannerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-4 py-1.5 bg-severity_watch_bg text-[11px] text-severity_watch_text hover:brightness-95 transition-all"
      >
        {receivingAvailable
          ? `No receiver invoice on file for ${items.length} of ${itemCount} item${itemCount === 1 ? "" : "s"} in the last 90 days`
          : "No received orders on file for this store in the last 90 days"}
        {/* Reorder can still fire for these, from sales stopping
            mid-week (finding M). */}
        {
          " — Call vendor can't be judged for those, and Reorder only from sales stopping. Price and trend are unaffected."
        }
        <span className="underline ml-1">{open ? "Hide" : "Show them"}</span>
      </button>
      <DetailPopover
        open={open}
        onClose={() => setOpen(false)}
        className="bg-severity_watch_bg text-severity_watch_text"
      >
        {items.map((it) => (
          <div
            key={it.productCode}
            className="px-4 py-1.5 border-b border-current/10 last:border-b-0"
          >
            <div className="text-[11.5px] font-semibold truncate">
              {it.description}
            </div>
            <div className="text-[11px] opacity-90 truncate">
              {it.productCode} · {it.department} · {it.vendorName}
            </div>
          </div>
        ))}
      </DetailPopover>
    </div>
  );
};

export default NoReceiverBanner;
