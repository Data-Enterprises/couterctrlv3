import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { setInvestigation } from "../../../../features/dev/devSalesLedgerSlice";
import { useDeptInvestigation, type Stage } from "../hooks/useDeptInvestigation";
import {
  SUPPLY_LOOKBACK_DAYS,
  supplyWindow,
} from "../shared/investigationData";
import type { Cause, ItemVerdict } from "../shared/deptInvestigation";
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import SortHeader, { PERF_SORT_HEADER } from "../../../../components-dev/SortHeader";
import { useTriStateSort } from "../../../../utils/useTriStateSort";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

/**
 * Why this store is behind that one, in this department.
 *
 * The page's full-width state. It is reached from a row of the sub-department
 * comparison, and it takes the whole page rather than a panel because the
 * question has outgrown one: by this point the reader is four steps in, and a
 * fifth panel inside a panel is how a drill-down becomes unusable.
 *
 * Everything on screen is `shared/deptInvestigation`'s arithmetic. Nothing is
 * computed here.
 *
 * It fills in three waves — see `useDeptInvestigation`. The grid is readable
 * as soon as sales land; each item's cause sharpens behind it. That is stated
 * on screen rather than hidden, because a cause that changes while somebody
 * is reading it needs to say why.
 */

type Col = "mine" | "theirs" | "gap";

const COLS = "minmax(220px,1fr) 150px 130px 130px 140px";
const GRID_MIN = 900;

const HEAD =
  "sticky top-0 z-10 bg-custom-white grid items-center gap-2.5 px-3 py-1.5 border-b border-brand_navy/15";

const CAUSE_LABEL: Record<Cause, string> = {
  "never-ordered": "Never ordered",
  "not-received": "Didn't arrive",
  "not-moving": "Not moving",
  "price-mix": "Price / mix",
  ahead: "We're ahead",
  unclassified: "No cause found",
};

/** Who owns the fix. The whole reason the causes are named separately is that
 *  they go to three different people. */
const CAUSE_OWNER: Record<Cause, string> = {
  "never-ordered": "buyer",
  "not-received": "vendor",
  "not-moving": "merchandising",
  "price-mix": "same units, less money",
  ahead: "ours to keep",
  unclassified: "worth a look",
};

/** Severity for the two supply failures, which are ordered — a buyer's miss
 *  is worse and more fixable than a price difference. Neutral for the rest,
 *  and the delta tokens where a figure carries direction. */
const CAUSE_CLASS: Record<Cause, string> = {
  "never-ordered": "bg-severity_critical_bg text-severity_critical_text",
  "not-received": "bg-severity_watch_bg text-severity_watch_text",
  "not-moving": "bg-gray-100 text-content/85",
  "price-mix": "bg-gray-100 text-content/85",
  ahead: "bg-delta_positive_bg text-delta_positive_text",
  unclassified: "bg-gray-100 text-content/85",
};

/** What is still outstanding, and what the screen cannot say yet because of
 *  it. A cause that sharpens as data lands has to explain itself. */
const STAGE_NOTE: Record<Stage, string | null> = {
  sales: "Loading this department's items…",
  orders: "Reading orders — until they land, nothing can be called never ordered.",
  receipts:
    "Reading deliveries — until they land, a vendor's miss cannot be told from a merchandising one.",
  done: null,
  failed: null,
};

const CAUSE_ORDER: Cause[] = [
  "never-ordered",
  "not-received",
  "not-moving",
  "price-mix",
  "unclassified",
  "ahead",
];

interface Props {
  gradingMetric: GradingMetric;
  twStart: string;
  twEnd: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
}

