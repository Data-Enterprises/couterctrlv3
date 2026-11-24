// Hooks
import { useMemo, useState } from "react";
import { useTriStateSort } from "../../../../../utils/useTriStateSort";

// Utils
import { formatBigNumber, formatCurrencyCompact } from "../../../../../utils";
import {
  byStanding,
  shareBalanceOf,
  shareRowsOf,
  shareStandingCounts,
  type ShareStanding,
} from "../utils/shareBalance";
import { shareDaysOf } from "../utils/shareByDay";
import { PERF_SORT_HEADER } from "../../../../../components-dev/utils";
import {
  BALANCE_TONE,
  BAND_LABEL,
  BAND_WHY,
  BAR_CEILING_PCT,
  COLS,
  keyOf,
  ORDER,
} from "../utils";

// Interfaces
import type { GradingMetric } from "../../../../../features/dev/devSalesLedgerSlice";
import type { ComparisonRow } from "../../utils/storeComparison";
import type { Col } from "../interfaces";
import type { LedgerRowData } from "../../interfaces";

// Components
import SortHeader from "../../../../../components-dev/SortHeader";
import GroupShareStoreDetail from "./GroupShareStoreDetail";
import ShareStoreRow from "./ShareStoreRow";

interface GroupShareBalanceProps {
  /** The comparison the panel is already showing, scoped the same way. */
  rows: ComparisonRow[];
  /** The same stores unreduced, for the selected store's day strip. Scoped to
   *  a day upstream it carries one day, and the strip stands itself down. */
  ledgerRows: LedgerRowData[];
  /** The group's total on the active metric, for pricing a share point. */
  groupTotal: number;
  gradingMetric: GradingMetric;
  /** Opens the store's own report — the panel the ledger row opens. */
  onOpenStore: (storeid: number) => void;
}

/**
 * Each store's share of group sales, as a balance.
 *
 * Sits below the day cards and owns nothing above them. Everything it draws
 * comes off `ComparisonRow`s the panel already has, so it costs no fetch and
 * cannot disagree with the day cards beside it.
 *
 * The point of the view is that shares total 100%: a store only gains weight
 * by taking it from the others, so a fall always has a matching rise and the
 * panel can name it. `shareBalance` holds that arithmetic; this file is the
 * drawing, and the rail on the right reads one store out of it.
 */
const GroupShareBalance = ({
  rows,
  ledgerRows,
  groupTotal,
  gradingMetric,
  onOpenStore,
}: GroupShareBalanceProps) => {
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const [band, setBand] = useState<ShareStanding | null>(null);
  const { sort, handleSort, applySort } = useTriStateSort<Col>();

  const isQty = gradingMetric === "qty";
  const money = (n: number) =>
    `${n > 0 ? "+" : n < 0 ? "−" : ""}${
      isQty
        ? formatBigNumber(Math.abs(n), 0)
        : formatCurrencyCompact(Math.abs(n))
    }`;

  const shareRows = useMemo(() => shareRowsOf(rows), [rows]);
  const balance = useMemo(() => shareBalanceOf(shareRows), [shareRows]);

  const counts = useMemo(() => shareStandingCounts(shareRows), [shareRows]);

  // Falling first, then Consistent, then Rising, biggest mover inside each.
  // A column sort is a temporary lens over that, and the third click on a
  // header puts this order back.
  const visible = useMemo(() => {
    const kept = band
      ? shareRows.filter((r) => r.standing === band)
      : shareRows;
    return applySort(byStanding(kept), (r, col) =>
      col === "share" ? r.sharePct : col === "change" ? r.changePct : r.money,
    );
    // `sort` is what actually changes applySort, which is rebuilt every
    // render and cannot be a dependency.
  }, [shareRows, band, sort]);

  // The store the rail reads. Nothing picked lands on the biggest faller,
  // which is the question the panel exists to answer — not an empty rail
  // asking to be clicked before it says anything.
  const picked = useMemo(() => {
    const byKey = shareRows.find((r) => keyOf(r) === pickedKey);
    return byKey ?? balance.lost[0] ?? shareRows[0] ?? null;
  }, [shareRows, pickedKey, balance.lost]);

  // The denominator has to be the set the weekly share was worked out over,
  // or the day shares will not sit around the weekly one.
  const countedKeys = useMemo(() => new Set(shareRows.map(keyOf)), [shareRows]);

  const days = useMemo(
    () =>
      picked
        ? shareDaysOf(
            ledgerRows,
            countedKeys,
            keyOf(picked),
            picked.usualPct,
            gradingMetric,
          )
        : [],
    [ledgerRows, countedKeys, picked, gradingMetric],
  );

  if (shareRows.length < 2) return null;

  return (
    <div data-help="share-balance" className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0">
        <span className="text-[14px] font-semibold text-content flex-shrink-0">
          Each store&rsquo;s share of group sales
        </span>
        {/* The three bands, the way the left panel carries Crit, Watch and
            OK: the count, and a way to see only that band. The list is
            ordered Falling first anyway, so this is a narrowing rather than
            the only way to find them. */}
        {ORDER.map((st) => (
          <button
            key={st}
            onClick={() => setBand((b) => (b === st ? null : st))}
            title={BAND_WHY[st]}
            className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full transition-shadow ${
              BALANCE_TONE[st].pill
            } ${band === st ? "ring-2 ring-content/25 shadow-sm" : ""}`}
          >
            {BAND_LABEL[st]} ({counts[st]})
          </button>
        ))}
      </div>

      <div className="px-4 pb-3 flex-1 min-h-0 flex flex-col">
        <div className="flex gap-3 flex-1 min-h-0">
          <div className="flex-1 min-w-0 flex flex-col">
            <div
              className="grid items-end gap-2 px-1 pb-1 flex-shrink-0 border-b border-brand_navy/15"
              style={{ gridTemplateColumns: COLS }}
            >
              <span className={PERF_SORT_HEADER}>Store</span>
              <span className="text-[11px] font-semibold text-content/95 truncate">
                share against usual
              </span>
              <SortHeader
                col="share"
                label="Share"
                sort={sort}
                onSort={handleSort}
                className={`${PERF_SORT_HEADER} w-full justify-end`}
              />
              <SortHeader
                col="change"
                label="Change"
                sort={sort}
                onSort={handleSort}
                className={`${PERF_SORT_HEADER} w-full justify-end`}
              />
              <SortHeader
                col="worth"
                label="Worth"
                sort={sort}
                onSort={handleSort}
                className={`${PERF_SORT_HEADER} w-full justify-end`}
              />
            </div>

            <div className="cc-scroll">
              {visible.map((r) => (
                <ShareStoreRow
                  key={keyOf(r)}
                  row={r}
                  selected={picked !== null && keyOf(picked) === keyOf(r)}
                  worth={money(r.money)}
                  onPick={() => setPickedKey(keyOf(r))}
                />
              ))}
            </div>

            <div className="flex items-center gap-3.5 pt-2 flex-shrink-0 text-[11px] text-content/95">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-2 rounded-sm bg-brand_navy" />
                share this week
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-0.5 h-3 bg-content" />
                the slice it usually takes
              </span>
              <span>bars run 0–{BAR_CEILING_PCT}% of group sales</span>
            </div>
          </div>

          {/* One store out of the balance: what its move was worth, who took
                the other side, and which days it happened on. */}
          <GroupShareStoreDetail
            row={picked}
            rows={shareRows}
            groupTotal={groupTotal}
            days={days}
            isQty={isQty}
            onOpenReport={() => picked && onOpenStore(picked.storeid)}
          />
        </div>
      </div>
    </div>
  );
};

export default GroupShareBalance;
