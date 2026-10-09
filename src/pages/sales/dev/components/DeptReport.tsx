import { useEffect, useMemo, useState } from "react";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import { CTA_SEVERITY_CLASSES, type Severity } from "../../../../utils/severity";
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
  type Gate,
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

/** The left list: marker, name, the money, and the units behind it. */
const LIST_COLS = "10px minmax(0,1fr) 88px 76px";

/** Whole units, signed, with the measure where it is not pieces. */
const units = (v: number, weighed: boolean) =>
  (v >= 0 ? "+" : "−") +
  Math.abs(Math.round(v)).toLocaleString("en-US") +
  (weighed ? " lb" : "");

/** What a department's chain concluded, in the fewest words that are true. */
const FINDING_SAYS: Record<Finding, string> = {
  "nothing-rung": "Nothing rung",
  "fewer-units": "Sold fewer units",
  "lower-price": "Took less per unit",
  "different-mix": "Selling a different mix",
  "a-little-less": "A little less of everything",
  ahead: "Ahead",
  level: "Level",
};

/** Pass, fail, or never reached. A tick, a cross, or an empty ring. */
const Mark = ({ state }: { state: Gate["state"] }) => (
  <span
    className={`w-[17px] h-[17px] flex-shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold leading-none ${
      state === "fail"
        ? "bg-red-500 text-custom-white"
        : state === "pass"
          ? "bg-emerald-500 text-custom-white"
          : "border border-content/40 text-transparent"
    }`}
  >
    {state === "fail" ? "✕" : state === "pass" ? "✓" : "·"}
  </span>
);

/**
 * One gate, as a tile.
 *
 * Run together on one line the three checks read as a sentence about a
 * sentence. Three tiles put the question above the figure and let the
 * failing one carry the tint, so what was checked and what it found are
 * read at a glance rather than parsed.
 */
