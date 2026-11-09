// Utils
import { shortStore } from "../utils";

// Interfaces
import type { Summary } from "../interfaces";
import type {
  Holds,
  Spread,
  Vitals as VitalsShape,
} from "../utils/investigationSteps";

// Components
import Carousel from "./Carousel";
import Weeks from "./Weeks";
import Index from "./Index";

/** The investigation's first tab: whether the report holds, led by the biggest dollar bucket
 *  against the other store, with the charts and the ranked items and vendors behind it. */
const HoldsPanel = ({
  holds,
  spread,
  summary,
  them,
  vitals,
  cash,
  marginGap,
  costPenalty,
  onPickItem,
  onVendor,
  onSeeAll,
}: {
  holds: Holds;
  spread: Spread;
  summary: Summary;
  them: string;
  vitals: VitalsShape;
  cash: (v: number) => string;
  /** Sales and margin can point opposite ways, and nothing else on the
   *  screen would say so. Both come off the sales wave, so this belongs in
   *  the step that draws first. */
  marginGap: number;
  costPenalty: number;
  onPickItem: (code: string) => void;
  onVendor: (vendor: string) => void;
  onSeeAll: () => void;
}) => {
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

  const shortfall = spread.ranked.reduce((t, i) => t - i.gap, 0);
  const top = spread.ranked.slice(0, 10);
  const widest = Math.abs(top[0]?.gap ?? 1);
  const vendors = spread.byVendor.slice(0, 6);
  const widestVendor = Math.max(1, Math.abs(vendors[0]?.dollars ?? 0));

  return (
    <div className="flex-1 min-h-0 overflow-auto thin-scrollbar bg-custom-white px-4 py-5">
      <div className="flex flex-col gap-5">
        {/* The finding first, across the width, then the evidence under it:
            the hero on the left and the three supporting cards beside it.
            The carousel sat above all of this for a while, which put three
            charts in front of the sentence they are there to support. */}
        {/* Left: the finding and the three cards that qualify it, one over
            the other. Right: the items it is made of. Side by side the hero
            and the charts crowded each other and the list sat alone under
            both of them. */}
        <div
          className="grid gap-5 items-start"
          style={{ gridTemplateColumns: "minmax(0,0.85fr) minmax(0,1fr)" }}
        >
          <div className="flex flex-col gap-5 min-w-0">
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

            {/* Three ways of asking the same question, so they are peers and
            share one frame. Across a row they were three cards none of them
            was wide enough for; down a rail the third went unread. */}
            <Carousel
              slides={[
                {
                  label: "Week by week",
                  body: (
                    <>
                      <p className="text-[12px] text-content/95 leading-snug mb-2.5">
                        Against itself: a standing difference, or something that
                        broke this week.
                      </p>
                      <Weeks vitals={vitals} cash={cash} />
                    </>
                  ),
                },
                {
                  label: `Against ${shortStore(them)}`,
                  body: (
                    <>
                      <p className="text-[12px] text-content/95 leading-snug mb-2.5">
                        One rule for all three, so measures that disagree are
                        seen to.
                      </p>
                      <Index vitals={vitals} them={them} cash={cash} />
                    </>
                  ),
                },
                ...(vendors.length > 0
                  ? [
                      {
                        label: "Who supplies it",
                        count: vendors.length,
                        body: (
                          <>
                            <p className="text-[12px] text-content/95 leading-snug mb-2.5">
                              The shortfall by vendor. Pick one to narrow the
                              items.
                            </p>
                            <div className="flex flex-col gap-1.5">
                              {vendors.map((v) => (
                                <button
                                  key={v.vendorName}
                                  onClick={() => onVendor(v.vendorName)}
                                  className="flex items-center gap-2.5 text-left rounded px-1 py-0.5 hover:bg-bkg transition-colors"
                                >
                                  <span className="w-[120px] flex-shrink-0 truncate text-[12.5px] text-content">
                                    {v.vendorName}
                                  </span>
                                  <span className="flex-1 min-w-0 h-[8.4px] rounded-sm bg-bkg">
                                    <span
                                      className="block h-[8.4px] rounded-sm bg-red-500"
                                      style={{
                                        width: `${(Math.abs(v.dollars) / widestVendor) * 100}%`,
                                      }}
                                    />
                                  </span>
                                  <span className="w-[80px] flex-shrink-0 text-right text-[12.5px] font-bold tabular-nums text-delta_negative_text">
                                    {"−"}
                                    {cash(Math.abs(v.dollars))}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </div>

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
        </div>
      </div>
    </div>
  );
};

export default HoldsPanel;
