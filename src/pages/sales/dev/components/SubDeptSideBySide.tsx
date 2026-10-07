import { useEffect, useMemo, useState } from "react";
import { getSubs } from "../../../../api/sales";
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { setInvestigation } from "../../../../features/dev/devSalesLedgerSlice";
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
 * One week, one figure each, and the difference. Nothing is graded here: two
 * stores are not a baseline for each other, so a severity colour would be
 * claiming something the data cannot support. The difference carries direction
 * and nothing more.
 */

/** `total_sales - total_tax`, the basis the whole page is on — see the note in
 *  PopupSubDeptList for why it is not `net_sales`. */
const totalsBySubDept = (rows: SubSale[], metric: GradingMetric) =>
  rows.reduce<Record<number, { name: string; value: number }>>((acc, s) => {
    if (!acc[s.sub_department])
      acc[s.sub_department] = { name: s.sub_department_description, value: 0 };
    acc[s.sub_department].value +=
      metric === "qty" ? s.qty : s.total_sales - s.total_tax;
    return acc;
  }, {});

/** One department, both stores, across the three periods. */
interface Row {
  id: number;
  name: string;
  /** The open store's week. */
  a: number;
  /** The counterpart's. */
  b: number;
  tyDiff: number;
  lwDiff: number;
  lyDiff: number;
}

/** The three sortable headings. `bars` sorts by what the bars draw. */
type Column = "name" | "bars" | "gap";

