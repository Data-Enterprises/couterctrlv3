// Interfaces
import type { Summary } from "../interfaces";
import type { Holds } from "../utils/investigationSteps";

interface HoldsFindingProps {
  holds: Holds;
  summary: Summary;
  them: string;
  cash: (v: number) => string;
  /** Sales and margin can point opposite ways, and nothing else on the
   *  screen would say so. Both come off the sales wave, so this belongs in
   *  the step that draws first. */
  marginGap: number;
  costPenalty: number;
}

/** The Summary's first card: whether the report holds, led by the biggest
 *  dollar bucket against the other store, with the buckets under it. */
const HoldsFinding = ({
  holds,
  summary,
  them,
  cash,
  marginGap,
  costPenalty,
}: HoldsFindingProps) => {
  const buckets = [
    {
      label: `Rang at ${them}, not here`,
      b: holds.onlyTheirs,
      tone: "bg-red-500",
    },
    { label: "Rang at both, less here", b: holds.bothLess, tone: "bg-red-500" },
    {
      label: "Rang at both, more here",
      b: holds.bothMore,
      tone: "bg-emerald-500",
    },
  ];
  const moved = buckets.reduce((t, x) => t + Math.abs(x.b.dollars), 0);
  /** The one row with money in it leads. Three rows where two are zero makes
   *  the reader find the finding; the figure IS the finding. */
  const lead = [...buckets].sort(
    (a, b) => Math.abs(b.b.dollars) - Math.abs(a.b.dollars),
  )[0];

  return (
    <div className="rounded-lg bg-custom-white shadow-card px-5 py-4 min-w-0">
      <div className="flex flex-col gap-4 min-w-0">
        {/* The finding and the figure that carries it, on one tint —
          the same block the caveats sit in at the foot of the card.
          Between them the card has its claim and its size; what
          follows is the working. */}
        <div className="rounded-md bg-bkg px-3.5 py-3 flex flex-col gap-2.5">
          <p className="text-[18px] font-semibold leading-snug text-content">
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

          <div className="flex items-baseline gap-3 flex-wrap">
            <span
              className={`text-[34px] font-bold tabular-nums leading-none ${
                lead.b.dollars >= 0
                  ? "text-delta_positive_text"
                  : "text-delta_negative_text"
              }`}
            >
              {lead.b.dollars >= 0 ? "+" : "−"}
              {cash(Math.abs(lead.b.dollars))}
            </span>
            <span className="text-[13.5px] text-content/95 min-w-0">
              <span className="font-semibold text-content">
                {lead.b.items.toLocaleString("en-US")} items
              </span>{" "}
              {lead.label.toLowerCase()}
            </span>
          </div>
        </div>

        {moved > 0 && (
          <span className="flex h-[8.4px] rounded-sm overflow-hidden bg-bkg">
            {buckets.map((x) => (
              <span
                key={x.label}
                className={`block h-2 ${x.tone}`}
                style={{
                  width: `${(Math.abs(x.b.dollars) / moved) * 100}%`,
                }}
                title={`${x.label} · ${cash(Math.abs(x.b.dollars))}`}
              />
            ))}
          </span>
        )}

        <div className="flex flex-col">
          {buckets.map((x) => (
            <div
              key={x.label}
              className="flex items-baseline gap-2.5 py-1.5 border-b border-brand_navy/15 last:border-b-0"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 self-center ${
                  x.b.items === 0 ? "bg-bkg" : x.tone
                }`}
              />
              <span className="text-[13px] text-content/95 min-w-0">
                {x.label}
              </span>
              <span className="ml-auto text-[12.5px] text-content/95 tabular-nums whitespace-nowrap">
                {x.b.items.toLocaleString("en-US")} items
              </span>
              <span
                className={`w-[96px] text-right text-[13px] font-bold tabular-nums whitespace-nowrap ${
                  x.b.items === 0
                    ? "text-content/95"
                    : x.b.dollars >= 0
                      ? "text-delta_positive_text"
                      : "text-delta_negative_text"
                }`}
              >
                {x.b.dollars >= 0 ? "+" : "−"}
                {cash(Math.abs(x.b.dollars))}
              </span>
            </div>
          ))}
        </div>

        {/* Only when there is a cost penalty to report. The block is
        the note, so with nothing to note there is no block. */}
        {costPenalty < 0 && summary.gap < 0 && (
          <p className="text-[13.5px] text-content/95 leading-relaxed rounded-md bg-bkg px-3.5 py-3">
            Buying the same goods for more took another{" "}
            <span className="font-semibold text-content">
              {cash(Math.abs(costPenalty))}
            </span>{" "}
            of margin on top of the sales gap.
          </p>
        )}

        {summary.gap >= 0 && marginGap < 0 && (
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
