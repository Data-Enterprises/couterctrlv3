import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { formatCurrency2 } from "../../../utils";
import type { ItemLookupHistory } from "../../../features/dev/devItemLookupSlice";
import type { DayBucket, MarginResult, TrendResult } from "./lookupMetrics";
import {
  buildDayBuckets,
  buildSaleTypeBreakdown,
  computeActiveGap,
  formatUnits,
  hasSaleTypeBreakdown,
  rowsOfSaleType,
} from "./lookupMetrics";
import {
  bestDay,
  dayLabel,
  dayMargin,
  dayShare,
  formatSignedPct,
  vsSellingAverage,
  windowTotals,
} from "./lookupReport";
import ItemDayChart from "./ItemDayChart";
import LookupDayRows from "./LookupDayRows";
import LocationTabs from "../../../components-dev/filters/LocationTabs";
import InfoButton from "../../../components-dev/InfoButton";
import InfoModal from "../../../components-dev/InfoModal";

interface Props {
  description: string;
  productCode: string;
  categoryDescription: string;
  storeName: string;
  storeNumbers: string[];
  selectedStoreNumber: string | null;
  onStoreNumberChange: (storeNumber: string | null) => void;
  onBack: () => void;
  onSelectRecent: (productCode: string) => void;
  margin: MarginResult;
  /** Every line type, for the sale-type card and its timelines. */
  historyAll: ItemLookupHistory[];
  buckets: DayBucket[];
  trend: TrendResult;
}

/** One figure and its caption. */
const Tile = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) => (
  <div className="flex flex-col">
    <span className="text-[9.5px] font-semibold uppercase tracking-wider text-content/85">
      {label}
    </span>
    <span className="font-display text-[15px] font-bold tracking-tight text-content">
      {value}
    </span>
    {sub && <span className="text-[10.5px] text-content/85">{sub}</span>}
  </div>
);

/**
 * Item Lookup's result screen, dev only — see `lookupDevView.ts`.
 *
 * The table this replaces put six columns on a 375px phone, and on a scale item
 * three of them carried nothing: a quantity of zero on every row, "No cost"
 * thirteen times, and a column of dashes for the margin that cost implies.
 * Everything needed to know that was already computed — `margin.weighed`,
 * `margin.costMissing`, `DayBucket.hasCost` — and simply wasn't consulted.
 *
 * So: one unit, never two. Pounds for a scale item, a count for anything else.
 * A missing cost is said once, in a sentence, instead of twenty-six times in
 * two columns. And the window opens with its own shape, because the question
 * behind a lookup is usually "what has this been doing", which thirteen numbers
 * in a column cannot answer.
 *
 * Order follows `PerfStoreReport`: the days first, then the figure they add up
 * to, then what made it up.
 *
 * Scoping a day narrows THIS card only. The sale-type and day-by-day cards stay
 * where they are — they are the context the scoped figure is read against, and
 * removing them meant the screen changed shape underneath a tap.
 *
 * NO FIGURE HERE IS GRADED. No red, no green, nothing that scores the margin
 * or ranks the item — mobile states the figures and lets the reader draw the
 * conclusion, which is deliberate and long-standing rather than a gap to fill
 * in later.
 *
 * The amber band at the foot of the card is the one exception, and it is not a
 * grade: it reports a CONDITION the reader would otherwise have to notice for
 * themselves by reading fourteen rows — that the second week moved less than
 * the first, or that nothing has sold for days. A verdict on how well the item
 * is doing stays out of it.
 */
