import { useMemo, useState } from "react";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import MobileDayStrip from "../../../components/mobile/MobileDayStrip";
import SevBadge from "../../../components/SevBadge";
import SevChips from "../../../components/SevChips";
import SelectFilter from "../../../components/filters/SelectFilter";
import TrendBadge from "../../lossPrevention/mobile/components/TrendBadge";
import { formatCurrency2, formatBigNumber } from "../../../utils";
import type { CouponItem } from "../../../interfaces";
import {
  setCouponBreakdown,
  setSelectedCouponSection,
  COUPON_THRESHOLD_DEFAULT,
} from "../../../features/couponSalesSlice";
import type { CouponBreakdown } from "../../../features/couponSalesSlice";
import {
  buildBreakdownRows,
  buildDateRows,
  couponPillClass,
  totalsFor,
  type GradingOptions,
} from "../shared/couponGrading";
import {
  badgeTier,
  filterByTier,
  tierCounts,
  ungradedCount,
  type CouponFilter,
} from "./couponTierUi";

/**
 * One store, broken down — screen two of three.
 *
 * Chrome follows Loss Prevention's inner nav, not the two-row
 * `MobilePerfHeader` the list screens use: a single navy block with a back
 * chevron, the store, and a subtitle naming what this screen is showing, then
 * a grey section label, then the graded totals strip. LP's comment calls that
 * shape "matches Sales LedgerStoreReport nav" — it is the drill-down
 * convention, and the two-row header belongs on the screen you drill in FROM.
 *
 * The only addition is the day strip, which Coupon Sales has and LP doesn't:
 * the desktop dropped its Date tab when it gained one, and mobile inherits that
 * rather than reintroducing a tab that says the same thing.
 */
const BREAKDOWN_OPTS: { value: CouponBreakdown; label: string }[] = [
  { value: "subdept", label: "Sub dept" },
  { value: "cashier", label: "Cashier" },
  { value: "item", label: "Item" },
];

const SUBTITLE: Record<CouponBreakdown, string> = {
  subdept: "Sub dept coupons",
  cashier: "Cashier coupons",
  item: "Item coupons",
};

/** Label / value / vs-baseline / trend, the cell LP's inner nav uses. */
const KpiCell = ({
  label,
  value,
  baseline,
  pct,
  last,
}: {
  label: string;
  value: string;
  baseline?: string;
  pct?: number;
  last?: boolean;
}) => (
  <div className={`px-3 py-2 ${last ? "" : "border-r border-gray-100"}`}>
    <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
      {label}
    </div>
    <div className="text-[12px] font-semibold text-content mt-0.5">{value}</div>
    {baseline && (
      <div className="text-[10px] text-content/85 mt-0.5">vs {baseline}</div>
    )}
    {pct !== undefined && <TrendBadge pct={pct} />}
  </div>
);

interface Props {
  /** Every coupon line for the selected store, the full week. */
  storeCoupons: CouponItem[];
  storeLabel: string;
  rangeLabel: string;
  /** Grading scoped to this store's own baseline slice — see CouponSales. */
  grading: GradingOptions;
  onBack: () => void;
  onSectionSelected: () => void;
}

