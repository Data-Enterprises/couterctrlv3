import { useEffect, useMemo, useState } from "react";
import { getSubs } from "../../../../api/sales";
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { setInvestigation } from "../../../../features/dev/devSalesLedgerSlice";
import { rememberCounterpart } from "../../../../features/dev/devSalesCacheSlice";
import { useSalesState } from "../hooks/useSalesState";
import { scopeToStoreNumber } from "../shared/ledgerUtils";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import SortHeader from "../../../../components-dev/SortHeader";
import { useTriStateSort } from "../../../../utils/useTriStateSort";
import type { SubSale } from "../../../../interfaces";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

/**
 * Two stores' sub departments, side by side.
 *
 * Opened by picking a store in the Comparison list: that store's departments
 * against the open one's, for the same week. The open store's rows are already
 * in the slice — the detail panel fetched them to draw its own Sub dept tab —
 * so only the counterpart is asked for.
 *
 * Nothing is graded here: two stores are not a baseline for each other, so a
 * severity colour would be claiming something the data cannot support. What
 * the colour carries is direction, and nothing more.
 *
 * The right rail is where the investigation warms up. By the time somebody
 * clicks through to the items they should already know whether the gap is
 * widening, whether to expect a price problem or a volume one, and whether
 * this department is even where the damage is.
 */

/** One department's week at one store. Money and units are both kept whatever
 *  the page's metric is: the rail compares them against each other, and that
 *  question has no answer if only one of them was summed. */
interface Totals {
  name: string;
  money: number;
  units: number;
}

/** `total_sales - total_tax`, the basis the whole page is on — see the note in
 *  PopupSubDeptList for why it is not `net_sales`. */
const totalsBySubDept = (rows: SubSale[]) =>
  rows.reduce<Record<number, Totals>>((acc, s) => {
    if (!acc[s.sub_department])
      acc[s.sub_department] = {
        name: s.sub_department_description,
        money: 0,
        units: 0,
      };
    acc[s.sub_department].money += s.total_sales - s.total_tax;
    acc[s.sub_department].units += s.qty;
    return acc;
  }, {});

/** One department, both stores, across the three periods. */
interface Row {
  id: number;
  name: string;
  /** The open store's week, in the page's metric. */
  a: number;
  /** The counterpart's. */
  b: number;
  /** Always money and always units, whatever the metric is set to. */
  aMoney: number;
  bMoney: number;
  aUnits: number;
  bUnits: number;
  tyDiff: number;
  lwDiff: number;
  lyDiff: number;
}

/** The three sortable headings. `bars` sorts by what the bar draws. */
type Column = "name" | "bars" | "gap";

/** A real minus, not a hyphen: these sit in tabular figures beside a plus. */
const MINUS = "−";

/**
 * The open store's own colour is its verdict — ahead or behind in this
 * department. The counterpart keeps one colour throughout: it is what is
 * being measured against, and colouring it too would be grading a store
 * nobody opened the page to ask about.
 *
 * The same pair the detail panel's own title bar is tinted with, not the
 * `delta_*_text` tokens. Those are tuned to be READ, as small dark type on a
 * light background, and a solid 18px block of them goes muddy — a bar is not
 * text and does not want text's contrast.
 */
const AHEAD = "bg-emerald-600";
const BEHIND = "bg-red-600";
const COMPARE = "bg-store_compare/85";

const ordinal = (n: number) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
};

const pct1 = (v: number) => `${Math.abs(v).toFixed(1)}%`;

interface Props {
  openStoreName: string;
  /** Needed to open the investigation, which is about one named store's
   *  supply chain and so cannot work from the name alone. */
  openStoreId: number;
  openStoreNumber: string;
  compareStoreId: number;
  /** Co-located stores share a storeid, so the rows have to be narrowed by
   *  number as well — the same scoping the detail panel does for its own. */
  compareStoreNumber: string;
  compareStoreName: string;
  twStart: string;
  twEnd: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
  gradingMetric: GradingMetric;
  onBack: () => void;
}

