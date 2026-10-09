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
  NOT_CHECKED,
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

/**
 * The store number as the page spells it elsewhere.
 *
 * `storeNumber` comes off the row unpadded — "3" where every label on the
 * screen says "003". The name already carries the padded form, so it is
 * read off there rather than padded to a width nobody has stated.
 */
const numberOf = (name: string, fallback: string) => {
  const lead = name.trim().split(/[\s-]/)[0];
  return /^\d+$/.test(lead) ? lead : fallback;
};

/** What a set of departments that failed the same gate is called. */
const GROUP_SAYS: Record<Finding, string> = {
  "nothing-rung": "Nothing rung",
  "fewer-units": "Sold fewer units",
  "lower-price": "Took less per unit",
  "different-mix": "Selling a different mix",
  "a-little-less": "A little less of everything",
  level: "Level",
};

/**
 * A capped name column, not a share of the row.
 *
 * At `1fr` the name sat alone in two hundred pixels of nothing, the figure
 * floated in the middle, and the sentence began a third of the way across —
 * three islands with two voids between them. Capped, the name, the money
 * and the sentence read as one run, and what is left over falls after the
 * sentence, where text ending is what a reader expects.
 */
const COLS = "10px minmax(0,216px) 104px minmax(0,1fr) 148px";

/** Pass, fail, or never reached. A tick, a cross, or an empty ring. */
const Mark = ({ state }: { state: Gate["state"] }) => (
  <span
    className={`w-[17px] h-[17px] flex-shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold leading-none ${
      state === "fail"
        ? "bg-delta_negative_text text-custom-white"
        : state === "pass"
          ? "bg-delta_positive_bg text-delta_positive_text"
          : "border border-content/40 text-transparent"
    }`}
  >
    {state === "fail" ? "✕" : state === "pass" ? "✓" : "·"}
  </span>
);

/**
 * One gate, as a tile.
 *
 * The trail these replace ran the three checks together on one line, which
 * read as a sentence about a sentence. Three tiles put the question above
 * the figure and let the failing one carry the tint, so what was checked
 * and what it found are read at a glance rather than parsed.
 */
const Tile = ({ gate }: { gate: Gate }) => {
  const fail = gate.state === "fail";
  const skipped = gate.state === "skipped";
  return (
    <div
      className={`flex items-center gap-2.5 min-w-0 rounded-md px-3 py-1.5 ${
        fail ? "bg-delta_negative_bg" : "bg-custom-white border border-brand_navy/15"
      }`}
    >
      <Mark state={gate.state} />
      <span className="min-w-0">
        <span
          className={`block text-[10px] font-bold uppercase tracking-wide leading-tight ${
            fail ? "text-delta_negative_text" : "text-content/85"
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
                : "text-content"
          }`}
        >
          {gate.value}
        </span>
      </span>
    </div>
  );
};

/** The square that opens every row: red where it is behind, green ahead.
 *  `top` for a row of two lines, where centring would float it. */
const Pip = ({ ahead = false, top = false }: { ahead?: boolean; top?: boolean }) => (
  <span
    className={`block w-2.5 h-2.5 rounded-sm ${top ? "mt-[5px]" : ""} ${
      ahead ? "bg-delta_positive_text" : "bg-delta_negative_text"
    }`}
  />
);

