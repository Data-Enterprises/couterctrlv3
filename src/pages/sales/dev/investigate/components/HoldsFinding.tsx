// Utils
import { CENT } from "../utils";
import { rowPhrase } from "../utils/holdsRows";

// Interfaces
import type { HoldsRow, RowKind, Summary } from "../interfaces";
import type { Holds } from "../utils/investigationSteps";

// Components
import RowChoice from "./RowChoice";

interface HoldsFindingProps {
  holds: Holds;
  rows: HoldsRow[];
  summary: Summary;
  us: string;
  them: string;
  /** The page's metric: dollars, or units on Quantity. */
  fmt: (v: number) => string;
  cash: (v: number) => string;
  /** Sales and margin can point opposite ways, and nothing else on the
   *  screen would say so. Both come off the sales wave, so this belongs in
   *  the step that draws first. */
  marginGap: number;
  costPenalty: number;
  selected: RowKind;
  onSelect: (kind: RowKind) => void;
}

/** The Summary's first card: whether the report holds, led by the biggest
 *  row against the other store, with the rows that pick the items card. */
const HoldsFinding = ({
  holds,
  rows,
  summary,
  us,
  them,
  fmt,
  cash,
  marginGap,
  costPenalty,
  selected,
  onSelect,
}: HoldsFindingProps) => {
  /** The one row with money in it leads. Three rows where two are zero makes
   *  the reader find the finding; the figure IS the finding. */
  const lead = [...rows].sort((a, b) => Math.abs(b.total) - Math.abs(a.total))[0];

  return (
    <div className="rounded-lg bg-custom-white shadow-card px-5 py-4 min-w-0">
      <div className="flex flex-col gap-4 min-w-0">
        {/* The finding and the figure that carries it, on one tint —
          the same block the caveats sit in at the foot of the card.
          Between them the card has its claim and its size; what
          follows is the working. */}
        <div className="rounded-md bg-bkg px-3.5 py-3 flex flex-col gap-2">
          <p className="text-[15px] font-semibold leading-snug text-content">
            <span
              className={
                holds.verdict === "holds"
                  ? "text-delta_positive_text"
                  : "text-severity_watch_text"
              }
            >
              {holds.verdict === "holds"
                ? "It holds."
                : "Not as the report put it."}
            </span>{" "}
            {holds.says}
          </p>

          {lead && (
            <div className="flex items-baseline gap-3 flex-wrap">
              <span
                className={`text-[30px] font-bold tabular-nums leading-none ${
                  lead.total >= 0
                    ? "text-delta_positive_text"
                    : "text-delta_negative_text"
                }`}
              >
                {lead.total >= 0 ? "+" : "−"}
                {fmt(Math.abs(lead.total))}
              </span>
              <span className="text-[13.5px] text-content/95 min-w-0">
                <span className="font-semibold text-content">
                  {lead.items.length.toLocaleString("en-US")} items
                </span>{" "}
                {rowPhrase(lead.kind, us, them)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-0.5">
          {rows.map((r) => (
            <RowChoice
              key={r.kind}
              row={r}
              us={us}
              them={them}
              fmt={fmt}
              on={r.kind === selected}
              onPick={() => onSelect(r.kind)}
            />
          ))}
        </div>

        {/* Only when there is a cost penalty to report. The block is
        the note, so with nothing to note there is no block, and a
        penalty that rounds to $0.00 is nothing to note. */}
        {costPenalty <= -CENT && summary.gap < 0 && (
          <p className="text-[13.5px] text-content/95 leading-relaxed rounded-md bg-bkg px-3.5 py-3">
            Buying the same goods for more took another{" "}
            <span className="font-semibold text-content">
              {cash(Math.abs(costPenalty))}
            </span>{" "}
            of margin on top of the sales gap.
          </p>
        )}

        {summary.gap >= 0 && marginGap <= -CENT && (
          <p className="text-[13px] leading-relaxed rounded-md bg-severity_watch_bg text-severity_watch_text px-3 py-2">
            <span className="font-bold">
              Ahead on sales, behind on margin.
            </span>{" "}
            This department took {cash(summary.gap)} more and kept{" "}
            {cash(Math.abs(marginGap))} less, because it buys the same
            goods for more.
          </p>
        )}
      </div>
    </div>
  );
};

export default HoldsFinding;
