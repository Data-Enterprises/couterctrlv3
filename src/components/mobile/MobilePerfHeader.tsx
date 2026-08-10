import { useState, type ReactNode } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import InfoButton from "../InfoButton";
import InfoPopover, { type InfoGlossaryEntry } from "../InfoPopover";

/**
 * The navy header on the single-store Performance pages — Sub Dept Margins,
 * Vendors and Categories.
 *
 * Two rows:
 *   1. the store on the left, the week it covers on the right
 *   2. re-search and the page name on the left, threshold and "?" on the right
 *
 * The page name is the point. These three pages are now laid out identically —
 * same KPI strip, same day cards, same rows — so without a name in the chrome
 * there was nothing on screen telling you which one you were looking at.
 *
 * The "?" opens the same `InfoPopover` desktop uses, from the same per-page
 * content file, which is also what replaced the severity legend that used to
 * sit on row two: the legend explained the colours and nothing else, and the
 * popover explains the whole page.
 */

interface Props {
  /** e.g. "Vendors" — the right end of row one. */
  pageName: string;
  /** e.g. "Aug 4 – Aug 10". */
  dateRange: string;
  storeName: string;
  onSearch: () => void;
  /** The page's own `ThresholdFilter`, units and all. Omitted on Loss
   *  Prevention, which grades against each cashier's own baseline rather
   *  than a number the user dials in. */
  threshold?: ReactNode;
  info: { title: string; purpose: string; glossary: InfoGlossaryEntry[] };
}

const MobilePerfHeader = ({
  pageName,
  dateRange,
  storeName,
  onSearch,
  threshold,
  info,
}: Props) => {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    // `relative` so the popover anchors to the header rather than the page —
    // InfoPopover positions itself `top-full right-0` against whatever
    // container establishes the offset parent.
    <div
      className="relative flex-shrink-0 px-3 pt-2 pb-2.5"
      style={{ background: "#1e2a4a" }}
    >
      {/* Row 1 — the store, then the week it covers */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-semibold text-custom-white truncate">
          {storeName}
        </span>
        <span className="text-[11px] text-custom-white/85 flex-shrink-0">
          {dateRange}
        </span>
      </div>

      {/* Row 2 — re-search and the page you're on, then threshold and "?" */}
      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onSearch}
            title="New search"
            aria-label="New search"
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/75 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
          <span className="text-[12px] font-semibold text-custom-white truncate">
            {pageName}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {threshold && (
            <div className="flex items-center gap-1.5">
              {/* Generic label, matching desktop — the page name beside it
                  already says what is being graded. */}
              <span className="text-[10px] text-custom-white/85">
                Threshold
              </span>
              {threshold}
            </div>
          )}
          <InfoButton
            onClick={() => setInfoOpen((prev) => !prev)}
            title={`About ${pageName}`}
          />
        </div>
      </div>

      {infoOpen && (
        <InfoPopover
          title={info.title}
          purpose={info.purpose}
          glossary={info.glossary}
          onClose={() => setInfoOpen(false)}
          // No width override. The popover is `right-0` with min 260px / max
          // 500px, so it grows leftward from the screen edge and stays on
          // screen even at 320px. Passing `left-*`/`right-*` here would collide
          // with its own positioning classes, and which one won would come down
          // to CSS source order rather than anything readable.
        />
      )}
    </div>
  );
};

export default MobilePerfHeader;
