import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { formatCurrency2 } from "../../../../utils";
import type { PerfDay, PerfTotals } from "./perfData";
import PairedBars from "./PairedBars";
import PerfDayChart from "./PerfDayChart";
import { COUPON_COLORS, COUPON_LABELS, LY_COLOR, TY_COLOR } from "./perfColors";

/** Darkest to lightest, so the stack and the legend agree. */
const COUPON_KEYS = ["digital", "elecStore", "elecInstore", "store"] as const;

interface Props {
  days: PerfDay[];
  selectedDay: string | null;
  onToggleDay: (iso: string) => void;
  /** Nothing on file last year for this store — drawn as "no history" rather
   *  than a $0.00 bar. */
  noLy: boolean;
  totals: PerfTotals;
  /** The store's own bundle is still in flight, so the four figures it owns
   *  are placeholders rather than zeroes nobody measured. */
  bundleLoading: boolean;
  totalsPartial: boolean;
  totalsNote: string;
  /** Leaves the card for the full-screen breakdowns. */
  onViewDetails: () => void;
}

/**
 * The report inside an expanded store card.
 *
 * Order is deliberate and reads top-down as the week narrowing: the seven days
 * first, because the shape of the week is the question a store card is opened
 * to answer; then the figure those days add up to; then that figure against
 * last year; then what made it up.
 *
 * The day chart sits above the headline rather than below the card because it
 * is also the card's only filter — putting the control under the number it
 * changes meant tapping a column scrolled the number off screen.
 *
 * Everything from the day chart down to the paired bars comes from the group
 * weekly response the list already had. Only the four figures and the coupon
 * mix wait on the store's own bundle, which is why they are the only things
 * that can be seen loading.
 */
const PerfStoreReport = ({
  days,
  selectedDay,
  onToggleDay,
  noLy,
  totals,
  bundleLoading,
  totalsPartial,
  totalsNote,
  onViewDetails,
}: Props) => (
  <div className="border-t border-gray-100">
    {/* ── the week ───────────────────────────────────────────────── */}
    <div className="px-3.5 pb-1 pt-2.5">
      <PerfDayChart
        days={days}
        selected={selectedDay}
        onToggle={onToggleDay}
      />
      <div className="mt-1 flex gap-3.5 px-1 text-[12px] text-content/85">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-3.5 rounded-sm"
            style={{ background: TY_COLOR }}
          />
          This year
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-3.5 rounded-sm"
            style={{ background: LY_COLOR }}
          />
          {/* No record isn't a zero — the columns can't say so, the legend
              can. */}
          {noLy ? "Last year: no history" : "Last year"}
        </span>
      </div>
      <p className="px-1 pt-1 text-[12px] text-content/85">
        {selectedDay
          ? "Tap the selected day again for the full week."
          : "Tap a day to scope this store to it."}
      </p>
    </div>

    {/* ── the figure, then the comparison ────────────────────────── */}
    <div className="px-3.5 pb-3 pt-1.5">
      <div className="font-display text-[32px] font-extrabold leading-none tracking-tight text-content">
        {formatCurrency2(totals.sales)}
      </div>

      <div className="mt-2.5">
        {/* This year is the full week; last year is its matched dates only,
            so a short last year reads as short rather than borrowing days
            that match nothing. */}
        <PairedBars
          ty={totals.sales}
          ly={totals.salesLy}
          max={Math.max(totals.sales, totals.salesLy)}
          compact
          lyUnavailable={noLy}
        />
        {totalsPartial && (
          <p className="mt-1.5 inline-block rounded bg-gray-200 px-1.5 py-0.5 text-[11px] font-semibold text-content">
            Last year: {totalsNote}
          </p>
        )}
      </div>

      {/* ── what made it up ─────────────────────────────────────── */}
      <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gray-100 pt-2">
        {/* Tax is on the weekly rows already loaded. The other three come from
            the store's own fetch, so until it lands they show a placeholder —
            not a zero nobody measured. */}
        {(
          [
            [
              "Transactions",
              totals.transactions.toLocaleString("en-US"),
              true,
            ],
            ["Avg basket", formatCurrency2(totals.avgBasket), true],
            ["Tax", formatCurrency2(totals.tax), false],
            ["Coupons", formatCurrency2(totals.coupons), true],
          ] as const
        ).map(([k, v, fromBundle]) => (
          <div key={k} className="flex flex-col">
            <span className="font-mono text-[9.5px] uppercase tracking-wider text-content/85">
              {k}
            </span>
            {fromBundle && bundleLoading ? (
              <span
                aria-label="Loading"
                className="mt-1 block h-[15px] w-16 animate-pulse rounded bg-gray-200"
              />
            ) : (
              <span className="font-display text-[15px] font-bold text-content">
                {v}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Same treatment as the four figures above: the channels are fixed, so
          the bar and the labels hold their place and only the amounts are
          masked. Hiding the block outright made the card jump a row taller the
          moment the bundle landed. */}
      {bundleLoading && (
        <div className="mt-2.5 border-t border-gray-100 pt-2">
          <span
            aria-label="Loading"
            className="block h-2 w-full animate-pulse rounded-full bg-gray-200"
          />
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {COUPON_KEYS.map((k) => (
              <div key={k} className="flex items-center gap-1.5 text-[12px]">
                <span
                  className="h-2 w-2 flex-none rounded-sm"
                  style={{ background: COUPON_COLORS[k] }}
                />
                <span className="flex-1 truncate text-content/85">
                  {COUPON_LABELS[k]}
                </span>
                <span className="block h-[13px] w-12 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coupon mix. A stacked bar rather than the legacy donut: this is one
          figure split four ways, and a ring makes its own circumference — TY
          plus LY plus the rest — look like a quantity. Rendered even when a
          channel is zero, because "this store takes no store coupons" is
          itself worth seeing. */}
      {!bundleLoading && totals.coupons > 0 && (
        <div className="mt-2.5 border-t border-gray-100 pt-2">
          <div className="flex h-2 overflow-hidden rounded-full bg-bkg">
            {COUPON_KEYS.map((k) => (
              <span
                key={k}
                style={{
                  width: `${(totals.couponSplit[k] / totals.coupons) * 100}%`,
                  background: COUPON_COLORS[k],
                }}
              />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {COUPON_KEYS.map((k) => (
              <div
                key={k}
                className="flex items-center gap-1.5 text-[12px] text-content/85"
              >
                <span
                  className="h-2 w-2 flex-none rounded-sm"
                  style={{ background: COUPON_COLORS[k] }}
                />
                <span className="flex-1 truncate">{COUPON_LABELS[k]}</span>
                <span className="font-semibold text-content">
                  {formatCurrency2(totals.couponSplit[k])}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* One way down. The card is a summary and the breakdowns are lists;
          naming them here as well as on the screen that holds them was two
          menus for one decision, and the counts were a fact nobody acted on
          without opening them anyway. */}
      <button
        type="button"
        disabled={bundleLoading}
        onClick={onViewDetails}
        className={`mt-3 flex w-full items-center justify-center gap-1 rounded-lg border-t border-gray-100 py-2.5 text-[12.5px] font-bold transition-colors ${
          bundleLoading
            ? "bg-bkg text-content/85"
            : "bg-[#1e2a4a] text-custom-white active:bg-[#2a3a62]"
        }`}
      >
        {bundleLoading ? "Loading\u2026" : "View details"}
        {!bundleLoading && <ChevronRightIcon className="h-4 w-4" />}
      </button>
    </div>
  </div>
);

export default PerfStoreReport;
