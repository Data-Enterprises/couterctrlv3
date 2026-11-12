// Hooks
import { useState } from "react";

// Utils
import { ROW_COLS, rowHeads, rowSays } from "../utils/holdsRows";

// Interfaces
import type { HoldsRow } from "../interfaces";

// Components
import RowBreakdown from "./RowBreakdown";
import RowLine from "./RowLine";
import SectionLine from "./SectionLine";

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

/** One row's items: what it is made of, then every item in sections by its
 *  share of the gap, and the way to the Items grid. */
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
  /** Folded sections. Only the first, the items making up half the gap,
   *  starts open, so the slide opens on the ones that matter. */
  const [folded, setFolded] = useState<Set<number>>(() => new Set([1, 2]));
  const widest = Math.abs(row.items[0]?.gap ?? 1);
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

          {row.sections.map((sec, si) => {
            const first = row.sections.slice(0, si).reduce((t, x) => t + x.items.length, 0);
            const open = !folded.has(si);
            return (
              <div key={si} className="flex flex-col">
                <SectionLine
                  label={`${Math.round(sec.share * 100)}% of the gap`}
                  count={sec.items.length}
                  amount={`${sec.total < 0 ? "−" : "+"}${fmt(Math.abs(sec.total))}`}
                  tone={behind ? "behind" : "ahead"}
                  open={open}
                  onToggle={() =>
                    setFolded((prev) => {
                      const next = new Set(prev);
                      if (next.has(si)) next.delete(si);
                      else next.add(si);
                      return next;
                    })
                  }
                />
                {open &&
                  sec.items.map((i, ix) => (
                    <RowLine
                      key={i.productCode}
                      item={i}
                      n={first + ix + 1}
                      kind={row.kind}
                      fmt={fmt}
                      widest={widest}
                      onPick={onPickItem}
                      onMenu={onItemMenu}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      )}

      {/* The way to the Items grid belongs beside the sentence that sums
        the list up, not three tabs away. */}
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
