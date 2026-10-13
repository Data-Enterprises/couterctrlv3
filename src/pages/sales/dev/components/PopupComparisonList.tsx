import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import {
  setCounterpart,
  setLedgerTab,
} from "../../../../features/dev/devSalesLedgerSlice";
import { applyStoreNumberToName } from "../shared/ledgerUtils";
import StoreColFilter from "./StoreColFilter";
import { compareForView, type ComparisonRow } from "../shared/storeComparison";
import SortHeader, { PERF_SORT_HEADER } from "../../../../components-dev/SortHeader";
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

type Col = "theirsTy" | "tyGap" | "lwGap" | "lyGap";

const COLS = "minmax(160px,1fr) 140px 130px 130px 130px";
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
  openStoreName: string;
}

const PopupComparisonList = ({
  rows,
  storeid,
  storeNumber,
  gradingMetric,
  threshold,
  selectedDate,
  openStoreName,
}: Props) => {
  const { sort, handleSort, applySort } = useTriStateSort<Col>();
  const dispatch = useAppDispatch();
  const counterpart = useAppSelector(
    (state) => state.dev.salesLedger.counterpart,
  );
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

  // Ordered on this week by default: the stores this one is furthest BEHIND at
  // the top, the ones it is furthest ahead of at the bottom.
  //
  // Worst first, which is how every Performance list on this page opens. The
  // reason somebody picks a counterpart at all is to go and find out why they
  // are losing to it — so the store that costs the most should not be the one
  // they have to scroll to. A column sort is a lens over this and the third
  // click returns to it.
  const others = group.rows
    .filter((r) => keyOf(r) !== keyOf(open))
    .sort((a, b) => tyGap(a) - tyGap(b));

  /**
   * Searching the list for one store.
   *
   * Narrows which stores are listed, not what the open store is measured
   * against — every gap on screen is still this store against that one, and
   * the figures do not move when the list does.
   */
  const [storeFilter, setStoreFilter] = useState("");
  const searched = useMemo(() => {
    const q = storeFilter.trim().toLowerCase();
    if (!q) return others;
    return others.filter(
      (r) =>
        r.storeName.toLowerCase().includes(q) ||
        r.storeNumber.toLowerCase().includes(q),
    );
  }, [others, storeFilter]);

  const sorted = applySort(searched, (row, col) =>
    col === "theirsTy"
      ? row.ty
      : col === "tyGap"
        ? tyGap(row)
        : col === "lwGap"
          ? lwGap(row)
          : lyGap(row),
  );

  const nameOf = (r: ComparisonRow) =>
    applyStoreNumberToName(r.storeName, r.storeNumber, r.storeNumbersForId);

  /**
   * This tab's job: choose who "they" is.
   *
   * It used to swap itself for a department grid, which made the comparison
   * something you could only have while standing on this tab. The choice is
   * page state now, so Sub depts and Hourly are both comparing against this
   * store the moment it is picked — and landing on Sub depts is the point,
   * because that is where the departments are.
   */
  const pick = (r: ComparisonRow) => {
    dispatch(
      setCounterpart({
        storeid: r.storeid,
        storeNumber: r.storeNumber,
        storeName: nameOf(r),
      }),
    );
    dispatch(setLedgerTab("subdept"));
  };

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
      {/* This row's own week. The open store's used to sit beside it, on the
          argument that seeing both made the pill checkable — but it is the
          same figure on every row, so eight copies of it bought one
          subtraction and cost the one column that differs. It is stated
          once, above. */}
      <span className="tabular-nums font-semibold text-[14px] bg-store_compare_tint -mx-1 px-1 py-[7px]">
        {fmt(r.ty)}
      </span>
      {diffPill(money(tyGap(r)), tyGap(r))}
      {diffPill(money(lwGap(r)), lwGap(r))}
      {diffPill(money(lyGap(r)), lyGap(r))}
    </>
  );

  return (
    <div className="h-full overflow-auto thin-scrollbar">
      <div style={{ minWidth: GRID_MIN }}>
        <p className="px-2 py-2 text-[12px] text-content/85 border-b border-gray-100">
          How <span className="font-semibold text-content">{openStoreName}</span>{" "}
          <span className="font-semibold text-content tabular-nums">
            {fmt(open.ty)}
          </span>{" "}
          stands against each store — ahead in green, behind in red. Pick one to
          compare department by department.
        </p>

        <div className={HEAD} style={{ gridTemplateColumns: COLS }}>
          <span className="min-w-0 flex items-center">
            <StoreColFilter value={storeFilter} onApply={setStoreFilter} />
          </span>
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
            onClick={() => pick(r)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                pick(r);
              }
            }}
            title={`Compare ${openStoreName} against ${nameOf(r)}, department by department`}
            className={`grid gap-2.5 items-center px-2 py-[7px] border-b border-brand_navy/15 last:border-b-0 hover:bg-gray-50 cursor-pointer text-[13px] text-content ${
              counterpart?.storeid === r.storeid &&
              counterpart?.storeNumber === r.storeNumber
                ? "bg-row_selected border-row_selected_border"
                : "even:bg-row_stripe"
            }`}
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
