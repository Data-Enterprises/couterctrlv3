// Utils
import { severityDotClass } from "../../../../../../utils/severity";
import { COMPARE_NOTE_TONE, money, word } from "../utils";

// Interfaces
import type { buildReport, hashTotals } from "../../../utils/deptReport";

// Components
import CtaStrip from "../../../../../../components-dev/CtaStrip";
import PageInfoButton from "../../../../../../components-dev/PageInfoButton";
import ConcentratedNote from "./ConcentratedNote";
import HashNote from "./HashNote";
import NotComparedNote from "./NotComparedNote";

interface DeptCompareHeaderProps {
  report: ReturnType<typeof buildReport>;
  /** What both stores leave out of net sales; null until the counterpart
   *  is in. */
  hash: ReturnType<typeof hashTotals> | null;
  compareStoreName: string;
  onBack: () => void;
}

/** The department comparison's head: Back, how far behind or ahead the store
 *  is, the behind and ahead piles, and the strip with the working behind
 *  them. */
const DeptCompareHeader = ({
  report,
  hash,
  compareStoreName,
  onBack,
}: DeptCompareHeaderProps) => {
  const {
    shown,
    folded,
    underTotal,
    overTotal,
    netGap,
    onlyMine,
    onlyTheirs,
    onlyMineTotal,
    onlyTheirsTotal,
  } = report;

  /** The three things the strip under the bar can say. Named here because the
   *  strip has to know whether it has anything to say at all before it
   *  decides what to put on its own label. */
  const concentrated = underTotal > 0 && shown.length > 0;
  const notComparedShown = onlyMine.length > 0 || onlyTheirs.length > 0;
  const hashShown = hash !== null && (hash.mine !== 0 || hash.theirs !== 0);

  return (
    /* Back, the headline and the counterpart on one line. They were two rows,
       the first of which was a 28px band holding four words and a question
       mark — most of it whitespace nobody was reading. */
    <div className="flex-shrink-0 px-4 pt-2.5 pb-3 border-b-2 border-brand_navy/20">
      <div className="flex items-center gap-2.5">
        {/* Named, not just pointed. A bare chevron is a direction, and the one
            question a reader has on a drill-down is what going back lands
            them on. */}
        <button
          onClick={onBack}
          title="Back to all stores"
          className="flex-shrink-0 h-6 px-2 inline-flex items-center gap-1 rounded-md border border-brand_navy/25 text-[12px] font-bold text-content hover:bg-bkg transition-colors"
        >
          <span className="text-[13px] leading-none">{"‹"}</span>
          Back
        </button>

        {/* The net first. It is the figure the Stores tab sent the reader here
            with, and it used to arrive third in a row of three, in the
            smallest type on the screen -- under a headline about a shortfall
            the reader had not been shown the size of. A store $118K behind in
            one set of departments and $117K ahead in another is NOT $73K down,
            and the old headline read as though it were. */}
        <p className="min-w-0 flex-1 text-[16.5px] font-bold leading-snug text-content truncate">
          {netGap < 0 ? (
            <>
              Behind by{" "}
              <span className="text-delta_negative_text">{money(-netGap)}</span>
            </>
          ) : netGap > 0 ? (
            <>
              Ahead by{" "}
              <span className="text-delta_positive_text">{money(netGap)}</span>
            </>
          ) : (
            <>Level with {compareStoreName}</>
          )}
        </p>

        <span className="flex-shrink-0 text-[11.5px] text-content/95 truncate max-w-[220px]">
          vs {compareStoreName}
        </span>
        <PageInfoButton
          page="sales"
          variant="light"
          title="How a department is checked"
          className="flex-shrink-0 -my-1"
        />
      </div>

      {underTotal > 0 && (
        /* The two piles the net is made of, both written where they are drawn.
           One bar split into "5 departments / 21 others" was a share of the
           behind pile -- a percentage of a figure the reader had not been
           given. */
        <span className="flex h-6 rounded-md overflow-hidden bg-bkg mt-2.5 text-[11.5px] font-semibold">
          <span
            className={`flex items-center px-2.5 text-custom-white whitespace-nowrap overflow-hidden ${severityDotClass.critical}`}
            style={{
              width: `${Math.max(12, (underTotal / (underTotal + overTotal)) * 100)}%`,
            }}
          >
            <span className="truncate">{money(underTotal)} behind</span>
          </span>
          {overTotal > 0 && (
            <span
              className={`flex items-center px-2.5 text-custom-white whitespace-nowrap overflow-hidden flex-1 ${severityDotClass.healthy}`}
            >
              <span className="truncate">{money(overTotal)} ahead</span>
            </span>
          )}
        </span>
      )}

      {/*
        Everything the bar cannot say, behind one strip.

        These were three stacked sentences under the bar. Together they ran to
        four lines of 11.5px type and pushed the two panels below them down the
        screen -- so the list a reader came here to scan started lower the
        more there was to explain, and the explanation was set in the smallest
        type on the page.

        As a CtaStrip it lays OVER the panels instead of moving them, which is
        the house rule for these, and the sentences get a size worth reading
        because the room is no longer rationed.

        Closed by default, per the same rule. The bar above already carries
        the finding; this is the working behind it.
      */}
      {(concentrated || notComparedShown || hashShown) && (
        <CtaStrip
          tone={COMPARE_NOTE_TONE}
          className="mt-1.5 rounded-md border"
          label={
            notComparedShown ? (
              /* Counted, not totalled. Adding onlyMine to onlyTheirs makes a
                 figure that is nobody's sales and no kind of gap -- one pile
                 is this store's, the other is the counterpart's -- and set
                 under "Behind by $53,758.56" it read as money missing from
                 that. It is not, and it never included the hash departments
                 either. The count is exact and the detail has both figures
                 with their stores attached. */
              <>
                <span className="font-bold tabular-nums">
                  {onlyMine.length + onlyTheirs.length}
                </span>{" "}
                {onlyMine.length + onlyTheirs.length === 1
                  ? "department is"
                  : "departments are"}{" "}
                carried by only one of the two stores
              </>
            ) : concentrated ? (
              <>
                {word(shown.length)}{" "}
                {shown.length === 1 ? "department holds" : "departments hold"}{" "}
                <span className="font-bold tabular-nums">
                  {money(shown.reduce((t, r) => t - r.gap, 0))}
                </span>{" "}
                of the gap
              </>
            ) : (
              <>Some sales are outside net sales at both stores</>
            )
          }
          trailing={notComparedShown ? "Not compared" : "Breakdown"}
          detail={
            /* Capped and scrollable: naming every department means this can run
               long on a pair of stores that share little, and the overlay must
               not reach past the panel it is laid over. */
            <span className="flex flex-col gap-2 text-[13px] leading-snug max-h-[45vh] overflow-y-auto">
              {concentrated && (
                <ConcentratedNote
                  shown={shown}
                  folded={folded}
                  underTotal={underTotal}
                />
              )}
              {notComparedShown && (
                <NotComparedNote
                  onlyMine={onlyMine}
                  onlyTheirs={onlyTheirs}
                  onlyMineTotal={onlyMineTotal}
                  onlyTheirsTotal={onlyTheirsTotal}
                  compareStoreName={compareStoreName}
                />
              )}
              {hashShown && hash && (
                <HashNote hash={hash} compareStoreName={compareStoreName} />
              )}
            </span>
          }
        />
      )}
    </div>
  );
};

export default DeptCompareHeader;
