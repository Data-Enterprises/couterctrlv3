// Hooks
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../../hooks";
import { useSalesCtx, useSalesState } from "../../../hooks";

// Redux
import { setInvestigation } from "../../../../../../features/dev/devSalesLedgerSlice";
import { rememberCounterpart } from "../../../../../../features/dev/devSalesCacheSlice";

// API
import { getSubs } from "../../../../../../api/sales";

// Utils
import { severityDotClass } from "../../../../../../utils/severity";
import { addDays, sameWeekDayLastYear } from "../../../../../../utils";
import { scopeToStoreNumber } from "../../../utils/ledgerUtils";
import {
  buildReport,
  hashTotals,
  totalsFrom,
  type ReportRow,
} from "../../../utils/deptReport";
import { COMPARE_NOTE_TONE, day, LIST_COLS, money, word } from "../utils";

// Interfaces
import type { SubSale } from "../../../../../../interfaces";

// Components
import LoadingIndicator from "../../../../../../components-dev/loading/LoadingIndicator";
import CtaStrip from "../../../../../../components-dev/CtaStrip";
import PageInfoButton from "../../../../../../components-dev/PageInfoButton";
import ListRow from "./ListRow";
import Detail from "./Detail";

interface DeptReportProps {
  openStoreName: string;
  /** The investigation is about one named store's supply chain, so it cannot
   *  work from the name alone. */
  openStoreId: number;
  openStoreNumber: string;
  compareStoreId: number;
  /** Co-located stores share a storeid, so the rows have to be narrowed by
   *  number as well. */
  compareStoreNumber: string;
  compareStoreName: string;
  twStart: string;
  twEnd: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
  /**
   * The exact days last week and last year that correspond to this week's.
   * The open store's LW and LY are already narrowed to these on the way into
   * the slice; the counterpart has to be narrowed to the same set.
   */
  lwWeekDates: string[];
  lyWeekDates: string[];
  onBack: () => void;
}

/**
 * The sub-department comparison, read as a report.
 *
 * Shown only when a counterpart has been chosen in Stores — without one the
 * tab stays the store's own graded departments, which is a different question
 * and already answered.
 *
 * One line a department: what it is, what it costs, what went wrong, and the
 * button that goes and looks. Under each, the three gates in order with the
 * failing one marked, so the sentence is a claim with its working shown
 * rather than an assertion to take on trust.
 *
 * There is nothing to expand. An earlier pass hid a tray of figures behind
 * every row and it read as a pile — three sub-tables in three shapes, each
 * re-declaring its own headers, with the finding competing against them for
 * the eye. The trail of checks IS the evidence, and it fits on one line.
 *
 * Every figure comes from rows already fetched. Nothing item-level appears
 * here — that costs nine requests a department and is the investigation's
 * whole job. The report NAMES a diagnosis; the investigation proves it.
 */