const SubDeptSideBySide = ({
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
  gradingMetric,
  onBack,
}: Props) => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  // The open store's three weeks are already here — the panel fetched them
  // for its own Sub dept tab, which is why only the counterpart is asked for.
  const { subSales, subSalesWk2, subSalesWk3 } = useSalesState();

  /**
   * The counterpart's three weeks, held across the trip into the items.
   *
   * There is no local copy: the cache IS the state. Going Back from an
   * investigation unmounts this component, and keeping the rows here meant
   * the same three requests every time somebody came back to pick another
   * department. The entry is dropped when a new search runs.
   */
  const cacheKey = [
    compareStoreId,
    compareStoreNumber,
    twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd,
  ].join("|");
  const theirs = useAppSelector(
    (state) => state.dev.salesCache.counterpart[cacheKey],
  );
  const [failed, setFailed] = useState(false);

  const isQty = gradingMetric === "qty";
  const fmt = (v: number) =>
    isQty ? formatBigNumber(v, 0) : formatCurrency2(v);
  /** Money, whatever the page is counting. The rail's price sentence is
   *  about dollars either way. */
  const cash = (v: number) => formatCurrency2(v);

  useEffect(() => {
    if (theirs) return;
    let live = true;
    setFailed(false);
    const ask = (from: string, to: string) =>
      getSubs(context.url, context.token, from, to, 0, compareStoreId, 1);

    Promise.all([
      ask(twStart, twEnd),
      ask(lwStart, lwEnd),
      ask(lyStart, lyEnd),
    ])
      .then(([tw, lw, ly]) => {
        if (!live) return;
        // Same unpacking the detail panel does: the house convention is a 200
        // carrying `error`, so `error === 0` is the success test. Scoped by
        // store NUMBER, because co-located stores share an id.
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
    theirs,
    dispatch,
  ]);

  const rows = useMemo(() => {
    if (!theirs) return [];
    // Already the open store's own weeks — the panel scoped them on the way in.
    const mineTw = totalsBySubDept(subSales);
    const mineLw = totalsBySubDept(subSalesWk2);
    const mineLy = totalsBySubDept(subSalesWk3);
    const theirTw = totalsBySubDept(theirs.tw);
    const theirLw = totalsBySubDept(theirs.lw);
    const theirLy = totalsBySubDept(theirs.ly);

    // Every department either store has in any week — one of them not
    // carrying a department is a finding, not a row to drop.
    const ids = [
      ...new Set(
        [mineTw, mineLw, mineLy, theirTw, theirLw, theirLy]
          .flatMap((m) => Object.keys(m))
          .map(Number),
      ),
    ];

    const money = (m: Record<number, Totals>, id: number) => m[id]?.money ?? 0;
    const units = (m: Record<number, Totals>, id: number) => m[id]?.units ?? 0;
    const at = (m: Record<number, Totals>, id: number) =>
      isQty ? units(m, id) : money(m, id);

    return ids
      .map((id) => {
        const a = at(mineTw, id);
        const b = at(theirTw, id);
        return {
          id,
          name:
            mineTw[id]?.name ??
            theirTw[id]?.name ??
            mineLy[id]?.name ??
            theirLy[id]?.name ??
            `Sub dept ${id}`,
          a,
          b,
          aMoney: money(mineTw, id),
          bMoney: money(theirTw, id),
          aUnits: units(mineTw, id),
          bUnits: units(theirTw, id),
          tyDiff: a - b,
          lwDiff: at(mineLw, id) - at(theirLw, id),
          lyDiff: at(mineLy, id) - at(theirLy, id),
        };
      })
      // Biggest department first by default, which is the order somebody
      // reads a department list in. A column sort is a lens over that, and
      // the third click returns to it.
      .sort((x, y) => y.a - x.a);
  }, [theirs, subSales, subSalesWk2, subSalesWk3, isQty]);

  const [picked, setPicked] = useState<number | null>(null);

  /** The house tri-state: unsorted → desc → asc → back to the list's own
   *  order, which here is biggest department first. */
  const { sort, handleSort, applySort } = useTriStateSort<Column>();

  const mineTotal = rows.reduce((t, r) => t + r.a, 0);
  const theirsTotal = rows.reduce((t, r) => t + r.b, 0);
  const shareMine = (r: Row) => (mineTotal > 0 ? (r.a / mineTotal) * 100 : 0);
  const shareTheirs = (r: Row) =>
    theirsTotal > 0 ? (r.b / theirsTotal) * 100 : 0;

  /**
   * One bar per row, split between the two stores.
   *
   * Its WIDTH is the pair's combined week against the biggest department, so
   * a big department still looks big; the SPLIT inside it is each store's
   * share of that pair. Two bars on one scale asked the reader to compare two
   * lengths, which is the hardest comparison there is to make by eye — a
   * split point is read in one go.
   *
   * Clamped at zero for the geometry only. A department can finish a week
   * negative on refunds, and a negative width is not a thing; the figures
   * beside the bar stay as they are.
   */
  const pairOf = (r: Row) => Math.max(0, r.a) + Math.max(0, r.b);
  const biggestPair = Math.max(1, ...rows.map(pairOf));
  const barWidth = (r: Row) => `${(pairOf(r) / biggestPair) * 100}%`;
  const mineShare = (r: Row) =>
    pairOf(r) > 0 ? `${(Math.max(0, r.a) / pairOf(r)) * 100}%` : "0%";
  const theirsShare = (r: Row) =>
    pairOf(r) > 0 ? `${(Math.max(0, r.b) / pairOf(r)) * 100}%` : "0%";

  const gapText = (r: Row) =>
    (r.tyDiff >= 0 ? "+" : MINUS) + fmt(Math.abs(r.tyDiff));

  /**
   * Sorted, or handed back in the default order.
   *
   * The name column cannot go through `applySort`, which compares numbers —
   * a department list sorted alphabetically is a real way to find one, so it
   * gets its own comparator rather than being left unsortable.
   *
   * The bars column sorts by the pair's combined week, which is what the
   * bar's length now is. Sorting a bar by a figure it is not showing is the
   * kind of thing that makes a column feel broken.
   */
  const ordered = useMemo(() => {
    if (sort?.col === "name") {
      const dir = sort.dir === "asc" ? 1 : -1;
      return [...rows].sort((a, b) => a.name.localeCompare(b.name) * dir);
    }
    return applySort(rows, (r, c) => (c === "bars" ? pairOf(r) : r.tyDiff));
    // `applySort` and `pairOf` are re-made every render; the state they close
    // over — the sort and the rows — is what actually moves.
  }, [rows, sort]);

  const focus = ordered.find((r) => r.id === picked) ?? ordered[0] ?? null;

  /**
   * Hand the page over to the investigation.
   *
   * Both stores travel with it: the question there is why THIS store is
   * behind THAT one in this department, and neither half survives being
   * re-derived from a name.
   */
  const openInvestigation = (subDept: number, subDeptName: string) =>
    dispatch(
      setInvestigation({
        storeid: openStoreId,
        storeNumber: openStoreNumber,
        storeName: openStoreName,
        compareStoreid: compareStoreId,
        compareStoreNumber,
        compareStoreName,
        subDept,
        subDeptName,
      }),
    );

  const COLS = "minmax(110px,1fr) minmax(90px,1.9fr) 104px";

  const SORT_HEAD =
    "text-[11px] font-semibold uppercase tracking-wide text-content/85 hover:text-content";

  /* ---------------------------------------------------------------- */
  /* The rail                                                          */
  /* ---------------------------------------------------------------- */

  /** Where this department ranks inside each store's own week. Context for
   *  the figures above it: $28K means one thing in the biggest department
   *  and another in the eleventh. */
  const rankIn = (r: Row, side: "a" | "b") =>
    [...rows].sort((x, y) => y[side] - x[side]).findIndex((x) => x.id === r.id) +
    1;

  /**
   * Last week against this week, said rather than left to be subtracted.
   *
   * Only the LW → TY move, because that is what a week's figures can support.
   * The bars above show where last year sat; calling three points a trend
   * would be reading more into them than they hold.
   */
  const trendOf = (r: Row) => {
    const widened = Math.abs(r.tyDiff) > Math.abs(r.lwDiff);
    if (r.tyDiff >= 0 && r.lwDiff < 0)
      return "Behind last week and ahead this week — the turn is recent, so it is not yet a trend.";
    if (r.tyDiff < 0 && r.lwDiff >= 0)
      return "Ahead last week and behind this week.";
    if (r.tyDiff < 0)
      return widened
        ? "Behind last week and further behind this week."
        : "Behind last week and less so this week.";
    return widened
      ? "Ahead last week and further ahead this week."
      : "Ahead last week and less so this week.";
  };

  /**
   * Units against money — the cause the items grid is about to be asked
   * about, read before it has loaded.
   *
   * Units and money moving apart is a price or a mix difference; moving
   * together is a volume one. Saying which to expect here is the difference
   * between opening the grid to look and opening it to check.
   */
  const priceRead = (r: Row) => {
    if (r.aUnits <= 0 || r.bUnits <= 0 || r.bMoney <= 0) return null;
    const theirsPer = r.bMoney / r.bUnits;
    if (theirsPer <= 0) return null;
    const pricePct = (r.aMoney / r.aUnits / theirsPer - 1) * 100;
    return {
      unitsPct: (r.aUnits / r.bUnits - 1) * 100,
      moneyPct: (r.aMoney / r.bMoney - 1) * 100,
      pricePct,
      // A realised price within a few points is the same price; whatever is
      // left over is volume.
      price: Math.abs(pricePct) > 5,
    };
  };

  const storeGap = rows.reduce((t, r) => t + r.tyDiff, 0);
  const worst = [...rows]
    .filter((r) => r.tyDiff < 0)
    .sort((a, b) => a.tyDiff - b.tyDiff)
    .slice(0, 2);

  const statRow = (key: string, v: number) => (
    <div className="flex items-baseline gap-2 px-3 py-2 bg-custom-white">
      <span className="text-[12px] text-content/85 w-[52px] flex-shrink-0">
        {key}
      </span>
      <span
        className={`ml-auto tabular-nums text-[13.5px] font-bold ${
          v >= 0 ? "text-delta_positive_text" : "text-delta_negative_text"
        }`}
      >
        {v >= 0 ? "+" : MINUS}
        {fmt(Math.abs(v))}
      </span>
    </div>
  );

  /** The same department's gap in each period, off a shared baseline, so
   *  widening and closing are a shape rather than three numbers to subtract
   *  in your head. */
  const trendBars = (r: Row) => {
    const periods = [
      { label: "Last year", v: r.lyDiff },
      { label: "Last week", v: r.lwDiff },
      { label: "This week", v: r.tyDiff },
    ];
    const biggest = Math.max(1, ...periods.map((p) => Math.abs(p.v)));
    return (
      <div className="grid grid-cols-3 gap-2 items-end">
        {periods.map((p) => (
          <div key={p.label}>
            <div className="h-[46px] flex items-end justify-center">
              <span
                className={`block w-[26px] rounded ${
                  p.v >= 0 ? AHEAD : BEHIND
                }`}
                style={{
                  height: `${Math.max(4, (Math.abs(p.v) / biggest) * 46)}px`,
                }}
              />
            </div>
            <div className="h-px bg-brand_navy/15 my-1" />
            <div className="text-[12px] font-semibold uppercase tracking-wide text-content/85 text-center">
              {p.label}
            </div>
            <div
              className={`text-[12px] font-bold tabular-nums text-center ${
                p.v >= 0
                  ? "text-delta_positive_text"
                  : "text-delta_negative_text"
              }`}
            >
              {p.v >= 0 ? "+" : MINUS}
              {fmt(Math.abs(p.v))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const read = focus ? priceRead(focus) : null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-brand_navy/15 flex-shrink-0 bg-gray-50">
        <button
          onClick={onBack}
          className="text-[12px] font-semibold text-content hover:underline flex-shrink-0"
        >
          &lsaquo; All stores
        </button>

        {/* Which colour is whose. The sentence that used to sit here named
            both stores for a third time — the heading below and this legend
            already say it, and the tab says where you are. */}
        <span className="ml-auto flex items-center gap-3 flex-shrink-0">
          <span className="flex items-center gap-1.5 text-[11.5px] text-content/85">
            <span className={`w-2.5 h-2.5 rounded-sm ${AHEAD}`} />
            <span className={`w-2.5 h-2.5 rounded-sm ${BEHIND}`} />
            ahead / behind
          </span>
          <span className="flex items-center gap-1.5 text-[11.5px] text-content/85 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${COMPARE}`} />
            <span className="truncate">{compareStoreName}</span>
          </span>
        </span>
      </div>

      {failed ? (
        <div className="flex-1 flex items-center justify-center px-4 text-center text-[12.5px] text-content/85">
          That store&rsquo;s departments could not be loaded.
        </div>
      ) : !theirs ? (
        <div className="relative flex-1">
          <LoadingIndicator message="Loading departments" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex overflow-hidden">
          <div className="flex-1 min-w-0 flex flex-col border-r border-brand_navy/15">
            <div
              className="flex-shrink-0 grid gap-2.5 items-center px-3 py-1.5 border-b border-brand_navy/15"
              style={{ gridTemplateColumns: COLS }}
            >
              <SortHeader
                col="name"
                label="Sub dept"
                sort={sort}
                onSort={handleSort}
                className={SORT_HEAD}
              />
              {/* Both names in full. Two numbers over a bar asked the reader
                  to hold a mapping in their head; the names say it outright,
                  and truncate before they crowd the difference. */}
              <SortHeader
                col="bars"
                label={`${openStoreName} vs ${compareStoreName}`}
                sort={sort}
                onSort={handleSort}
                className={`min-w-0 ${SORT_HEAD}`}
              />
              {/* "Diff", not "vs TY": it is not a comparison TO this year,
                  it is this year's difference between two stores. */}
              <SortHeader
                col="gap"
                label="Diff"
                sort={sort}
                onSort={handleSort}
                className={`justify-end ${SORT_HEAD}`}
              />
            </div>

            <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
              {ordered.map((r) => {
                const on = focus?.id === r.id;
                const none = r.b === 0 && r.a > 0;
                return (
                  <button
                    key={r.id}
                    onClick={() => setPicked(r.id)}
                    className={`w-full text-left grid gap-2.5 items-center px-3 py-2 border-b border-brand_navy/15 transition-colors ${
                      on
                        ? "bg-row_selected border-row_selected_border"
                        : "hover:bg-gray-50"
                    }`}
                    style={{ gridTemplateColumns: COLS }}
                  >
                    <span className="min-w-0 truncate text-[12.5px] font-medium text-content">
                      {r.name}
                    </span>

                    <span className="flex items-center gap-1 min-w-0">
                      <span
                        className="relative block h-[18px] rounded-sm overflow-hidden bg-bkg"
                        style={{ width: barWidth(r) }}
                      >
                        <span
                          className={`absolute left-0 top-0 h-full ${
                            r.tyDiff >= 0 ? AHEAD : BEHIND
                          }`}
                          style={{ width: mineShare(r) }}
                        />
                        <span
                          className={`absolute right-0 top-0 h-full ${COMPARE}`}
                          style={{ width: theirsShare(r) }}
                        />
                      </span>

                      {/* A department they do not carry would otherwise be
                          one solid bar, indistinguishable from their simply
                          having much less. The hatch sits OUTSIDE the bar so
                          the bar's own width stays honest. */}
                      {none && (
                        <span
                          title={`${compareStoreName} carries none`}
                          className="h-[18px] w-3.5 rounded-sm flex-shrink-0"
                          style={{
                            background:
                              "repeating-linear-gradient(45deg, rgb(var(--color-store-compare)) 0 3px, transparent 3px 6px)",
                          }}
                        />
                      )}
                    </span>

                    <span
                      className={`text-right tabular-nums text-[12px] font-semibold ${
                        r.tyDiff >= 0
                          ? "text-delta_positive_text"
                          : "text-delta_negative_text"
                      }`}
                    >
                      {gapText(r)}
                    </span>
                  </button>
                );
              })}

              {ordered.length === 0 && (
                <div className="px-3 py-6 text-center text-[12.5px] text-content/85">
                  Neither store recorded departments this week.
                </div>
              )}
            </div>
          </div>

          {focus && (
            <div className="w-[360px] flex-shrink-0 flex flex-col p-3 gap-3 overflow-auto thin-scrollbar">
              <div>
                <div className="text-[15px] font-bold text-content leading-snug">
                  {focus.name}
                </div>
                <div className="text-[12px] text-content/85 mt-1 leading-snug">
                  {rankIn(focus, "a") === 1 && rankIn(focus, "b") === 1 ? (
                    <>Biggest department at both stores</>
                  ) : (
                    <>
                      {ordinal(rankIn(focus, "a"))} biggest at {openStoreName},{" "}
                      {ordinal(rankIn(focus, "b"))} at {compareStoreName}
                    </>
                  )}
                  {" · "}
                  {pct1(shareMine(focus))} of {openStoreName}&rsquo;s week,{" "}
                  {pct1(shareTheirs(focus))} of {compareStoreName}&rsquo;s
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* The open store's box takes the same verdict colour its bar
                    does, so the rail and the row agree. */}
                <div
                  className={`rounded-md px-2.5 py-2 min-w-0 ${
                    focus.tyDiff >= 0
                      ? "bg-delta_positive_bg"
                      : "bg-delta_negative_bg"
                  }`}
                >
                  <div className="text-[12px] font-bold uppercase tracking-wide text-content/85 leading-tight">
                    {openStoreName}
                  </div>
                  <div
                    className={`text-[15px] font-bold tabular-nums mt-0.5 ${
                      focus.tyDiff >= 0
                        ? "text-delta_positive_text"
                        : "text-delta_negative_text"
                    }`}
                  >
                    {fmt(focus.a)}
                  </div>
                  <div className="text-[12px] text-content/85 tabular-nums mt-0.5">
                    {pct1(shareMine(focus))} ·{" "}
                    {formatBigNumber(focus.aUnits, 0)} units
                  </div>
                </div>
                <div className="rounded-md px-2.5 py-2 min-w-0 bg-store_compare_tint">
                  <div className="text-[12px] font-bold uppercase tracking-wide text-content/85 leading-tight">
                    {compareStoreName}
                  </div>
                  <div className="text-[15px] font-bold tabular-nums text-content mt-0.5">
                    {fmt(focus.b)}
                  </div>
                  <div className="text-[12px] text-content/85 tabular-nums mt-0.5">
                    {pct1(shareTheirs(focus))} ·{" "}
                    {formatBigNumber(focus.bUnits, 0)} units
                  </div>
                </div>
              </div>

              {focus.b === 0 && (
                <span className="self-start text-[12px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-severity_watch_bg text-severity_watch_text">
                  {compareStoreName} carries none
                </span>
              )}

              <div className="rounded-md border border-brand_navy/15 px-2.5 py-2.5">
                <div className="text-[12px] font-bold uppercase tracking-wide text-content/85 mb-2">
                  Is the gap closing?
                </div>
                {trendBars(focus)}
                <p className="text-[12.5px] text-content/85 leading-relaxed mt-2">
                  {trendOf(focus)}
                </p>
              </div>

              {read && (
                <div className="rounded-md border border-brand_navy/15 px-2.5 py-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[12px] font-bold uppercase tracking-wide text-content/85">
                      Units against money
                    </span>
                    <span className="ml-auto text-[12px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-content/85 whitespace-nowrap">
                      {read.price
                        ? "Expect price, not volume"
                        : "Expect volume, not price"}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-content/85 leading-relaxed">
                    {openStoreName} sold{" "}
                    <span className="font-semibold text-content">
                      {pct1(read.unitsPct)}{" "}
                      {read.unitsPct >= 0 ? "more" : "fewer"} units
                    </span>{" "}
                    and took{" "}
                    <span className="font-semibold text-content">
                      {pct1(read.moneyPct)}{" "}
                      {read.moneyPct >= 0 ? "more" : "less"} money
                    </span>{" "}
                    &mdash; it is ringing this department{" "}
                    <span className="font-semibold text-content">
                      {pct1(read.pricePct)}{" "}
                      {read.pricePct >= 0 ? "dearer" : "cheaper"} a unit
                    </span>
                    . The items grid splits that between real price and mix.
                  </p>
                </div>
              )}

              <div className="rounded-md border border-brand_navy/15 px-2.5 py-2.5">
                <div className="text-[12px] font-bold uppercase tracking-wide text-content/85 mb-1.5">
                  Against the whole week
                </div>
                <p className="text-[12.5px] text-content/85 leading-relaxed">
                  {openStoreName} is{" "}
                  <span
                    className={`font-semibold ${
                      storeGap >= 0
                        ? "text-delta_positive_text"
                        : "text-delta_negative_text"
                    }`}
                  >
                    {cash(Math.abs(storeGap))}{" "}
                    {storeGap >= 0 ? "ahead of" : "behind"}
                  </span>{" "}
                  {compareStoreName} across every department.
                  {focus.tyDiff >= 0 && storeGap < 0 && (
                    <>
                      {" "}
                      {focus.name} is one of the places it is ahead, offsetting{" "}
                      <span className="font-semibold text-content">
                        {pct1((focus.tyDiff / Math.abs(storeGap)) * 100)}
                      </span>{" "}
                      of that.
                    </>
                  )}
                  {focus.tyDiff < 0 && storeGap < 0 && (
                    <>
                      {" "}
                      {focus.name} is{" "}
                      <span className="font-semibold text-content">
                        {pct1((focus.tyDiff / storeGap) * 100)}
                      </span>{" "}
                      of it.
                    </>
                  )}
                  {worst.length > 0 && (
                    <>
                      {" "}The departments costing the most are{" "}
                      <span className="font-semibold text-content">
                        {worst.map((w) => w.name).join(" and ")}
                      </span>
                      .
                    </>
                  )}
                </p>
              </div>

              <div className="grid gap-px bg-brand_navy/15 rounded-md overflow-hidden">
                {statRow("vs TY", focus.tyDiff)}
                {statRow("vs LW", focus.lwDiff)}
                {statRow("vs LY", focus.lyDiff)}
              </div>

              {/* The way into the items, named and pinned, rather than a row
                  click somebody has to discover. */}
              <button
                onClick={() => openInvestigation(focus.id, focus.name)}
                className="mt-auto w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12.5px] font-bold transition-colors"
              >
                Investigate {focus.name} items &rarr;
              </button>
              <p className="text-[12px] text-content/85 text-center leading-snug">
                Items, causes, cost and supply for this department at both
                stores
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubDeptSideBySide;
