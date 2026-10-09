import { useEffect, useMemo, useState } from "react";
import { getSubs } from "../../../../api/sales";
import { formatCurrency2 } from "../../../../utils";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { setInvestigation } from "../../../../features/dev/devSalesLedgerSlice";
import { rememberCounterpart } from "../../../../features/dev/devSalesCacheSlice";
import { useSalesState } from "../hooks/useSalesState";
import { scopeToStoreNumber } from "../shared/ledgerUtils";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import PageInfoButton from "../../../../components-dev/PageInfoButton";
import {
  buildReport,
  totalsFrom,
  type Finding,
  type ReportRow,
} from "../shared/deptReport";
import type { SubSale } from "../../../../interfaces";

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

const money = (v: number) => formatCurrency2(v);
const signed = (v: number) =>
  (v >= 0 ? "+" : "−") + formatCurrency2(Math.abs(v));

const WORDS = [
  "No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
  "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
];
const word = (n: number) => WORDS[n] ?? String(n);

/** What a set of departments that failed the same gate is called. */
const GROUP_SAYS: Record<Finding, string> = {
  "nothing-rung": "Nothing rung",
  "fewer-units": "Sold fewer units",
  "lower-price": "Took less per unit",
  "different-mix": "Selling a different mix",
  "a-little-less": "A little less of everything",
  level: "Level",
};

const COLS = "minmax(0,1fr) 112px minmax(0,2.4fr) 156px";

/* ------------------------------------------------------------------ */
/* One line                                                            */
/* ------------------------------------------------------------------ */

interface RowProps {
  row: ReportRow;
  /** Inside the cut gets the solid button, the rest a link. Both go to the
   *  same place — the weight only says where to start. */
  lead: boolean;
  onInvestigate: (row: ReportRow) => void;
}

const Row = ({ row, lead, onInvestigate }: RowProps) => (
  <div
    className="grid gap-4 items-start px-4 py-3 border-b border-brand_navy/15"
    style={{ gridTemplateColumns: COLS }}
  >
    <span className="min-w-0 truncate text-[14px] font-bold text-content leading-snug">
      {row.name}
    </span>

    <span className="text-right text-[14px] font-bold tabular-nums text-delta_negative_text leading-snug">
      {signed(row.gap)}
    </span>

    <span className="min-w-0">
      <span className="block text-[13.5px] leading-snug text-content">
        <span className="font-bold text-delta_negative_text">
          {row.chain.says.lead}
        </span>
        {row.chain.says.tail}
      </span>

      {/* The gates in order, the failing one marked. Somebody who does not
          care takes the sentence; somebody who does can see what it rests
          on without opening anything. */}
      <span className="flex items-center gap-1.5 flex-wrap mt-1">
        {row.chain.gates.map((g, i) => (
          <span key={g.name} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-[11px] text-content/85">&rsaquo;</span>}
            <span
              className={`text-[12px] whitespace-nowrap ${
                g.state === "fail"
                  ? "font-bold text-delta_negative_text"
                  : g.state === "pass"
                    ? "text-content/85"
                    : "text-content/85 opacity-60"
              }`}
            >
              {g.state === "fail" ? "✕ " : g.state === "pass" ? "✓ " : ""}
              {g.detail}
            </span>
          </span>
        ))}
      </span>
    </span>

    {/* Named by the gate that failed. "Check the mix" rather than "Check
        prices" where the take per unit is half the other store's: that is
        not a department that priced low, and comparing price tags would
        send somebody to the one place the answer is not. */}
    {lead ? (
      <button
        onClick={() => onInvestigate(row)}
        className="justify-self-end px-3.5 py-2 rounded-md bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12.5px] font-bold transition-colors whitespace-nowrap"
      >
        {row.chain.cta} &rarr;
      </button>
    ) : (
      <button
        onClick={() => onInvestigate(row)}
        className="justify-self-end text-[12.5px] font-bold text-brand_navy_hover hover:underline whitespace-nowrap"
      >
        Investigate &rarr;
      </button>
    )}
  </div>
);

/* ------------------------------------------------------------------ */

