// Utils
import { money, OUTLINE_TONE } from "../../utils";

// Interfaces
import type { CompareTotals, divergenceByDept } from "../utils/topItemsCompare";

// Components
import CtaStrip from "../../../../../../../components-dev/CtaStrip";

interface CompareHeadlineProps {
  openStoreName: string;
  compareStoreName: string;
  totals: CompareTotals;
  /** Every item in either list, which the piles divide. */
  itemCount: number;
  byDept: ReturnType<typeof divergenceByDept>;
  onBack: () => void;
}

/** The comparison's head: Back, the bar of items in both lists and in one
 *  only, and the strip naming the departments where the lists differ. */
const CompareHeadline = ({
  openStoreName,
  compareStoreName,
  totals,
  itemCount,
  byDept,
  onBack,
}: CompareHeadlineProps) => {
  const differ = totals.onlyMine + totals.onlyTheirs;
  const pileTotal = Math.max(1, itemCount);

  return (
    /* Headline — the shape DeptReport uses, so the two comparisons read as
       one feature rather than two. */
    <div className="flex-shrink-0 px-4 pt-2.5 pb-3 border-b-2 border-brand_navy/20">
      {/*
        Back and the bar on one row, and no headline sentence.
        It read "202 of 301 differ", where 301 was the UNION of the two
        lists -- a number nobody asked for, and one that cannot be "of 200"
        because the list holds items from both stores. The bar's own three
        labels say it exactly: 99 in both, 101 only at one, 101 only at the
        other, and 99 + 101 is each store's 200. The counterpart is named
        inside its own segment, so the "vs store" line went with it.
      */}
      <div className="flex items-stretch gap-2.5">
        <button
          onClick={onBack}
          title="Back to all stores"
          className="flex-shrink-0 px-2.5 inline-flex items-center gap-1.5 rounded-md border border-brand_navy/25 text-[12px] font-bold text-content hover:bg-bkg transition-colors"
        >
          <span className="text-[14px] leading-none">{"‹"}</span>
          Back
        </button>

        <span
          data-help="top200-piles"
          className="flex-1 flex h-[30px] rounded-md overflow-hidden bg-bkg text-[12px] font-semibold"
        >
          <span
            className="flex items-center px-2.5 text-custom-white whitespace-nowrap overflow-hidden bg-brand_navy"
            style={{
              width: `${Math.max(12, (totals.both / pileTotal) * 100)}%`,
            }}
          >
            <span className="truncate">
              {totals.both} in both · {money(totals.sharedMineSales)}
            </span>
          </span>
          {/* Three weights of one colour: solid, a quarter, a tenth, all with
              dark text on the two tints. The piles are COUNTS of items, not
              the stores themselves -- the row bars are where a store wears its
              own colour. */}
          {totals.onlyMine > 0 && (
            <span
              className="flex items-center px-2.5 text-content whitespace-nowrap overflow-hidden bg-brand_navy/25"
              style={{
                width: `${Math.max(10, (totals.onlyMine / pileTotal) * 100)}%`,
              }}
            >
              <span className="truncate">
                {totals.onlyMine} only {openStoreName}
              </span>
            </span>
          )}
          {totals.onlyTheirs > 0 && (
            <span className="flex items-center px-2.5 flex-1 text-content whitespace-nowrap overflow-hidden bg-brand_navy/15">
              <span className="truncate">
                {totals.onlyTheirs} only {compareStoreName}
              </span>
            </span>
          )}
        </span>
      </div>

      {/* The anchor lives on a wrapper: CtaStrip takes no `data-help` and
          would drop it, leaving the help panel pointing at nothing. */}
      {byDept.length > 0 && (
        <div data-help="top200-outline" className="mt-2.5">
          <CtaStrip
            tone={OUTLINE_TONE}
            className="rounded-md border"
            label={
              <>
                The difference sits in{" "}
                <b>
                  {byDept
                    .slice(0, 3)
                    .map((d) => d.dept)
                    .join(", ")}
                </b>
              </>
            }
            trailing={`${differ} items`}
            detail={
              <span className="flex flex-col gap-2 text-[13px] leading-snug max-h-[45vh] overflow-y-auto">
                <span>
                  Of the {differ} items in one list and not the other, by
                  department:
                </span>
                <span className="flex flex-col gap-0.5">
                  {byDept.map((d) => (
                    <span key={d.dept}>
                      <span className="font-semibold tabular-nums">
                        {d.count}
                      </span>{" "}
                      {d.dept}
                    </span>
                  ))}
                </span>
                <span>
                  Counted over one-sided rows only. An item both stores carry is
                  not where they differ in stocking, however far apart the two
                  sizes are.
                </span>
              </span>
            }
          />
        </div>
      )}
    </div>
  );
};

export default CompareHeadline;