const LookupItemReport = ({
  description,
  productCode,
  categoryDescription,
  storeName,
  storeNumbers,
  selectedStoreNumber,
  onStoreNumberChange,
  onBack,
  margin,
  historyAll,
  buckets,
  trend,
}: Props) => {
  const [infoOpen, setInfoOpen] = useState(false);
  // Both keyed to the item, so a new lookup opens on its sales and the whole
  // window rather than inheriting the last item's scope.
  const [saleTypePick, setSaleTypePick] = useState({ code: "", type: "Sale" });
  const [dayPick, setDayPick] = useState<{ code: string; date: string | null }>({
    code: "",
    date: null,
  });

  const saleTypes = buildSaleTypeBreakdown(historyAll);
  const selectedSaleType =
    saleTypePick.code === productCode &&
    saleTypes.some((s) => s.saleType === saleTypePick.type)
      ? saleTypePick.type
      : "Sale";
  const isSale = selectedSaleType === "Sale";

  const timeline = isSale
    ? buckets
    : buildDayBuckets(rowsOfSaleType(historyAll, selectedSaleType));

  const selectedDay = dayPick.code === productCode ? dayPick.date : null;
  const day = selectedDay
    ? (timeline.find((b) => b.date === selectedDay) ?? null)
    : null;

  const totals = windowTotals(timeline);
  const best = bestDay(timeline);
  const weighed = margin.weighed;
  const rate = weighed ? "/lb" : " ea";

  const pickDay = (iso: string) =>
    setDayPick({
      code: productCode,
      date: selectedDay === iso ? null : iso,
    });

  const pickSaleType = (type: string) => {
    setSaleTypePick({ code: productCode, type });
    // The scoped day belonged to the outgoing timeline. A cancellation on the
    // 12th is not the same fact as a sale on the 12th, and silently carrying
    // the selection across made the headline change meaning without moving.
    setDayPick({ code: productCode, date: null });
  };

  const activeGapDays = computeActiveGap(buckets);
  const dateRangeLabel = buckets.length
    ? `${buckets[0].label} – ${buckets[buckets.length - 1].label}`
    : "";
  const isNegative = margin.marginPct !== null && margin.marginPct < 0;

  const share = day ? dayShare(day, totals.revenue) : null;
  const vsAvg = day ? vsSellingAverage(day, timeline) : null;
  const dayMarginPct = day ? dayMargin(day) : null;
  const windowMarginPct =
    totals.hasCost && totals.revenue > 0
      ? ((totals.revenue - totals.cost) / totals.revenue) * 100
      : null;

  return (
    // Fixed height with its own scroll region, the same shape every mobile
    // Performance page uses. A `min-h` page grows past the viewport and the
    // last card ends up underneath the bottom nav, which is where the sale
    // type card was being cut in half.
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      {/* pb-14 clears the fixed bottom tab bar — 56px, outside document
          flow, so nothing reserves space for it. Same fix and same
          value as SalesPerfMobile. */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-14">
        <div className="flex flex-col gap-2.5 p-2.5">
        {/* ── what is being read, and through which lens ─────────── */}
        <section
          data-testid="lookup-header"
          className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md"
        >
          {/* One block, not two.
           *
           * This card IS the page, so the page's controls live on it rather
           * than on a navy band above that named the same store twice — but
           * splitting the store and the item into two bordered bands stacked
           * three rules between the top of the card and the chart, and put the
           * store above the item on a screen you reached by looking up an
           * item. The item is the title; the store and the window are what
           * qualify it. */}
          <div className="flex items-start gap-2 border-b border-gray-100 px-3.5 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[15px] font-bold leading-tight text-content">
                {description}
              </div>
              <div className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-wide text-content/85">
                {productCode}
                {categoryDescription ? ` \u00b7 ${categoryDescription}` : ""}
              </div>
              {/* The window is already drawn by the chart and counted by the
                  caption under it, so it sits here as small print rather than
                  as a third announcement. */}
              <div className="mt-1 truncate text-[11px] font-semibold text-content/85">
                {storeName} &middot; {dateRangeLabel}
              </div>
            </div>
            {/* Search and "?" together in the corner, the same pair
                MobilePerfCard puts on a card that IS the page.
             *
             * The back arrow that used to sit on the left said "up" without
             * saying where to — and where it goes is the search card, which
             * also holds the recent lookups. A magnifying glass names that
             * destination, so leaving this item and looking up another are
             * visibly the same action rather than two. */}
            <div className="flex flex-none items-center gap-1.5">
              <button
                type="button"
                onClick={onBack}
                title="New search"
                aria-label="New search"
                className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-content/85 active:bg-bkg"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
              </button>
              <InfoButton
                variant="light"
                onClick={() => setInfoOpen(true)}
                title="What this page shows"
                className="-mr-1"
              />
            </div>
          </div>

          {storeNumbers.length > 1 && (
            <div className="border-b border-gray-100">
              <LocationTabs
                numbers={storeNumbers}
                selected={selectedStoreNumber}
                onChange={onStoreNumberChange}
                variant="bare"
              />
            </div>
          )}
          {hasSaleTypeBreakdown(saleTypes) && (
              <div data-testid="lookup-sale-types" className="border-t border-gray-100">
                {/* A caption, not a heading. The card already has a title —
                  the item — and a second one at nearly the same weight
                  directly beneath it read as two cards fused together. This
                  labels the rows the way the tile captions label their
                  figures, and the rows themselves say they are selectable by
                  carrying the selected marker. */}
              <div className="px-3.5 pb-1.5 pt-2.5">
                <span className="text-[9.5px] font-semibold uppercase tracking-wider text-content/85">
                  By sale type
                </span>
              </div>
              <div>
                {saleTypes.map((s) => {
                  const isSelected = s.saleType === selectedSaleType;
                  const saleDollars =
                    saleTypes.find((t) => t.saleType === "Sale")?.sales ?? 0;
                  return (
                    <button
                      key={s.saleType}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() =>
                        pickSaleType(
                          isSelected && s.saleType !== "Sale" ? "Sale" : s.saleType,
                        )
                      }
                      className={`block w-full border-l-2 border-t border-gray-100 px-3.5 py-2.5 text-left first:border-t-0 ${
                        isSelected
                          ? "border-l-[#1e2a4a] bg-row_selected"
                          : "border-l-transparent active:bg-bkg"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-display text-[13px] font-semibold text-content">
                          {s.saleType}
                        </span>
                        <span className="text-[13px] font-bold text-content">
                          {formatCurrency2(s.sales)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-3 text-[11px] text-content/85">
                        <span>
                          {s.days} {s.days === 1 ? "day" : "days"}
                        </span>
                        <span className="font-semibold text-content">
                          {formatUnits(s.units, weighed)}
                        </span>
                        {/* Sale is the denominator, so a percentage of itself
                            would be 100% pretending to be information. */}
                        {s.saleType !== "Sale" && saleDollars > 0 && (
                          <span>
                            {((s.sales / saleDollars) * 100).toFixed(2)}% of sales
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              </div>
          )}
        </section>

        {/* ── the window, and the figure it comes to ─────────────── */}
        <section
          data-testid="lookup-headline"
          className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md"
        >
          {isNegative && (
            <p className="border-b border-gray-100 bg-gray-100 px-3.5 py-2 text-[11.5px] font-semibold text-content">
              Selling below cost
            </p>
          )}

          <div className="px-2.5 pb-1 pt-2.5">
            <ItemDayChart
              buckets={timeline}
              selected={selectedDay}
              onToggle={pickDay}
            />
            <p className="px-1.5 pt-1 text-[12px] text-content/85">
              {selectedDay
                ? "Tap the selected day again for the whole window."
                : "Tap a day to scope this item to it."}
            </p>
          </div>

          <div className="px-3.5 pb-3 pt-1.5">
            <div className="text-[9.5px] font-semibold uppercase tracking-wider text-content/85">
              {day
                ? dayLabel(day.date)
                : `Sold · ${totals.sellingDays} of ${totals.windowDays} days`}
            </div>
            <div className="mt-0.5 font-display text-[31px] font-extrabold leading-none tracking-tight text-content">
              {formatCurrency2(day ? day.revenue : totals.revenue)}
            </div>
            <div className="mt-1 text-[12px] text-content/85">
              <span className="font-semibold text-content">
                {formatUnits(day ? day.units : totals.units, weighed)}
              </span>
              {(day ? day.units : totals.units) > 0 && (
                <>
                  {day ? " at " : " at an average of "}
                  {formatCurrency2(
                    (day ? day.revenue : totals.revenue) /
                      (day ? day.units : totals.units),
                  )}
                  {rate}
                </>
              )}
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gray-100 pt-2">
              {day ? (
                <>
                  <Tile
                    label="Share of window"
                    value={share === null ? "—" : `${share.toFixed(1)}%`}
                  />
                  <Tile
                    label="vs typical day"
                    value={vsAvg === null ? "—" : formatSignedPct(vsAvg)}
                  />
                  {isSale && dayMarginPct !== null && (
                    <Tile label="Margin" value={`${dayMarginPct.toFixed(1)}%`} />
                  )}
                  {isSale && day.hasCost && day.units > 0 && (
                    <Tile
                      label="Cost"
                      value={`${formatCurrency2(day.cost / day.units)}${rate}`}
                    />
                  )}
                </>
              ) : (
                <>
                  <Tile
                    label="Per selling day"
                    value={
                      totals.sellingDays > 0
                        ? formatCurrency2(totals.revenue / totals.sellingDays)
                        : "—"
                    }
                  />
                  <Tile
                    label={weighed ? "Lb per day" : "Units per day"}
                    value={
                      totals.sellingDays > 0
                        ? (totals.units / totals.sellingDays).toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: weighed ? 2 : 0,
                              maximumFractionDigits: weighed ? 2 : 0,
                            },
                          )
                        : "—"
                    }
                  />
                  {isSale && windowMarginPct !== null ? (
                    <>
                      <Tile
                        label="Margin"
                        value={`${windowMarginPct.toFixed(1)}%`}
                      />
                      <Tile label="COGS" value={formatCurrency2(totals.cost)} />
                    </>
                  ) : (
                    <>
                      <Tile
                        label="Best day"
                        value={best ? best.label : "—"}
                        sub={best ? formatCurrency2(best.revenue) : undefined}
                      />
                      <Tile
                        label="Shelf price"
                        value={`${formatCurrency2(margin.listPrice)}${rate}`}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Said once, in a sentence — not in two columns, thirteen times. */}
          {isSale && margin.costMissing && (
            <p className="border-t border-gray-100 bg-bkg px-3.5 py-2 text-[11.5px] text-content/85">
              No cost on file for this item, so COGS and margin are unavailable.
            </p>
          )}

          {/* Window-level readings. Suppressed while a day is scoped: they
              describe the fortnight, and sitting under one day's figure they
              read as describing that day. */}
          {!day && isSale && trend.isSlowing && (
            <p className="border-t border-amber-200 bg-amber-50 px-3.5 py-2 text-[11.5px] font-semibold text-amber-900">
              Slowing down — {formatUnits(trend.firstHalfUnits, weighed)} the
              first week, {formatUnits(trend.secondHalfUnits, weighed)} this
              week.
            </p>
          )}
          {!day && isSale && activeGapDays >= 2 && (
            <p className="border-t border-amber-200 bg-amber-50 px-3.5 py-2 text-[11.5px] font-semibold text-amber-900">
              No sales in the last {activeGapDays} days.
            </p>
          )}
        </section>

        {/* ── the days ───────────────────────────────────────────── */}
        <section
          data-testid="lookup-days"
          className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md"
        >
          <div className="flex items-baseline justify-between gap-2 px-3.5 pb-1.5 pt-2.5">
            <span className="font-display text-[13.5px] font-semibold text-content">
              Day by day
            </span>
            <span className="text-[12px] text-content/85">
              {isSale ? "newest first" : `${selectedSaleType.toLowerCase()} lines`}
            </span>
          </div>
          <LookupDayRows
            buckets={timeline}
            weighed={weighed}
            selected={selectedDay}
            isSale={isSale}
          />
        </section>
        </div>
      </div>

      <InfoModal
        page="item-lookup"
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
      />
    </div>
  );
};

export default LookupItemReport;