const DeptReport = ({
  openStoreName,
  openStoreId,
  openStoreNumber,
  compareStoreId,
  compareStoreNumber,
  compareStoreName,
  twStart,
  twEnd,
  lwStart,
  lwEnd,
  lyStart,
  lyEnd,
  lwWeekDates,
  lyWeekDates,
  onBack,
}: DeptReportProps) => {
  // A day picked in the strip above narrows both sides to that day. The
  // open store's departments arrive already narrowed; without this the
  // counterpart stayed a whole week, and one Friday was "behind" a week.
  const { selectedDate } = useSalesCtx();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  // The open store's three weeks are already here — the panel fetched them
  // for its own Sub dept tab, which is why only the counterpart is asked for.
  const { subSales, subSalesWk2, subSalesWk3 } = useSalesState();

  /** No local copy: the cache IS the state, so coming back from an
   *  investigation does not re-ask for three weeks that have not changed. */
  const cacheKey = [
    compareStoreId,
    compareStoreNumber,
    twStart,
    twEnd,
    lwStart,
    lwEnd,
    lyStart,
    lyEnd,
  ].join("|");
  const cached = useAppSelector(
    (state) => state.dev.salesCache.counterpart[cacheKey],
  );

  /** The cache holds the counterpart's whole weeks; this narrows them exactly
   *  as the open store's were narrowed, so picking a day costs no request. */
  const lwKey = lwWeekDates.join(",");
  const lyKey = lyWeekDates.join(",");
  const theirs = useMemo(() => {
    if (!cached) return undefined;
    if (selectedDate) {
      const lwDay = addDays(new Date(selectedDate), -7)
        .toISOString()
        .split("T")[0];
      const lyDay = sameWeekDayLastYear(selectedDate).date;
      return {
        tw: cached.tw.filter((s) => day(s.sale_date) === selectedDate),
        lw: cached.lw.filter((s) => day(s.sale_date) === lwDay),
        ly: cached.ly.filter((s) => day(s.sale_date) === lyDay),
      };
    }
    const lwSet = new Set(lwKey.split(","));
    const lySet = new Set(lyKey.split(","));
    return {
      tw: cached.tw,
      lw: cached.lw.filter((s) => lwSet.has(day(s.sale_date))),
      ly: cached.ly.filter((s) => lySet.has(day(s.sale_date))),
    };
  }, [cached, selectedDate, lwKey, lyKey]);
  const [failed, setFailed] = useState(false);
  /** The department the panel is showing, by its matched key — not by a
   *  store's own number, which means different things at each store. */
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    if (cached) return;
    let live = true;
    setFailed(false);
    const ask = (from: string, to: string) =>
      getSubs(context.url, context.token, from, to, 0, compareStoreId, 1);

    Promise.all([ask(twStart, twEnd), ask(lwStart, lwEnd), ask(lyStart, lyEnd)])
      .then(([tw, lw, ly]) => {
        if (!live) return;
        // The house convention is a 200 carrying `error`, so `error === 0` is
        // the success test. Scoped by store NUMBER: co-located stores share
        // an id.
        const take = (resp: { data: { error: number; subs: SubSale[] } }) =>
          resp.data.error === 0
            ? scopeToStoreNumber(resp.data.subs, compareStoreNumber)
            : [];
        dispatch(
          rememberCounterpart({
            key: cacheKey,
            value: { tw: take(tw), lw: take(lw), ly: take(ly) },
          }),
        );
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [
    context.url,
    context.token,
    twStart,
    twEnd,
    lwStart,
    lwEnd,
    lyStart,
    lyEnd,
    compareStoreId,
    compareStoreNumber,
    cacheKey,
    cached,
    dispatch,
  ]);

  /** What both stores leave out of net sales, for the note under the bar. */
  const hash = useMemo(
    () =>
      theirs
        ? hashTotals({
            mineTw: subSales,
            mineLw: subSalesWk2,
            mineLy: subSalesWk3,
            theirsTw: theirs.tw,
            theirsLw: theirs.lw,
            theirsLy: theirs.ly,
          })
        : null,
    [theirs, subSales, subSalesWk2, subSalesWk3],
  );

  const report = useMemo(() => {
    if (!theirs) return null;
    return buildReport(
      totalsFrom({
        mineTw: subSales,
        mineLw: subSalesWk2,
        mineLy: subSalesWk3,
        theirsTw: theirs.tw,
        theirsLw: theirs.lw,
        theirsLy: theirs.ly,
      }),
    );
  }, [theirs, subSales, subSalesWk2, subSalesWk3]);

  /** Both stores travel with it: the question there is why THIS store is
   *  behind THAT one in this department. The gate that failed travels too,
   *  so the investigation can mark the pile it points at. */
  const investigate = (row: ReportRow) =>
    dispatch(
      setInvestigation({
        storeid: openStoreId,
        storeNumber: openStoreNumber,
        storeName: openStoreName,
        compareStoreid: compareStoreId,
        compareStoreNumber,
        compareStoreName,
        subDept: row.mineId ?? 0,
        // The counterpart's own number for the same department. The two
        // stores do not agree on it; the report paired them by name.
        compareSubDept: row.theirsId ?? 0,
        subDeptName: row.name,
        focus: row.chain.focus,
      }),
    );

  if (failed) {
    return (
      <div className="h-full flex items-center justify-center px-4 text-center text-[12.5px] text-content/95">
        That store&rsquo;s departments could not be loaded.
      </div>
    );
  }
  if (!report) {
    return (
      <div className="relative h-full">
        <LoadingIndicator message="Loading departments" />
      </div>
    );
  }

  const {
    shown,
    folded,
    underTotal,
    overTotal,
    over,
    netGap,
    onlyMine,
    onlyTheirs,
    onlyMineTotal,
    onlyTheirsTotal,
  } = report;

  /**
   * Every department, worst first.
   *
   * The cut still does its work — it decides what the headline counts and
   * what the bar draws — but it no longer decides what is on screen. A
   * department folded away is one somebody has to take on trust, and with
   * a panel sitting beside the list there is room to show all of them.
   */
  const rows = [...shown, ...folded, ...over].sort((x, y) => x.gap - y.gap);

  /** The first row until somebody picks another, so the panel is never
   *  empty and never opens on a department nobody chose. */
  const selected = rows.find((r) => r.key === picked) ?? rows[0] ?? null;

  /** The three things the strip under the bar can say. Named here because the
   *  strip has to know whether it has anything to say at all before it
   *  decides what to put on its own label. */
  const concentrated = underTotal > 0 && shown.length > 0;
  const notComparedShown = onlyMine.length > 0 || onlyTheirs.length > 0;
  const hashShown = hash !== null && (hash.mine !== 0 || hash.theirs !== 0);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Back, the headline and the counterpart on one line. They were two
          rows, the first of which was a 28px band holding four words and a
          question mark — most of it whitespace nobody was reading. */}
      <div className="flex-shrink-0 px-4 pt-2.5 pb-3 border-b-2 border-brand_navy/20">
        <div className="flex items-center gap-2.5">
          {/* Named, not just pointed. A bare chevron is a direction, and the
              one question a reader has on a drill-down is what going back
              lands them on. */}
          <button
            onClick={onBack}
            title="Back to all stores"
            className="flex-shrink-0 h-6 px-2 inline-flex items-center gap-1 rounded-md border border-brand_navy/25 text-[12px] font-bold text-content hover:bg-bkg transition-colors"
          >
            <span className="text-[13px] leading-none">{"‹"}</span>
            Back
          </button>

          {/* The net first. It is the figure the Stores tab sent the reader
              here with, and it used to arrive third in a row of three, in the
              smallest type on the screen -- under a headline about a
              shortfall the reader had not been shown the size of. A store
              $118K behind in one set of departments and $117K ahead in
              another is NOT $73K down, and the old headline read as though
              it were. */}
          <p className="min-w-0 flex-1 text-[16.5px] font-bold leading-snug text-content truncate">
            {netGap < 0 ? (
              <>
                Behind by{" "}
                <span className="text-delta_negative_text">
                  {money(-netGap)}
                </span>
              </>
            ) : netGap > 0 ? (
              <>
                Ahead by{" "}
                <span className="text-delta_positive_text">
                  {money(netGap)}
                </span>
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
          /* The two piles the net is made of, both written where they are
             drawn. One bar split into "5 departments / 21 others" was a share
             of the behind pile -- a percentage of a figure the reader had not
             been given. */
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

          These were three stacked sentences under the bar. Together they ran
          to four lines of 11.5px type and pushed the two panels below them
          down the screen -- so the list a reader came here to scan started
          lower the more there was to explain, and the explanation was set in
          the smallest type on the page.

          As a CtaStrip it lays OVER the panels instead of moving them, which
          is the house rule for these, and the sentences get a size worth
          reading because the room is no longer rationed.

          Closed by default, per the same rule. The bar above already carries
          the finding; this is the working behind it.
        */}
        {(concentrated || notComparedShown || hashShown) && (
          <CtaStrip
            tone={COMPARE_NOTE_TONE}
            className="mt-1.5 rounded-md border"
            label={
              notComparedShown ? (
                /* Counted, not totalled. Adding onlyMine to onlyTheirs makes
                   a figure that is nobody's sales and no kind of gap -- one
                   pile is this store's, the other is the counterpart's --
                   and set under "Behind by $53,758.56" it read as money
                   missing from that. It is not, and it never included the
                   hash departments either. The count is exact and the detail
                   has both figures with their stores attached. */
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
              /* Capped and scrollable: naming every department means this can
                 run long on a pair of stores that share little, and the
                 overlay must not reach past the panel it is laid over. */
              <span className="flex flex-col gap-2 text-[13px] leading-snug max-h-[45vh] overflow-y-auto">
                {concentrated && (
                  <span>
                    {word(shown.length)}{" "}
                    {shown.length === 1
                      ? "department holds"
                      : "departments hold"}{" "}
                    <span className="font-bold tabular-nums text-delta_negative_text">
                      {money(shown.reduce((t, r) => t - r.gap, 0))}
                    </span>{" "}
                    of the {money(underTotal)} behind
                    {folded.length > 0 && (
                      <>
                        {" "}
                        &middot; {folded.length}{" "}
                        {folded.length === 1 ? "other holds" : "others hold"}{" "}
                        the rest
                      </>
                    )}
                    .
                  </span>
                )}

                {/* A department only one store carries has no counterpart to
                    be behind, so it is not in the bar above -- but its money
                    is real and it is most of why the two stores differ at
                    all. Naming it keeps the three parts adding up: the bar,
                    this, and the headline. */}
                {notComparedShown && (
                  <span>
                    Not compared &mdash; departments only one store carries:{" "}
                    {onlyMine.length > 0 && (
                      <>
                        <span className="font-semibold">
                          {onlyMine.length}
                        </span>{" "}
                        only here worth{" "}
                        <span className="font-bold tabular-nums text-delta_positive_text">
                          {money(onlyMineTotal)}
                        </span>
                      </>
                    )}
                    {onlyMine.length > 0 && onlyTheirs.length > 0 && (
                      <> &middot; </>
                    )}
                    {onlyTheirs.length > 0 && (
                      <>
                        <span className="font-semibold">
                          {onlyTheirs.length}
                        </span>{" "}
                        only at {compareStoreName} worth{" "}
                        <span className="font-bold tabular-nums text-delta_negative_text">
                          {money(onlyTheirsTotal)}
                        </span>
                      </>
                    )}
                    .
                    {/* Every one of them, by name, on its own line per
                        store. These were three names and "and others" --
                        which told a reader there was something they were not
                        being shown about the biggest unexplained figure on
                        the screen. The strip overlays now, so the room to
                        name them exists. */}
                    <span className="mt-1 flex flex-col gap-0.5 text-content/95">
                      {onlyMine.length > 0 && (
                        <span>
                          <span className="font-semibold">Only here:</span>{" "}
                          {onlyMine.map((r) => r.name).join(", ")}
                        </span>
                      )}
                      {onlyTheirs.length > 0 && (
                        <span>
                          <span className="font-semibold">
                            Only at {compareStoreName}:
                          </span>{" "}
                          {onlyTheirs.map((r) => r.name).join(", ")}
                        </span>
                      )}
                    </span>
                  </span>
                )}

                {/* Fuel, lottery, cash accounts. The store leaves these out
                    of its own net sales, so the Stores tab figure this
                    headline is set beside leaves them out too, and the
                    comparison has to as well or the two disagree. Named
                    because a reader who knows Tupelo sells fuel will look
                    for it. */}
                {hashShown && (
                  <span>
                    Outside net sales at both stores, so not compared:{" "}
                    <span className="font-bold tabular-nums">
                      {money(hash.theirs)}
                    </span>{" "}
                    at {compareStoreName}
                    {hash.names.length > 0 && (
                      <span className="text-content/95">
                        {" "}
                        ({hash.names.join(", ")})
                      </span>
                    )}
                    {hash.mine !== 0 && (
                      <>
                        {" "}
                        &middot;{" "}
                        <span className="font-bold tabular-nums">
                          {money(hash.mine)}
                        </span>{" "}
                        here
                      </>
                    )}
                    .
                  </span>
                )}
              </span>
            }
          />
        )}
      </div>

      {/* The same two panels the single-store tab uses: a list to scan, and
          the thing it points at. One row of evidence could never carry a
          name, a figure, a sentence, a button and three gates across a full
          width — split in two, each half has room to be read. */}
      <div className="flex-1 min-h-0 flex">
        <div
          className="flex flex-col min-h-0 border-r border-brand_navy/15"
          style={{ width: "39.5%" }}
        >
          <div
            className="flex-shrink-0 grid items-center gap-2 px-3 py-1.5 border-b border-brand_navy/15 text-[10px] font-bold uppercase tracking-wide text-content/95"
            style={{ gridTemplateColumns: LIST_COLS }}
          >
            <span />
            <span className="min-w-0">Sub dept</span>
            {/* "Gap" was unambiguous while it was the only one. */}
            <span className="text-right">Sales gap</span>
            <span className="text-right">Units</span>
          </div>

          <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
            {rows.map((r) => (
              <ListRow
                key={r.key}
                row={r}
                selected={selected?.key === r.key}
                onSelect={() => setPicked(r.key)}
              />
            ))}
          </div>
        </div>

        {selected ? (
          <Detail
            row={selected}
            us={openStoreName}
            them={compareStoreName}
            day={selectedDate}
            onInvestigate={investigate}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center px-4 text-center text-[12.5px] text-content/95">
            No departments to compare.
          </div>
        )}
      </div>
    </div>
  );
};

export default DeptReport;
