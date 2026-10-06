import { useMemo, useState } from "react";
import { applyStoreNumberToName } from "../shared/ledgerUtils";
import { compareForView, type ComparisonRow } from "../shared/storeComparison";
import SortHeader, { PERF_SORT_HEADER } from "../../../../components-dev/SortHeader";
import SubDeptSideBySide from "./SubDeptSideBySide";
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import { useTriStateSort } from "../../../../utils/useTriStateSort";
import type { LedgerRowData } from "./LedgerRow";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

/**
 * The Comparison tab: every other store in the search, against this one.
 *
 * Sits beside Sub dept and Hourly because it is the same kind of thing — a
 * breakdown of the store that is open. The open store is pinned at the top as
 * the line everything else is measured from, so the column of differences has
 * something visible to be a difference from.
 *
 * The difference is in POINTS, because both sides are already percentages and
 * subtracting two percentages never gives a percentage.
 */

type Col = "mineTy" | "theirsTy" | "tyGap" | "lwGap" | "lyGap";

const COLS = "minmax(160px,1fr) 116px 116px 130px 130px 130px";
const GRID_MIN = 800;

const HEAD =
  "sticky top-0 z-10 bg-custom-white grid items-center gap-2.5 px-2 py-1.5 border-b border-brand_navy/15";

interface Props {
  rows: LedgerRowData[];
  storeid: number;
  storeNumber: string;
  gradingMetric: GradingMetric;
  threshold: number;
  selectedDate: string | null;
  /** The open store's own name and week, for the departments view. */
  openStoreName: string;
  twStart: string;
  twEnd: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
}