interface Props {
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
  onBack: () => void;
}

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
  onBack,
}: Props) => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  // The open store's three weeks are already here — the panel fetched them
  // for its own Sub dept tab, which is why only the counterpart is asked for.
  const { subSales, subSalesWk2, subSalesWk3 } = useSalesState();

  /** No local copy: the cache IS the state, so coming back from an
   *  investigation does not re-ask for three weeks that have not changed. */
  const cacheKey = [
    compareStoreId, compareStoreNumber,
    twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd,
  ].join("|");
  const theirs = useAppSelector(
    (state) => state.dev.salesCache.counterpart[cacheKey],
  );
  const [failed, setFailed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (theirs) return;
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
    context.url, context.token,
    twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd,
    compareStoreId, compareStoreNumber, cacheKey, theirs, dispatch,
  ]);

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
        subDept: row.id,
        subDeptName: row.name,
        focus: row.chain.focus,
      }),
    );

  if (failed) {
    return (
      <div className="h-full flex items-center justify-center px-4 text-center text-[12.5px] text-content/85">
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

  const { shown, folded, byFinding, underTotal, overTotal, over, netGap } = report;

  /**
   * What prints after the cut.
   *
   * Departments that failed the SAME gate collapse into one line: four that
   * rang nothing are one problem with one owner, and four rows saying it
   * four times is the padding this report exists instead of. Whatever is
   * left over is listed on its own, a few at a time, and the remainder is a
   * count in the footer.
   */
  const grouped = new Set(
    byFinding
      .filter((g) => g.rows.filter((r) => folded.includes(r)).length > 1)
      .map((g) => g.finding),
  );
  const loose = folded.filter((r) => !grouped.has(r.chain.finding));
  const groups = byFinding
    .filter((g) => grouped.has(g.finding))
    .map((g) => {
      const rows = g.rows.filter((r) => folded.includes(r));
      return { finding: g.finding, rows, total: rows.reduce((t, r) => t - r.gap, 0) };
    });

  const LOOSE_CAP = 3;
  const listed = showAll ? loose : loose.slice(0, LOOSE_CAP);
  const rest = loose.slice(listed.length);
  const restTotal = rest.reduce((t, r) => t - r.gap, 0);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center gap-2 flex-wrap text-[12px] text-content/85">
            <button
              onClick={onBack}
              className="font-semibold text-content hover:underline flex-shrink-0"
            >
              &lsaquo; All stores
            </button>
            <span>&middot;</span>
            <span className="truncate">vs {compareStoreName}</span>
            <span>&middot;</span>
            <span
              className={`font-bold ${
                netGap < 0 ? "text-delta_negative_text" : "text-delta_positive_text"
              }`}
            >
              {signed(netGap)} {netGap < 0 ? "behind" : "ahead"} overall
            </span>
            <PageInfoButton
              page="sales"
              section="gap-split"
              variant="light"
              title="How a department is checked"
              className="ml-auto flex-shrink-0 -my-1"
            />
          </div>

          {/* The whole report in one line: how much, and how concentrated. */}
          <p className="text-[18px] font-bold leading-snug text-content mt-1.5">
            {shown.length === 0 ? (
              <>Nothing is under {compareStoreName}.</>
            ) : (
              <>
                {word(shown.length)}{" "}
                {shown.length === 1 ? "department holds" : "departments hold"}{" "}
                <span className="text-delta_negative_text">
                  {money(shown.reduce((t, r) => t - r.gap, 0))}
                </span>{" "}
                of the shortfall
              </>
            )}
          </p>
        </div>

        {shown.map((r) => (
          <Row key={r.id} row={r} lead onInvestigate={investigate} />
        ))}
        {listed.map((r) => (
          <Row key={r.id} row={r} lead={false} onInvestigate={investigate} />
        ))}

        {groups.map((g) => (
          <div
            key={g.finding}
            className="grid gap-4 items-start px-4 py-3 border-b border-brand_navy/15"
            style={{ gridTemplateColumns: COLS }}
          >
            <span className="min-w-0">
              <span className="block text-[14px] font-bold text-content leading-snug">
                {word(g.rows.length)} departments
              </span>
              {/* A few names and a count. Spelling out twelve wrapped to six
                  lines and left this row three times the height of the ones
                  above it, which is most of what made the list look ragged —
                  and nobody reads the twelfth name anyway. */}
              <span
                className="block text-[12px] text-content/85 leading-snug mt-0.5 truncate"
                title={g.rows.map((r) => r.name).join(", ")}
              >
                {g.rows.slice(0, 3).map((r) => r.name).join(", ")}
                {g.rows.length > 3 &&
                  ` and ${g.rows.length - 3} more`}
              </span>
            </span>
            <span className="text-right text-[14px] font-bold tabular-nums text-delta_negative_text leading-snug">
              {signed(-g.total)}
            </span>
            <span className="text-[13.5px] font-bold text-delta_negative_text leading-snug">
              {GROUP_SAYS[g.finding]}
            </span>
            <button
              onClick={() => investigate(g.rows[0])}
              className="justify-self-end text-[12.5px] font-bold text-brand_navy_hover hover:underline whitespace-nowrap"
            >
              Show &rarr;
            </button>
          </div>
        ))}

        <div className="flex items-center gap-2 flex-wrap px-4 py-3 text-[12.5px] text-content/85">
          {rest.length > 0 && (
            <>
              <span>
                {rest.length} more under{" "}
                <span className="font-semibold tabular-nums text-delta_negative_text">
                  {signed(-restTotal)}
                </span>
              </span>
              <span>&middot;</span>
            </>
          )}
          <span>
            {over.length} ahead{" "}
            <span className="font-semibold tabular-nums text-delta_positive_text">
              {signed(overTotal)}
            </span>
          </span>
          <span>&middot;</span>
          <span className="tabular-nums">{signed(-underTotal)} under in all</span>
          {loose.length > LOOSE_CAP && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="ml-auto font-semibold text-brand_navy_hover hover:underline flex-shrink-0"
            >
              {showAll ? "Show less" : "Show all"} &rsaquo;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeptReport;
