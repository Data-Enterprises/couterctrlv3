// Hooks
import { useState } from "react";

// Utils
import { formatCurrency2 } from "../../../../utils";
import {
  buildDayBuckets,
  buildSaleTypeBreakdown,
  computeActiveGap,
  formatUnits,
  hasSaleTypeBreakdown,
  rowsOfSaleType,
} from "../utils";
import {
  bestDay,
  dayLabel,
  dayMargin,
  dayShare,
  formatSignedPct,
  vsSellingAverage,
  windowTotals,
} from "./utils";

// Interfaces
import type { DayBucket, MarginResult, TrendResult } from "../interfaces";
import type { ItemLookupHistory } from "../../../../features/dev/devItemLookupSlice";

// Components
import BackButton from "../../../../components-dev/BackButton";
import LocationTabs from "../../../../components-dev/filters/LocationTabs";
import InfoButton from "../../../../components-dev/InfoButton";
import InfoModal from "../../../../components-dev/InfoModal";
import ItemDayChart from "./components/ItemDayChart";
import LookupDayRows from "./components/LookupDayRows";
import Tile from "./components/Tile";

interface LookupItemReportProps {
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

/**
 * Item Lookup's result screen, dev only. One unit, never two: pounds for a
 * scale item, a count otherwise. A missing cost is said once. Order: the days,
 * the figure they add up to, then what made it up. Scoping a day narrows this
 * card only.
 *
 * NO FIGURE HERE IS GRADED: mobile states figures and lets the reader judge,
 * on purpose. The amber band reports a condition (the second week moved less,
 * or nothing has sold for days), not a grade.
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
}: LookupItemReportProps) => {
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
    // The scoped day belonged to the old timeline (a cancellation on the 12th
    // isn't a sale on the 12th), so it is cleared.
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
    // Fixed height with its own scroll region, like every mobile Performance
    // page, so the last card never ends up under the bottom nav.
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      {/* pb-14 clears the fixed 56px bottom tab bar. */}
      <div data-help="report" className="min-h-0 flex-1 overflow-y-auto pb-14">
        <div className="flex flex-col gap-2.5 p-2.5">
        {/* ── what is being read, and through which lens ─────────── */}
        <section
          data-testid="lookup-header"
          className="overflow-hidden rounded-2xl border border-line_field bg-custom-white shadow-md"
        >
          {/* One block: the item is the title, the store and window qualify
              it, and the page's controls live on this card. */}
          <div className="flex items-start gap-2 border-b border-line_hair px-3.5 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[15px] font-bold leading-tight text-content">
                {description}
              </div>
              <div className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-wide text-content/95">
                {productCode}
                {categoryDescription ? ` \u00b7 ${categoryDescription}` : ""}
              </div>
              {/* The window as small print: the chart already draws it. */}
              <div className="mt-1 truncate text-[11px] font-semibold text-content/95">
                {storeName} &middot; {dateRangeLabel}
              </div>
            </div>
            {/* Search and "?" together in the corner, as MobilePerfCard does:
                search leads back to the search card and its recent lookups. */}
            <div className="flex flex-none items-center gap-1.5">
              <BackButton onClick={onBack} tone="light" />
              <InfoButton
                variant="light"
                onClick={() => setInfoOpen(true)}
                title="What this page shows"
                className="-mr-1"
              />
            </div>
          </div>

          {storeNumbers.length > 1 && (
            <div className="border-b border-line_hair">
              <LocationTabs
                numbers={storeNumbers}
                selected={selectedStoreNumber}
                onChange={onStoreNumberChange}
                variant="bare"
              />
            </div>
          )}
          {hasSaleTypeBreakdown(saleTypes) && (
              <div data-testid="lookup-sale-types" className="border-t border-line_hair">
                {/* A caption, not a heading: the item is the card's title. */}
              <div className="px-3.5 pb-1.5 pt-2.5">
                <span className="text-[9.5px] font-semibold uppercase tracking-wider text-content/95">
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
                      className={`block w-full border-l-2 border-t border-line_hair px-3.5 py-2.5 text-left first:border-t-0 ${
                        isSelected
                          ? "border-l-brand_navy bg-row_selected"
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
                      <div className="mt-0.5 flex items-baseline gap-3 text-[11px] text-content/95">
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
          className="overflow-hidden rounded-2xl border border-line_field bg-custom-white shadow-md"
        >
          {isNegative && (
            <p className="border-b border-line_hair bg-gray-100 px-3.5 py-2 text-[11.5px] font-semibold text-content">
              Selling below cost
            </p>
          )}

          <div className="px-2.5 pb-1 pt-2.5">
            <ItemDayChart
              buckets={timeline}
              selected={selectedDay}
              onToggle={pickDay}
            />
            <p className="px-1.5 pt-1 text-[12px] text-content/95">
              {selectedDay
                ? "Tap the selected day again for the whole window."
                : "Tap a day to scope this item to it."}
            </p>
          </div>

          <div className="px-3.5 pb-3 pt-1.5">
            <div className="text-[9.5px] font-semibold uppercase tracking-wider text-content/95">
              {day
                ? dayLabel(day.date)
                : `Sold · ${totals.sellingDays} of ${totals.windowDays} days`}
            </div>
            <div className="mt-0.5 font-display text-[31px] font-extrabold leading-none tracking-tight text-content">
              {formatCurrency2(day ? day.revenue : totals.revenue)}
            </div>
            <div className="mt-1 text-[12px] text-content/95">
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

            <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line_hair pt-2">
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
            <p className="border-t border-line_hair bg-bkg px-3.5 py-2 text-[11.5px] text-content/95">
              No cost on file for this item, so COGS and margin are unavailable.
            </p>
          )}

          {/* Window-level readings, hidden while a day is scoped (they
              describe the fortnight, not the day). */}
          {!day && isSale && trend.isSlowing && (
            <p className="border-t border-severity_watch_text/20 bg-severity_watch_bg px-3.5 py-2 text-[11.5px] font-semibold text-severity_watch_text">
              Slowing down — {formatUnits(trend.firstHalfUnits, weighed)} the
              first week, {formatUnits(trend.secondHalfUnits, weighed)} this
              week.
            </p>
          )}
          {!day && isSale && activeGapDays >= 2 && (
            <p className="border-t border-severity_watch_text/20 bg-severity_watch_bg px-3.5 py-2 text-[11.5px] font-semibold text-severity_watch_text">
              No sales in the last {activeGapDays} days.
            </p>
          )}
        </section>

        {/* ── the days ───────────────────────────────────────────── */}
        <section
          data-testid="lookup-days"
          className="overflow-hidden rounded-2xl border border-line_field bg-custom-white shadow-md"
        >
          <div className="flex items-baseline justify-between gap-2 px-3.5 pb-1.5 pt-2.5">
            <span className="font-display text-[13.5px] font-semibold text-content">
              Day by day
            </span>
            <span className="text-[12px] text-content/95">
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
