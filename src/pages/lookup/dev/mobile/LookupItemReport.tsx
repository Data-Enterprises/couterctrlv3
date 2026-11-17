// Hooks
import { useState } from "react";
import { useLookupLens } from "./hooks";

// Utils
import { computeActiveGap } from "../utils";

// Interfaces
import type { DayBucket, MarginResult, TrendResult } from "../interfaces";
import type { ItemLookupHistory } from "../../../../features/dev/devItemLookupSlice";

// Components
import InfoModal from "../../../../components-dev/InfoModal";
import LookupDayRows from "./components/LookupDayRows";
import ReportHeaderCard from "./components/ReportHeaderCard";
import HeadlineCard from "./components/HeadlineCard";

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
  const lens = useLookupLens(productCode, historyAll, buckets);

  const activeGapDays = computeActiveGap(buckets);
  const dateRangeLabel = buckets.length
    ? `${buckets[0].label} – ${buckets[buckets.length - 1].label}`
    : "";

  return (
    // Fixed height with its own scroll region, like every mobile Performance
    // page, so the last card never ends up under the bottom nav.
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      {/* pb-14 clears the fixed 56px bottom tab bar. */}
      <div data-help="report" className="min-h-0 flex-1 overflow-y-auto pb-14">
        <div className="flex flex-col gap-2.5 p-2.5">
          <ReportHeaderCard
            description={description}
            productCode={productCode}
            categoryDescription={categoryDescription}
            storeName={storeName}
            dateRangeLabel={dateRangeLabel}
            storeNumbers={storeNumbers}
            selectedStoreNumber={selectedStoreNumber}
            onStoreNumberChange={onStoreNumberChange}
            onBack={onBack}
            onInfo={() => setInfoOpen(true)}
            saleTypes={lens.saleTypes}
            selectedSaleType={lens.selectedSaleType}
            weighed={margin.weighed}
            onPickSaleType={lens.pickSaleType}
          />

          <HeadlineCard
            timeline={lens.timeline}
            selectedDay={lens.selectedDay}
            day={lens.day}
            onPickDay={lens.pickDay}
            isSale={lens.isSale}
            margin={margin}
            trend={trend}
            activeGapDays={activeGapDays}
          />

          <section data-testid="lookup-days" className="cc-card-phone">
            <div className="flex items-baseline justify-between gap-2 px-3.5 pb-1.5 pt-2.5">
              <span className="font-display text-[13.5px] font-semibold text-content">
                Day by day
              </span>
              <span className="text-[12px] text-content/95">
                {lens.isSale
                  ? "newest first"
                  : `${lens.selectedSaleType.toLowerCase()} lines`}
              </span>
            </div>
            <LookupDayRows
              buckets={lens.timeline}
              weighed={margin.weighed}
              selected={lens.selectedDay}
              isSale={lens.isSale}
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