const Tile = ({ gate }: { gate: Gate }) => {
  const fail = gate.state === "fail";
  const skipped = gate.state === "skipped";
  return (
    <div
      className={`flex items-center gap-2.5 min-w-0 rounded-md px-3 py-1.5 ${
        fail
          ? "bg-delta_negative_bg"
          : skipped
            ? "bg-custom-white border border-brand_navy/15"
            : "bg-delta_positive_bg"
      }`}
    >
      <Mark state={gate.state} />
      <span className="min-w-0">
        <span
          className={`block text-[10px] font-bold uppercase tracking-wide leading-tight ${
            fail
              ? "text-delta_negative_text"
              : skipped
                ? "text-content/85"
                : "text-delta_positive_text"
          }`}
        >
          {gate.label}
        </span>
        <span
          className={`block text-[12.5px] font-semibold tabular-nums truncate leading-tight mt-0.5 ${
            fail
              ? "text-delta_negative_text"
              : skipped
                ? "text-content/85"
                : "text-delta_positive_text"
          }`}
        >
          {gate.value}
        </span>
      </span>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* The list                                                            */
/* ------------------------------------------------------------------ */

/**
 * One department in the left column.
 *
 * Every department is here, not only the ones that carry the shortfall.
 * The cut still decides what the headline counts and what the bar draws,
 * but a department left off the list entirely is one somebody has to take
 * on trust, and the point of the panel beside it is that nothing has to be
 * taken on trust.
 *
 * The row does nothing but change what that panel is showing. Every action
 * lives on the right, so there is no part of this list where clicking the
 * wrong thing does something unexpected.
 */
const ListRow = ({
  row,
  selected,
  onSelect,
}: {
  row: ReportRow;
  selected: boolean;
  onSelect: () => void;
}) => {
  const ahead = row.gap >= 0;
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-3 py-1.5 border-b border-b-brand_navy/15 border-l-2 transition-colors ${
        selected
          ? "bg-row_selected border-row_selected_border"
          : "border-transparent hover:bg-gray-50"
      }`}
    >
      <span
        className="grid items-center gap-2"
        style={{ gridTemplateColumns: LIST_COLS }}
      >
        <span
          className={`block w-2 h-2 rounded-full flex-shrink-0 ${
            ahead ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
        <span className="min-w-0 truncate text-[12px] font-semibold text-content">
          {row.name}
        </span>
        <span
          className={`text-right text-[12px] font-bold tabular-nums whitespace-nowrap ${
            ahead ? "text-delta_positive_text" : "text-delta_negative_text"
          }`}
        >
          {signed(row.gap)}
        </span>
        {/* The units behind the money. A department down four thousand
            dollars on nine hundred fewer units is a different problem from
            one down four thousand on the same units, and the sentence
            underneath can only say which after the fact. */}
        <span
          className={`text-right text-[12px] tabular-nums whitespace-nowrap ${
            row.mineUnits - row.theirsUnits >= 0
              ? "text-delta_positive_text"
              : "text-delta_negative_text"
          }`}
        >
          {row.theirsUnits === 0 && row.mineUnits === 0
            ? "—"
            : units(row.mineUnits - row.theirsUnits, row.weighed)}
        </span>
      </span>
      <span className="block pl-4 text-[11px] text-content/85 truncate">
        {FINDING_SAYS[row.chain.finding]}
      </span>
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* The panel                                                           */
/* ------------------------------------------------------------------ */

/** A headed block, so the panel reads as sections rather than a column of
 *  loose figures. */
/** Red behind, green ahead, black level — level is not a finding. */
const against = (mine: number, theirs: number) =>
  mine < theirs
    ? "text-delta_negative_text"
    : mine > theirs
      ? "text-delta_positive_text"
      : "text-content";

const Block = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  /* A rule BETWEEN blocks, which the first one is not under — against the
     strip above it, it read as a stray line with a gap over it. */
  <div className="border-t border-brand_navy/15 pt-2.5 mt-3 first:border-t-0 first:pt-0 first:mt-0">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content/85 mb-1.5">
      {title}
    </div>
    {children}
  </div>
);

/**
 * The selected department, in full.
 *
 * What the single column could never fit: the sentence, the three gates
 * with a column each, the exact split behind the sentence, and how the
 * same subtraction ran in the two earlier weeks.
 */
const Detail = ({
  row,
  onInvestigate,
}: {
  row: ReportRow;
  onInvestigate: (row: ReportRow) => void;
}) => {
  const ahead = row.gap >= 0;
  /* Closed. It lays over the panel rather than pushing it down, so an open
     strip on arrival would cover the first thing the panel has to show. */
  const [open, setOpen] = useState(false);
  const unitWord = row.weighed ? "lb" : "units";
  const oneWord = row.weighed ? "lb" : "unit";

  /* The identity behind the sentence: the gap is exactly what the missing
     units would have taken at THEIR rate, plus what our own units lost at
     our rate. One bar, because they are two halves of one figure. */
  const split = row.split;
  const splitSize = split ? Math.abs(split.volume) + Math.abs(split.rate) : 0;

  const weeks = [
    { label: "Last year", v: row.lyGap },
    { label: "Last week", v: row.lwGap },
    { label: "This week", v: row.gap },
  ];

  /**
   * Critical where a gate actually failed, watch where none did and it is
   * merely down, healthy where it is ahead.
   *
   * "A little less of everything" passed all three checks — calling that
   * critical beside a department that rang nothing would make the strongest
   * colour on the page mean "behind by any amount", which is what the gap
   * figure beside it already says.
   */
  const sev: Severity = ahead
    ? "healthy"
    : row.chain.finding === "a-little-less" || row.chain.finding === "level"
      ? "watch"
      : "critical";
  const cta = CTA_SEVERITY_CLASSES[sev];
  const Mark_ =
    sev === "critical"
      ? ExclamationTriangleIcon
      : sev === "watch"
        ? ExclamationCircleIcon
        : CheckCircleIcon;

  return (
    <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
      {/* The same strip the single-store tab opens a department with: the
          name, what it is worth, and the finding folded behind it. */}
      <div className={`relative flex-shrink-0 border-b ${cta.border}`}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`w-full flex items-center gap-2 px-4 py-2 text-left transition-colors ${cta.bg} ${cta.hoverBg}`}
        >
          <Mark_ className={`w-4 h-4 flex-shrink-0 ${cta.text}`} />
          <span className={`min-w-0 truncate text-[14px] font-semibold ${cta.text}`}>
            {row.name}
          </span>
          <span
            className={`ml-auto flex-shrink-0 text-[14px] font-semibold tabular-nums ${cta.text}`}
          >
            {signed(row.gap)}
          </span>
          {open ? (
            <ChevronUpIcon className={`w-3.5 h-3.5 flex-shrink-0 ${cta.text}`} />
          ) : (
            <ChevronDownIcon className={`w-3.5 h-3.5 flex-shrink-0 ${cta.text}`} />
          )}
        </button>

        {/* Over the panel, not above it. Pushing the blocks down meant
            every open and close moved the whole column, and the reader lost
            their place in the thing the strip is describing. */}
        {open && (
          <p
            className={`absolute top-full left-0 right-0 z-20 px-4 py-2.5 border-b shadow-lg text-[12.5px] leading-snug ${cta.bg} ${cta.border} ${cta.text}`}
          >
            <span className="font-bold">{row.chain.says.lead}</span>
            {row.chain.says.tail}
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto thin-scrollbar px-4 py-3 flex flex-col">

      {/* Three checks in order, and the first one to fail is the finding.
          A green tick says only that this check was not the problem — a
          department can pass "rung" by ringing anything at all and still be
          five thousand down, which is exactly what the row's own red is
          about. The heading is here so the two colours are plainly
          answering different questions. */}
      <Block title="Where it breaks down">
        <div className="grid grid-cols-3 gap-2.5">
          {row.chain.gates.map((g) => (
            <Tile key={g.name} gate={g} />
          ))}
        </div>
      </Block>

      {split && splitSize > 0 && (
        <Block title="What the gap is made of">
          <span className="flex h-[8.4px] rounded-sm overflow-hidden bg-bkg">
            <span
              className={`block ${ahead ? "bg-emerald-500" : "bg-red-500"}`}
              style={{ width: `${(Math.abs(split.volume) / splitSize) * 100}%` }}
            />
            <span
              className={`block opacity-50 ${ahead ? "bg-emerald-500" : "bg-red-500"}`}
              style={{ width: `${(Math.abs(split.rate) / splitSize) * 100}%` }}
            />
          </span>
          <div className="flex justify-between gap-4 text-[12.5px] text-content/85 mt-1">
            <span>
              {row.weighed ? "Weight" : "Units"}{" "}
              <span className="font-semibold tabular-nums text-content">
                {signed(split.volume)}
              </span>
            </span>
            <span>
              Take per {oneWord}{" "}
              <span className="font-semibold tabular-nums text-content">
                {signed(split.rate)}
              </span>
            </span>
          </div>
        </Block>
      )}

      <Block title="The gap, week by week">
        <div className="flex gap-4 flex-wrap text-[12.5px] text-content/85">
          {weeks.map((w) => (
            <span key={w.label}>
              {w.label}{" "}
              <span
                className={`font-bold tabular-nums ${
                  w.v >= 0 ? "text-delta_positive_text" : "text-delta_negative_text"
                }`}
              >
                {signed(w.v)}
              </span>
            </span>
          ))}
        </div>
      </Block>

      <Block title="What each store rang">
        <div className="flex gap-4 flex-wrap text-[12.5px] text-content/85">
          <span>
            Sales{" "}
            {/* This store's own figure carries the direction: level is not a
                finding, so it stays black rather than claiming one. */}
            <span className={`font-semibold tabular-nums ${against(row.mine, row.theirs)}`}>
              {money(row.mine)}
            </span>{" "}
            vs{" "}
            <span className="font-semibold tabular-nums text-content">
              {money(row.theirs)}
            </span>
          </span>
          <span>
            {row.weighed ? "Weight" : "Units"}{" "}
            <span
              className={`font-semibold tabular-nums ${against(row.mineUnits, row.theirsUnits)}`}
            >
              {Math.round(row.mineUnits).toLocaleString("en-US")}
            </span>{" "}
            vs{" "}
            <span className="font-semibold tabular-nums text-content">
              {Math.round(row.theirsUnits).toLocaleString("en-US")}
            </span>{" "}
            {unitWord}
          </span>
        </div>
      </Block>

      {/* Pinned, so it is in the same place whatever the panel had to say. */}
      <button
        onClick={() => onInvestigate(row)}
        className="mt-auto self-start px-3.5 py-1.5 rounded-md bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12px] font-bold transition-colors whitespace-nowrap"
      >
        {row.chain.cta} &rarr;
      </button>
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
  /** The department the panel is showing, by id. */
  const [picked, setPicked] = useState<number | null>(null);

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

  const { shown, folded, underTotal, overTotal, over, netGap, shownShare } =
    report;

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
  const selected = rows.find((r) => r.id === picked) ?? rows[0] ?? null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Back, the headline and the counterpart on one line. They were two
          rows, the first of which was a 28px band holding four words and a
          question mark — most of it whitespace nobody was reading. */}
      <div className="flex-shrink-0 px-4 pt-2.5 pb-3 border-b-2 border-brand_navy/20">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            title="Back to all stores"
            className="flex-shrink-0 w-6 h-6 rounded-md border border-brand_navy/25 text-[13px] font-bold text-content hover:bg-bkg transition-colors"
          >
            {"‹"}
          </button>

          <p className="min-w-0 flex-1 text-[16.5px] font-bold leading-snug text-content truncate">
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

          <span className="flex-shrink-0 text-[11.5px] text-content/85 truncate max-w-[220px]">
            vs {compareStoreName}
          </span>
          <PageInfoButton
            page="sales"
            section="gap-split"
            variant="light"
            title="How a department is checked"
            className="flex-shrink-0 -my-1"
          />
        </div>

        {underTotal > 0 && (
          <>
            {/* Two parts, each saying what it is. Fifteen slivers down an
                opacity ladder showed the same split and left the reader to
                work out where the headline's three ended. */}
            <span className="flex h-6 rounded-md overflow-hidden bg-bkg mt-2.5 text-[11.5px] font-semibold">
              <span
                className="flex items-center px-2.5 bg-red-500 text-custom-white whitespace-nowrap overflow-hidden"
                style={{ width: `${Math.max(8, shownShare * 100)}%` }}
              >
                <span className="truncate">
                  {shown.length}{" "}
                  {shown.length === 1 ? "department" : "departments"} &middot;{" "}
                  {Math.round(shownShare * 100)}%
                </span>
              </span>
              {folded.length > 0 && (
                <span className="flex items-center px-2.5 text-content/85 whitespace-nowrap overflow-hidden">
                  <span className="truncate">
                    {folded.length} others &middot;{" "}
                    {Math.round((1 - shownShare) * 100)}%
                  </span>
                </span>
              )}
            </span>

            <div className="flex items-baseline gap-5 flex-wrap mt-1.5 text-[11.5px] text-content/85">
              <span>
                <span className="font-bold tabular-nums text-delta_negative_text">
                  {signed(-underTotal)}
                </span>{" "}
                under
              </span>
              {over.length > 0 && (
                <span>
                  <span className="font-bold tabular-nums text-delta_positive_text">
                    {signed(overTotal)}
                  </span>{" "}
                  ahead
                </span>
              )}
              <span>
                <span
                  className={`font-bold tabular-nums ${
                    netGap < 0
                      ? "text-delta_negative_text"
                      : "text-delta_positive_text"
                  }`}
                >
                  {signed(netGap)}
                </span>{" "}
                net
              </span>
            </div>
          </>
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
            className="flex-shrink-0 grid items-center gap-2 px-3 py-1.5 border-b border-brand_navy/15 text-[10px] font-bold uppercase tracking-wide text-content/85"
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
                key={r.id}
                row={r}
                selected={selected?.id === r.id}
                onSelect={() => setPicked(r.id)}
              />
            ))}
          </div>
        </div>

        {selected ? (
          <Detail row={selected} onInvestigate={investigate} />
        ) : (
          <div className="flex-1 flex items-center justify-center px-4 text-center text-[12.5px] text-content/85">
            No departments to compare.
          </div>
        )}
      </div>
    </div>
  );
};

export default DeptReport;
