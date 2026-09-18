import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { formatCurrency2 } from "../../../utils";
import PairedBars from "../../../components/mobile/perf/PairedBars";
import PerfDayChart from "../../../components/mobile/perf/PerfDayChart";
import { LY_COLOR, TY_COLOR } from "../../../components/mobile/perf/perfColors";
import type { EventTotals } from "./eventPerfData";

const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");

interface Props {
  days: { iso: string; label: string; value: number; baseline: number }[];
  selectedDay: string | null;
  onToggleDay: (iso: string) => void;
  totals: EventTotals;
  /** Which figure this page leads on — LP counts, Coupon Sales totals. */
  measure: "transactions" | "amount";
  /** Names the hero. The number alone doesn't say dollars or a count, nor
   *  whether it is the week or the tapped day. */
  heroCaption: string;
  /** The day this card is scoped to, already formatted, or "" for the week. */
  dayLabel: string;
  busiest: string;
  onViewDetails: () => void;
}

/**
 * The report inside an expanded store card.
 *
 * Same order as Sales, deliberately: the seven days first, because the shape
 * of the week is what a card is opened to see; then the figure they add up to;
 * then that figure against the store's own baseline; then what made it up.
 *
 * The day chart sits above the headline rather than below the card because it
 * is also the card's only filter — putting the control under the number it
 * changes meant tapping a column scrolled the number off screen.
 *
 * Nothing here fetches. The week arrives in one load, so every figure is a
 * regroup of rows already held.
 */
const EventStoreReport = ({
  days,
  selectedDay,
  onToggleDay,
  totals,
  measure,
  heroCaption,
  dayLabel,
  busiest,
  onViewDetails,
}: Props) => {
  const fmt = measure === "amount" ? formatCurrency2 : fmtInt;
  const value = measure === "amount" ? totals.amount : totals.transactions;
  const base =
    measure === "amount" ? totals.baselineAmount : totals.baselineTransactions;

  return (
    <div className="border-t border-gray-100">
      {/* ── the week ─────────────────────────────────────────────── */}
      <div className="px-3.5 pb-1 pt-2.5">
        <PerfDayChart
          days={days.map((d) => ({
            iso: d.iso,
            label: d.label,
            ty: d.value,
            ly: d.baseline,
          }))}
          selected={selectedDay}
          onToggle={onToggleDay}
        />
        <div className="mt-1 flex gap-3.5 px-1 text-[12px] text-content/85">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-3.5 rounded-sm"
              style={{ background: TY_COLOR }}
            />
            This week
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-3.5 rounded-sm"
              style={{ background: LY_COLOR }}
            />
            Prior 2-wk avg
          </span>
        </div>
        <p className="px-1 pt-1 text-[12px] text-content/85">
          {selectedDay
            ? "Tap the selected day again for the full week."
            : "Tap a day to scope this store to it."}
        </p>
      </div>

      {/* ── the figure, then the comparison ──────────────────────── */}
      <div className="px-3.5 pb-3 pt-1.5">
        <div className="text-[11px] font-semibold text-content/85">
          {heroCaption}
        </div>
        <div className="mt-1 font-display text-[30px] font-extrabold leading-none tracking-tight text-content">
          {fmt(value)}
        </div>

        {/* No second bar when the comparison period has nothing at this level —
            LP's baseline knows stores, never people, and a zero would read as
            "none last time" rather than "not measured". */}
        {base !== null && (
          <div className="mt-2.5">
            <PairedBars
              ty={value}
              ly={base}
              max={Math.max(value, base)}
              labels={["WK", "AVG"]}
              format={fmt}
              compact
            />
            <p className="mt-1.5 text-[11px] text-content/85">
              WK {dayLabel ? "selected day" : "this week"} · AVG prior 2-wk avg
              {dayLabel ? ", same weekday" : ""}
            </p>
          </div>
        )}

        {/* ── what made it up ───────────────────────────────────── */}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-gray-100 pt-2.5">
          {(
            [
              // The hero is dollars on Coupon Sales and a count on LP, so each
              // puts the other figure here — and LP shows its cashiers rather
              // than repeating the hero.
              ...(measure === "amount"
                ? ([
                    ["Coupons", fmtInt(totals.lines)],
                    ["Transactions", fmtInt(totals.transactions)],
                  ] as [string, string][])
                : ([
                    ["Amount", formatCurrency2(totals.amount)],
                    ["Cashiers", fmtInt(totals.cashiers)],
                  ] as [string, string][])),
              ["Per txn", formatCurrency2(totals.perTransaction)],
              ["Busiest", busiest],
            ] as [string, string][]
          ).map(([k, v]) => (
            <div key={k} className="flex flex-col">
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                {k}
              </span>
              <span className="font-display text-[15px] font-bold text-content">
                {v}
              </span>
            </div>
          ))}
        </div>

        {/* One way down. The card is a summary; who and which receipts are
            lists of their own, and opening one inside the card pushed the
            report it explains off the top of the screen. */}
        <button
          type="button"
          onClick={onViewDetails}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border-t border-gray-100 bg-[#1e2a4a] py-2.5 text-[12.5px] font-bold text-custom-white transition-colors active:bg-[#2a3a62]"
        >
          View details
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default EventStoreReport;
