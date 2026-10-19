import { useMemo } from "react";
import { formatCurrencyCompact, formatBigNumber } from "../../../../utils";
import { applyStoreNumberToName } from "../shared/ledgerUtils";
import {
  compareForView,
  groupDays,
  type Excluded,
} from "../shared/storeComparison";
import PopupDaySidebar from "./PopupDaySidebar";
import GroupShareBalance from "./GroupShareBalance";
import type { LedgerRowData } from "./LedgerRow";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

/**
 * Where every store stands inside the group that was searched.
 *
 * The right panel's resting state. It is shown when nothing is selected, which
 * is the state the panel has always had and has always spent on an empty
 * prompt — so this is not a new surface, it is the one that was already there
 * saying nothing.
 *
 * All of the arithmetic is in `shared/storeComparison`; nothing is computed
 * here. Selecting a day re-asks the whole question of that day by handing
 * `scopeToDay`'s rows to the same function.
 */

interface Props {
  rows: LedgerRowData[];
  gradingMetric: GradingMetric;
  /** The page's own threshold, so the comparison bands move with the control
   *  the severity dot already answers to. */
  threshold: number;
  /** Shared with the store popup — picking Saturday here keeps Saturday when
   *  a store is opened. */
  selectedDate: string | null;
  onSelectDay: (date: string | null) => void;
  onSelectStore: (row: LedgerRowData) => void;
}

const EXCLUDED_LABEL: Record<Excluded, string> = {
  "no-baseline": "No baseline",
  "partial-week": "Short week",
  "nothing-to-compare": "Nothing to compare",
};

/** Whole percent. This reads as a headline above eight stores, and a tenth
 *  of a point on a $1.4M group is noise dressed as precision. */
const pct0 = (v: number | null) =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${Math.round(v)}%`;

const GroupComparisonPanel = ({
  rows,
  gradingMetric,
  threshold,
  selectedDate,
  onSelectDay,
  onSelectStore,
}: Props) => {
  const isQty = gradingMetric === "qty";

  const fmt = (v: number | null) =>
    v === null ? "—" : isQty ? formatBigNumber(v, 0) : formatCurrencyCompact(v);

  const days = useMemo(() => groupDays(rows), [rows]);

  // A day selection narrows the rows before any of the comparison runs, so
  // every contribution, expectation and verdict below belongs to that day alone —
  // with wider bands, because one day against one day is a thinner baseline.
  const group = useMemo(
    () => compareForView(rows, gradingMetric, threshold, selectedDate),
    [rows, gradingMetric, threshold, selectedDate],
  );

  const excludedTotal = Object.values(group.excludedBy).reduce(
    (a, b) => a + b,
    0,
  );
  const excludedReasons = (Object.keys(group.excludedBy) as Excluded[])
    .filter((k) => group.excludedBy[k] > 0)
    .map((k) => `${group.excludedBy[k]} ${EXCLUDED_LABEL[k].toLowerCase()}`)
    .join(" · ");

  const worst = group.biggestShortfall;

  const tile = (label: string, value: string, sub?: string, title?: string) => (
    <div className="px-3 py-2.5 min-w-0" title={title}>
      <div className="text-[10px] font-bold uppercase tracking-wide text-content/85">
        {label}
      </div>
      <div className="text-[14px] font-bold text-content truncate mt-0.5">
        {value}
      </div>
      {sub && <div className="text-[10.5px] text-content/85 truncate">{sub}</div>}
    </div>
  );

  return (
    <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* The panel's own bar. By store and By department were two readings
          of one group and the share panel below is the reading that answers
          the question, so the tabs went -- the header did not. */}
      <div className="flex items-center gap-1 px-4 py-3 flex-shrink-0 bg-brand_navy">
        <span className="text-custom-white text-[12px] font-semibold">
          By store
        </span>
      </div>

      {/* KPI tiles — every one recomputes when a day is picked, which is why
          the header above says which window they cover. */}
      <div className="grid grid-cols-5 divide-x divide-brand_navy/15 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        {tile(
          "Group total",
          fmt(group.groupTy),
          // The period the group actually has, not always last year. With no
          // last year on file this read "— vs LY" while every store beneath
          // it was being graded against last week.
          group.groupBasis === "LW"
            ? `${pct0(group.groupVsLwPct)} vs LW`
            : `${pct0(group.groupVsLyPct)} vs LY`,
          "Summed over counted stores, then compared — never an average of each store's percentage.",
        )}
        {tile(
          "Stores counted",
          String(group.counted),
          excludedTotal ? `${excludedTotal} set aside · ${excludedReasons}` : "all comparable",
          excludedTotal
            ? "A store missing from either window would shift every other store's usual contribution by its own weight."
            : undefined,
        )}
        {tile(
          "Range",
          group.low === null ? "—" : `${fmt(group.low)}–${fmt(group.high)}`,
          group.median === null ? undefined : `${fmt(group.median)} median`,
        )}
        {tile(
          "Biggest shortfall",
          worst ? fmt(worst.gapValue) : "none",
          worst
            ? applyStoreNumberToName(
                worst.storeName,
                worst.storeNumber,
                worst.storeNumbersForId,
              )
            : "no store is under its expected",
        )}
        {tile(
          "Standing",
          `${group.falling} falling`,
          `${group.consistent} consistent · ${group.rising} rising`,
        )}
      </div>

      {/* The same day selector the store popup uses, one level up: the group's
          seven days rather than one store's.

          Full width and above the grid, not beside it. Despite the name it is
          a horizontal strip — its cards are flex-1 and divide whatever width
          they are given, so a shrink-to-fit wrapper makes them sprawl. It also
          draws its own border-b. */}
      <div className="flex-shrink-0">
        <PopupDaySidebar
          days={days}
          selectedDate={selectedDate}
          gradingMetric={gradingMetric}
          onSelect={onSelectDay}
        />
      </div>

      {/* Share of the group, as a balance. Below the day cards and above
          the grid: it answers "who picked up what this store dropped", which
          is the question the grid's own standing column prompts and cannot
          answer on a single row. Draws from the same rows, so it costs no
          fetch and cannot drift from the grid beside it. */}
      <GroupShareBalance
        rows={group.rows}
        selectedStoreId={null}
        onSelectStore={(storeid) => {
          const original = rows.find((x) => x.storeid === storeid);
          if (original) onSelectStore(original);
        }}
      />

      {/* The By-store grid stood here. Every column it carried is on the
          share panel above and better said: contribution TY against the
          contribution it usually takes, with the money that difference is
          worth and which store took it. Two lists of the same eight stores
          is one more than the question needs. */}
    </div>
  );
};

export default GroupComparisonPanel;
