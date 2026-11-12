// Utils
import { ROW_COLS, rowHeads, rowSays } from "../utils/holdsRows";

// Interfaces
import type { HoldsRow } from "../interfaces";

// Components
import RowBreakdown from "./RowBreakdown";
import RowLine from "./RowLine";

interface RowSlideProps {
  row: HoldsRow;
  us: string;
  them: string;
  fmt: (v: number) => string;
  cash: (v: number) => string;
  onPickItem: (code: string) => void;
  onSeeAll: () => void;
  onItemMenu: (x: number, y: number, code: string) => void;
}

/** One row's items: what it is made of, then its ten biggest items, where
 *  half of it is reached, and the way to the rest. */
const RowSlide = ({
  row,
  us,
  them,
  fmt,
  cash,
  onPickItem,
  onSeeAll,
  onItemMenu,
}: RowSlideProps) => {
  const top = row.items.slice(0, 10);
  const widest = Math.abs(top[0]?.gap ?? 1);
  const behind = row.total < 0;
  const n = row.items.length;
  const heads = rowHeads(row.kind, us, them);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 min-w-0">
      <p className="text-[17px] font-semibold leading-snug text-content">
        {rowSays(row, us, them, fmt, cash)}
      </p>

      {row.breakdown.length > 0 && (
        <RowBreakdown lines={row.breakdown} fmt={fmt} cash={cash} />
      )}

      {/* The items scroll inside the slide: the breakdown above them can
        run to any number of lines, so the card fits the page whatever it holds. */}
      {n > 0 && (
        <div className="cc-scroll flex flex-col">
          <div
            className={`sticky top-0 z-10 bg-custom-white grid ${ROW_COLS[row.kind]} gap-3 px-1.5 pb-1.5 border-b border-brand_navy/15 cc-caps text-[10.5px] text-brand_slate`}
          >
            {heads.map((h, i) => (
              <span key={i} className={i === heads.length - 1 ? "text-right" : ""}>
                {h}
              </span>
            ))}
          </div>

          {top.map((i, ix) => (
            <div key={i.productCode}>
              <RowLine
                item={i}
                n={ix + 1}
                kind={row.kind}
                fmt={fmt}
                widest={widest}
                onPick={onPickItem}
                onMenu={onItemMenu}
              />
              {/* The conclusion drawn in the list it is about, rather
                than only stated above it. */}
              {row.toHalf > 0 && ix === row.toHalf - 1 && ix < n - 1 && (
                <div className="flex items-center gap-2 py-1">
                  <span
                    className={`h-px flex-1 ${behind ? "bg-red-500/50" : "bg-emerald-500/50"}`}
                  />
                  <span
                    className={`text-[11.5px] font-bold uppercase tracking-wide whitespace-nowrap ${
                      behind ? "text-delta_negative_text" : "text-delta_positive_text"
                    }`}
                  >
                    {behind ? "half the shortfall" : "half the lead"}
                  </span>
                  <span
                    className={`h-px flex-1 ${behind ? "bg-red-500/50" : "bg-emerald-500/50"}`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* The list is the ten biggest; the way to the rest belongs
        beside the sentence that says so, not three tabs away. */}
      {n > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-[12.5px] text-content/95 leading-relaxed">
            {n.toLocaleString("en-US")} {n === 1 ? "item" : "items"} | biggest
            difference first | click one for its evidence |{" "}
            {behind ? "−" : "+"}
            {fmt(Math.abs(row.total))} in all
          </p>
          <button
            onClick={onSeeAll}
            className="ml-auto flex-shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-md border border-brand_navy/25 text-content hover:bg-bkg transition-colors whitespace-nowrap"
          >
            See every item &rarr;
          </button>
        </div>
      )}
    </div>
  );
};

export default RowSlide;
