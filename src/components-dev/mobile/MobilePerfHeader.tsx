import type { ReactNode } from "react";
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
} from "@heroicons/react/20/solid";
import PageInfoButton from "../PageInfoButton";
import HeaderIconButton from "../HeaderIconButton";
import type { HelpPage } from "../../constants/helpPages";

/**
 * The navy header shared by every mobile report — the Performance pages (Sub
 * Dept Margins, Vendors, Categories, Sales, Cashiers) and the Data pages
 * (Orders, Receivers, Coupons).
 *
 * Two rows:
 *   1. the store or scope on the left, the range it covers on the right
 *   2. back / re-search and the page name on the left, page controls,
 *      threshold and "?" on the right
 *
 * The page name is the point. The Performance pages are laid out identically —
 * same KPI strip, same day cards, same rows — so without a name in the chrome
 * there was nothing on screen telling you which one you were looking at. The
 * Data pages have the same problem one level down: their drill-downs are all
 * "a list of things under a heading", so each screen names what it is showing.
 *
 * The "?" opens the same help page desktop opens, for whichever page this
 * header is naming. It is what replaced the severity legend that used to sit
 * on row two: the legend explained the colours and nothing else, and the help
 * explains the whole page.
 */

interface Props {
  /** e.g. "Vendors" — the left of row two. */
  pageName: string;
  /** e.g. "Aug 4 – Aug 10". */
  dateRange: string;
  storeName: string;
  /** Omitted where re-searching isn't reachable from this screen — a Coupons
   *  drill-down leaves via back, and offering both is the same destination
   *  twice. */
  onSearch?: () => void;
  /** Drill-down screens only. Renders the chevron ahead of the search button,
   *  in the order the two are used. */
  onBack?: () => void;
  /** Page-specific controls — a sort toggle, an export button. Sits left of
   *  the threshold and the "?" so those two stay in the same place on every
   *  page. */
  actions?: ReactNode;
  /** The page's own `ThresholdFilter`, units and all. Omitted on Loss
   *  Prevention, which grades against each cashier's own baseline rather
   *  than a number the user dials in, and on the Data pages, which don't
   *  grade at all. */
  threshold?: ReactNode;
  /** Optional: a page with no help page of its own hides the "?" rather
   *  than opening a frame that 403s. */
  helpPage?: HelpPage;
}

const MobilePerfHeader = ({
  pageName,
  dateRange,
  storeName,
  onSearch,
  onBack,
  actions,
  threshold,
  helpPage,
}: Props) => {

  return (
    <div
      className="flex-shrink-0 px-3 pt-2 pb-2.5"
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

      {/* Row 2 — back / re-search and the page you're on, then the page's own
          controls, threshold and "?" */}
      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <HeaderIconButton onClick={onBack} title="Back">
              <ChevronLeftIcon className="w-3.5 h-3.5" />
            </HeaderIconButton>
          )}
          {onSearch && (
            <HeaderIconButton onClick={onSearch} title="New search">
              <MagnifyingGlassIcon className="w-3.5 h-3.5" />
            </HeaderIconButton>
          )}
          <span className="text-[12px] font-semibold text-custom-white truncate">
            {pageName}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
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
          {helpPage && (
            <PageInfoButton page={helpPage} title={`About ${pageName}`} />
          )}
        </div>
      </div>

    </div>
  );
};

export default MobilePerfHeader;
