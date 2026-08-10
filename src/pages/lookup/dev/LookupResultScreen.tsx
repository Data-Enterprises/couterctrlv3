import {
  ArrowTrendingDownIcon,
  ChevronLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import type { MarginResult, DayBucket, TrendResult } from "./lookupMetrics";
import { computeActiveGap } from "./lookupMetrics";
import RecentLookupsStrip from "./RecentLookupsStrip";
import LocationTabs from "../../../components/filters/LocationTabs";
import { useState } from "react";
import BottomSheet from "../../../components/BottomSheet";
import DailyBreakdown from "./DailyBreakdown";

interface LookupResultScreenProps {
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
  buckets: DayBucket[];
  trend: TrendResult;
}

const LookupResultScreen = ({
  description,
  productCode,
  categoryDescription,
  storeName,
  storeNumbers,
  selectedStoreNumber,
  onStoreNumberChange,
  onBack,
  onSelectRecent,
  margin,
  buckets,
  trend,
}: LookupResultScreenProps) => {
  const [recentOpen, setRecentOpen] = useState(false);
  const isNegative = margin.marginPct !== null && margin.marginPct < 0;
  const activeGapDays = computeActiveGap(buckets);
  const dateRangeLabel = buckets.length
    ? `${buckets[0].label} – ${buckets[buckets.length - 1].label}`
    : "";

  return (
    <div className="min-h-[calc(100vh-56px)] bg-custom-white">
      <div
        className="flex-shrink-0 px-3 pt-2 pb-2.5"
        style={{ background: "#1e2a4a" }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-custom-white/85 hover:text-custom-white transition-colors flex-shrink-0 -ml-1"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-custom-white truncate">
              {storeName}
            </div>
            <div className="text-[10px] mt-0.5 truncate text-custom-white/85">
              {dateRangeLabel}
            </div>
          </div>
          <div className="flex-1" />
          {/* Page-level action, so it belongs beside the back button rather
              than on the item's own row — it navigates away from this item
              rather than doing anything to it. Same 22px shell as the search
              and "?" buttons on every other mobile header. */}
          <button
            onClick={() => setRecentOpen(true)}
            title="Recent lookups"
            aria-label="Recent lookups"
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/75 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0"
          >
            <ClockIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <LocationTabs
        numbers={storeNumbers}
        selected={selectedStoreNumber}
        onChange={onStoreNumberChange}
        variant="bare"
      />

      {/* Item identity — a plain white band, the way every mobile report names
          what it is reporting on. */}
      {/* Item identity and the screen's two controls. The breakdown's own
          "last 14 days" caption is gone — the window never changes, so it was
          a line of chrome restating a constant. */}
      <div className="px-3.5 pt-3 pb-2 bg-custom-white border-b border-[#1e2a4a]/15">
        <div className="text-[13px] font-semibold text-content truncate">
          {description}
        </div>
        <div className="flex items-baseline justify-between gap-2 mt-0.5">
          <span className="text-[11px] font-medium text-content/85 truncate">
            {productCode}
          </span>
          <span className="text-[11px] font-medium text-content/85 truncate flex-shrink-0">
            {categoryDescription}
          </span>
        </div>
      </div>

      {isNegative && (
        <div className="px-3.5 py-2 bg-red-50 border-b border-red-100">
          <span className="text-[11px] font-semibold text-red-800">
            Selling below cost
          </span>
        </div>
      )}

      <DailyBreakdown buckets={buckets} />

      <div className="p-3.5 pt-2.5">
        {trend.isSlowing && (
          <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-2 bg-amber-50 rounded-lg">
            <ArrowTrendingDownIcon className="w-4 h-4 text-amber-800" />
            <span className="text-[11.5px] text-amber-900">
              Slowing down - {trend.firstHalfQty} units first week,{" "}
              {trend.secondHalfQty} units this week
            </span>
          </div>
        )}

        {activeGapDays >= 2 && (
          <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-2 bg-red-50 rounded-lg">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-700" />
            <span className="text-[11.5px] text-red-800">
              No sales in the last {activeGapDays} days
            </span>
          </div>
        )}
      </div>
      {recentOpen && (
        <BottomSheet onClose={() => setRecentOpen(false)}>
          <div className="px-4 pb-4">
            <RecentLookupsStrip
              onSelect={(code) => {
                setRecentOpen(false);
                onSelectRecent(code);
              }}
              variant="list"
            />
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default LookupResultScreen;
