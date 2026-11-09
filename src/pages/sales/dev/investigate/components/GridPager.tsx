// Utils
import { PAGE_ROWS } from "../utils";

// Interfaces
import type { ItemVerdict } from "../interfaces";

/** The strip under the grid: where you are in the list, and the pages. */
const GridPager = ({
  sorted,
  items,
  chosen,
  from,
  page: at_,
  pages,
  setPage,
}: {
  /** The filtered, sorted list the grid pages through. */
  sorted: ItemVerdict[];
  /** Every item in the department. */
  items: ItemVerdict[];
  chosen: Set<string>;
  /** Index of the first row on this page. */
  from: number;
  page: number;
  pages: number;
  setPage: (p: number) => void;
}) => {
  /**
   * The page numbers worth printing: the first, the last, and a few either
   * side of where you are, with gaps for the rest.
   *
   * Two hundred pages of buttons is not navigation. `null` is a gap.
   */
  const pageWindow: (number | null)[] = (() => {
    if (pages <= 7) return [...Array(pages).keys()];
    const near = new Set([0, pages - 1, at_, at_ - 1, at_ + 1]);
    const out: (number | null)[] = [];
    for (let p = 0; p < pages; p += 1) {
      if (near.has(p)) out.push(p);
      else if (out[out.length - 1] !== null) out.push(null);
    }
    return out;
  })();

  /* Outside the scroller, so it stays put while the rows move. The
     totals row above it is over the whole filtered set, not this
     page — which is the figure anybody reading totals wants. */
  return (
    <div className="flex-shrink-0 flex items-center gap-3 flex-wrap px-4 py-2 border-t border-brand_line bg-custom-white text-[12.5px] text-content/95">
      <span>
        <span className="font-semibold text-content tabular-nums">
          {(from + 1).toLocaleString("en-US")}–
          {Math.min(
            from + PAGE_ROWS,
            sorted.length,
          ).toLocaleString("en-US")}
        </span>{" "}
        of {sorted.length.toLocaleString("en-US")}
        {sorted.length !== items.length &&
          ` filtered from ${items.length.toLocaleString("en-US")}`}{" "}
        &middot; ordered by the biggest difference &middot;{" "}
        {chosen.size > 0 ? (
          <span className="font-semibold text-content">
            {chosen.size.toLocaleString("en-US")} selected
          </span>
        ) : (
          "click a row for its evidence"
        )}
      </span>

      {pages > 1 && (
        <span className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setPage(Math.max(0, at_ - 1))}
            disabled={at_ === 0}
            className="px-2.5 py-1 rounded-md font-semibold hover:bg-bkg disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
          >
            {"‹"} Prev
          </button>

          {/* Numbered, in a window around where you are. Prev and
        Next alone made page 5 of 5 four presses away and gave
        no sense of how much was behind the page in view. */}
          {pageWindow.map((p, i) =>
            p === null ? (
              <span
                key={`gap${i}`}
                className="px-1 text-content/95"
              >
                &hellip;
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                aria-current={p === at_}
                className={`min-w-[28px] px-2 py-1 rounded-md font-semibold tabular-nums transition-colors ${
                  p === at_
                    ? "bg-brand_navy text-custom-white"
                    : "hover:bg-bkg text-content"
                }`}
              >
                {p + 1}
              </button>
            ),
          )}

          <button
            onClick={() => setPage(Math.min(pages - 1, at_ + 1))}
            disabled={at_ >= pages - 1}
            className="px-2.5 py-1 rounded-md font-semibold hover:bg-bkg disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
          >
            Next {"›"}
          </button>
        </span>
      )}
    </div>
  );
};

export default GridPager;
