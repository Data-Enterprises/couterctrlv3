import { useAppDispatch, useAppSelector } from "../../hooks";
import { setLpCase } from "../../features/lpActionsSlice";
import { formatDateSimple } from "../../utils";
import { PlusIcon } from "@heroicons/react/20/solid";
import type { ExceptionRow } from "./lpActionsMetrics";

/**
 * One exception in full: the weeks it was counted over, then the cashiers
 * behind the latest one.
 *
 * The cashier list is the reason the page exists. It is ordered by movement
 * against each person's own weekly normal — `was 4/wk` beside `41` is the
 * whole finding, and sorting by the raw count would put the busiest lane on
 * top every single week.
 */
interface Props {
  onAddWeek: () => void;
  addingWeek: boolean;
}

const Empty = ({ text }: { text: string }) => (
  <div className="flex-shrink-0 shadow-lg" style={{ width: "63%" }}>
    <div className="bg-custom-white rounded-xl shadow-sm h-full flex items-center justify-center px-4">
      <p className="text-[12px] text-content text-center leading-relaxed">
        {text}
      </p>
    </div>
  </div>
);

const changeLine = (row: ExceptionRow, weeks: number) => {
  if (row.changePct === null)
    return row.severity === "investigate"
      ? `First appearance at this volume — nothing in the previous ${weeks - 1} weeks to compare against.`
      : `Too few in the latest week to read a trend from.`;
  const dir = row.changePct >= 0 ? "above" : "below";
  return `The latest week is ${Math.abs(row.changePct).toFixed(0)}% ${dir} this store's own ${weeks - 1}-week average of ${row.baseline.toFixed(1)}.`;
};

const LpExceptionDetail = ({ onAddWeek, addingWeek }: Props) => {
  const dispatch = useAppDispatch();
  const { rows, selectedId, weeks } = useAppSelector((s) => s.lpActions);
  const row = rows.find((r) => r.id === selectedId) ?? null;

  if (!row)
    return <Empty text="Pick an exception for its weeks and cashiers." />;

  const tone =
    row.severity === "investigate"
      ? "bg-severity_critical_bg text-severity_critical_text"
      : row.severity === "watch"
        ? "bg-severity_watch_bg text-severity_watch_text"
        : "bg-severity_healthy_bg text-severity_healthy_text";

  return (
    <div className="flex-shrink-0 shadow-lg" style={{ width: "63%" }}>
      <div className="bg-custom-white rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#1e2a4a] px-4 py-2.5">
          <p className="text-custom-white text-[13px] font-semibold truncate">
            {row.saleType}
          </p>
          <p className="text-custom-white/85 text-[12px] truncate">
            {row.storeName}
          </p>
        </div>

        <div className={`flex-shrink-0 px-4 py-2.5 ${tone}`}>
          <div className="text-[11px] font-bold uppercase tracking-wide">
            {row.severity}
          </div>
          <div className="text-[13px] leading-relaxed mt-0.5">
            {changeLine(row, weeks)}
          </div>
        </div>

        <div className="flex-shrink-0 flex border-b border-gray-100 bg-gray-50">
          {row.weeks.map((w, i) => {
            const last = i === row.weeks.length - 1;
            return (
              <div
                key={w.start}
                className={`flex-1 min-w-0 px-2 py-2 text-center border-r border-gray-100 ${
                  last && row.severity !== "steady" ? tone : ""
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wide truncate">
                  {formatDateSimple(w.end)}
                </div>
                <div className="text-[14px] font-bold tabular-nums">
                  {w.count}
                </div>
              </div>
            );
          })}
          <button
            onClick={onAddWeek}
            disabled={addingWeek}
            title="Read one more week of history — the baseline widens with it"
            className="flex-shrink-0 px-3 flex items-center gap-1 text-[11.5px] font-medium text-content hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            {addingWeek ? "Reading…" : "week"}
          </button>
        </div>

        <div className="flex-shrink-0 px-3 py-1.5 border-b border-gray-100 text-[11.5px] font-semibold uppercase tracking-wide text-content/85">
          Cashiers in the latest week
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar rounded-b-xl">
          {row.cashiers.filter((c) => c.latest > 0).length === 0 && (
            <div className="py-8 text-center text-[12px] text-content/85">
              Nothing rang against this exception in the latest week.
            </div>
          )}
          {row.cashiers
            .filter((c) => c.latest > 0)
            .map((c) => {
              const move = c.latest - c.baseline;
              const tone =
                move >= 5
                  ? "text-severity_critical_text"
                  : move >= 2
                    ? "text-severity_watch_text"
                    : "text-content";
              return (
                <button
                  key={c.cashierNumber}
                  onClick={() =>
                    dispatch(
                      setLpCase({
                        ref: {
                          storeid: row.storeid,
                          cashierNumber: c.cashierNumber,
                        },
                        type: row.saleType,
                      }),
                    )
                  }
                  title="Open this cashier's case"
                  className="w-full text-left flex items-center gap-3 px-3 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-content truncate">
                      {c.cashierName}
                    </span>
                    <span className="block text-[12px] text-content/85">
                      Cashier {c.cashierNumber}
                    </span>
                  </span>
                  <span className="text-[12px] text-content/85 flex-shrink-0">
                    was {c.baseline.toFixed(1)}/wk
                  </span>
                  <span
                    className={`text-[13px] font-medium tabular-nums w-9 text-right flex-shrink-0 ${tone}`}
                  >
                    {c.latest}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default LpExceptionDetail;
