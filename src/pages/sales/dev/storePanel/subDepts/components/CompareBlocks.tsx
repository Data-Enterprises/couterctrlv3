/**
 * The two pieces every store-vs-store panel is built from.
 *
 * They were written for the department comparison and the Top 200 comparison
 * wanted exactly the same vocabulary, so they live here rather than in one of
 * them. Two copies of a comparison's dress is how two comparisons on the same
 * screen end up disagreeing about which store is which colour.
 */

/** A headed block, so the panel reads as sections rather than a column of
 *  loose figures. */
export const Block = ({
  title,
  action,
  children,
}: {
  title: string;
  /** Sits on the heading's own line, where a section has something to do. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  /* A rule BETWEEN blocks, which the first one is not under — against the
     strip above it, it read as a stray line with a gap over it. */
  <div className="border-t border-brand_navy/15 pt-2.5 mt-3 first:border-t-0 first:pt-0 first:mt-0">
    <div className="flex items-center gap-3 mb-1.5">
      <div className="text-[10px] font-bold uppercase tracking-wide text-content/85">
        {title}
      </div>
      {action && <span className="ml-auto flex-shrink-0">{action}</span>}
    </div>
    {children}
  </div>
);

/**
 * One measure, both stores, with the sentence that compares them.
 *
 * Two figures and a "vs" asked the reader to divide. The bars do it: the
 * shorter one is this store, the longer one is the other, and the line
 * underneath says by how much in the only terms anybody repeats out loud.
 */
export const Measure = ({
  title,
  mine,
  theirs,
  us,
  them,
  fmt,
  better,
}: {
  title: string;
  mine: number;
  theirs: number;
  us: string;
  them: string;
  fmt: (v: number) => string;
  /** Which direction is good. Take per unit being up is not a shortfall. */
  better: "more" | "less";
}) => {
  const widest = Math.max(Math.abs(mine), Math.abs(theirs), 1);
  const pct =
    theirs === 0 ? null : Math.round(Math.abs(mine / theirs - 1) * 100);
  const up = mine > theirs;
  const good = better === "more" ? up : !up;

  return (
    <div className="rounded-lg bg-bkg px-3.5 py-2.5 min-w-0">
      {/* The verdict rides the heading. Under the bars it was a third line
          saying what the two bars had just shown. */}
      <div className="flex items-baseline gap-3">
        <span className="text-[11.5px] font-bold uppercase tracking-wide text-content/85">
          {title}
        </span>
        <span
          className={`ml-auto text-[13px] font-semibold truncate ${
            pct === null || pct === 0
              ? "text-content/85"
              : good
                ? "text-delta_positive_text"
                : "text-delta_negative_text"
          }`}
        >
          {pct === null
            ? `${them} rang none of it`
            : pct === 0
              ? `Level with ${them}`
              : `${pct}% ${up ? "more" : "less"} than ${them}`}
        </span>
      </div>

      <div className="flex flex-col gap-1 mt-2">
        {[
          /* This store's bar carries the verdict; the other store's is the
             reference it is measured against, so it stays neutral. A pair
             of brand colours said which store without saying how it went,
             which is the only thing the card is for. */
          {
            label: us,
            v: mine,
            tone:
              pct === null || pct === 0
                ? "bg-store_compare"
                : good
                  ? "bg-emerald-500"
                  : "bg-red-500",
            /* The figure matches its own bar: two marks for one reading,
               and a black number beside a red bar reads as a correction. */
            ink:
              pct === null || pct === 0
                ? "text-content"
                : good
                  ? "text-delta_positive_text"
                  : "text-delta_negative_text",
          },
          {
            label: them,
            v: theirs,
            tone: "bg-store_compare",
            ink: "text-content",
          },
        ].map((b) => (
          <span key={b.label} className="flex items-center gap-2.5 text-[13px]">
            <span
              className="w-[168px] flex-shrink-0 truncate text-content/85"
              title={b.label}
            >
              {b.label}
            </span>
            <span className="flex-1 min-w-0 h-[9.2px] rounded-sm bg-custom-white">
              <span
                className={`block h-[9.2px] rounded-sm ${b.tone}`}
                style={{ width: `${(Math.abs(b.v) / widest) * 100}%` }}
              />
            </span>
            <span
              className={`w-[104px] flex-shrink-0 text-right tabular-nums font-semibold whitespace-nowrap ${b.ink}`}
            >
              {fmt(b.v)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};