const DeptInvestigation = ({
  gradingMetric,
  twStart,
  twEnd,
  lwStart,
  lwEnd,
  lyStart,
  lyEnd,
}: Props) => {
  const dispatch = useAppDispatch();
  const target = useAppSelector((state) => state.dev.salesLedger.investigation);
  const { sort, handleSort, applySort } = useTriStateSort<Col>();
  const [only, setOnly] = useState<Cause | null>(null);

  const isQty = gradingMetric === "qty";
  const fmt = (v: number) => (isQty ? formatBigNumber(v, 0) : formatCurrency2(v));

  const args = useMemo(
    () => ({
      mine: {
        storeid: target?.storeid ?? 0,
        storeNumber: target?.storeNumber ?? "",
        name: target?.storeName ?? "",
      },
      theirs: {
        storeid: target?.compareStoreid ?? 0,
        storeNumber: target?.compareStoreNumber ?? "",
        name: target?.compareStoreName ?? "",
      },
      subDept: target?.subDept ?? 0,
      tw: { start: twStart, end: twEnd },
      lw: { start: lwStart, end: lwEnd },
      ly: { start: lyStart, end: lyEnd },
      metric: gradingMetric,
      enabled: target !== null,
    }),
    [target, twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd, gradingMetric],
  );

  const { stage, items, summary, problem } = useDeptInvestigation(args);

  const shown = useMemo(
    () => (only ? items.filter((i) => i.cause === only) : items),
    [items, only],
  );

  const sorted = applySort(shown, (row, col) =>
    col === "mine" ? row.mineTy : col === "theirs" ? row.theirsTy : row.gap,
  );

  if (!target) return null;

  const supply = supplyWindow({ start: twStart, end: twEnd });
  const byCause = new Map(summary.byCause.map((c) => [c.cause, c]));
  const worst = CAUSE_ORDER.filter(
    (c) => c !== "ahead" && (byCause.get(c)?.dollars ?? 0) < 0,
  ).slice(0, 3);

  const close = () => dispatch(setInvestigation(null));

  return (
    <div className="h-full flex flex-col overflow-hidden bg-custom-white rounded-xl shadow-sm">

      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 bg-brand_navy">
        <button
          onClick={close}
          className="text-custom-white text-[12.5px] font-semibold hover:underline"
        >
          ‹ Back to the comparison
        </button>
        <span className="text-custom-white/85 text-[12.5px] truncate">
          <span className="font-semibold text-custom-white">{target.storeName}</span>
          {" · "}{target.subDeptName}{" · "}week ending {twEnd}{" · against "}
          <span className="font-semibold text-custom-white">{target.compareStoreName}</span>
        </span>
        <span
          className={`ml-auto flex-shrink-0 text-[13px] font-semibold px-2.5 py-1 rounded ${
            summary.gap < 0
              ? "bg-delta_negative_bg text-delta_negative_text"
              : "bg-delta_positive_bg text-delta_positive_text"
          }`}
        >
          {summary.gap >= 0 ? "+" : "−"}
          {fmt(Math.abs(summary.gap))}
        </span>
      </div>

      {/* The headline is a sentence, not a dashboard. Each bucket goes to a
          different person, which is the only reason to separate them. */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-brand_navy/15">
        {stage !== "failed" && worst.length > 0 && (
          <p className="text-[13.5px] text-content leading-relaxed mb-2.5">
            Of the {fmt(Math.abs(summary.gap))} gap,{" "}
            {worst.map((c, i) => (
              <span key={c}>
                {i > 0 && (i === worst.length - 1 ? " and " : ", ")}
                <span className="font-semibold">
                  {fmt(Math.abs(byCause.get(c)?.dollars ?? 0))}
                </span>{" "}
                {c === "never-ordered"
                  ? "never got ordered"
                  : c === "not-received"
                    ? "was ordered and never arrived"
                    : c === "not-moving"
                      ? "is on the shelf not moving"
                      : c === "price-mix"
                        ? "is price, not volume"
                        : "has no cause yet"}
              </span>
            ))}
            .
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setOnly(null)}
            className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
              only === null
                ? "bg-filter_active border-filter_active_border text-content"
                : "bg-custom-white border-brand_line text-content hover:bg-gray-50"
            }`}
          >
            All {items.length} items
          </button>
          {CAUSE_ORDER.filter((c) => byCause.has(c)).map((c) => {
            const t = byCause.get(c);
            return (
              <button
                key={c}
                onClick={() => setOnly(only === c ? null : c)}
                title={CAUSE_OWNER[c]}
                className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  only === c
                    ? "bg-filter_active border-filter_active_border text-content"
                    : "bg-custom-white border-brand_line text-content hover:bg-gray-50"
                }`}
              >
                {CAUSE_LABEL[c]}
                <span className="ml-1.5 text-content/85">
                  {t?.items} · {fmt(Math.abs(t?.dollars ?? 0))}
                </span>
              </button>
            );
          })}
        </div>

        {/* The windows do not line up, and the screen says so rather than
            letting the grid imply every column is diagnosed. */}
        <p className="text-[11px] text-content/85 mt-2.5">
          Causes explain this week against {target.compareStoreName}. Orders and
          deliveries are read over {SUPPLY_LOOKBACK_DAYS} days
          ({supply.start} to {supply.end}) — they cannot account for the LW or
          LY columns.
          {STAGE_NOTE[stage] && (
            <span className="ml-1.5 font-semibold">{STAGE_NOTE[stage]}</span>
          )}
        </p>
      </div>

      {problem ? (
        <div className="flex-1 flex items-center justify-center px-6 text-center text-[13px] text-content/85">
          {problem}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
          <div style={{ minWidth: GRID_MIN }}>
            <div className={HEAD} style={{ gridTemplateColumns: COLS }}>
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/85">
                Item
              </span>
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/85">
                Cause
              </span>
              <SortHeader col="mine" label={`${target.storeNumber} TY`} sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-start min-w-0`} />
              <SortHeader col="theirs" label={`${target.compareStoreNumber} TY`} sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-start min-w-0`} />
              <SortHeader col="gap" label="Difference" sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-start min-w-0`} />
            </div>

            {sorted.map((r) => (
              <Row key={r.productCode} row={r} fmt={fmt} />
            ))}

            {sorted.length === 0 && stage !== "sales" && (
              <div className="px-4 py-8 text-center text-[12.5px] text-content/85">
                Nothing in this department to compare.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Row = ({
  row,
  fmt,
}: {
  row: ItemVerdict;
  fmt: (v: number) => string;
}) => (
  <div
    className="grid gap-2.5 items-center px-3 py-[11px] border-b border-brand_navy/15 last:border-b-0 even:bg-row_stripe hover:bg-gray-50 text-[13px] text-content"
    style={{ gridTemplateColumns: COLS }}
  >
    <span className="min-w-0 truncate font-medium" title={row.vendorName}>
      {row.description}
      <span className="ml-2 text-[11px] text-content/85">{row.productCode}</span>
    </span>

    <span className="min-w-0">
      <span
        className={`inline-block text-[11.5px] font-semibold px-2 py-0.5 rounded ${CAUSE_CLASS[row.cause]}`}
        title={CAUSE_OWNER[row.cause]}
      >
        {CAUSE_LABEL[row.cause]}
      </span>
    </span>

    <span className="tabular-nums font-semibold text-[14px]">{fmt(row.mineTy)}</span>
    <span className="tabular-nums text-[14px] text-content/85">{fmt(row.theirsTy)}</span>

    <span className="flex justify-start">
      <span
        className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center whitespace-nowrap ${
          row.gap === 0
            ? "bg-gray-100 text-content/85"
            : row.gap > 0
              ? "bg-delta_positive_bg text-delta_positive_text"
              : "bg-delta_negative_bg text-delta_negative_text"
        }`}
        style={{ minWidth: 112 }}
      >
        {row.gap >= 0 ? "+" : "−"}
        {fmt(Math.abs(row.gap))}
      </span>
    </span>
  </div>
);

export default DeptInvestigation;
