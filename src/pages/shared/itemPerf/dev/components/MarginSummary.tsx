// Hooks
import { useItemPerfCtx } from "../hooks";

// Utils
import { formatCurrency2 } from "../../../../../utils";
import { cmpShort, cmpWord, pct } from "../utils";

// Components
import PairedBars from "../../../../../components-dev/mobile/perf/PairedBars";
import PerfDelta from "../../../../../components-dev/mobile/perf/PerfDelta";

/** The margin figures for whatever is in scope: the group card, the store
 *  card and the item screen ask the same question of a different scope. */
const MarginSummary = () => {
  const { totals, cardNoLy, selectedItem, basis, totalsPartial, weekMatch } =
    useItemPerfCtx();
  return (
    <div className="px-3.5 pb-3.5 pt-2">
      {/* Three even thirds, not a flex row with the +/- shoved right by
          `ml-auto`. That left TY and LY touching and the difference stranded
          at the far edge, reading as a separate thing bolted on rather than
          the third term of one comparison. A grid also holds the columns put
          when "no history" replaces a figure and the widths change.

          Sizes are set by the widest case, which is 100.00% — seven glyphs in
          a third of a phone-width card. At 26px that overran its column and
          drew straight over the LY figure, because a grid cell does not clip
          what overflows it. 20px fits at 375px wide with room to spare, and
          `min-w-0` with `truncate` means a longer string would cut rather
          than overlap again. */}
      <div className="grid grid-cols-3 items-end gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="mb-1 font-mono text-[9.5px] uppercase tracking-wider text-content/95">
            TY margin
          </span>
          <span className="truncate font-display text-[20px] font-extrabold leading-none tracking-tight text-content">
            {pct(totals.gpm)}
          </span>
        </div>
        <div className="flex min-w-0 flex-col pb-0.5">
          <span className="mb-1 font-mono text-[9.5px] uppercase tracking-wider text-content/95">
            LY margin
          </span>
          {/* No record isn't a 0% margin. */}
          <span className="truncate font-display text-[17px] font-bold leading-none tracking-tight text-content/95">
            {cardNoLy ? "no history" : pct(totals.gpmLy)}
          </span>
        </div>
        {/* Bare number, no unit. This is a move in margin POINTS — 28.40%
            against 26.30% is "+2.10" — so a "%" would be wrong, reading as a
            2% gain on the margin itself. "pts" said so explicitly but wrapped
            onto a second line in a column this narrow; sat under a "+/-"
            heading between two figures both labelled "margin", the unit is
            already the only one it could be. */}
        {totals.gpm !== null && totals.gpmLy !== null && (
          <div className="flex min-w-0 flex-col items-end pb-0.5">
            <span className="mb-1 font-mono text-[9.5px] uppercase tracking-wider text-content/95">
              +/-
            </span>
            <PerfDelta
              ty={totals.gpm}
              ly={totals.gpmLy}
              format={(n) => n.toFixed(2)}
              unavailable={cardNoLy}
              className="!text-[17px] whitespace-nowrap"
            />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-wider text-content/95">
          <span>Sales</span>
          <span>
            {selectedItem
              ? `${totals.units.toLocaleString("en-US")} qty`
              : `${totals.itemCount.toLocaleString("en-US")} ${
                  totals.itemCount === 1 ? "item" : "items"
                }`}
          </span>
        </div>
        <PairedBars
          ty={totals.sales}
          ly={totals.salesLy}
          max={Math.max(totals.sales, totals.salesLy)}
          labels={["TY", cmpShort(basis)]}
          compact
          lyUnavailable={cardNoLy}
        />
        {totalsPartial && (
          <p className="mt-1.5 inline-block rounded bg-gray-200 px-1.5 py-0.5 text-[11px] font-semibold text-content">
            {cmpWord(basis)}: {weekMatch.lyDays} of {weekMatch.days} days matched
          </p>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-brand_line pt-2.5">
        {/* Columns are the figure, rows are the year: each LY tile sits
            directly under the TY one it compares with. */}
        {[
          { k: "TY gross profit", v: totals.profit, ly: false },
          { k: "TY cost", v: totals.cogs, ly: false },
          { k: "LY gross profit", v: totals.profitLy, ly: true },
          { k: "LY cost", v: totals.cogsLy, ly: true },
        ].map(({ k, v, ly }) => (
          <div key={k} className="flex flex-col items-center text-center">
            <span className="font-mono text-[9.5px] uppercase tracking-wider text-content/95">
              {k}
            </span>
            <span
              className={`font-display text-[15px] font-bold ${
                ly ? "text-content/95" : "text-content"
              }`}
            >
              {ly && cardNoLy ? "no history" : formatCurrency2(v)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarginSummary;