const CpnBreakdownMobile = ({
  storeCoupons,
  storeLabel,
  rangeLabel,
  grading,
  onBack,
  onSectionSelected,
}: Props) => {
  const dispatch = useAppDispatch();
  const { breakdown, metric, threshold } = useAppSelector((s) => s.couponSales);
  const [filter, setFilter] = useState<CouponFilter>("all");
  const [day, setDay] = useState<string | null>(null);

  const isTrend = metric === "trend";
  const activeThreshold = threshold ?? COUPON_THRESHOLD_DEFAULT;

  // Day markers come from the same day-matched builder the desktop strip uses:
  // this Tuesday against the baseline Tuesdays, not against a date that has no
  // counterpart. `isUp` is the bad direction — coupons getting larger.
  const dayEntries = useMemo(
    () =>
      buildDateRows(storeCoupons, grading)
        .slice()
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((r) => ({
          date: r.key,
          isUp: (r.trendPct ?? 0) > 0,
          hasRef: r.trendPct !== null,
        })),
    [storeCoupons, grading],
  );

  // The day filter narrows what is grouped, but never what a row is graded
  // against: the baseline stays the whole two-week window, because a single day
  // has no two-week counterpart of its own.
  const scoped = useMemo(
    () =>
      day === null
        ? storeCoupons
        : storeCoupons.filter((c) => c.sale_date.split("T")[0] === day),
    [storeCoupons, day],
  );

  const totals = useMemo(() => totalsFor(scoped), [scoped]);

  // Amount, coupons and transactions are two-week TOTALS against one week, so
  // they halve to read as a comparable week — LP's convention. The average is
  // NOT halved: it is already per coupon, and halving it would invent a 50%
  // drop on every store.
  //
  // Only computed for the whole week. With a single day selected there is
  // nothing here to compare against — one day against a week-equivalent would
  // show an ~85% collapse on every store, which is an artefact, not a finding.
  const baselineTotals = useMemo(() => {
    const rows = grading.baseline ?? [];
    if (day !== null || rows.length === 0) return null;
    const t = totalsFor(rows);
    return {
      amount: t.amount / 2,
      lines: t.lines / 2,
      transactions: t.transactions / 2,
      avgAmount: t.avgAmount,
    };
  }, [grading.baseline, day]);

  const pctVs = (now: number, base: number | undefined) =>
    base === undefined || base === 0 ? undefined : ((now - base) / base) * 100;

  const rows = useMemo(
    () => buildBreakdownRows(scoped, grading, breakdown),
    [scoped, grading, breakdown],
  );

  const counts = useMemo(() => tierCounts(rows), [rows]);
  const ungraded = useMemo(() => ungradedCount(rows), [rows]);
  const visible = useMemo(() => filterByTier(rows, filter), [rows, filter]);

  return (
    <div className="flex flex-col h-full">
      {/* Header — matches LP CashierListMobile / Sales LedgerStoreReport nav */}
      <div className="bg-[#1e2a4a] px-4 pt-3 pb-4 flex items-start gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          aria-label="Back to stores"
          className="text-custom-white/85 mt-0.5 flex-shrink-0"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <div className="text-custom-white font-semibold text-[13px] truncate">
            {storeLabel}
          </div>
          {/* The week lives here because this header has no second row for it,
              and once you have drilled in it is the only statement of which
              seven days you are looking at. */}
          <div className="text-custom-white/85 text-[11px] truncate">
            {SUBTITLE[breakdown]} · {rangeLabel}
          </div>
        </div>
      </div>

      {/* Section label + group-by. The bar already exists in LP as a label with
          room on its right, so the selector costs no extra row. */}
      <div className="flex-shrink-0 px-3 py-[7px] bg-gray-100 border-b border-gray-200 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
          Store totals
        </span>
        <div className="ml-auto flex-shrink-0">
          <SelectFilter
            options={BREAKDOWN_OPTS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            value={breakdown}
            onChange={(v) => {
              dispatch(setCouponBreakdown(v as CouponBreakdown));
              setFilter("all");
            }}
            placeholder=""
            className="w-[104px]"
          />
        </div>
      </div>

      <div className="flex-shrink-0 grid grid-cols-4 bg-custom-white border-b border-gray-100">
        <KpiCell
          label="Avg"
          value={formatCurrency2(totals.avgAmount)}
          baseline={
            baselineTotals
              ? formatCurrency2(baselineTotals.avgAmount)
              : undefined
          }
          pct={pctVs(totals.avgAmount, baselineTotals?.avgAmount)}
        />
        <KpiCell
          label="Total"
          value={formatCurrency2(totals.amount)}
          baseline={
            baselineTotals ? formatCurrency2(baselineTotals.amount) : undefined
          }
          pct={pctVs(totals.amount, baselineTotals?.amount)}
        />
        <KpiCell
          label="Coupons"
          value={formatBigNumber(totals.lines, 0)}
          baseline={
            baselineTotals
              ? formatBigNumber(baselineTotals.lines, 0)
              : undefined
          }
          pct={pctVs(totals.lines, baselineTotals?.lines)}
        />
        <KpiCell
          label="Trans"
          value={formatBigNumber(totals.transactions, 0)}
          baseline={
            baselineTotals
              ? formatBigNumber(baselineTotals.transactions, 0)
              : undefined
          }
          pct={pctVs(totals.transactions, baselineTotals?.transactions)}
          last
        />
      </div>

      <MobileDayStrip days={dayEntries} selected={day} onSelect={setDay} />

      <SevChips
        active={filter}
        counts={counts}
        onChange={(f) => setFilter(f)}
        extra={
          isTrend && ungraded > 0
            ? {
                label: "Ungraded",
                count: ungraded,
                active: filter === "ungraded",
                onClick: () =>
                  setFilter(filter === "ungraded" ? "all" : "ungraded"),
              }
            : undefined
        }
      />

      <div className="flex-1 overflow-y-auto pb-14 thin-scrollbar">
        {visible.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
            Nothing matches
          </div>
        ) : (
          visible.map((row) => (
            <button
              key={row.key}
              onClick={() => {
                dispatch(setSelectedCouponSection(row.key));
                onSectionSelected();
              }}
              className="w-full px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <SevBadge sev={badgeTier(row.tier)} />
                <div className="text-[13px] font-medium text-content truncate flex-1 min-w-0">
                  {row.label}
                </div>
                {isTrend && row.isOutlier && (
                  <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-severity_critical_bg text-severity_critical_text flex-shrink-0">
                    ${activeThreshold}+
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 flex-wrap pl-[30px]">
                <span
                  className={`flex items-baseline gap-1 rounded px-1.5 py-0.5 ${couponPillClass[row.tier]}`}
                >
                  <span className="text-[11px] opacity-85">Avg</span>
                  <span className="text-[11px] font-semibold">
                    {formatCurrency2(row.avgAmount)}
                  </span>
                </span>
                <span className="flex items-baseline gap-1 rounded px-1.5 py-0.5 bg-gray-100 text-content">
                  <span className="text-[11px] opacity-85">Total</span>
                  <span className="text-[11px] font-semibold">
                    {formatCurrency2(row.amount)}
                  </span>
                </span>
                <span className="flex items-baseline gap-1 rounded px-1.5 py-0.5 bg-gray-100 text-content">
                  <span className="text-[11px] opacity-85">Coupons</span>
                  <span className="text-[11px] font-semibold">
                    {formatBigNumber(row.lines, 0)}
                  </span>
                </span>
                {isTrend && (
                  <span
                    className={`text-[11px] font-semibold tabular-nums px-1 ${
                      row.trendPct === null
                        ? "text-content/85"
                        : row.trendPct > 0
                          ? "text-severity_critical_text"
                          : "text-severity_healthy_text"
                    }`}
                  >
                    {row.trendPct === null
                      ? "no baseline"
                      : `${row.trendPct > 0 ? "▲" : "▼"} ${Math.abs(row.trendPct).toFixed(1)}% vs base`}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default CpnBreakdownMobile;