/** A real minus, not a hyphen: these sit in tabular figures beside a plus. */
const MINUS = "\u2212";

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
  const [theirs, setTheirs] = useState<{
    tw: SubSale[];
    lw: SubSale[];
    ly: SubSale[];
  } | null>(null);
  const [failed, setFailed] = useState(false);

  const isQty = gradingMetric === "qty";
  const fmt = (v: number) =>
    isQty ? formatBigNumber(v, 0) : formatCurrency2(v);

  useEffect(() => {
    let live = true;
    setTheirs(null);
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
        setTheirs({ tw: take(tw), lw: take(lw), ly: take(ly) });
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
  ]);

  const rows = useMemo(() => {
    if (!theirs) return [];
    // Already the open store's own weeks — the panel scoped them on the way in.
    const mineTw = totalsBySubDept(subSales, gradingMetric);
    const mineLw = totalsBySubDept(subSalesWk2, gradingMetric);
    const mineLy = totalsBySubDept(subSalesWk3, gradingMetric);
    const theirTw = totalsBySubDept(theirs.tw, gradingMetric);
    const theirLw = totalsBySubDept(theirs.lw, gradingMetric);
    const theirLy = totalsBySubDept(theirs.ly, gradingMetric);

    // Every department either store has in any week — one of them not
    // carrying a department is a finding, not a row to drop.
    const ids = [
      ...new Set(
        [mineTw, mineLw, mineLy, theirTw, theirLw, theirLy]
          .flatMap((m) => Object.keys(m))
          .map(Number),
      ),
    ];

    const at = (
      m: Record<number, { name: string; value: number }>,
      id: number,
    ) => m[id]?.value ?? 0;

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
          tyDiff: a - b,
          lwDiff: at(mineLw, id) - at(theirLw, id),
          lyDiff: at(mineLy, id) - at(theirLy, id),
        };
      })
      // Biggest department first by default, which is the order somebody
      // reads a department list in. A column sort is a lens over that, and
      // the third click returns to it.
      .sort((x, y) => y.a - x.a);
  }, [theirs, subSales, subSalesWk2, subSalesWk3, gradingMetric]);

  /**
   * Money or mix.
   *
   * In money a bigger store is bigger in almost everything, which is true and
   * is not a finding - eleven green rows tell you one thing you already knew.
   * Mix divides each department by its OWN store's week, so size drops out
   * and what is left is what the two actually lean on.
   */
  const [mode, setMode] = useState<"money" | "mix">("money");
  const [picked, setPicked] = useState<number | null>(null);

  /** The house tri-state: unsorted → desc → asc → back to the list's own
   *  order, which here is biggest department first. */
  const { sort, handleSort, applySort } = useTriStateSort<Column>();

  const mineTotal = rows.reduce((t, r) => t + r.a, 0);
  const theirsTotal = rows.reduce((t, r) => t + r.b, 0);
  const shareMine = (r: Row) => (mineTotal > 0 ? (r.a / mineTotal) * 100 : 0);
  const shareTheirs = (r: Row) => (theirsTotal > 0 ? (r.b / theirsTotal) * 100 : 0);

  // One scale for both bars, so a bar's length means the same thing on every
  // row and for either store.
  const barMax =
    mode === "money"
      ? Math.max(1, ...rows.flatMap((r) => [r.a, r.b]))
      : Math.max(1, ...rows.flatMap((r) => [shareMine(r), shareTheirs(r)]));

  const widthOf = (v: number) => Math.min(100, (v / barMax) * 100) + "%";
  const gapOf = (r: Row) =>
    mode === "money" ? r.tyDiff : shareMine(r) - shareTheirs(r);
  const gapText = (r: Row) => {
    const g = gapOf(r);
    const sign = g >= 0 ? "+" : MINUS;
    return mode === "money"
      ? sign + fmt(Math.abs(g))
      : sign + Math.abs(g).toFixed(1) + " pts";
  };

  /**
   * Sorted, or handed back in the default order.
   *
   * The name column cannot go through `applySort`, which compares numbers —
   * a department list sorted alphabetically is a real way to find one, so it
   * gets its own comparator rather than being left unsortable.
   *
   * The bars column sorts by whatever the bars are DRAWING: the open store's
   * money, or its share of the week in mix mode. Sorting a bar by a figure it
   * is not showing is the kind of thing that makes a column feel broken.
   */
  const ordered = useMemo(() => {
    if (sort?.col === "name") {
      const dir = sort.dir === "asc" ? 1 : -1;
      return [...rows].sort((a, b) => a.name.localeCompare(b.name) * dir);
    }
    return applySort(rows, (r, c) =>
      c === "bars"
        ? mode === "money"
          ? r.a
          : shareMine(r)
        : gapOf(r),
    );
    // `applySort` and `gapOf` are re-made every render; the state they close
    // over — the sort, the mode and the two totals — is what actually moves.
  }, [rows, sort, mode, mineTotal, theirsTotal]);

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

  const stat = (key: string, v: number) => (
    <div className="flex items-baseline gap-2 px-3 py-2 bg-custom-white">
      <span className="text-[11.5px] text-content/85 w-[52px] flex-shrink-0">{key}</span>
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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-brand_navy/15 flex-shrink-0 bg-gray-50">
        <button
          onClick={onBack}
          className="text-[12px] font-semibold text-content hover:underline flex-shrink-0"
        >
          &lsaquo; All stores
        </button>
        <span className="text-[12px] text-content/85 truncate">
          How <span className="font-semibold text-content">{openStoreName}</span>{" "}
          stands against{" "}
          <span className="font-semibold text-content">{compareStoreName}</span>
        </span>

        <span className="ml-auto inline-flex rounded-full border border-brand_line overflow-hidden flex-shrink-0">
          {(["money", "mix"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-[11.5px] font-semibold px-2.5 py-1 transition-colors ${
                mode === m
                  ? "bg-brand_navy text-custom-white"
                  : "bg-custom-white text-content hover:bg-gray-50"
              }`}
            >
              {m === "money" ? "Money" : "Mix"}
            </button>
          ))}
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
              className="flex-shrink-0 grid gap-2.5 items-center px-3 py-1.5 border-b border-brand_navy/15 text-[11px] font-semibold uppercase tracking-wide text-content/85"
              style={{ gridTemplateColumns: COLS }}
            >
              <SortHeader
                col="name"
                label="Sub dept"
                sort={sort}
                onSort={handleSort}
                className={SORT_HEAD}
              />
              {/* Both names in full. Two numbers over a pair of bars asked
                  the reader to hold a mapping in their head; the names say
                  it outright, and truncate before they crowd the gap. */}
              <SortHeader
                col="bars"
                label={`${openStoreName} vs ${compareStoreName}`}
                sort={sort}
                onSort={handleSort}
                className={`min-w-0 ${SORT_HEAD}`}
              />
              <SortHeader
                col="gap"
                label={mode === "money" ? "vs TY" : "Share"}
                sort={sort}
                onSort={handleSort}
                className={`justify-end ${SORT_HEAD}`}
              />
            </div>

            <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
              {ordered.map((r) => {
                const g = gapOf(r);
                const on = focus?.id === r.id;
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

                    {/* Two bars on one scale: length is the week, the pair is
                        the comparison. A single diverging bar shows the gap
                        and throws away how big either store actually is. */}
                    <span className="grid gap-[3px] min-w-0">
                      <span className="block h-2 rounded-sm bg-bkg">
                        <span
                          className="block h-2 rounded-sm bg-store_open"
                          style={{ width: widthOf(mode === "money" ? r.a : shareMine(r)) }}
                        />
                      </span>
                      {/* A department they do not carry gets a hatched full
                          track, not a zero-width bar nobody can see. */}
                      <span className="block h-2 rounded-sm bg-bkg">
                        <span
                          className="block h-2 rounded-sm"
                          style={
                            r.b === 0
                              ? {
                                  width: "100%",
                                  background:
                                    "repeating-linear-gradient(45deg, rgb(var(--color-severity-watch-bg)) 0 4px, transparent 4px 8px)",
                                }
                              : {
                                  width: widthOf(mode === "money" ? r.b : shareTheirs(r)),
                                  background: "rgb(var(--color-store-compare))",
                                }
                          }
                        />
                      </span>
                    </span>

                    <span
                      className={`text-right tabular-nums text-[12px] font-semibold ${
                        g >= 0 ? "text-delta_positive_text" : "text-delta_negative_text"
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
            <div className="w-[320px] flex-shrink-0 flex flex-col p-3 gap-3 overflow-auto thin-scrollbar">
              <div>
                <div className="text-[15px] font-bold text-content leading-snug">
                  {focus.name}
                </div>
                {focus.b === 0 && (
                  <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-severity_watch_bg text-severity_watch_text">
                    {compareStoreNumber} carries none
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md px-2.5 py-2 bg-store_open_tint">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-content/85">
                    {openStoreNumber}
                  </div>
                  <div className="text-[15px] font-bold tabular-nums text-content mt-0.5">
                    {fmt(focus.a)}
                  </div>
                </div>
                <div className="rounded-md px-2.5 py-2 bg-store_compare_tint">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-content/85">
                    {compareStoreNumber}
                  </div>
                  <div className="text-[15px] font-bold tabular-nums text-content mt-0.5">
                    {fmt(focus.b)}
                  </div>
                </div>
              </div>

              <div className="grid gap-px bg-brand_navy/15 rounded-md overflow-hidden">
                {stat("vs TY", focus.tyDiff)}
                {stat("vs LW", focus.lwDiff)}
                {stat("vs LY", focus.lyDiff)}
              </div>

              <p className="text-[11.5px] text-content/85 leading-relaxed">
                This department is{" "}
                <span className="font-semibold text-content">
                  {shareMine(focus).toFixed(1)}%
                </span>{" "}
                of {openStoreNumber}&rsquo;s week and{" "}
                <span className="font-semibold text-content">
                  {shareTheirs(focus).toFixed(1)}%
                </span>{" "}
                of {compareStoreNumber}&rsquo;s
                {Math.abs(shareMine(focus) - shareTheirs(focus)) < 0.5 ? (
                  <> &mdash; near enough the same lean.</>
                ) : (
                  <>
                    {" "}
                    &mdash;{" "}
                    <span className="font-semibold text-content">
                      {Math.abs(shareMine(focus) - shareTheirs(focus)).toFixed(1)} points
                    </span>{" "}
                    heavier at{" "}
                    {shareMine(focus) > shareTheirs(focus)
                      ? openStoreNumber
                      : compareStoreNumber}
                    .
                  </>
                )}
              </p>

              {/* The way into the items, named and pinned, rather than a row
                  click somebody has to discover. */}
              <button
                onClick={() => openInvestigation(focus.id, focus.name)}
                className="mt-auto w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12.5px] font-bold transition-colors"
              >
                Investigate {focus.name} items &rarr;
              </button>
              <p className="text-[10.5px] text-content/85 text-center leading-snug">
                Items, causes and supply for this department at both stores
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubDeptSideBySide;
