import { useEffect, useMemo, useState } from "react";
import { getSubs } from "../../../../api/sales";
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { setInvestigation } from "../../../../features/dev/devSalesLedgerSlice";
import { rememberCounterpart } from "../../../../features/dev/devSalesCacheSlice";
import { useSalesState } from "../hooks/useSalesState";
import { scopeToStoreNumber } from "../shared/ledgerUtils";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import {
  buildReport,
  totalsFrom,
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
 * It replaced a list because a list made the reader hunt. Ordered by
 * department SIZE, the top rows were the biggest departments, which are the
 * ones most likely to be level; the only way to find the problem was to click
 * around until you hit it. This leads instead: it says what the gap is, where
 * it concentrates, and what shape each of those has, before anybody clicks
 * anything.
 *
 * Every figure comes from rows already fetched. Nothing item-level appears
 * here — that costs nine requests a department and is the investigation's
 * whole job. The report NAMES a diagnosis; the investigation proves it.
 */

/** A ramp for the band, darkest first. Six is enough: past that the cut has
 *  printed more departments than a reader is going to hold anyway. */
const REDS = ["#9f1f36", "#b83142", "#c9505e", "#d9707d", "#e68e99", "#eca5ad"];
const GREENS = ["#0f7a4f", "#1a9c66", "#45b88a", "#86d4b4", "#a9e0c8", "#c9ecdd"];
const TAIL = "#c3ccd6";

const money = (v: number) => formatCurrency2(v);
const signed = (v: number) =>
  (v >= 0 ? "+" : "−") + formatCurrency2(Math.abs(v));
const short = (v: number) =>
  "$" + (Math.round(Math.abs(v) / 100) / 10).toFixed(1) + "K";
const count = (v: number) => formatBigNumber(v, 0);

const WORDS = [
  "No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
  "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
];
const word = (n: number) => WORDS[n] ?? String(n);

const deltaText = (v: number) =>
  v >= 0 ? "text-delta_positive_text" : "text-delta_negative_text";

const HEAD =
  "text-[12px] font-bold uppercase tracking-wide text-content/85";
const SUBHEAD =
  "text-[12px] font-bold uppercase tracking-wide text-content/85";

/* ------------------------------------------------------------------ */
/* One department                                                      */
/* ------------------------------------------------------------------ */

interface RowProps {
  row: ReportRow;
  tone: string;
  openStoreName: string;
  compareStoreName: string;
  onInvestigate: (row: ReportRow) => void;
}

const Row = ({ row, tone, openStoreName, compareStoreName, onInvestigate }: RowProps) => {
  const unit = row.weighed ? "lb" : "units";
  const periods = [
    { label: "Last year", v: row.lyGap },
    { label: "Last week", v: row.lwGap },
    { label: "This week", v: row.gap },
  ];

  return (
    <div className="px-4 py-2.5 border-b border-brand_navy/15">
      {/* The finding on one line: which department, how much, and what
          happened. The rule down its left edge is this department's colour
          in the band above, so a row and its segment there are one object. */}
      <div
        className={`flex items-baseline gap-2.5 flex-wrap px-3 py-2 rounded ${
          row.gap < 0 ? "bg-delta_negative_bg" : "bg-delta_positive_bg"
        }`}
        style={{ borderLeft: `3px solid ${tone}` }}
      >
        <span className="text-[15px] font-bold text-content">{row.name}</span>
        <span
          className={`text-[15px] font-bold tabular-nums whitespace-nowrap ${deltaText(row.gap)}`}
        >
          {signed(row.gap)}
        </span>
        <span className="text-[13.5px] leading-snug text-content/85 flex-1 min-w-0 basis-[290px]">
          {row.says}
        </span>
        <button
          onClick={() => onInvestigate(row)}
          className="flex-shrink-0 text-[12.5px] font-bold text-brand_navy_hover hover:underline whitespace-nowrap"
        >
          {row.focus === "price"
            ? "Open items · start with the price ladder →"
            : "Open items · start with orders →"}
        </button>
      </div>

      <div className="flex gap-10 items-start mt-2 px-0.5 flex-wrap">
        {/* STORE metrics: totals as the payload states them. */}
        <div className="w-[318px] flex-shrink-0">
          <div className={`${HEAD} pb-1 border-b border-brand_navy/15`}>
            What each store did
          </div>
          <div
            className="grid gap-x-2.5 gap-y-0.5 mt-1.5 text-[12.5px] tabular-nums"
            style={{ gridTemplateColumns: "minmax(0,1fr) 92px 62px" }}
          >
            <span className={SUBHEAD}>Store</span>
            <span className={`${SUBHEAD} text-right`}>Sales</span>
            <span className={`${SUBHEAD} text-right`}>{unit}</span>

            <span className="min-w-0 truncate font-semibold text-content" title={openStoreName}>
              {openStoreName}
            </span>
            <span className={`text-right font-bold whitespace-nowrap ${deltaText(row.gap)}`}>
              {money(row.mine)}
            </span>
            <span
              className={`text-right font-bold ${deltaText(row.mineUnits - row.theirsUnits)}`}
            >
              {count(row.mineUnits)}
            </span>

            <span className="min-w-0 truncate text-content/85" title={compareStoreName}>
              {compareStoreName}
            </span>
            <span className="text-right text-content/85 whitespace-nowrap">
              {money(row.theirs)}
            </span>
            <span className="text-right text-content/85">{count(row.theirsUnits)}</span>
          </div>
        </div>

        {/* DIFFERENCE metrics: neither is a figure either store reported. */}
        <div className="w-[212px] flex-shrink-0">
          <div className={`${HEAD} pb-1 border-b border-brand_navy/15`}>
            What the gap is made of
          </div>
          <div
            className="grid gap-x-3 mt-1.5"
            style={{ gridTemplateColumns: "86px minmax(0,1fr)" }}
          >
            <span className={SUBHEAD}>Part</span>
            <span className={`${SUBHEAD} text-right`}>Amount</span>
          </div>
          {row.split === null ? (
            <p className="text-[12.5px] text-content/85 leading-snug mt-1.5">
              No units at {compareStoreName} to compare against.
            </p>
          ) : (
            <div
              className="grid gap-x-3 gap-y-1 mt-0.5"
              style={{ gridTemplateColumns: "86px minmax(0,1fr)" }}
            >
              <span className="text-[12px] font-bold uppercase tracking-wide text-volume_text">
                Volume
              </span>
              <span
                className={`text-[13px] font-bold tabular-nums text-right whitespace-nowrap ${deltaText(row.split.volume)}`}
              >
                {signed(row.split.volume)}
              </span>
              <span className="text-[12px] font-bold uppercase tracking-wide text-rate_text">
                Price &amp; mix
              </span>
              <span
                className={`text-[13px] font-bold tabular-nums text-right whitespace-nowrap ${deltaText(row.split.rate)}`}
              >
                {signed(row.split.rate)}
              </span>
            </div>
          )}
        </div>

        <div className="w-[258px] flex-shrink-0">
          <div className={`${HEAD} pb-1 border-b border-brand_navy/15`}>
            The gap, week by week
          </div>
          <div className="grid grid-cols-3 gap-2.5 mt-1.5">
            {periods.map((p) => (
              <div key={p.label} className="min-w-0">
                <div className={`${SUBHEAD} whitespace-nowrap`}>{p.label}</div>
                <div
                  className={`text-[13px] font-bold tabular-nums whitespace-nowrap mt-px ${deltaText(p.v)}`}
                >
                  {signed(p.v)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

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
      compareStoreName,
    );
  }, [theirs, subSales, subSalesWk2, subSalesWk3, compareStoreName]);

  /** Both stores travel with it: the question there is why THIS store is
   *  behind THAT one in this department, and neither half survives being
   *  re-derived from a name. The focus travels too, so the investigation can
   *  mark the pile this shape points at. */
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
        focus: row.focus,
      }),
    );

  const [openUnder, setOpenUnder] = useState(false);
  const [openOver, setOpenOver] = useState(false);

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

  const {
    shown, folded, steep, over, underTotal, overTotal, netGap, shownShare,
  } = report;

  const toneOf = (i: number, ramp: string[]) =>
    ramp[Math.min(i, ramp.length - 1)];

  /** One band. Both share the UNDER scale, so the departments running over
   *  are SEEN against those running under rather than being a second number
   *  to hold against the first. */
  const band = (
    label: string,
    total: number,
    tone: string,
    parts: { name: string; v: number }[],
    tailName: string,
    tailValue: number,
    ramp: string[],
  ) => {
    const scale = Math.max(1, underTotal);
    const segs = parts
      .map((p, i) => ({ ...p, fill: toneOf(i, ramp) }))
      .concat(tailValue > 0 ? [{ name: tailName, v: tailValue, fill: TAIL }] : []);
    return (
      <div key={label} className="mb-2">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-[54px] flex-shrink-0 text-[12px] font-bold uppercase tracking-wide ${tone}`}
          >
            {label}
          </span>
          <span className="flex-1 min-w-0 flex h-[18px] rounded overflow-hidden bg-bkg">
            {segs.map((p) => (
              <span
                key={p.name}
                title={`${p.name} ${money(p.v)}`}
                className="block h-full"
                style={{ background: p.fill, width: `${(p.v / scale) * 100}%` }}
              />
            ))}
          </span>
          <span
            className={`w-[104px] flex-shrink-0 text-right text-[13.5px] font-bold tabular-nums ${tone}`}
          >
            {label === "Under" ? "−" : "+"}
            {money(total)}
          </span>
        </div>
        <div className="flex items-center gap-3.5 flex-wrap mt-1 pl-[64px]">
          {segs.map((p) => (
            <span key={p.name} className="flex items-center gap-1.5 text-[12px] text-content/85">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ background: p.fill }}
              />
              <span className="font-semibold text-content">{p.name}</span>
              <span className="tabular-nums">{short(p.v)}</span>
            </span>
          ))}
        </div>
      </div>
    );
  };

  const rowsOf = (list: ReportRow[], ramp: string[]) =>
    list.map((r, i) => (
      <Row
        key={r.id}
        row={r}
        tone={toneOf(i, ramp)}
        openStoreName={openStoreName}
        compareStoreName={compareStoreName}
        onInvestigate={investigate}
      />
    ));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-brand_navy/15 flex-shrink-0 bg-gray-50">
        <button
          onClick={onBack}
          className="text-[12px] font-semibold text-content hover:underline flex-shrink-0"
        >
          &lsaquo; All stores
        </button>
        <span className="ml-auto text-[12px] text-content/85 truncate">
          Week ending {twEnd}
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
        {/* The accounting, stated so the three figures check against each
            other rather than being read one at a time. */}
        <div className="px-4 pt-3 pb-2.5 border-b border-brand_navy/15">
          <p className="text-[15.5px] leading-snug text-content max-w-[1020px] mb-2.5">
            <span className="font-bold">
              {openStoreName} took {money(Math.abs(netGap))}{" "}
              {netGap < 0 ? "less than" : "more than"} {compareStoreName}
            </span>{" "}
            in the week ending {twEnd}.{" "}
            {shown.length > 0 && (
              <>
                {word(shown.length)} of the {report.under.length} departments
                running under account for {Math.round(shownShare * 100)}% of it.
              </>
            )}
          </p>

          {band(
            "Under", underTotal, "text-delta_negative_text",
            shown.map((r) => ({ name: r.name, v: -r.gap })),
            `the other ${folded.length}`,
            folded.reduce((t, r) => t - r.gap, 0),
            REDS,
          )}
          {band(
            "Over", overTotal, "text-delta_positive_text",
            over.slice(0, 4).map((r) => ({ name: r.name, v: r.gap })),
            `the other ${Math.max(0, over.length - 4)}`,
            over.slice(4).reduce((t, r) => t + r.gap, 0),
            GREENS,
          )}
        </div>

        {/* Said once, in front of the rows it governs. */}
        <div className="flex items-start gap-6 flex-wrap px-4 py-2 bg-gray-50 border-b border-brand_navy/15">
          <span className="text-[12px] font-bold uppercase tracking-wide text-content/85 flex-shrink-0">
            Every gap splits two ways
          </span>
          <span className="text-[12.5px] text-content/85">
            <span className="font-bold text-volume_text">Volume</span> &mdash;
            the difference in how much went out of the door.
          </span>
          <span className="text-[12.5px] text-content/85">
            <span className="font-bold text-rate_text">Price &amp; mix</span>{" "}
            &mdash; the difference in what each unit brought in.
          </span>
          <span className="text-[12.5px] text-content/85">
            The two add back to the gap exactly.
          </span>
        </div>

        {rowsOf(shown, REDS)}

        {shown.length === 0 && (
          <div className="px-4 py-8 text-center text-[12.5px] text-content/85">
            Nothing in this store is behind {compareStoreName}.
          </div>
        )}

        <div className="px-4 py-2.5">
          {folded.length > 0 && (
            <div className="border border-brand_navy/15 rounded-md mb-2">
              <button
                onClick={() => setOpenUnder((v) => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-content/85">{openUnder ? "⌄" : "›"}</span>
                <span className="text-[13px] font-bold text-content">
                  {word(folded.length)} more{" "}
                  {folded.length === 1 ? "department is" : "departments are"} under{" "}
                  {compareStoreName}
                </span>
                <span className="text-[12.5px] text-content/85">
                  the same rows, folded away
                </span>
                <span className="ml-auto text-[13.5px] font-bold tabular-nums text-delta_negative_text">
                  {signed(folded.reduce((t, r) => t + r.gap, 0))}
                </span>
              </button>

              {/* The cut ranks by money, so a small department running at half
                  its counterpart can never surface. That is the one case the
                  ranking is blind to by construction, so it is named rather
                  than left to be found. These are PART of the count above. */}
              {steep.length > 0 && (
                <div className="flex items-baseline gap-2 flex-wrap px-3 pb-2.5 pt-2 border-t border-dashed border-brand_navy/15 pl-9">
                  <span className="text-[12.5px] font-bold text-severity_watch_text flex-shrink-0">
                    {word(steep.length)} {steep.length === 1 ? "is" : "are"} more than 40%
                    behind:
                  </span>
                  {steep.map((r) => (
                    <span key={r.id} className="text-[12.5px] text-content/85 whitespace-nowrap">
                      <span className="font-semibold text-content">{r.name}</span>{" "}
                      <span className="font-semibold tabular-nums text-delta_negative_text">
                        {signed(r.gap)}
                      </span>{" "}
                      <span className="tabular-nums">
                        ({Math.round(r.dropoff * 100)}% behind)
                      </span>
                    </span>
                  ))}
                </div>
              )}

              {openUnder && <div className="border-t border-brand_navy/15">{rowsOf(folded, [TAIL])}</div>}
            </div>
          )}

          {over.length > 0 && (
            <div className="border border-brand_navy/15 rounded-md">
              <button
                onClick={() => setOpenOver((v) => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-content/85">{openOver ? "⌄" : "›"}</span>
                <span className="text-[13px] font-bold text-content">
                  {word(over.length)}{" "}
                  {over.length === 1 ? "department is" : "departments are"} over{" "}
                  {compareStoreName}
                </span>
                <span className="text-[12.5px] text-content/85">
                  the same rows, the other way round
                </span>
                <span className="ml-auto text-[13.5px] font-bold tabular-nums text-delta_positive_text">
                  {signed(overTotal)}
                </span>
              </button>
              {openOver && <div className="border-t border-brand_navy/15">{rowsOf(over, GREENS)}</div>}
            </div>
          )}
        </div>

        <p className="px-4 pb-4 text-[12px] leading-relaxed text-content/85 max-w-[1010px]">
          Sales and units are the department totals as reported. Volume values
          the unit difference at {compareStoreName}&rsquo;s rate for the week;
          price &amp; mix is the rest, and the two add back to the gap exactly.
          They are named, not separated: a department takes less per unit
          because it priced lower, because a different set of items sold, or
          both &mdash; telling those apart needs the real price and cost
          points, which come off the items. A department that rings by weight
          is counted in pounds. Departments show in full until they account for
          60% of what is under; the rest fold away, ranked the same way.
        </p>
      </div>
    </div>
  );
};

export default DeptReport;
