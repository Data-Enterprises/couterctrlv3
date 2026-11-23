// Hooks
import { useMemo } from "react";
import { useCouponSalesCtx } from "../hooks";
import { useTriStateSort } from "../../../../utils/useTriStateSort";

// Redux
import {
  setCouponThreshold,
  setCouponTrendThreshold,
  setCouponMetric,
  setSelectedCouponStore,
  setCouponTierFilter,
  setCouponStoreFilter,
  COUPON_THRESHOLD_DEFAULT,
} from "../../../../features/couponSalesSlice";

// Utils
import {
  formatCurrency2,
  formatBigNumber,
  formatCurrencyCompact,
} from "../../../../utils";
import { type CouponRow, type CouponTotals } from "../utils";

// Interfaces
import type { StoreSortCol } from "../interfaces";

// Components
import TextFilter from "../../../../components/filters/TextFilter";
import HeaderFigure from "./components/HeaderFigure";
import StoreControlsRow from "./components/StoreControlsRow";
import TierChip from "./components/TierChip";
import StoreColumnHead from "./components/StoreColumnHead";
import StoreRow from "./components/StoreRow";

interface CpnSalesStorePanelProps {
  rows: CouponRow[];
  totals: CouponTotals;
  rangeLabel: string;
  onOpenSearch: () => void;
}

/** Coupon Sales' left panel: the week's totals, a Trend / Avg $ switch with its threshold,
 *  tier chips, a store filter and the graded store list (sortable by amount, trans and
 *  count). Clicking a store selects it. */
const CpnSalesStorePanel = ({
  rows,
  totals,
  rangeLabel,
  onOpenSearch,
}: CpnSalesStorePanelProps) => {
  const {
    dispatch,
    threshold: rawThreshold,
    trendThreshold: rawTrendThreshold,
    metric,
    tierFilter,
    storeFilter,
    selectedStoreKey,
  } = useCouponSalesCtx();
  const { sort, handleSort, applySort } = useTriStateSort<StoreSortCol>();
  const activeThreshold = rawThreshold ?? COUPON_THRESHOLD_DEFAULT;
  const isTrend = metric === "trend";

  const visible = useMemo(() => {
    const byTier =
      tierFilter === "all" ? rows : rows.filter((r) => r.tier === tierFilter);
    const q = storeFilter.trim().toLowerCase();
    const filtered = q
      ? byTier.filter((r) => r.label.toLowerCase().includes(q))
      : byTier;
    // No sort selected leaves the grade order (worst first) intact.
    return applySort(filtered, (r, col) =>
      col === "amount" ? r.amount : col === "trans" ? r.transactions : r.lines,
    );
  }, [rows, tierFilter, storeFilter, sort]);

  const countOf = (tier: CouponRow["tier"]) =>
    rows.filter((r) => r.tier === tier).length;

  const chip = (tier: "critical" | "watch" | "ok", label: string) => (
    <TierChip
      tier={tier}
      label={label}
      count={countOf(tier)}
      active={tierFilter === tier}
      onClick={() =>
        dispatch(setCouponTierFilter(tierFilter === tier ? "all" : tier))
      }
    />
  );

  return (
    <div className="flex flex-col min-w-0 h-full shadow-lg">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="cc-navy-panel-header flex flex-col gap-0 flex-shrink-0">
        {/* Row 1: range | labelled totals, matching LP's SALES/TRANS/QTY run */}
        <div className="flex items-center gap-2 min-h-[26px]">
          <span className="cc-navy-title text-[13px] flex-shrink-0">
            {rangeLabel}
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-custom-white">
            <HeaderFigure
              label="Amount"
              value={formatCurrencyCompact(totals.amount)}
            />
            <span className="w-px h-3.5 bg-custom-white/20" />
            <HeaderFigure
              label="Coupons"
              value={formatBigNumber(totals.lines, 0)}
            />
            <span className="w-px h-3.5 bg-custom-white/20" />
            <HeaderFigure
              label="Avg"
              value={formatCurrency2(totals.avgAmount)}
            />
          </div>
        </div>

        <StoreControlsRow
          metric={metric}
          onMetric={(key) => dispatch(setCouponMetric(key))}
          threshold={rawThreshold}
          trendThreshold={rawTrendThreshold}
          onThreshold={(v) => dispatch(setCouponThreshold(v))}
          onTrendThreshold={(v) => dispatch(setCouponTrendThreshold(v))}
          onOpenSearch={onOpenSearch}
        />
      </div>

      {/* ── Tier chips + text filter ───────────────────────────────────── */}
      <div className="flex items-center justify-between gap-1.5 px-4 py-2 bg-custom-white border-x border-line_hair flex-shrink-0">
        <div data-help="severity-chips" className="flex items-center gap-1.5">
          {chip("critical", "Crit")}
          {/* Avg $ is a two-tier question — over the line or not — so Watch
              has nothing to count under it. */}
          {isTrend && chip("watch", "Watch")}
          {chip("ok", "OK")}
        </div>
        <div className="flex-shrink-0">
          <TextFilter
            value={storeFilter}
            onChange={(v) => dispatch(setCouponStoreFilter(v))}
            placeholder="Filter stores"
          />
        </div>
      </div>

      <StoreColumnHead sort={sort} onSort={handleSort} isTrend={isTrend} />

      {/* ── Rows ───────────────────────────────────────────────────────── */}
      <div
        data-help="store-list"
        className="flex-1 overflow-y-auto thin-scrollbar bg-custom-white border-x border-b border-line_hair rounded-b-xl"
      >
        {visible.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-[12px] text-content/95">
            No stores match
          </div>
        ) : (
          visible.map((row) => (
            <StoreRow
              key={row.key}
              row={row}
              isSelected={selectedStoreKey === row.key}
              isTrend={isTrend}
              activeThreshold={activeThreshold}
              onSelect={() => dispatch(setSelectedCouponStore(row.key))}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CpnSalesStorePanel;
