// Interfaces
import type { Spread } from "../utils/investigationSteps";

interface ShortfallListProps {
  spread: Spread;
  cash: (v: number) => string;
  onPickItem: (code: string) => void;
  onSeeAll: () => void;
}

/** The Summary's item list: the ten biggest items behind, where half the
 *  shortfall is reached, and the way to the rest. */
const ShortfallList = ({
  spread,
  cash,
  onPickItem,
  onSeeAll,
}: ShortfallListProps) => {
  const shortfall = spread.ranked.reduce((t, i) => t - i.gap, 0);
  const top = spread.ranked.slice(0, 10);
  const widest = Math.abs(top[0]?.gap ?? 1);

  return (
    <div className="rounded-lg bg-custom-white shadow-card px-5 py-4 min-w-0">
      <div className="flex flex-col gap-4 min-w-0">
        <p className="text-[18px] font-semibold leading-snug text-content">
          {spread.says}
        </p>

        <span className="flex h-[8.4px] rounded-sm overflow-hidden bg-bkg">
          <span
            className="block h-[8.4px] bg-red-500"
            style={{ width: `${Math.max(4, spread.topTenShare * 100)}%` }}
          />
        </span>

        <div className="flex flex-col">
          {top.map((i, ix) => (
            <div key={i.productCode}>
              <button
                onClick={() => onPickItem(i.productCode)}
                className="w-full grid gap-3 items-center px-1.5 py-1.5 border-b border-brand_navy/15 hover:bg-bkg rounded text-left"
                style={{
                  gridTemplateColumns: "22px minmax(0,1fr) 120px 96px",
                }}
              >
                <span className="text-[12px] text-content/95 tabular-nums">
                  {ix + 1}
                </span>
                <span className="min-w-0 truncate text-[12.5px] font-mono text-content">
                  {i.description}
                </span>
                <span className="h-[8.4px] rounded-sm bg-bkg">
                  <span
                    className="block h-[8.4px] rounded-sm bg-red-500"
                    style={{
                      width: `${(Math.abs(i.gap) / widest) * 100}%`,
                    }}
                  />
                </span>
                <span className="text-right text-[12.5px] font-bold tabular-nums text-delta_negative_text">
                  {"−"}
                  {cash(Math.abs(i.gap))}
                </span>
              </button>
              {/* The conclusion drawn in the list it is about, rather
                than only stated above it. */}
              {spread.toHalf > 0 && ix === spread.toHalf - 1 && (
                <div className="flex items-center gap-2 py-1">
                  <span className="h-px flex-1 bg-red-500/50" />
                  <span className="text-[11.5px] font-bold uppercase tracking-wide text-delta_negative_text whitespace-nowrap">
                    half the shortfall
                  </span>
                  <span className="h-px flex-1 bg-red-500/50" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* The list is the ten biggest; the way to the rest belongs
          beside the sentence that says so, not three tabs away. */}
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-[12.5px] text-content/95 leading-relaxed">
            {spread.ranked.length.toLocaleString("en-US")} items behind ·
            ordered by the biggest difference · click one for its evidence
            · {cash(shortfall)} in all
          </p>
          <button
            onClick={onSeeAll}
            className="ml-auto flex-shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-md border border-brand_navy/25 text-content hover:bg-bkg transition-colors whitespace-nowrap"
          >
            See every item &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShortfallList;
