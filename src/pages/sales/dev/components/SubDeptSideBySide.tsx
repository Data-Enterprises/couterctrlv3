import { useEffect, useMemo, useState } from "react";
import { getSubs } from "../../../../api/sales";
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import { useAppSelector } from "../../../../hooks";
import { useSalesState } from "../hooks/useSalesState";
import { scopeToStoreNumber } from "../shared/ledgerUtils";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import SortHeader, { PERF_SORT_HEADER } from "../../../../components-dev/SortHeader";
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

type Col = "tyDiff" | "lwDiff" | "lyDiff";

const COLS = "minmax(180px,1fr) 136px 136px 136px";
const GRID_MIN = 620;

const HEAD =
  "sticky top-0 z-10 bg-custom-white grid items-center gap-2.5 px-2 py-1.5 border-b border-brand_navy/15";

interface Props {
  openStoreName: string;
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
  const { sort, handleSort, applySort } = useTriStateSort<Col>();
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

  const sorted = applySort(rows, (row, col) =>
    col === "tyDiff"
      ? row.tyDiff
      : col === "lwDiff"
        ? row.lwDiff
        : row.lyDiff,
  );

  /** The ledger's pill shape, carrying direction only: two stores are not a
   *  baseline for each other, so there is no threshold to grade against. */
  const diffPill = (v: number) => (
    <span className="flex justify-start">
      <span
        className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center whitespace-nowrap ${
          v === 0
            ? "bg-gray-100 text-content/85"
            : v > 0
              ? "bg-delta_positive_bg text-delta_positive_text"
              : "bg-delta_negative_bg text-delta_negative_text"
        }`}
        style={{ minWidth: 108 }}
      >
        {v >= 0 ? "+" : "−"}
        {fmt(Math.abs(v))}
      </span>
    </span>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 flex-shrink-0 bg-gray-50">
        <button
          onClick={onBack}
          className="text-[12px] font-semibold text-content hover:underline"
        >
          ‹ All stores
        </button>
        <span className="text-[12px] text-content/85 truncate">
          How <span className="font-semibold text-content">{openStoreName}</span>{" "}
          stands against{" "}
          <span className="font-semibold text-content">{compareStoreName}</span>,
          department by department
        </span>
      </div>

      {failed ? (
        <div className="flex-1 flex items-center justify-center px-4 text-center text-[12.5px] text-content/85">
          That store's departments could not be loaded.
        </div>
      ) : !theirs ? (
        <div className="relative flex-1">
          <LoadingIndicator message="Loading departments" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto thin-scrollbar">
          <div style={{ minWidth: GRID_MIN }}>
            <div className={HEAD} style={{ gridTemplateColumns: COLS }}>
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/85">
                Sub dept
              </span>
              {/* The same three comparisons the store grid makes, one
                  department at a time, and sorted the same way. Both stores
                  are named in the line above, so neither needs a column. */}
              <SortHeader col="tyDiff" label="vs TY" sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-start`} />
              <SortHeader col="lwDiff" label="vs LW" sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-start`} />
              <SortHeader col="lyDiff" label="vs LY" sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-start`} />
            </div>

            {sorted.map((r) => (
              <div
                key={r.id}
                className="grid gap-2.5 items-center px-2 py-[11px] border-b border-brand_navy/15 last:border-b-0 even:bg-row_stripe text-[13px] text-content"
                style={{ gridTemplateColumns: COLS }}
              >
                <span
                  className="min-w-0 truncate font-medium"
                  title={`${openStoreName} ${fmt(r.a)} · ${compareStoreName} ${fmt(r.b)}`}
                >
                  {r.name}
                </span>
                {diffPill(r.tyDiff)}
                {diffPill(r.lwDiff)}
                {diffPill(r.lyDiff)}
              </div>
            ))}

            {rows.length === 0 && (
              <div className="px-3 py-6 text-center text-[12.5px] text-content/85">
                Neither store recorded departments this week.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubDeptSideBySide;