const PopupComparisonList = ({
  rows,
  storeid,
  storeNumber,
  gradingMetric,
  threshold,
  selectedDate,
  openStoreName,
  twStart,
  twEnd,
  lwStart,
  lwEnd,
  lyStart,
  lyEnd,
}: Props) => {
  const { sort, handleSort, applySort } = useTriStateSort<Col>();
  // Which store's departments to put beside this one's. Held here rather than
  // in the slice: it belongs to this tab and means nothing once you leave it.
  const [picked, setPicked] = useState<ComparisonRow | null>(null);
  const isQty = gradingMetric === "qty";
  const fmt = (v: number) =>
    isQty ? formatBigNumber(v, 0) : formatCurrency2(v);
  const group = useMemo(
    () => compareForView(rows, gradingMetric, threshold, selectedDate),
    [rows, gradingMetric, threshold, selectedDate],
  );

  const keyOf = (r: ComparisonRow) => `${r.storeid}__${r.storeNumber}`;
  const open = group.rows.find(
    (r) => r.storeid === storeid && r.storeNumber === storeNumber,
  );

  if (!open) {
    return (
      <div className="h-full flex items-center justify-center px-4 text-center text-[12.5px] text-content/85">
        This store is not in the current search.
      </div>
    );
  }


  /**
   * The OPEN store's week against this row's, in each of the three periods.
   *
   * That direction, and not the other way about, because the panel is about
   * the open store: green has to mean the store you are looking at is ahead.
   * Subtracting the other way reads as a verdict on whichever store the row
   * happens to be, which is backwards on a page you opened to ask about one.
   *
   * Money, not points: "Leitchfield is $28.6K behind Louisville this week" is
   * the sentence somebody says out loud, and it is the one thing neither
   * store's own row — here or in the ledger — can tell you.
   *
   * Null where the store has nothing for that period, so there is no
   * comparison to state rather than a zero implying one.
   */
  const tyGap = (r: ComparisonRow) => open.ty - r.ty;
  const lwGap = (r: ComparisonRow) =>
    r.hasLW && open.hasLW ? open.lw - r.lw : null;
  const lyGap = (r: ComparisonRow) =>
    r.hasLY && open.hasLY ? open.ly - r.ly : null;

  // Ordered on this week by default, the way the group grid opens on
  // contribution: the stores this one is furthest ahead of at the top, the
  // ones it is furthest behind at the bottom, so the list reads as a standing
  // rather than as whatever order the ledger handed the rows over in. A column
  // sort is a lens over this and the third click returns to it.
  const others = group.rows
    .filter((r) => keyOf(r) !== keyOf(open))
    .sort((a, b) => tyGap(b) - tyGap(a));

  const sorted = applySort(others, (row, col) =>
    col === "mineTy"
      ? open.ty
      : col === "theirsTy"
        ? row.ty
        : col === "tyGap"
          ? tyGap(row)
          : col === "lwGap"
            ? lwGap(row)
            : lyGap(row),
  );

  const nameOf = (r: ComparisonRow) =>
    applyStoreNumberToName(r.storeName, r.storeNumber, r.storeNumbersForId);

  /** The pill shape the ledger uses, carrying direction only. Two stores are
   *  not a baseline for each other, so there is no threshold to grade on. */
  const diffPill = (text: string, sign: number | null) => (
    <span className="flex justify-start">
      <span
        className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center whitespace-nowrap ${
          sign === null || sign === 0
            ? "bg-gray-100 text-content/85"
            : sign > 0
              ? "bg-delta_positive_bg text-delta_positive_text"
              : "bg-delta_negative_bg text-delta_negative_text"
        }`}
        style={{ minWidth: 112 }}
      >
        {text}
      </span>
    </span>
  );

  const money = (v: number | null) =>
    v === null ? "—" : `${v >= 0 ? "+" : "−"}${fmt(Math.abs(v))}`;

  const cells = (r: ComparisonRow) => (
    <>
      <span className="min-w-0 truncate font-medium">{nameOf(r)}</span>
      {/* The two figures the difference comes out of. The open store's is
          the same on every row — that is the point: it is the line all of
          them are measured from, and seeing it beside each one is what makes
          the pill checkable rather than something to take on trust. */}
      <span className="tabular-nums font-semibold text-[14px] bg-store_open_tint -mx-1 px-1 py-[7px]">
        {fmt(open.ty)}
      </span>
      <span className="tabular-nums text-[14px] text-content/85 bg-store_compare_tint -mx-1 px-1 py-[7px]">
        {fmt(r.ty)}
      </span>
      {diffPill(money(tyGap(r)), tyGap(r))}
      {diffPill(money(lwGap(r)), lwGap(r))}
      {diffPill(money(lyGap(r)), lyGap(r))}
    </>
  );

  // Picking a store swaps this list for its departments beside the open
  // store's — the next step of the same question.
  if (picked) {
    return (
      <SubDeptSideBySide
        openStoreName={openStoreName}
        openStoreId={storeid}
        openStoreNumber={storeNumber}
        compareStoreId={picked.storeid}
        compareStoreNumber={picked.storeNumber}
        compareStoreName={nameOf(picked)}
        twStart={twStart}
        twEnd={twEnd}
        lwStart={lwStart}
        lwEnd={lwEnd}
        lyStart={lyStart}
        lyEnd={lyEnd}
        gradingMetric={gradingMetric}
        onBack={() => setPicked(null)}
      />
    );
  }

  return (
    <div className="h-full overflow-auto thin-scrollbar">
      <div style={{ minWidth: GRID_MIN }}>
        <p className="px-2 py-2 text-[12px] text-content/85 border-b border-gray-100">
          How <span className="font-semibold text-content">{openStoreName}</span>{" "}
          stands against each store — ahead in green, behind in red.
        </p>

        <div className={HEAD} style={{ gridTemplateColumns: COLS }}>
          <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/85">
            Store
          </span>
          <SortHeader col="mineTy" label={`${storeNumber} TY`} sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-start min-w-0`} />
          <SortHeader col="theirsTy" label="Store TY" sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-start min-w-0`} />
          {/* Each one is this store's movement against the open store's, over
              the same comparison. */}
          <SortHeader col="tyGap" label="vs TY" sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-start`} />
          <SortHeader col="lwGap" label="vs LW" sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-start`} />
          <SortHeader col="lyGap" label="vs LY" sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-start`} />
        </div>

        {sorted.map((r) => (
          <div
            key={keyOf(r)}
            role="button"
            tabIndex={0}
            onClick={() => setPicked(r)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setPicked(r);
              }
            }}
            title={`Departments: ${nameOf(r)} beside ${openStoreName}`}
            className="grid gap-2.5 items-center px-2 py-[7px] border-b border-brand_navy/15 last:border-b-0 even:bg-row_stripe hover:bg-gray-50 cursor-pointer text-[13px] text-content"
            style={{ gridTemplateColumns: COLS }}
          >
            {cells(r)}
          </div>
        ))}

        {sorted.length === 0 && (
          <div className="px-3 py-6 text-center text-[12.5px] text-content/85">
            No other stores in this search.
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupComparisonList;
