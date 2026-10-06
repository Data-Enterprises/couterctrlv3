import { useEffect, useMemo, useState } from "react";
import { getSubs } from "../../../../api/sales";
import { formatCurrencyCompact, formatBigNumber } from "../../../../utils";
import { useAppSelector } from "../../../../hooks";
import { useSalesState } from "../hooks/useSalesState";
import { scopeToStoreNumber } from "../shared/ledgerUtils";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import { PCT_COL_W } from "./utils";
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

const COLS = "minmax(160px,1fr) 118px 118px 128px";
const GRID_MIN = 530;

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
  gradingMetric,
  onBack,
}: Props) => {
  const context = useAppSelector((state) => state.app);
  const { subSales } = useSalesState();
  const [theirs, setTheirs] = useState<SubSale[] | null>(null);
  const [failed, setFailed] = useState(false);

  const isQty = gradingMetric === "qty";
  const fmt = (v: number) =>
    isQty ? formatBigNumber(v, 0) : formatCurrencyCompact(v);

  useEffect(() => {
    let live = true;
    setTheirs(null);
    setFailed(false);
    getSubs(context.url, context.token, twStart, twEnd, 0, compareStoreId, 1)
      .then((resp) => {
        if (!live) return;
        // Same unpacking the detail panel does: the house convention is a 200
        // carrying `error`, so `error === 0` is the success test.
        setTheirs(
          resp.data.error === 0
            ? scopeToStoreNumber(resp.data.subs as SubSale[], compareStoreNumber)
            : [],
        );
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [context.url, context.token, twStart, twEnd, compareStoreId, compareStoreNumber]);

  const rows = useMemo(() => {
    if (!theirs) return [];
    // Already the open store's own week — the panel scoped it on the way in.
    const mine = totalsBySubDept(subSales, gradingMetric);
    const yours = totalsBySubDept(theirs, gradingMetric);

    // Every department either store has — one of them not carrying a
    // department is a finding, not a row to drop.
    const ids = [
      ...new Set([...Object.keys(mine), ...Object.keys(yours)].map(Number)),
    ];

    return ids
      .map((id) => {
        const a = mine[id]?.value ?? 0;
        const b = yours[id]?.value ?? 0;
        return {
          id,
          name: mine[id]?.name ?? yours[id]?.name ?? `Sub dept ${id}`,
          a,
          b,
          diff: a - b,
        };
      })
      .sort((x, y) => y.a - x.a);
  }, [theirs, subSales, gradingMetric]);

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
          {openStoreName} against {compareStoreName}
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
              <span
                className="text-[11.5px] font-semibold uppercase tracking-wide text-content/85 text-right truncate"
                title={openStoreName}
              >
                {openStoreName}
              </span>
              <span
                className="text-[11.5px] font-semibold uppercase tracking-wide text-content/85 text-right truncate"
                title={compareStoreName}
              >
                {compareStoreName}
              </span>
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/85 text-right">
                Diff
              </span>
            </div>

            {rows.map((r) => (
              <div
                key={r.id}
                className="grid gap-2.5 items-center px-2 py-[7px] border-b border-brand_navy/15 last:border-b-0 even:bg-row_stripe text-[13px] text-content"
                style={{ gridTemplateColumns: COLS }}
              >
                <span className="min-w-0 truncate font-medium">{r.name}</span>
                <span className="text-right tabular-nums">{fmt(r.a)}</span>
                <span className="text-right tabular-nums">{fmt(r.b)}</span>
                {/* The ledger's pill shape, so a figure in this grid reads
                    like a figure anywhere else. Direction only — two stores
                    are not a baseline for each other, so there is no
                    threshold for this to be graded against. */}
                <span className="flex justify-end">
                  <span
                    className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center whitespace-nowrap ${
                      r.diff === 0
                        ? "bg-gray-100 text-content/85"
                        : r.diff > 0
                          ? "bg-delta_positive_bg text-delta_positive_text"
                          : "bg-delta_negative_bg text-delta_negative_text"
                    }`}
                    style={{ minWidth: PCT_COL_W }}
                  >
                    {r.diff >= 0 ? "+" : "−"}
                    {fmt(Math.abs(r.diff))}
                  </span>
                </span>
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