/** Show 9 / Hide, the same control on every collapsible row. */
const Expander = ({
  open,
  count,
  onClick,
}: {
  open: boolean;
  count: number;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="justify-self-end flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-brand_navy/25 hover:bg-bkg transition-colors text-[12px] font-bold text-content whitespace-nowrap"
  >
    {open ? "Hide" : `Show ${count}`}
    <span className="text-[10px] leading-none">{open ? "▲" : "▼"}</span>
  </button>
);

/* ------------------------------------------------------------------ *//* ------------------------------------------------------------------ */
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
  <div className="px-4 py-2.5 border-b-2 border-brand_navy/20">
    {/* Centred, not top-aligned: the button is half again the height of the
        text beside it, and aligning to the top left a band of dead space
        under the sentence that read as a gap between two rows. */}
    <div
      className="grid gap-4 items-center"
      style={{ gridTemplateColumns: COLS }}
    >
      <Pip />

      <span className="min-w-0 truncate text-[13px] font-bold text-content leading-snug">
        {row.name}
      </span>

      <span className="text-right text-[13px] font-bold tabular-nums text-delta_negative_text leading-snug">
        {signed(row.gap)}
      </span>

      <span className="block text-[12.5px] leading-snug text-content">
        <span className="font-bold text-delta_negative_text">
          {row.chain.says.lead}
        </span>
        {row.chain.says.tail}
      </span>

      {/* Named by the gate that failed. "Check the mix" rather than "Check
          prices" where the take per unit is half the other store's: that is
          not a department that priced low, and comparing price tags would
          send somebody to the one place the answer is not. */}
      {lead ? (
        <button
          onClick={() => onInvestigate(row)}
          className="justify-self-end px-3.5 py-1.5 rounded-md bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12px] font-bold transition-colors whitespace-nowrap"
        >
          {row.chain.cta} &rarr;
        </button>
      ) : (
        <button
          onClick={() => onInvestigate(row)}
          className="justify-self-end text-[12px] font-bold text-brand_navy_hover hover:underline whitespace-nowrap"
        >
          Investigate &rarr;
        </button>
      )}

      {/* The gates in order, under the sentence they hold up. Somebody who
          does not care takes the sentence; somebody who does can see what
          it rests on without opening anything. */}
      <span
        className="grid grid-cols-3 gap-2.5 mt-1.5"
        style={{ gridColumn: "2 / 5" }}
      >
        {row.chain.gates.map((g) => (
          <Tile key={g.name} gate={g} />
        ))}
      </span>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Several departments, one finding                                    */
/* ------------------------------------------------------------------ */

/**
 * What a folded row shows once it is opened.
 *
 * The group header names the finding they share, so a sub-row repeating it
 * would be the padding this report exists instead of — except where they
 * are ahead, which the header cannot say per department. There the units
 * carry it: a department $3,000 up because it sold half again as much is a
 * different store from one that took more for the same volume.
 */
const subSays = (row: ReportRow, ahead: boolean) => {
  if (!ahead) return row.chain.says.lead;
  const sold = row.chain.gates[1];
  return sold.value === NOT_CHECKED ? "Ahead" : `Sold ${sold.value}`;
};

interface GroupProps {
  rows: ReportRow[];
  /** Positive magnitude, whichever way it runs. */
  total: number;
  says: string;
  ahead?: boolean;
  open: boolean;
  onToggle: () => void;
  onInvestigate: (row: ReportRow) => void;
}

/**
 * Departments that failed the same gate, as one line that opens.
 *
 * Four that rang nothing are one problem with one owner, and four rows
 * saying it four times is noise. But the fold used to end in a button that
 * dropped straight into the FIRST of them, which is a department nobody
 * chose — so it opens in place instead, and each one keeps its own way in.
 */
const GroupBlock = ({
  rows, total, says, ahead = false, open, onToggle, onInvestigate,
}: GroupProps) => {
  const tone = ahead ? "text-delta_positive_text" : "text-delta_negative_text";
  return (
    <div className="border-b-2 border-brand_navy/20">
      <div
        className="grid gap-4 items-start px-4 py-2.5"
        style={{ gridTemplateColumns: COLS }}
      >
        <Pip ahead={ahead} top />

        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="flex-shrink-0 min-w-[22px] text-center px-1.5 py-0.5 rounded bg-bkg text-[11.5px] font-bold tabular-nums text-content">
              {rows.length}
            </span>
            <span className="text-[13px] font-bold text-content leading-snug">
              departments
            </span>
          </span>
          {/* A few names and a count. Spelling out twelve wrapped to six
              lines and left this row three times the height of the ones
              above it, and nobody reads the twelfth name anyway. */}
          <span
            className="block text-[11.5px] text-content/85 leading-snug mt-0.5 truncate"
            title={rows.map((r) => r.name).join(", ")}
          >
            {rows.slice(0, 3).map((r) => r.name).join(", ")}
            {rows.length > 3 && ` and ${rows.length - 3} more`}
          </span>
        </span>

        <span className={`text-right text-[13px] font-bold tabular-nums leading-snug ${tone}`}>
          {signed(ahead ? total : -total)}
        </span>

        <span className={`text-[12.5px] font-bold leading-snug ${tone}`}>
          {says}
        </span>

        <Expander open={open} count={rows.length} onClick={onToggle} />
      </div>

      {/* Hung off the row above, not laid beside it.

          Flat rows on a tinted band read as a second table spliced in at
          the same weight as the first. A rail running down under the pip
          says whose contents these are, and the columns still line up with
          the rows above because the rail lives inside the pip's own cell. */}
      {open && (
        <div className="bg-bkg">
          {rows.map((r, i) => (
            <div
              key={r.id}
              className={`grid gap-4 items-center px-4 py-1.5 ${
                i > 0 ? "border-t border-brand_navy/10" : ""
              }`}
              style={{ gridTemplateColumns: COLS }}
            >
              <span
                className={`block w-[2px] self-stretch mx-auto ${
                  ahead ? "bg-delta_positive_text/30" : "bg-delta_negative_text/30"
                }`}
              />
              <span className="min-w-0 truncate pl-3 text-[12.5px] font-semibold text-content">
                {r.name}
              </span>
              <span className={`text-right text-[12.5px] font-semibold tabular-nums ${tone}`}>
                {signed(r.gap)}
              </span>
              <span className="text-[12.5px] text-content/85 truncate">
                {subSays(r, ahead)}
              </span>
              <button
                onClick={() => onInvestigate(r)}
                className="justify-self-end text-[12px] font-bold text-brand_navy_hover hover:underline whitespace-nowrap"
              >
                Investigate &rarr;
              </button>
            </div>
          ))}
        </div>
      )}
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
  const [showAll, setShowAll] = useState(false);
  /** Which folds are open, by finding — plus "ahead" for the green one. */
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

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

  /**
   * The shortfall as one bar, a segment a printed row, in the order the
   * rows come.
   *
   * It is a legend as much as a figure: the first block IS the first line,
   * so "two departments hold most of it" is seen before it is read. What
   * the store is ahead on stays off the bar — netting them would hide both
   * — and is named beside it instead.
   */
  const segments = [
    ...shown.map((r) => ({ key: `d${r.id}`, size: -r.gap })),
    ...listed.map((r) => ({ key: `l${r.id}`, size: -r.gap })),
    ...groups.map((g) => ({ key: g.finding, size: g.total })),
    ...(rest.length ? [{ key: "rest", size: restTotal }] : []),
  ].filter((x) => x.size > 0);
  const underCount = shown.length + folded.length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
        <div className="px-4 pt-2.5 pb-3 border-b-2 border-brand_navy/20">
          <div className="flex items-center gap-2 flex-wrap text-[11.5px] text-content/85">
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
          <p className="text-[16.5px] font-bold leading-snug text-content mt-1.5">
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

          {underTotal > 0 && (
            <>
              <span className="flex h-2.5 rounded-sm overflow-hidden bg-bkg mt-2.5">
                {segments.map((seg, i) => (
                  <span
                    key={seg.key}
                    className="block bg-delta_negative_text"
                    style={{
                      width: `${(seg.size / underTotal) * 100}%`,
                      opacity: Math.max(0.3, 1 - i * 0.17),
                    }}
                  />
                ))}
              </span>

              {/* Both totals, where the bar can be read against them. They
                  used to sit in a strip under the last row, which is the
                  one place somebody reading the top of a report does not
                  look. */}
              <div className="flex items-baseline gap-4 flex-wrap mt-1.5 text-[11.5px] text-content/85">
                <span>
                  <span className="font-bold tabular-nums text-delta_negative_text">
                    {signed(-underTotal)}
                  </span>{" "}
                  under, across {underCount}{" "}
                  {underCount === 1 ? "department" : "departments"}
                </span>
                {over.length > 0 && (
                  <span className="ml-auto">
                    offset by{" "}
                    <span className="font-bold tabular-nums text-delta_positive_text">
                      {signed(overTotal)}
                    </span>{" "}
                    where {numberOf(openStoreName, openStoreNumber)} is ahead
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {shown.map((r) => (
          <Row key={r.id} row={r} lead onInvestigate={investigate} />
        ))}
        {listed.map((r) => (
          <Row key={r.id} row={r} lead={false} onInvestigate={investigate} />
        ))}

        {groups.map((g) => (
          <GroupBlock
            key={g.finding}
            rows={g.rows}
            total={g.total}
            says={GROUP_SAYS[g.finding]}
            open={!!open[g.finding]}
            onToggle={() => toggle(g.finding)}
            onInvestigate={investigate}
          />
        ))}

        {/* Where the store is ahead, on the same terms. It was a count in
            the footer, which made a department $3,000 up unreachable — and
            a store that is ahead somewhere usually knows why, which is the
            one thing in here that can be copied. */}
        {over.length > 0 && (
          <GroupBlock
            rows={over}
            total={overTotal}
            says={`Ahead of ${numberOf(compareStoreName, compareStoreNumber)}`}
            ahead
            open={!!open.ahead}
            onToggle={() => toggle("ahead")}
            onInvestigate={investigate}
          />
        )}

        {loose.length > LOOSE_CAP && (
          <div className="flex items-center gap-2 px-4 py-2.5">
            <span className="text-[12px] text-content/85">
              {rest.length > 0 ? (
                <>
                  {rest.length} more under{" "}
                  <span className="font-semibold tabular-nums text-delta_negative_text">
                    {signed(-restTotal)}
                  </span>
                </>
              ) : (
                <>All departments shown</>
              )}
            </span>
            <button
              onClick={() => setShowAll((v) => !v)}
              className="ml-auto text-[12px] font-bold text-brand_navy_hover hover:underline flex-shrink-0"
            >
              {showAll ? "Show less" : "Show all"} &rsaquo;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeptReport;
